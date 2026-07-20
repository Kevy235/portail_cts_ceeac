import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import { query } from "../db.js";
import { config } from "../config.js";
import { requireAdmin, requireAuth } from "../auth.js";
import { ah } from "../http.js";
import { logActivity } from "../activity.js";
import { LANGS, type Lang } from "../migrations.js";
import { upload } from "./documents.routes.js";

/**
 * Guide utilisateur téléchargeable : un fichier par langue.
 * La liste et le téléchargement sont publics (affichés dès la page de
 * connexion) ; l'ajout, le remplacement et la suppression sont réservés
 * à l'administrateur.
 */
export const guideRouter = Router();

const isLang = (v: string): v is Lang => (LANGS as readonly string[]).includes(v);

const ROW = `lang, file_name AS "fileName", file_size AS "fileSize",
  mime_type AS "mimeType", updated_at AS "updatedAt"`;

async function listGuides() {
  const { rows } = await query(
    `SELECT ${ROW} FROM guide_files ORDER BY array_position(ARRAY['fr','en','pt','es'], lang)`
  );
  return rows;
}

guideRouter.get(
  "/",
  ah(async (_req, res) => {
    res.json({ guides: await listGuides() });
  })
);

guideRouter.get(
  "/download/:lang",
  ah(async (req, res) => {
    const { lang } = req.params;
    if (!isLang(lang)) return res.status(400).json({ error: "Langue inconnue" });

    const { rows } = await query<{
      file_name: string;
      stored_name: string;
      mime_type: string;
    }>("SELECT file_name, stored_name, mime_type FROM guide_files WHERE lang = $1", [lang]);
    const guide = rows[0];
    if (!guide) return res.status(404).json({ error: "Guide indisponible dans cette langue" });

    const filePath = path.join(config.uploadDir, guide.stored_name);
    if (!fs.existsSync(filePath)) {
      return res.status(410).json({ error: "Fichier absent du stockage" });
    }

    const asciiName = guide.file_name.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
    const { size } = await fs.promises.stat(filePath);
    res.setHeader("Content-Type", guide.mime_type);
    res.setHeader("Content-Length", size);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(guide.file_name)}`
    );
    fs.createReadStream(filePath).pipe(res);
  })
);

// Ajout ou remplacement du guide d'une langue
guideRouter.put(
  "/:lang",
  requireAuth,
  requireAdmin,
  upload.single("file"),
  (req, res, next) => {
    const handle = async () => {
      const { lang } = req.params;
      const file = req.file;
      if (!isLang(lang)) return res.status(400).json({ error: "Langue inconnue" });
      if (!file) return res.status(400).json({ error: "Fichier manquant" });

      const { rows: previous } = await query<{ stored_name: string }>(
        "SELECT stored_name FROM guide_files WHERE lang = $1",
        [lang]
      );

      await query(
        `INSERT INTO guide_files (lang, file_name, stored_name, file_size, mime_type, updated_at)
         VALUES ($1, $2, $3, $4, $5, now())
         ON CONFLICT (lang) DO UPDATE SET
           file_name = EXCLUDED.file_name, stored_name = EXCLUDED.stored_name,
           file_size = EXCLUDED.file_size, mime_type = EXCLUDED.mime_type, updated_at = now()`,
        [lang, file.originalname, file.filename, file.size, file.mimetype]
      );

      // L'ancien fichier n'est plus référencé : suppression silencieuse.
      if (previous[0]) {
        fs.promises
          .unlink(path.join(config.uploadDir, previous[0].stored_name))
          .catch(() => {});
      }

      await logActivity(
        "guide_updated",
        "Guide utilisateur mis à jour",
        `${file.originalname} (${lang})`,
        req.user!.id
      );
      res.json({ guides: await listGuides() });
    };
    handle().catch((err) => {
      if (req.file) fs.promises.unlink(req.file.path).catch(() => {});
      next(err);
    });
  }
);

guideRouter.delete(
  "/:lang",
  requireAuth,
  requireAdmin,
  ah(async (req, res) => {
    const { lang } = req.params;
    if (!isLang(lang)) return res.status(400).json({ error: "Langue inconnue" });

    const { rows } = await query<{ stored_name: string; file_name: string }>(
      "DELETE FROM guide_files WHERE lang = $1 RETURNING stored_name, file_name",
      [lang]
    );
    if (!rows[0]) return res.status(404).json({ error: "Guide introuvable" });

    fs.promises
      .unlink(path.join(config.uploadDir, rows[0].stored_name))
      .catch(() => {});
    await logActivity(
      "guide_deleted",
      "Guide utilisateur supprimé",
      `${rows[0].file_name} (${lang})`,
      req.user!.id
    );
    res.json({ guides: await listGuides() });
  })
);
