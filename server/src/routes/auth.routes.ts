import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../db.js";
import {
  clearAuthCookie,
  requireAuth,
  setAuthCookie,
  signToken,
} from "../auth.js";
import { logActivity } from "../activity.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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
  };
}

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "E-mail ou mot de passe invalide" });
  }
  const { email, password } = parsed.data;

  const { rows } = await query<DbUser>(
    "SELECT * FROM users WHERE email = $1",
    [email.toLowerCase().trim()]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Identifiants incorrects. Veuillez réessayer." });
  }
  if (user.status === "inactif") {
    return res.status(403).json({
      error: "Votre compte est désactivé. Contactez le Secrétariat DAPPS.",
    });
  }

  await query(
    "UPDATE users SET last_login_at = now(), status = CASE WHEN status = 'en-attente' THEN 'actif' ELSE status END WHERE id = $1",
    [user.id]
  );
  await logActivity("login", "Connexion à la plateforme", `${user.name} — ${user.email}`, user.id);

  setAuthCookie(res, signToken({ id: user.id, role: user.role }));
  res.json({ user: publicUser({ ...user, status: user.status === "en-attente" ? "actif" : user.status }) });
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const { rows } = await query<DbUser>("SELECT * FROM users WHERE id = $1", [
    req.user!.id,
  ]);
  if (!rows[0]) {
    clearAuthCookie(res);
    return res.status(401).json({ error: "Compte introuvable" });
  }
  res.json({ user: publicUser(rows[0]) });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
});

authRouter.post("/change-password", requireAuth, async (req, res) => {
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
  await query(
    "UPDATE users SET password_hash = $1, must_change_password = FALSE, updated_at = now() WHERE id = $2",
    [hash, user.id]
  );
  res.json({ ok: true });
});
