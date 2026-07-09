import express from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { assertProdConfig, config } from "./config.js";
import { ah } from "./http.js";
import { pool, runMigrations } from "./db.js";
import { seedAdmin } from "./seed.js";
import { requireAdmin, requireAuth } from "./auth.js";
import { authRouter } from "./routes/auth.routes.js";
import { participantsRouter } from "./routes/participants.routes.js";
import { sessionsRouter } from "./routes/sessions.routes.js";
import { categoriesRouter, documentsRouter } from "./routes/documents.routes.js";
import { activityRouter, settingsRouter, statsRouter } from "./routes/admin.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  assertProdConfig();
  fs.mkdirSync(config.uploadDir, { recursive: true });

  await runMigrations();
  await seedAdmin();

  const app = express();
  app.disable("x-powered-by");
  // Derrière le reverse proxy Traefik de Dokploy : IP client réelle + cookies Secure.
  app.set("trust proxy", 1);
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // ─── En-têtes de sécurité ────────────────────────────────────────────────
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (config.isProd) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });

  // Protection contre la force brute sur la connexion.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
    },
  });

  // L'auto-inscription est publique : limite dédiée contre l'abus.
  const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Trop de tentatives d'inscription. Réessayez dans 15 minutes.",
    },
  });

  // ─── API ─────────────────────────────────────────────────────────────────
  const api = express.Router();
  api.use("/auth/login", loginLimiter);
  api.use("/auth/session-login", loginLimiter);
  api.use("/auth/register", registerLimiter);
  api.use("/auth", authRouter);
  api.use("/participants", requireAuth, requireAdmin, participantsRouter);
  api.use("/sessions", requireAuth, sessionsRouter);
  api.use("/documents", requireAuth, documentsRouter);
  api.use("/categories", requireAuth, categoriesRouter);
  api.use("/stats", requireAuth, requireAdmin, statsRouter);
  api.use("/settings/admin", requireAuth, requireAdmin, settingsRouter);
  api.use("/activity", requireAuth, requireAdmin, activityRouter);

  // Paramètres publics (page de connexion) — lecture seule, par langue
  // avec repli sur le français lorsque la traduction est absente.
  api.get(
    "/settings",
    ah(async (req, res) => {
      const lang = ["fr", "en", "pt", "es"].includes(String(req.query.lang))
        ? String(req.query.lang)
        : "fr";
      const { rows } = await pool.query<{ key: string; lang: string; value: string }>(
        "SELECT key, lang, value FROM settings WHERE lang IN ('fr', $1)",
        [lang]
      );
      const settings: Record<string, string> = {};
      for (const r of rows) if (r.lang === "fr") settings[r.key] = r.value;
      for (const r of rows) if (r.lang === lang && r.value) settings[r.key] = r.value;
      res.json({ settings });
    })
  );

  api.get("/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({ status: "db_unreachable" });
    }
  });

  app.use("/api", api);

  // ─── Frontend statique (production) ─────────────────────────────────────
  const distDir = path.resolve(__dirname, "../../dist");
  if (fs.existsSync(distDir)) {
    // Les fichiers de /assets sont hachés par Vite → cache immuable ;
    // les fichiers à la racine (logo, favicon) peuvent changer → cache court.
    app.use(
      "/assets",
      express.static(path.join(distDir, "assets"), { maxAge: "1y", immutable: true })
    );
    app.use(express.static(distDir, { maxAge: "1h", index: false }));
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  // ─── Gestion d'erreurs ───────────────────────────────────────────────────
  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      // Erreur PostgreSQL « invalid text representation » (paramètre mal formé) :
      // requête invalide du client, pas une panne serveur.
      if ((err as { code?: string }).code === "22P02") {
        return res.status(400).json({ error: "Paramètre invalide" });
      }
      console.error("[api] erreur non gérée :", err);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  );

  const server = app.listen(config.port, () => {
    console.log(`[api] serveur démarré sur le port ${config.port} (${config.env})`);
  });

  // Arrêt propre lors des redéploiements (SIGTERM envoyé par Docker/Dokploy).
  const shutdown = (signal: string) => {
    console.log(`[api] ${signal} reçu, arrêt en cours…`);
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("Échec du démarrage :", err);
  process.exit(1);
});
