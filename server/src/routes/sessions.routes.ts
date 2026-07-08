import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAdmin } from "../auth.js";
import { logActivity } from "../activity.js";

export const sessionsRouter = Router();

const sessionSchema = z.object({
  title: z.string().trim().min(3, "Titre trop court"),
  location: z.string().trim().default(""),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de début invalide"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  status: z.enum(["à-venir", "en-cours", "terminé"]).default("à-venir"),
  reference: z.string().trim().default(""),
  description: z.string().trim().default(""),
  expectedParticipants: z.number().int().min(0).default(0),
});

const ROW = `s.id, s.title, s.location, s.start_date AS "startDate", s.end_date AS "endDate",
  s.status, s.reference, s.description, s.expected_participants AS "expectedParticipants",
  s.created_at AS "createdAt",
  (SELECT COUNT(*)::int FROM documents d WHERE d.session_id = s.id) AS "documentCount"`;

sessionsRouter.get("/", async (_req, res) => {
  const { rows } = await query(
    `SELECT ${ROW} FROM cts_sessions s ORDER BY s.start_date DESC`
  );
  res.json({ sessions: rows });
});

sessionsRouter.post("/", requireAdmin, async (req, res) => {
  const parsed = sessionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
  }
  const d = parsed.data;
  const { rows } = await query(
    `WITH inserted AS (
       INSERT INTO cts_sessions (title, location, start_date, end_date, status, reference, description, expected_participants)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
     ) SELECT ${ROW} FROM inserted s`,
    [d.title, d.location, d.startDate, d.endDate ?? null, d.status, d.reference, d.description, d.expectedParticipants]
  );

  await logActivity("session_created", "Session programmée", d.title, req.user!.id);
  res.status(201).json({ session: rows[0] });
});

sessionsRouter.put("/:id", requireAdmin, async (req, res) => {
  const parsed = sessionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
  }
  const d = parsed.data;
  const { rows } = await query(
    `WITH updated AS (
       UPDATE cts_sessions SET title = $1, location = $2, start_date = $3, end_date = $4,
         status = $5, reference = $6, description = $7, expected_participants = $8, updated_at = now()
       WHERE id = $9 RETURNING *
     ) SELECT ${ROW} FROM updated s`,
    [d.title, d.location, d.startDate, d.endDate ?? null, d.status, d.reference, d.description, d.expectedParticipants, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Session introuvable" });

  await logActivity("session_updated", "Session mise à jour", d.title, req.user!.id);
  res.json({ session: rows[0] });
});

sessionsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { rows } = await query(
    "DELETE FROM cts_sessions WHERE id = $1 RETURNING title",
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Session introuvable" });

  await logActivity("session_deleted", "Session supprimée", rows[0].title, req.user!.id);
  res.json({ ok: true });
});
