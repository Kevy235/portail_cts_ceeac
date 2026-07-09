import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../db.js";
import { invalidateAuthCache } from "../auth.js";
import { ah, uuidParams } from "../http.js";
import { generateTempPassword } from "../codes.js";
import { logActivity } from "../activity.js";

export const participantsRouter = Router();

const participantSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court"),
  email: z.string().trim().email("E-mail invalide"),
  country: z.string().trim().min(1, "Pays requis"),
  // Fonction facultative : tous les participants n'ont pas de titre officiel.
  functionTitle: z.string().trim().default(""),
  institution: z.string().trim().default(""),
  status: z.enum(["actif", "en-attente", "inactif"]).default("en-attente"),
});

const ROW = `u.id, u.name, u.email, u.role, u.country, u.function_title AS "functionTitle",
  u.institution, u.status, u.must_change_password AS "mustChangePassword",
  u.last_login_at AS "lastLoginAt", u.created_at AS "createdAt",
  u.origin_session_id AS "originSessionId", s.title AS "originSessionTitle"`;

const JOINS = `LEFT JOIN cts_sessions s ON s.id = u.origin_session_id`;

participantsRouter.get(
  "/",
  ah(async (_req, res) => {
    const { rows } = await query(
      `SELECT ${ROW} FROM users u ${JOINS}
       WHERE u.role = 'participant' ORDER BY u.created_at DESC`
    );
    res.json({ participants: rows });
  })
);

participantsRouter.post(
  "/",
  ah(async (req, res) => {
    const parsed = participantSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
    }
    const data = parsed.data;
    const email = data.email.toLowerCase();

    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Un compte existe déjà avec cet e-mail" });
    }

    const password = generateTempPassword();
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query<{ id: string }>(
      `INSERT INTO users (name, email, password_hash, role, country, function_title, institution, status, must_change_password)
       VALUES ($1, $2, $3, 'participant', $4, $5, $6, $7, TRUE)
       RETURNING id`,
      [data.name, email, hash, data.country, data.functionTitle, data.institution, data.status]
    );
    const created = await query(
      `SELECT ${ROW} FROM users u ${JOINS} WHERE u.id = $1`,
      [rows[0].id]
    );

    await logActivity(
      "participant_created",
      "Nouveau participant accrédité",
      `${data.name} — ${data.country}`,
      req.user!.id
    );

    res.status(201).json({ participant: created.rows[0], temporaryPassword: password });
  })
);

participantsRouter.put(
  "/:id",
  uuidParams("id"),
  ah(async (req, res) => {
    const parsed = participantSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
    }
    const data = parsed.data;

    const { rows } = await query<{ id: string }>(
      `UPDATE users SET name = $1, email = $2, country = $3, function_title = $4,
         institution = $5, status = $6, updated_at = now()
       WHERE id = $7 AND role = 'participant'
       RETURNING id`,
      [
        data.name,
        data.email.toLowerCase(),
        data.country,
        data.functionTitle,
        data.institution,
        data.status,
        req.params.id,
      ]
    );
    if (!rows[0]) return res.status(404).json({ error: "Participant introuvable" });
    // Un passage en « inactif » doit couper l'accès immédiatement.
    invalidateAuthCache(req.params.id);

    const updated = await query(
      `SELECT ${ROW} FROM users u ${JOINS} WHERE u.id = $1`,
      [req.params.id]
    );

    await logActivity(
      "participant_updated",
      "Participant mis à jour",
      `${data.name} — ${data.country}`,
      req.user!.id
    );
    res.json({ participant: updated.rows[0] });
  })
);

participantsRouter.post(
  "/:id/reset-password",
  uuidParams("id"),
  ah(async (req, res) => {
    const password = generateTempPassword();
    const hash = await bcrypt.hash(password, 12);
    // token_version + 1 : les sessions ouvertes avec l'ancien mot de passe sont révoquées.
    const { rows } = await query(
      `UPDATE users SET password_hash = $1, must_change_password = TRUE,
         token_version = token_version + 1, updated_at = now()
       WHERE id = $2 AND role = 'participant' RETURNING name`,
      [hash, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Participant introuvable" });
    invalidateAuthCache(req.params.id);

    await logActivity(
      "participant_updated",
      "Mot de passe réinitialisé",
      rows[0].name,
      req.user!.id
    );
    res.json({ temporaryPassword: password });
  })
);

participantsRouter.delete(
  "/:id",
  uuidParams("id"),
  ah(async (req, res) => {
    const { rows } = await query(
      "DELETE FROM users WHERE id = $1 AND role = 'participant' RETURNING name, country",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Participant introuvable" });
    invalidateAuthCache(req.params.id);

    await logActivity(
      "participant_deleted",
      "Participant supprimé",
      `${rows[0].name} — ${rows[0].country}`,
      req.user!.id
    );
    res.json({ ok: true });
  })
);
