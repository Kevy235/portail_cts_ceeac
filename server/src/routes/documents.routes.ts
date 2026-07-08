import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { z } from "zod";
import { query } from "../db.js";
import { config } from "../config.js";
import { requireAdmin } from "../auth.js";
import { logActivity } from "../activity.js";

export const documentsRouter = Router();

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error("Type de fichier non autorisé (PDF, Word, Excel, PowerPoint uniquement)"));
  },
});

const metaSchema = z.object({
  title: z.string().trim().min(3, "Titre trop court"),
  categoryId: z.string().uuid().nullable().optional(),
  sessionId: z.string().uuid().nullable().optional(),
  status: z.enum(["publié", "brouillon"]).default("brouillon"),
});

const ROW = `d.id, d.title, d.status, d.file_name AS "fileName", d.file_size AS "fileSize",
  d.mime_type AS "mimeType", d.created_at AS "createdAt", d.updated_at AS "updatedAt",
  d.category_id AS "categoryId", c.name AS "categoryName",
  d.session_id AS "sessionId", s.title AS "sessionTitle", s.reference AS "sessionReference",
  (SELECT COUNT(*)::int FROM document_downloads dd WHERE dd.document_id = d.id) AS "downloads"`;

const FROM = `FROM documents d
  LEFT JOIN categories c ON c.id = d.category_id
  LEFT JOIN cts_sessions s ON s.id = d.session_id`;

documentsRouter.get("/", async (req, res) => {
  // Les participants ne voient que les documents publiés.
  const isAdmin = req.user!.role === "admin";
  const { rows } = await query(
    `SELECT ${ROW} ${FROM}
     ${isAdmin ? "" : "WHERE d.status = 'publié'"}
     ORDER BY d.created_at DESC`
  );
  res.json({ documents: rows });
});

documentsRouter.post("/", requireAdmin, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      const msg =
        err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
          ? `Fichier trop volumineux (max. ${config.maxUploadMb} Mo)`
          : err.message;
      return res.status(400).json({ error: msg });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier fourni" });
    }

    const parsed = metaSchema.safeParse({
      title: req.body.title,
      categoryId: req.body.categoryId || null,
      sessionId: req.body.sessionId || null,
      status: req.body.status || "brouillon",
    });
    if (!parsed.success) {
      fs.promises.unlink(req.file.path).catch(() => {});
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
    }
    const d = parsed.data;

    try {
      const { rows } = await query(
        `WITH inserted AS (
           INSERT INTO documents (title, category_id, session_id, status, file_name, stored_name, file_size, mime_type, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
         ) SELECT ${ROW} FROM inserted d
           LEFT JOIN categories c ON c.id = d.category_id
           LEFT JOIN cts_sessions s ON s.id = d.session_id`,
        [
          d.title,
          d.categoryId ?? null,
          d.sessionId ?? null,
          d.status,
          req.file.originalname,
          req.file.filename,
          req.file.size,
          req.file.mimetype,
          req.user!.id,
        ]
      );

      if (d.status === "publié") {
        await logActivity("document_published", "Document publié", d.title, req.user!.id);
      }
      res.status(201).json({ document: rows[0] });
    } catch (dbErr) {
      fs.promises.unlink(req.file.path).catch(() => {});
      throw dbErr;
    }
  });
});

documentsRouter.put("/:id", requireAdmin, async (req, res) => {
  const parsed = metaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
  }
  const d = parsed.data;

  const before = await query<{ status: string }>(
    "SELECT status FROM documents WHERE id = $1",
    [req.params.id]
  );
  if (!before.rows[0]) return res.status(404).json({ error: "Document introuvable" });

  const { rows } = await query(
    `WITH updated AS (
       UPDATE documents SET title = $1, category_id = $2, session_id = $3, status = $4, updated_at = now()
       WHERE id = $5 RETURNING *
     ) SELECT ${ROW} FROM updated d
       LEFT JOIN categories c ON c.id = d.category_id
       LEFT JOIN cts_sessions s ON s.id = d.session_id`,
    [d.title, d.categoryId ?? null, d.sessionId ?? null, d.status, req.params.id]
  );

  const type =
    before.rows[0].status !== "publié" && d.status === "publié"
      ? "document_published"
      : "document_updated";
  await logActivity(
    type,
    type === "document_published" ? "Document publié" : "Document mis à jour",
    d.title,
    req.user!.id
  );
  res.json({ document: rows[0] });
});

documentsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { rows } = await query<{ title: string; stored_name: string }>(
    "DELETE FROM documents WHERE id = $1 RETURNING title, stored_name",
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Document introuvable" });

  fs.promises
    .unlink(path.join(config.uploadDir, rows[0].stored_name))
    .catch(() => {});
  await logActivity("document_deleted", "Document supprimé", rows[0].title, req.user!.id);
  res.json({ ok: true });
});

documentsRouter.get("/:id/download", async (req, res) => {
  const isAdmin = req.user!.role === "admin";
  const { rows } = await query<{
    title: string;
    file_name: string;
    stored_name: string;
    mime_type: string;
    status: string;
  }>("SELECT title, file_name, stored_name, mime_type, status FROM documents WHERE id = $1", [
    req.params.id,
  ]);
  const doc = rows[0];
  if (!doc || (!isAdmin && doc.status !== "publié")) {
    return res.status(404).json({ error: "Document introuvable" });
  }

  const filePath = path.join(config.uploadDir, doc.stored_name);
  if (!fs.existsSync(filePath)) {
    return res.status(410).json({ error: "Fichier absent du stockage" });
  }

  await query(
    "INSERT INTO document_downloads (document_id, user_id) VALUES ($1, $2)",
    [req.params.id, req.user!.id]
  );

  res.setHeader("Content-Type", doc.mime_type);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(doc.file_name)}`
  );
  fs.createReadStream(filePath).pipe(res);
});

// ─── Catégories ────────────────────────────────────────────────────────────────
export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res) => {
  const { rows } = await query(
    "SELECT id, name, position FROM categories ORDER BY position, name"
  );
  res.json({ categories: rows });
});

categoriesRouter.post("/", requireAdmin, async (req, res) => {
  const name = z.string().trim().min(2).safeParse(req.body?.name);
  if (!name.success) return res.status(400).json({ error: "Nom de catégorie invalide" });
  const { rows } = await query(
    `INSERT INTO categories (name, position)
     VALUES ($1, (SELECT COALESCE(MAX(position), 0) + 1 FROM categories))
     ON CONFLICT (name) DO NOTHING
     RETURNING id, name, position`,
    [name.data]
  );
  if (!rows[0]) return res.status(409).json({ error: "Cette catégorie existe déjà" });
  res.status(201).json({ category: rows[0] });
});

categoriesRouter.delete("/:id", requireAdmin, async (req, res) => {
  await query("DELETE FROM categories WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
});
