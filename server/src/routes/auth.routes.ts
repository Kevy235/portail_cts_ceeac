import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { query } from "../db.js";
import {
  clearAuthCookie,
  invalidateAuthCache,
  requireAccount,
  requireAuth,
  setAuthCookie,
  signGuestToken,
  signToken,
} from "../auth.js";
import { ah } from "../http.js";
import { logActivity } from "../activity.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const LANGS = ["fr", "en", "pt", "es"] as const;

// Hash factice comparé quand l'e-mail est inconnu : temps de réponse constant,
// pas d'énumération d'utilisateurs par mesure de latence.
const DUMMY_HASH = bcrypt.hashSync("dummy-timing-equalizer", 12);

interface DbUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "admin" | "participant";
  country: string;
  function_title: string;
  institution: string;
  status: string;
  must_change_password: boolean;
  created_at: string;
  ui_lang: string;
  doc_langs: string[];
  token_version: number;
  origin_session_id: string | null;
  origin_session_title?: string | null;
}

function publicUser(u: DbUser) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    country: u.country,
    functionTitle: u.function_title,
    institution: u.institution,
    status: u.status,
    mustChangePassword: u.must_change_password,
    createdAt: u.created_at,
    uiLang: u.ui_lang,
    docLangs: u.doc_langs,
    originSessionId: u.origin_session_id ?? null,
    originSessionTitle: u.origin_session_title ?? null,
  };
}

/** Utilisateur + titre de la session d'auto-inscription (le cas échéant). */
const USER_SELECT = `SELECT u.*, s.title AS origin_session_title
  FROM users u LEFT JOIN cts_sessions s ON s.id = u.origin_session_id`;

authRouter.post(
  "/login",
  ah(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "E-mail ou mot de passe invalide" });
    }
    const { email, password } = parsed.data;

    const { rows } = await query<DbUser>(`${USER_SELECT} WHERE u.email = $1`, [
      email.toLowerCase().trim(),
    ]);
    const user = rows[0];
    const passwordOk = await bcrypt.compare(
      password,
      user?.password_hash ?? DUMMY_HASH
    );
    if (!user || !passwordOk) {
      return res.status(401).json({
        error: "Identifiants incorrects. Veuillez réessayer.",
        code: "invalid_credentials",
      });
    }
    if (user.status === "inactif") {
      return res.status(403).json({
        error: "Votre compte est désactivé. Contactez le Secrétariat CTS-DSS.",
        code: "account_disabled",
      });
    }

    await query(
      "UPDATE users SET last_login_at = now(), status = CASE WHEN status = 'en-attente' THEN 'actif' ELSE status END WHERE id = $1",
      [user.id]
    );
    invalidateAuthCache(user.id);
    await logActivity("login", "Connexion à la plateforme", `${user.name} — ${user.email}`, user.id);

    setAuthCookie(res, signToken({ id: user.id, role: user.role }, user.token_version));
    res.json({
      user: publicUser({
        ...user,
        status: user.status === "en-attente" ? "actif" : user.status,
      }),
    });
  })
);

// ─── Auto-inscription avec les accès d'une session CTS ────────────────────────
// L'administrateur crée la session, transmet l'identifiant + le mot de passe
// d'accès aux États membres, et chaque participant crée lui-même son compte.
const registerSchema = z.object({
  accessCode: z.string().trim().min(4, "Identifiant de session requis"),
  accessPassword: z.string().min(1, "Mot de passe de session requis"),
  name: z.string().trim().min(2, "Nom trop court"),
  email: z.string().trim().email("E-mail invalide"),
  country: z.string().trim().min(1, "Pays requis"),
  // Fonction facultative : tous les participants n'ont pas de titre officiel.
  functionTitle: z.string().trim().default(""),
  institution: z.string().trim().default(""),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

authRouter.post(
  "/register",
  ah(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
    }
    const d = parsed.data;

    const sessions = await query<{
      id: string;
      title: string;
      status: string;
      access_password: string;
    }>(
      "SELECT id, title, status, access_password FROM cts_sessions WHERE access_code = $1",
      [d.accessCode.toUpperCase()]
    );
    const session = sessions.rows[0];
    // Comparaison à temps constant si la session existe ; message identique
    // que le code ou le mot de passe soit en cause.
    const accessOk =
      session &&
      session.access_password.length > 0 &&
      timingSafeEqualStr(d.accessPassword.trim().toUpperCase(), session.access_password);
    if (!accessOk) {
      return res.status(401).json({
        error: "Identifiant ou mot de passe de session incorrect",
        code: "invalid_session_access",
      });
    }
    if (session.status === "terminé") {
      return res.status(403).json({
        error: "Les inscriptions pour cette session sont closes",
        code: "session_closed",
      });
    }

    const email = d.email.toLowerCase();
    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: "Un compte existe déjà avec cet e-mail. Connectez-vous directement.",
        code: "email_taken",
      });
    }

    const hash = await bcrypt.hash(d.password, 12);
    const { rows } = await query<DbUser>(
      `INSERT INTO users (name, email, password_hash, role, country, function_title,
                          institution, status, must_change_password, origin_session_id)
       VALUES ($1, $2, $3, 'participant', $4, $5, $6, 'actif', FALSE, $7)
       RETURNING *`,
      [d.name, email, hash, d.country, d.functionTitle, d.institution, session.id]
    );
    const user = rows[0];
    user.origin_session_title = session.title;

    await logActivity(
      "participant_registered",
      "Participant auto-inscrit",
      `${d.name} — ${d.country} (${session.title})`,
      user.id
    );

    setAuthCookie(res, signToken({ id: user.id, role: user.role }, user.token_version));
    res.status(201).json({ user: publicUser(user) });
  })
);

// ─── Accès invité : consultation des documents avec les seuls codes de session ─
// Les représentants des États membres saisissent les codes reçus et accèdent
// directement à l'espace documentaire. Ils ne deviennent participants (compte,
// discussions) que s'ils choisissent de s'inscrire.
const sessionLoginSchema = z.object({
  accessCode: z.string().trim().min(4, "Identifiant de session requis"),
  accessPassword: z.string().min(1, "Mot de passe de session requis"),
});

/** Représentation « utilisateur » d'un invité pour le client. */
function guestUser(sessionId: string, sessionTitle: string) {
  return {
    id: `guest:${sessionId}`,
    name: "",
    email: "",
    role: "guest" as const,
    country: "",
    functionTitle: "",
    institution: "",
    status: "actif",
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
    uiLang: "fr",
    docLangs: ["fr", "en", "pt", "es"],
    originSessionId: sessionId,
    originSessionTitle: sessionTitle,
  };
}

authRouter.post(
  "/session-login",
  ah(async (req, res) => {
    const parsed = sessionLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
    }
    const d = parsed.data;

    const sessions = await query<{
      id: string;
      title: string;
      status: string;
      access_code: string;
      access_password: string;
    }>(
      "SELECT id, title, status, access_code, access_password FROM cts_sessions WHERE access_code = $1",
      [d.accessCode.toUpperCase()]
    );
    const session = sessions.rows[0];
    const accessOk =
      session &&
      session.access_password.length > 0 &&
      timingSafeEqualStr(d.accessPassword.trim().toUpperCase(), session.access_password);
    if (!accessOk) {
      return res.status(401).json({
        error: "Identifiant ou mot de passe de session incorrect",
        code: "invalid_session_access",
      });
    }
    if (session.status === "terminé") {
      return res.status(403).json({
        error: "Cette session est terminée, ses accès ne sont plus valides",
        code: "session_closed",
      });
    }

    setAuthCookie(res, signGuestToken(session.id, session.access_code));
    res.json({ user: guestUser(session.id, session.title) });
  })
);

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.get(
  "/me",
  requireAuth,
  ah(async (req, res) => {
    // Invité : pas de ligne utilisateur, on reconstruit depuis la session.
    if (req.user!.role === "guest") {
      const { rows } = await query<{ id: string; title: string }>(
        "SELECT id, title FROM cts_sessions WHERE id = $1",
        [req.user!.sessionId]
      );
      if (!rows[0]) {
        clearAuthCookie(res);
        return res.status(401).json({ error: "Session introuvable" });
      }
      return res.json({ user: guestUser(rows[0].id, rows[0].title) });
    }

    const { rows } = await query<DbUser>(`${USER_SELECT} WHERE u.id = $1`, [
      req.user!.id,
    ]);
    if (!rows[0]) {
      clearAuthCookie(res);
      return res.status(401).json({ error: "Compte introuvable" });
    }
    res.json({ user: publicUser(rows[0]) });
  })
);

// ─── Mise à jour du compte (nom d'utilisateur + e-mail de connexion) ──────────
const profileSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court"),
  email: z.string().trim().email("E-mail invalide"),
});

authRouter.put(
  "/me",
  requireAuth,
  requireAccount,
  ah(async (req, res) => {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
    }
    const email = parsed.data.email.toLowerCase();

    const taken = await query(
      "SELECT id FROM users WHERE email = $1 AND id <> $2",
      [email, req.user!.id]
    );
    if (taken.rows.length > 0) {
      return res.status(409).json({
        error: "Un autre compte utilise déjà cet e-mail.",
        code: "email_taken",
      });
    }

    const updated = await query(
      "UPDATE users SET name = $1, email = $2, updated_at = now() WHERE id = $3 RETURNING id",
      [parsed.data.name, email, req.user!.id]
    );
    if (!updated.rows[0]) return res.status(404).json({ error: "Compte introuvable" });
    invalidateAuthCache(req.user!.id);

    const { rows } = await query<DbUser>(`${USER_SELECT} WHERE u.id = $1`, [
      req.user!.id,
    ]);
    res.json({ user: publicUser(rows[0]) });
  })
);

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
});

authRouter.post(
  "/change-password",
  requireAuth,
  requireAccount,
  ah(async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
    }
    const { currentPassword, newPassword } = parsed.data;

    const { rows } = await query<DbUser>("SELECT * FROM users WHERE id = $1", [
      req.user!.id,
    ]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      return res.status(400).json({ error: "Mot de passe actuel incorrect" });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    // token_version + 1 : tous les jetons émis avant ce changement sont révoqués.
    const updated = await query<{ token_version: number }>(
      `UPDATE users SET password_hash = $1, must_change_password = FALSE,
         token_version = token_version + 1, updated_at = now()
       WHERE id = $2 RETURNING token_version`,
      [hash, user.id]
    );
    invalidateAuthCache(user.id);

    // Réémission d'un cookie valide pour la session courante.
    setAuthCookie(
      res,
      signToken(
        { id: user.id, role: user.role },
        updated.rows[0].token_version
      )
    );
    res.json({ ok: true });
  })
);

// ─── Préférences de langue ─────────────────────────────────────────────────────
const preferencesSchema = z.object({
  uiLang: z.enum(LANGS).optional(),
  docLangs: z.array(z.enum(LANGS)).min(1, "Choisissez au moins une langue").optional(),
});

authRouter.put(
  "/preferences",
  requireAuth,
  requireAccount,
  ah(async (req, res) => {
    const parsed = preferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
    }
    const { uiLang, docLangs } = parsed.data;

    const updated = await query(
      `UPDATE users SET
         ui_lang = COALESCE($1, ui_lang),
         doc_langs = COALESCE($2, doc_langs),
         updated_at = now()
       WHERE id = $3
       RETURNING id`,
      [uiLang ?? null, docLangs ?? null, req.user!.id]
    );
    if (!updated.rows[0]) return res.status(404).json({ error: "Compte introuvable" });
    const { rows } = await query<DbUser>(`${USER_SELECT} WHERE u.id = $1`, [
      req.user!.id,
    ]);
    res.json({ user: publicUser(rows[0]) });
  })
);
