import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { query } from "../db.js";
import { logActivity } from "../activity.js";

export const participantsRouter = Router();

const participantSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court"),
  email: z.string().trim().email("E-mail invalide"),
  country: z.string().trim().min(1, "Pays requis"),
  functionTitle: z.string().trim().min(1, "Fonction requise"),
  institution: z.string().trim().default(""),
  status: z.enum(["actif", "en-attente", "inactif"]).default("en-attente"),
});

const ROW = `id, name, email, role, country, function_title AS "functionTitle",
  institution, status, must_change_password AS "mustChangePassword",
  last_login_at AS "lastLoginAt", created_at AS "createdAt"`;

participantsRouter.get("/", async (_req, res) => {
  const { rows } = await query(
    `SELECT ${ROW} FROM users WHERE role = 'participant' ORDER BY created_at DESC`
  );
  res.json({ participants: rows });
});

/** Génère un mot de passe provisoire lisible (communiqué une seule fois à l'admin). */
function tempPassword(): string {
  return crypto.randomBytes(9).toString("base64url");
}

participantsRouter.post("/", async (req, res) => {
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

  const password = tempPassword();
  const hash = await bcrypt.hash(password, 12);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role, country, function_title, institution, status, must_change_password)
     VALUES ($1, $2, $3, 'participant', $4, $5, $6, $7, TRUE)
     RETURNING ${ROW}`,
    [data.name, email, hash, data.country, data.functionTitle, data.institution, data.status]
  );

  await logActivity(
    "participant_created",
    "Nouveau participant accrédité",
    `${data.name} — ${data.country}`,
    req.user!.id
  );

  res.status(201).json({ participant: rows[0], temporaryPassword: password });
});

participantsRouter.put("/:id", async (req, res) => {
  const parsed = participantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
  }
  const data = parsed.data;

  const { rows } = await query(
    `UPDATE users SET name = $1, email = $2, country = $3, function_title = $4,
       institution = $5, status = $6, updated_at = now()
     WHERE id = $7 AND role = 'participant'
     RETURNING ${ROW}`,
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

  await logActivity(
    "participant_updated",
    "Participant mis à jour",
    `${data.name} — ${data.country}`,
    req.user!.id
  );
  res.json({ participant: rows[0] });
});

participantsRouter.post("/:id/reset-password", async (req, res) => {
  const password = tempPassword();
  const hash = await bcrypt.hash(password, 12);
  const { rows } = await query(
    `UPDATE users SET password_hash = $1, must_change_password = TRUE, updated_at = now()
     WHERE id = $2 AND role = 'participant' RETURNING name`,
    [hash, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Participant introuvable" });

  await logActivity(
    "participant_updated",
    "Mot de passe réinitialisé",
    rows[0].name,
    req.user!.id
  );
  res.json({ temporaryPassword: password });
});

participantsRouter.delete("/:id", async (req, res) => {
  const { rows } = await query(
    "DELETE FROM users WHERE id = $1 AND role = 'participant' RETURNING name, country",
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Participant introuvable" });

  await logActivity(
    "participant_deleted",
    "Participant supprimé",
    `${rows[0].name} — ${rows[0].country}`,
    req.user!.id
  );
  res.json({ ok: true });
});
