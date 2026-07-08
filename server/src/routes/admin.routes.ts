import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { logActivity } from "../activity.js";

export const statsRouter = Router();

statsRouter.get("/", async (_req, res) => {
  const [participants, documents, sessions, downloads, activity] =
    await Promise.all([
      query<{ total: string; actifs: string }>(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'actif') AS actifs
         FROM users WHERE role = 'participant'`
      ),
      query<{ publies: string; brouillons: string }>(
        `SELECT COUNT(*) FILTER (WHERE status = 'publié') AS publies,
                COUNT(*) FILTER (WHERE status = 'brouillon') AS brouillons
         FROM documents`
      ),
      query<{ avenir: string; prochaine_titre: string | null; prochaine_date: string | null; prochaine_lieu: string | null; prochaine_id: string | null; prochaine_docs: string | null; prochaine_participants: string | null }>(
        `SELECT COUNT(*) FILTER (WHERE status IN ('à-venir','en-cours')) AS avenir,
                (SELECT title FROM cts_sessions WHERE status IN ('à-venir','en-cours') ORDER BY start_date ASC LIMIT 1) AS prochaine_titre,
                (SELECT start_date::text FROM cts_sessions WHERE status IN ('à-venir','en-cours') ORDER BY start_date ASC LIMIT 1) AS prochaine_date,
                (SELECT location FROM cts_sessions WHERE status IN ('à-venir','en-cours') ORDER BY start_date ASC LIMIT 1) AS prochaine_lieu,
                (SELECT id::text FROM cts_sessions WHERE status IN ('à-venir','en-cours') ORDER BY start_date ASC LIMIT 1) AS prochaine_id,
                (SELECT expected_participants::text FROM cts_sessions WHERE status IN ('à-venir','en-cours') ORDER BY start_date ASC LIMIT 1) AS prochaine_participants,
                (SELECT COUNT(*)::text FROM documents d WHERE d.session_id = (SELECT id FROM cts_sessions WHERE status IN ('à-venir','en-cours') ORDER BY start_date ASC LIMIT 1)) AS prochaine_docs
         FROM cts_sessions`
      ),
      query<{ mois: string; total: string }>(
        `SELECT COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now())) AS mois,
                COUNT(*) AS total
         FROM document_downloads`
      ),
      query(
        `SELECT a.id, a.type, a.message, a.detail, a.created_at AS "createdAt"
         FROM activity_log a
         WHERE a.type <> 'login'
         ORDER BY a.created_at DESC
         LIMIT 8`
      ),
    ]);

  const s = sessions.rows[0];
  res.json({
    participants: {
      total: Number(participants.rows[0].total),
      actifs: Number(participants.rows[0].actifs),
    },
    documents: {
      publies: Number(documents.rows[0].publies),
      brouillons: Number(documents.rows[0].brouillons),
    },
    sessions: {
      planifiees: Number(s.avenir),
      prochaine: s.prochaine_titre
        ? {
            id: s.prochaine_id,
            title: s.prochaine_titre,
            startDate: s.prochaine_date,
            location: s.prochaine_lieu,
            documents: Number(s.prochaine_docs ?? 0),
            participants: Number(s.prochaine_participants ?? 0),
          }
        : null,
    },
    downloads: {
      moisCourant: Number(downloads.rows[0].mois),
      total: Number(downloads.rows[0].total),
    },
    activity: activity.rows,
  });
});

// ─── Paramètres du portail (contenus éditables) ───────────────────────────────
export const settingsRouter = Router();

const EDITABLE_KEYS = [
  "platform_name",
  "platform_subtitle",
  "org_full_name",
  "org_description",
  "contact_email",
  "footer_text",
  "login_notice",
] as const;

settingsRouter.get("/", async (_req, res) => {
  const { rows } = await query<{ key: string; value: string }>(
    "SELECT key, value FROM settings"
  );
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json({ settings });
});

const settingsSchema = z.record(z.string(), z.string().max(2000));

settingsRouter.put("/", async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body?.settings);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides" });

  const entries = Object.entries(parsed.data).filter(([k]) =>
    (EDITABLE_KEYS as readonly string[]).includes(k)
  );
  for (const [key, value] of entries) {
    await query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, value]
    );
  }

  await logActivity("settings_updated", "Contenus du portail mis à jour", "", req.user!.id);
  const { rows } = await query<{ key: string; value: string }>(
    "SELECT key, value FROM settings"
  );
  res.json({ settings: Object.fromEntries(rows.map((r) => [r.key, r.value])) });
});

// ─── Journal d'activité complet ───────────────────────────────────────────────
export const activityRouter = Router();

activityRouter.get("/", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const { rows } = await query(
    `SELECT a.id, a.type, a.message, a.detail, a.created_at AS "createdAt",
            u.name AS "actorName"
     FROM activity_log a
     LEFT JOIN users u ON u.id = a.actor_id
     ORDER BY a.created_at DESC
     LIMIT $1`,
    [limit]
  );
  res.json({ activity: rows });
});
