import path from "node:path";

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const config = {
  env: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
  port: num(process.env.PORT, 3001),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/portail_cts",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  jwtExpiresIn: "7d" as const,
  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? "uploads"),
  maxUploadMb: num(process.env.MAX_UPLOAD_MB, 50),
  /** URL publique de la plateforme, utilisée dans les e-mails (liens). */
  appUrl: (process.env.APP_URL ?? "").replace(/\/+$/, ""),
  admin: {
    email: process.env.ADMIN_EMAIL ?? "admin@ceeac-eccas.org",
    password: process.env.ADMIN_PASSWORD ?? "ChangezMoi!2025",
    name: process.env.ADMIN_NAME ?? "Secrétariat CTS-DSS",
  },
  /** Diffusion des rapports par e-mail — désactivée si SMTP_HOST est absent. */
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: num(process.env.SMTP_PORT, 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from:
      process.env.SMTP_FROM ??
      process.env.SMTP_USER ??
      "no-reply@ceeac-eccas.org",
  },
};

export const isMailConfigured = () => Boolean(config.smtp.host);

export function assertProdConfig() {
  if (!config.isProd) return;
  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
  // Sans ADMIN_PASSWORD, le premier démarrage créerait un compte admin avec
  // le mot de passe par défaut, public dans le dépôt.
  if (!process.env.ADMIN_PASSWORD) missing.push("ADMIN_PASSWORD");
  if (missing.length) {
    throw new Error(
      `Variables d'environnement manquantes en production : ${missing.join(", ")}`
    );
  }
}
