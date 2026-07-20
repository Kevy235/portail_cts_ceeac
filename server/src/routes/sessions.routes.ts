import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { z } from "zod";
import { query } from "../db.js";
import { config, isMailConfigured } from "../config.js";
import { requireAccount, requireAdmin } from "../auth.js";
import { ah, uuidParams } from "../http.js";
import { generateAccessCode, generateAccessPassword } from "../codes.js";
import { buildReportMail, sendBroadcast, type MailAttachment } from "../mailer.js";
import { logActivity } from "../activity.js";

export const sessionsRouter = Router();

const sessionSchema = z
  .object({
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
  })
  .refine((d) => !d.endDate || d.endDate >= d.startDate, {
    message: "La date de fin doit être postérieure à la date de début",
  });

// Colonnes visibles par tous les utilisateurs authentifiés.
const ROW = `s.id, s.title, s.location, s.start_date AS "startDate", s.end_date AS "endDate",
  s.status, s.reference, s.description, s.expected_participants AS "expectedParticipants",
  s.created_at AS "createdAt",
  (SELECT COUNT(*)::int FROM documents d WHERE d.session_id = s.id) AS "documentCount",
  (SELECT COUNT(*)::int FROM users u WHERE u.origin_session_id = s.id) AS "registeredCount"`;

// Identifiants d'accès : réservés à l'administrateur.
const ADMIN_ROW = `${ROW}, s.access_code AS "accessCode", s.access_password AS "accessPassword"`;

sessionsRouter.get(
  "/",
  ah(async (req, res) => {
    const isAdmin = req.user!.role === "admin";
    const { rows } = await query(
      `SELECT ${isAdmin ? ADMIN_ROW : ROW} FROM cts_sessions s ORDER BY s.start_date DESC`
    );
    res.json({ sessions: rows });
  })
);

/**
 * Référence auto-générée : CTS-DSS/ANNÉE/NN, où NN suit la plus haute
 * séquence existante pour l'année (robuste aux suppressions).
 */
async function nextReference(startDate: string): Promise<string> {
  const year = startDate.slice(0, 4);
  const { rows } = await query<{ next: number }>(
    `SELECT COALESCE(MAX(split_part(reference, '/', 3)::int), 0) + 1 AS next
     FROM cts_sessions
     WHERE reference LIKE $1 AND split_part(reference, '/', 3) ~ '^[0-9]+$'`,
    [`CTS-DSS/${year}/%`]
  );
  return `CTS-DSS/${year}/${String(rows[0].next).padStart(2, "0")}`;
}

sessionsRouter.post(
  "/",
  requireAdmin,
  ah(async (req, res) => {
    const parsed = sessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
    }
    const d = parsed.data;
    const reference = d.reference || (await nextReference(d.startDate));

    // L'identifiant d'accès est unique : on réessaie en cas de collision (rarissime).
    for (let attempt = 0; attempt < 5; attempt++) {
      const accessCode = generateAccessCode();
      const accessPassword = generateAccessPassword();
      try {
        const { rows } = await query(
          `WITH inserted AS (
             INSERT INTO cts_sessions (title, location, start_date, end_date, status, reference,
                                       description, expected_participants, access_code, access_password)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
           ) SELECT ${ADMIN_ROW} FROM inserted s`,
          [d.title, d.location, d.startDate, d.endDate ?? null, d.status, reference,
           d.description, d.expectedParticipants, accessCode, accessPassword]
        );
        await logActivity("session_created", "Session programmée", d.title, req.user!.id);
        return res.status(201).json({ session: rows[0] });
      } catch (err) {
        const isUniqueViolation =
          typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
        if (!isUniqueViolation || attempt === 4) throw err;
      }
    }
  })
);

sessionsRouter.put(
  "/:id",
  requireAdmin,
  uuidParams("id"),
  ah(async (req, res) => {
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
       ) SELECT ${ADMIN_ROW} FROM updated s`,
      [d.title, d.location, d.startDate, d.endDate ?? null, d.status, d.reference, d.description, d.expectedParticipants, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Session introuvable" });

    await logActivity("session_updated", "Session mise à jour", d.title, req.user!.id);
    res.json({ session: rows[0] });
  })
);

// Régénération des accès (si les identifiants ont fuité ou pour une relance).
sessionsRouter.post(
  "/:id/regenerate-access",
  requireAdmin,
  uuidParams("id"),
  ah(async (req, res) => {
    const { rows } = await query(
      `WITH updated AS (
         UPDATE cts_sessions SET access_code = $1, access_password = $2, updated_at = now()
         WHERE id = $3 RETURNING *
       ) SELECT ${ADMIN_ROW} FROM updated s`,
      [generateAccessCode(), generateAccessPassword(), req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Session introuvable" });

    await logActivity(
      "session_updated",
      "Accès de session régénérés",
      (rows[0] as { title: string }).title,
      req.user!.id
    );
    res.json({ session: rows[0] });
  })
);

sessionsRouter.delete(
  "/:id",
  requireAdmin,
  uuidParams("id"),
  ah(async (req, res) => {
    const { rows } = await query(
      "DELETE FROM cts_sessions WHERE id = $1 RETURNING title",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Session introuvable" });

    await logActivity("session_deleted", "Session supprimée", rows[0].title, req.user!.id);
    res.json({ ok: true });
  })
);

// ─── Diffusion des rapports par e-mail ─────────────────────────────────────────
const broadcastSchema = z.object({
  subject: z.string().trim().min(3, "Objet trop court").max(200),
  message: z.string().trim().min(3, "Message trop court").max(5000),
  // Tableau (JSON) ou chaîne JSON (multipart/form-data avec pièces jointes).
  documentIds: z.preprocess((v) => {
    if (typeof v !== "string") return v;
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }, z.array(z.string().uuid()).max(20).default([])),
  // "session" : participants inscrits via cette session ; "all" : tous les actifs.
  scope: z.enum(["session", "all"]).default("all"),
});

// Pièces jointes de l'e-mail : en mémoire (jamais écrites sur disque), mêmes
// types que les documents, limites adaptées aux messageries des destinataires.
const ATTACHMENT_MAX_MB = 10;
const ATTACHMENT_TOTAL_MB = 15;
const ATTACHMENT_EXT = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"]);
const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ATTACHMENT_MAX_MB * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, cb) => {
    if (ATTACHMENT_EXT.has(path.extname(file.originalname).toLowerCase())) {
      return cb(null, true);
    }
    cb(new Error("Type de pièce jointe non autorisé (PDF, Word, Excel, PowerPoint uniquement)"));
  },
}).array("attachments", 3);

sessionsRouter.post(
  "/:id/broadcast",
  requireAdmin,
  uuidParams("id"),
  (req, res, next) => {
    attachmentUpload(req, res, (err) => {
      if (err) {
        const msg =
          err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
            ? `Pièce jointe trop volumineuse (max. ${ATTACHMENT_MAX_MB} Mo par fichier)`
            : err instanceof multer.MulterError && err.code === "LIMIT_FILE_COUNT"
              ? "3 pièces jointes maximum"
              : err.message;
        return res.status(400).json({ error: msg });
      }
      next();
    });
  },
  ah(async (req, res) => {
    if (!isMailConfigured()) {
      return res.status(503).json({
        error:
          "L'envoi d'e-mails n'est pas configuré (variables SMTP_* manquantes). Contactez l'hébergeur.",
        code: "smtp_not_configured",
      });
    }
    const parsed = broadcastSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
    }
    const d = parsed.data;

    const uploaded = (req.files ?? []) as Express.Multer.File[];
    const totalBytes = uploaded.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > ATTACHMENT_TOTAL_MB * 1024 * 1024) {
      return res.status(400).json({
        error: `Total des pièces jointes limité à ${ATTACHMENT_TOTAL_MB} Mo`,
      });
    }
    const attachments: MailAttachment[] = uploaded.map((f) => ({
      filename: f.originalname,
      content: f.buffer,
      contentType: f.mimetype,
    }));

    const session = await query<{ title: string }>(
      "SELECT title FROM cts_sessions WHERE id = $1",
      [req.params.id]
    );
    if (!session.rows[0]) return res.status(404).json({ error: "Session introuvable" });

    const recipients = await query<{ email: string }>(
      `SELECT email FROM users
       WHERE role = 'participant' AND status = 'actif'
       ${d.scope === "session" ? "AND origin_session_id = $1" : ""}
       ORDER BY email`,
      d.scope === "session" ? [req.params.id] : []
    );
    if (recipients.rows.length === 0) {
      return res.status(400).json({
        error:
          d.scope === "session"
            ? "Aucun participant actif inscrit via cette session"
            : "Aucun participant actif à notifier",
      });
    }

    const appUrl =
      config.appUrl || `${req.protocol}://${req.get("host") ?? "localhost"}`;

    // Un lien par document publié et par version linguistique disponible.
    const docs = d.documentIds.length
      ? await query<{ id: string; title: string; is_coded: boolean; lang: string }>(
          `SELECT d.id, d.title, d.is_coded, f.lang
           FROM documents d
           JOIN document_files f ON f.document_id = d.id
           WHERE d.id = ANY($1::uuid[]) AND d.status = 'publié'
           ORDER BY d.title, array_position(ARRAY['fr','en','pt','es'], f.lang)`,
          [d.documentIds]
        )
      : { rows: [] as { id: string; title: string; is_coded: boolean; lang: string }[] };

    const links = docs.rows.map((doc) => ({
      title: `${doc.title} (${doc.lang.toUpperCase()})`,
      url: `${appUrl}/api/documents/${doc.id}/download/${doc.lang}`,
      isCoded: doc.is_coded,
    }));

    const platform = await query<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'platform_name' AND lang = 'fr'"
    );

    const mail = buildReportMail({
      platformName: platform.rows[0]?.value ?? "CEEAC · CTS-DSS",
      sessionTitle: session.rows[0].title,
      subject: d.subject,
      message: d.message,
      documents: links,
      appUrl,
    });
    if (attachments.length > 0) mail.attachments = attachments;

    const result = await sendBroadcast(
      recipients.rows.map((r) => r.email),
      mail
    );

    await logActivity(
      "broadcast_sent",
      "Rapport diffusé par e-mail",
      `${session.rows[0].title} — ${result.sent.length} envoyé(s), ${result.failed.length} échec(s)`,
      req.user!.id
    );
    res.json({ sent: result.sent.length, failed: result.failed.length });
  })
);

// ─── Fil de discussion par session ─────────────────────────────────────────────
const MESSAGE_ROW = `m.id, m.body, m.created_at AS "createdAt",
  m.user_id AS "authorId", COALESCE(u.name, 'Compte supprimé') AS "authorName",
  COALESCE(u.country, '') AS "authorCountry", COALESCE(u.role, '') AS "authorRole"`;

sessionsRouter.get(
  "/:id/messages",
  uuidParams("id"),
  ah(async (req, res) => {
    const after = Number(req.query.after) || 0;
    // Les 200 plus récents (et non les 200 plus anciens), rendus en ordre croissant.
    const { rows } = await query(
      `SELECT * FROM (
         SELECT ${MESSAGE_ROW}
         FROM session_messages m
         LEFT JOIN users u ON u.id = m.user_id
         WHERE m.session_id = $1 AND m.id > $2
         ORDER BY m.id DESC
         LIMIT 200
       ) latest ORDER BY id ASC`,
      [req.params.id, after]
    );
    res.json({ messages: rows });
  })
);

const messageSchema = z.object({
  body: z.string().trim().min(1, "Message vide").max(2000, "Message trop long (2000 caractères max.)"),
});

sessionsRouter.post(
  "/:id/messages",
  requireAccount,
  uuidParams("id"),
  ah(async (req, res) => {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Message invalide" });
    }

    const session = await query("SELECT id FROM cts_sessions WHERE id = $1", [req.params.id]);
    if (!session.rows[0]) return res.status(404).json({ error: "Session introuvable" });

    const { rows } = await query(
      `WITH inserted AS (
         INSERT INTO session_messages (session_id, user_id, body)
         VALUES ($1, $2, $3) RETURNING *
       )
       SELECT ${MESSAGE_ROW} FROM inserted m LEFT JOIN users u ON u.id = m.user_id`,
      [req.params.id, req.user!.id, parsed.data.body]
    );
    res.status(201).json({ message: rows[0] });
  })
);

// Suppression : auteur du message ou administrateur
sessionsRouter.delete(
  "/:id/messages/:messageId",
  requireAccount,
  uuidParams("id"),
  ah(async (req, res) => {
    const messageId = Number(req.params.messageId);
    if (!Number.isInteger(messageId) || messageId <= 0) {
      return res.status(404).json({ error: "Message introuvable" });
    }
    const isAdmin = req.user!.role === "admin";
    const { rows } = await query(
      `DELETE FROM session_messages
       WHERE id = $1 AND session_id = $2 ${isAdmin ? "" : "AND user_id = $3"}
       RETURNING id`,
      isAdmin
        ? [messageId, req.params.id]
        : [messageId, req.params.id, req.user!.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Message introuvable" });
    res.json({ ok: true });
  })
);
