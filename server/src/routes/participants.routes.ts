import { Router } from "express";
import bcrypt from "bcryptjs";
import type { PoolClient } from "pg";
import { z } from "zod";
import { query, withTransaction } from "../db.js";
import { invalidateAuthCache } from "../auth.js";
import { ah, uuidParams } from "../http.js";
import { generateTempPassword } from "../codes.js";
import { logActivity } from "../activity.js";

export const participantsRouter = Router();

const COMMISSION_INSTITUTION = "Commission de la CEEAC";

const participantSchema = z
  .object({
    name: z.string().trim().min(2, "Nom trop court"),
    email: z.string().trim().email("E-mail invalide"),
    country: z.string().trim().default(""),
    functionTitle: z.string().trim().default(""),
    institution: z.string().trim().default(""),
    status: z.enum(["actif", "en-attente", "inactif"]).default("en-attente"),
    kind: z.enum(["member_state", "commission"]).default("member_state"),
    allSessions: z.boolean().optional(),
    sessionIds: z.array(z.string().uuid()).max(200).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.kind === "member_state" && !d.country) {
      ctx.addIssue({ code: "custom", message: "Pays requis", path: ["country"] });
    }
  });

const ROW = `u.id, u.name, u.email, u.role, u.country, u.function_title AS "functionTitle",
  u.institution, u.status, u.must_change_password AS "mustChangePassword",
  u.last_login_at AS "lastLoginAt", u.created_at AS "createdAt",
  u.origin_session_id AS "originSessionId", s.title AS "originSessionTitle",
  u.participant_kind AS "kind", u.all_sessions AS "allSessions",
  COALESCE((
    SELECT json_agg(json_build_object('id', cs.id, 'title', cs.title, 'reference', cs.reference)
             ORDER BY cs.start_date DESC)
    FROM session_access sa JOIN cts_sessions cs ON cs.id = sa.session_id
    WHERE sa.user_id = u.id
  ), '[]'::json) AS "sessionAccess"`;

async function applyMeetingAccess(
  client: PoolClient,
  userId: string,
  allSessions: boolean,
  sessionIds: string[]
) {
  const ids = Array.from(new Set(sessionIds));
  await client.query("UPDATE users SET all_sessions = $1, updated_at = now() WHERE id = $2", [
    allSessions,
    userId,
  ]);
  if (allSessions) {
    await client.query("DELETE FROM session_access WHERE user_id = $1", [userId]);
    return;
  }
  await client.query(
    "DELETE FROM session_access WHERE user_id = $1 AND session_id <> ALL($2::uuid[])",
    [userId, ids]
  );
  if (ids.length > 0) {
    await client.query(
      `INSERT INTO session_access (user_id, session_id)
       SELECT $1, id FROM cts_sessions WHERE id = ANY($2::uuid[])
       ON CONFLICT (user_id, session_id) DO NOTHING`,
      [userId, ids]
    );
  }
}

function normalizeInstitution(kind: "member_state" | "commission", institution: string) {
  if (kind === "commission" && !institution) return COMMISSION_INSTITUTION;
  return institution;
}

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
    const allSessions = data.kind === "commission" && Boolean(data.allSessions);
    const sessionIds = allSessions ? [] : Array.from(new Set(data.sessionIds ?? []));
    if (data.kind === "commission" && !allSessions && sessionIds.length === 0) {
      return res.status(400).json({
        error: "Affectez le participant de la Commission à au moins une réunion, ou à toutes",
      });
    }
    const institution = normalizeInstitution(data.kind, data.institution);

    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Un compte existe déjà avec cet e-mail" });
    }

    const password = generateTempPassword();
    const hash = await bcrypt.hash(password, 12);
    const id = await withTransaction(async (client) => {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO users (name, email, password_hash, role, country, function_title,
           institution, status, must_change_password, participant_kind, all_sessions)
         VALUES ($1, $2, $3, 'participant', $4, $5, $6, $7, TRUE, $8, $9)
         RETURNING id`,
        [
          data.name,
          email,
          hash,
          data.country,
          data.functionTitle,
          institution,
          data.status,
          data.kind,
          allSessions,
        ]
      );
      await applyMeetingAccess(client, rows[0].id, allSessions, sessionIds);
      return rows[0].id;
    });
    const created = await query(`SELECT ${ROW} FROM users u ${JOINS} WHERE u.id = $1`, [id]);

    await logActivity(
      "participant_created",
      data.kind === "commission"
        ? "Nouveau participant Commission de la CEEAC"
        : "Nouveau participant accrédité",
      `${data.name} — ${data.kind === "commission" ? "Commission" : data.country}`,
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
    const allSessions = data.kind === "commission" && Boolean(data.allSessions);
    const sessionIds = allSessions ? [] : Array.from(new Set(data.sessionIds ?? []));
    const touchAccess = data.allSessions !== undefined || data.sessionIds !== undefined;
    if (touchAccess && data.kind === "commission" && !allSessions && sessionIds.length === 0) {
      return res.status(400).json({
        error: "Affectez le participant de la Commission à au moins une réunion, ou à toutes",
      });
    }
    const institution = normalizeInstitution(data.kind, data.institution);

    const updatedRows = await withTransaction(async (client) => {
      const updated = await client.query<{ id: string }>(
        `UPDATE users SET name = $1, email = $2, country = $3, function_title = $4,
           institution = $5, status = $6, participant_kind = $7, updated_at = now()
         WHERE id = $8 AND role = 'participant'
         RETURNING id`,
        [
          data.name,
          data.email.toLowerCase(),
          data.country,
          data.functionTitle,
          institution,
          data.status,
          data.kind,
          req.params.id,
        ]
      );
      if (!updated.rows[0]) return updated.rows;
      if (touchAccess) {
        await applyMeetingAccess(
          client,
          req.params.id,
          data.kind === "commission" ? allSessions : false,
          sessionIds
        );
      } else if (data.kind === "member_state") {
        await client.query("UPDATE users SET all_sessions = FALSE WHERE id = $1", [req.params.id]);
      }
      return updated.rows;
    });
    if (!updatedRows[0]) return res.status(404).json({ error: "Participant introuvable" });
    // Un passage en « inactif » doit couper l'accès immédiatement.
    invalidateAuthCache(req.params.id);

    const updated = await query(
      `SELECT ${ROW} FROM users u ${JOINS} WHERE u.id = $1`,
      [req.params.id]
    );

    await logActivity(
      "participant_updated",
      "Participant mis à jour",
      `${data.name} — ${data.kind === "commission" ? "Commission" : data.country}`,
      req.user!.id
    );
    res.json({ participant: updated.rows[0] });
  })
);

// ─── Réunions ouvertes à un participant ───────────────────────────────────────
// Les codes d'une réunion n'ouvrent que cette réunion ; cette route permet à
// l'administrateur d'ajuster les droits d'un compte (notamment les comptes
// créés à la main, qui n'ont aucune réunion d'origine).
const accessSchema = z.object({
  sessionIds: z.array(z.string().uuid()).max(200).default([]),
  allSessions: z.boolean().optional().default(false),
});

participantsRouter.put(
  "/:id/access",
  uuidParams("id"),
  ah(async (req, res) => {
    const parsed = accessSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Liste de réunions invalide" });
    }
    const sessionIds = Array.from(new Set(parsed.data.sessionIds));
    const allSessions = Boolean(parsed.data.allSessions);

    const target = await query<{ name: string; kind: string }>(
      "SELECT name, participant_kind AS kind FROM users WHERE id = $1 AND role = 'participant'",
      [req.params.id]
    );
    if (!target.rows[0]) return res.status(404).json({ error: "Participant introuvable" });
    if (allSessions && target.rows[0].kind !== "commission") {
      return res.status(400).json({
        error: "Seuls les participants de la Commission peuvent être rattachés à toutes les réunions",
      });
    }
    if (target.rows[0].kind === "commission" && !allSessions && sessionIds.length === 0) {
      return res.status(400).json({
        error: "Affectez le participant de la Commission à au moins une réunion, ou à toutes",
      });
    }

    await withTransaction(async (client) => {
      await applyMeetingAccess(client, req.params.id, allSessions, allSessions ? [] : sessionIds);
    });
    invalidateAuthCache(req.params.id);

    const updated = await query(
      `SELECT ${ROW} FROM users u ${JOINS} WHERE u.id = $1`,
      [req.params.id]
    );
    await logActivity(
      "session_access_granted",
      "Accès aux réunions modifiés",
      `${target.rows[0].name} — ${sessionIds.length} réunion(s)`,
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
