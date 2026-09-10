import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../db.js";
import { invalidateAuthCache } from "../auth.js";
import { ah, uuidParams } from "../http.js";
import { generateTempPassword } from "../codes.js";
import { logActivity } from "../activity.js";

export const adminsRouter = Router();

const adminSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court"),
  email: z.string().trim().email("E-mail invalide"),
  functionTitle: z.string().trim().default(""),
  institution: z.string().trim().default(""),
  status: z.enum(["actif", "en-attente", "inactif"]).default("actif"),
});

const ROW = `id, name, email, role, country, function_title AS "functionTitle",
  institution, status, must_change_password AS "mustChangePassword",
  last_login_at AS "lastLoginAt", created_at AS "createdAt"`;

async function activeAdminCount(exceptId?: string) {
  const { rows } = await query<{ n: string }>(
    exceptId
      ? `SELECT COUNT(*)::text AS n FROM users
         WHERE role = 'admin' AND status <> 'inactif' AND id <> $1`
      : `SELECT COUNT(*)::text AS n FROM users
         WHERE role = 'admin' AND status <> 'inactif'`,
    exceptId ? [exceptId] : []
  );
  return Number(rows[0]?.n ?? 0);
}

async function emailTaken(email: string, exceptId?: string) {
  const { rows } = await query<{ id: string }>(
    exceptId
      ? "SELECT id FROM users WHERE email = $1 AND id <> $2"
      : "SELECT id FROM users WHERE email = $1",
    exceptId ? [email, exceptId] : [email]
  );
  return rows.length > 0;
}

adminsRouter.get(
  "/",
  ah(async (_req, res) => {
    const { rows } = await query(
      `SELECT ${ROW} FROM users WHERE role = 'admin' ORDER BY created_at ASC`
    );
    res.json({ admins: rows });
  })
);

adminsRouter.post(
  "/",
  ah(async (req, res) => {
    const parsed = adminSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
    }
    const data = parsed.data;
    const email = data.email.toLowerCase();

    if (await emailTaken(email)) {
      return res.status(409).json({ error: "Un compte existe déjà avec cet e-mail" });
    }

    const password = generateTempPassword();
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query<{ id: string }>(
      `INSERT INTO users (name, email, password_hash, role, country, function_title,
         institution, status, must_change_password)
       VALUES ($1, $2, $3, 'admin', '', $4, $5, $6, TRUE)
       RETURNING id`,
      [data.name, email, hash, data.functionTitle, data.institution, data.status]
    );
    const created = await query(`SELECT ${ROW} FROM users WHERE id = $1`, [rows[0].id]);

    await logActivity("admin_created", "Nouvel administrateur", data.name, req.user!.id);
    res.status(201).json({ admin: created.rows[0], temporaryPassword: password });
  })
);

adminsRouter.put(
  "/:id",
  uuidParams("id"),
  ah(async (req, res) => {
    const parsed = adminSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
    }
    const data = parsed.data;
    const email = data.email.toLowerCase();
    const targetId = req.params.id;
    const isSelf = targetId === req.user!.id;

    const current = await query<{ id: string; status: string }>(
      "SELECT id, status FROM users WHERE id = $1 AND role = 'admin'",
      [targetId]
    );
    if (!current.rows[0]) return res.status(404).json({ error: "Administrateur introuvable" });

    if (isSelf && data.status === "inactif") {
      return res.status(403).json({ error: "Vous ne pouvez pas désactiver votre propre compte" });
    }

    const becomingInactive =
      data.status === "inactif" && current.rows[0].status !== "inactif";
    if (becomingInactive && (await activeAdminCount(targetId)) === 0) {
      return res.status(409).json({
        error: "Impossible de désactiver le dernier administrateur actif",
      });
    }

    if (await emailTaken(email, targetId)) {
      return res.status(409).json({ error: "Un compte existe déjà avec cet e-mail" });
    }

    const { rows } = await query<{ id: string }>(
      `UPDATE users SET name = $1, email = $2, function_title = $3,
         institution = $4, status = $5, updated_at = now()
       WHERE id = $6 AND role = 'admin'
       RETURNING id`,
      [data.name, email, data.functionTitle, data.institution, data.status, targetId]
    );
    if (!rows[0]) return res.status(404).json({ error: "Administrateur introuvable" });
    invalidateAuthCache(targetId);

    const updated = await query(`SELECT ${ROW} FROM users WHERE id = $1`, [targetId]);
    await logActivity("admin_updated", "Administrateur mis à jour", data.name, req.user!.id);
    res.json({ admin: updated.rows[0] });
  })
);

adminsRouter.post(
  "/:id/reset-password",
  uuidParams("id"),
  ah(async (req, res) => {
    if (req.params.id === req.user!.id) {
      return res.status(403).json({
        error: "Réinitialisez votre mot de passe depuis votre compte",
      });
    }

    const password = generateTempPassword();
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `UPDATE users SET password_hash = $1, must_change_password = TRUE,
         token_version = token_version + 1, updated_at = now()
       WHERE id = $2 AND role = 'admin' RETURNING name`,
      [hash, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Administrateur introuvable" });
    invalidateAuthCache(req.params.id);

    await logActivity(
      "admin_updated",
      "Mot de passe administrateur réinitialisé",
      rows[0].name,
      req.user!.id
    );
    res.json({ temporaryPassword: password });
  })
);

adminsRouter.delete(
  "/:id",
  uuidParams("id"),
  ah(async (req, res) => {
    if (req.params.id === req.user!.id) {
      return res.status(403).json({ error: "Vous ne pouvez pas supprimer votre propre compte" });
    }

    const current = await query<{ name: string; status: string }>(
      "SELECT name, status FROM users WHERE id = $1 AND role = 'admin'",
      [req.params.id]
    );
    if (!current.rows[0]) return res.status(404).json({ error: "Administrateur introuvable" });

    if (current.rows[0].status !== "inactif" && (await activeAdminCount(req.params.id)) === 0) {
      return res.status(409).json({
        error: "Impossible de supprimer le dernier administrateur actif",
      });
    }

    await query("DELETE FROM users WHERE id = $1 AND role = 'admin'", [req.params.id]);
    invalidateAuthCache(req.params.id);

    await logActivity(
      "admin_deleted",
      "Administrateur supprimé",
      current.rows[0].name,
      req.user!.id
    );
    res.json({ ok: true });
  })
);
