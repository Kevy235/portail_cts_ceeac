import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { z } from "zod";
import { query, withTransaction } from "../db.js";
import { config } from "../config.js";
import { requireAdmin } from "../auth.js";
import { ah, uuidParams } from "../http.js";
import { logActivity } from "../activity.js";
import { LANGS, type Lang } from "../migrations.js";

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

const ALLOWED_EXT = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
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
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.has(ext)) {
      return cb(null, true);
    }
    cb(new Error("Type de fichier non autorisé (PDF, Word, Excel, PowerPoint uniquement)"));
  },
});

const uploadByLang = upload.fields(LANGS.map((lang) => ({ name: `file_${lang}`, maxCount: 1 })));

// isCoded arrive en booléen (JSON) ou en chaîne "true"/"false" (FormData).
const metaSchema = z.object({
  title: z.string().trim().min(3, "Titre trop court"),
  categoryId: z.string().uuid().nullable().optional(),
  sessionId: z.string().uuid().nullable().optional(),
  status: z.enum(["publié", "brouillon"]).default("brouillon"),
  isCoded: z.preprocess((v) => v === true || v === "true", z.boolean()),
});

const isLang = (v: string): v is Lang => (LANGS as readonly string[]).includes(v);

const ROW = `d.id, d.title, d.status, d.is_coded AS "isCoded",
  d.created_at AS "createdAt", d.updated_at AS "updatedAt",
  d.category_id AS "categoryId", c.name AS "categoryName",
  d.session_id AS "sessionId", s.title AS "sessionTitle", s.reference AS "sessionReference",
  COALESCE((
    SELECT json_agg(json_build_object(
      'lang', f.lang, 'fileName', f.file_name, 'fileSize', f.file_size, 'mimeType', f.mime_type
    ) ORDER BY array_position(ARRAY['fr','en','pt','es'], f.lang))
    FROM document_files f WHERE f.document_id = d.id
  ), '[]'::json) AS files,
  (SELECT COUNT(*)::int FROM document_downloads dd WHERE dd.document_id = d.id) AS "downloads"`;

const JOINS = `LEFT JOIN categories c ON c.id = d.category_id
  LEFT JOIN cts_sessions s ON s.id = d.session_id`;

async function fetchDocument(id: string) {
  const { rows } = await query(
    `SELECT ${ROW} FROM documents d ${JOINS} WHERE d.id = $1`,
    [id]
  );
  return rows[0];
}

function cleanupFiles(files: Express.Multer.File[]) {
  for (const f of files) fs.promises.unlink(f.path).catch(() => {});
}

documentsRouter.get(
  "/",
  ah(async (req, res) => {
    // Les participants ne voient que les documents publiés.
    const isAdmin = req.user!.role === "admin";
    const { rows } = await query(
      `SELECT ${ROW} FROM documents d ${JOINS}
       ${isAdmin ? "" : "WHERE d.status = 'publié'"}
       ORDER BY d.created_at DESC`
    );
    res.json({ documents: rows });
  })
);

// Création : métadonnées + un fichier par langue (file_fr, file_en, file_pt, file_es)
documentsRouter.post("/", requireAdmin, (req, res, next) => {
  uploadByLang(req, res, (err) => {
    const handle = async () => {
      const fileMap = (req.files ?? {}) as Record<string, Express.Multer.File[]>;
      const received = Object.values(fileMap).flat();

      if (err) {
        cleanupFiles(received);
        const msg =
          err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
            ? `Fichier trop volumineux (max. ${config.maxUploadMb} Mo)`
            : err.message;
        return res.status(400).json({ error: msg });
      }
      if (received.length === 0) {
        return res.status(400).json({ error: "Fournissez au moins un fichier dans une langue" });
      }

      const parsed = metaSchema.safeParse({
        title: req.body.title,
        categoryId: req.body.categoryId || null,
        sessionId: req.body.sessionId || null,
        status: req.body.status || "brouillon",
        isCoded: req.body.isCoded,
      });
      if (!parsed.success) {
        cleanupFiles(received);
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message ?? "Données invalides" });
      }
      const d = parsed.data;

      try {
        // Transaction : jamais de document sans ses fichiers en base.
        const docId = await withTransaction(async (client) => {
          const inserted = await client.query<{ id: string }>(
            `INSERT INTO documents (title, category_id, session_id, status, is_coded, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [d.title, d.categoryId ?? null, d.sessionId ?? null, d.status, d.isCoded, req.user!.id]
          );
          const id = inserted.rows[0].id;

          for (const lang of LANGS) {
            const file = fileMap[`file_${lang}`]?.[0];
            if (!file) continue;
            await client.query(
              `INSERT INTO document_files (document_id, lang, file_name, stored_name, file_size, mime_type)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [id, lang, file.originalname, file.filename, file.size, file.mimetype]
            );
          }
          return id;
        });

        if (d.status === "publié") {
          await logActivity("document_published", "Document publié", d.title, req.user!.id);
        }
        res.status(201).json({ document: await fetchDocument(docId) });
      } catch (dbErr) {
        cleanupFiles(received);
        throw dbErr;
      }
    };
    handle().catch(next);
  });
});

// Mise à jour des métadonnées
documentsRouter.put(
  "/:id",
  requireAdmin,
  uuidParams("id"),
  ah(async (req, res) => {
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

    await query(
      `UPDATE documents SET title = $1, category_id = $2, session_id = $3, status = $4,
         is_coded = $5, updated_at = now()
       WHERE id = $6`,
      [d.title, d.categoryId ?? null, d.sessionId ?? null, d.status, d.isCoded, req.params.id]
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
    res.json({ document: await fetchDocument(req.params.id) });
  })
);

// Ajout ou remplacement du fichier d'une langue
documentsRouter.post("/:id/files/:lang", requireAdmin, uuidParams("id"), (req, res, next) => {
  const { lang } = req.params;
  if (!isLang(lang)) return res.status(400).json({ error: "Langue inconnue" });

  upload.single("file")(req, res, (err) => {
    const handle = async () => {
      if (err) {
        const msg =
          err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
            ? `Fichier trop volumineux (max. ${config.maxUploadMb} Mo)`
            : err.message;
        return res.status(400).json({ error: msg });
      }
      if (!req.file) return res.status(400).json({ error: "Aucun fichier fourni" });

      const doc = await query<{ title: string }>(
        "SELECT title FROM documents WHERE id = $1",
        [req.params.id]
      );
      if (!doc.rows[0]) {
        fs.promises.unlink(req.file.path).catch(() => {});
        return res.status(404).json({ error: "Document introuvable" });
      }

      try {
        const old = await query<{ stored_name: string }>(
          "SELECT stored_name FROM document_files WHERE document_id = $1 AND lang = $2",
          [req.params.id, lang]
        );

        await query(
          `INSERT INTO document_files (document_id, lang, file_name, stored_name, file_size, mime_type)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (document_id, lang) DO UPDATE SET
             file_name = EXCLUDED.file_name, stored_name = EXCLUDED.stored_name,
             file_size = EXCLUDED.file_size, mime_type = EXCLUDED.mime_type,
             created_at = now()`,
          [req.params.id, lang, req.file.originalname, req.file.filename, req.file.size, req.file.mimetype]
        );

        if (old.rows[0]) {
          fs.promises
            .unlink(path.join(config.uploadDir, old.rows[0].stored_name))
            .catch(() => {});
        }

        await logActivity(
          "document_updated",
          "Version linguistique ajoutée",
          `${doc.rows[0].title} (${lang.toUpperCase()})`,
          req.user!.id
        );
        res.json({ document: await fetchDocument(req.params.id) });
      } catch (dbErr) {
        fs.promises.unlink(req.file.path).catch(() => {});
        throw dbErr;
      }
    };
    handle().catch(next);
  });
});

// Suppression du fichier d'une langue (au moins une version doit rester)
documentsRouter.delete(
  "/:id/files/:lang",
  requireAdmin,
  uuidParams("id"),
  ah(async (req, res) => {
    const { lang } = req.params;
    if (!isLang(lang)) return res.status(400).json({ error: "Langue inconnue" });

    const count = await query<{ n: string }>(
      "SELECT COUNT(*) AS n FROM document_files WHERE document_id = $1",
      [req.params.id]
    );
    if (Number(count.rows[0]?.n ?? 0) <= 1) {
      return res
        .status(400)
        .json({ error: "Impossible de supprimer la dernière version du document" });
    }

    const { rows } = await query<{ stored_name: string }>(
      "DELETE FROM document_files WHERE document_id = $1 AND lang = $2 RETURNING stored_name",
      [req.params.id, lang]
    );
    if (!rows[0]) return res.status(404).json({ error: "Version introuvable" });

    fs.promises
      .unlink(path.join(config.uploadDir, rows[0].stored_name))
      .catch(() => {});
    res.json({ document: await fetchDocument(req.params.id) });
  })
);

documentsRouter.delete(
  "/:id",
  requireAdmin,
  uuidParams("id"),
  ah(async (req, res) => {
    const files = await query<{ stored_name: string }>(
      "SELECT stored_name FROM document_files WHERE document_id = $1",
      [req.params.id]
    );
    const { rows } = await query<{ title: string }>(
      "DELETE FROM documents WHERE id = $1 RETURNING title",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Document introuvable" });

    for (const f of files.rows) {
      fs.promises.unlink(path.join(config.uploadDir, f.stored_name)).catch(() => {});
    }
    await logActivity("document_deleted", "Document supprimé", rows[0].title, req.user!.id);
    res.json({ ok: true });
  })
);

documentsRouter.get(
  "/:id/download/:lang",
  uuidParams("id"),
  ah(async (req, res) => {
    const { lang } = req.params;
    if (!isLang(lang)) return res.status(400).json({ error: "Langue inconnue" });

    const isAdmin = req.user!.role === "admin";
    const { rows } = await query<{
      file_name: string;
      stored_name: string;
      mime_type: string;
      status: string;
    }>(
      `SELECT f.file_name, f.stored_name, f.mime_type, d.status
       FROM document_files f
       JOIN documents d ON d.id = f.document_id
       WHERE f.document_id = $1 AND f.lang = $2`,
      [req.params.id, lang]
    );
    const doc = rows[0];
    if (!doc || (!isAdmin && doc.status !== "publié")) {
      return res.status(404).json({ error: "Document introuvable" });
    }

    const filePath = path.join(config.uploadDir, doc.stored_name);
    if (!fs.existsSync(filePath)) {
      return res.status(410).json({ error: "Fichier absent du stockage" });
    }

    // ?inline=1 : consultation dans le navigateur (PDF) — n'est pas comptée
    // comme téléchargement pour ne pas gonfler les statistiques.
    // Invités : pas de ligne utilisateur → téléchargement non journalisé.
    const inline = req.query.inline === "1";
    if (!inline && req.user!.role !== "guest") {
      await query(
        "INSERT INTO document_downloads (document_id, user_id, lang) VALUES ($1, $2, $3)",
        [req.params.id, req.user!.id, lang]
      );
    }

    const asciiName = doc.file_name.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
    const { size } = await fs.promises.stat(filePath);
    res.setHeader("Content-Type", doc.mime_type);
    // Taille annoncée au client : permet d'afficher la progression du téléchargement.
    res.setHeader("Content-Length", size);
    res.setHeader(
      "Content-Disposition",
      `${inline ? "inline" : "attachment"}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(doc.file_name)}`
    );
    fs.createReadStream(filePath).pipe(res);
  })
);

// ─── Catégories ────────────────────────────────────────────────────────────────
export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  ah(async (_req, res) => {
    const { rows } = await query(
      "SELECT id, name, position FROM categories ORDER BY position, name"
    );
    res.json({ categories: rows });
  })
);

categoriesRouter.post(
  "/",
  requireAdmin,
  ah(async (req, res) => {
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
  })
);

categoriesRouter.delete(
  "/:id",
  requireAdmin,
  uuidParams("id"),
  ah(async (req, res) => {
    await query("DELETE FROM categories WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  })
);
