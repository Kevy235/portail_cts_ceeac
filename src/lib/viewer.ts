import type { Doc, DocFile } from "@/lib/types";
import type { Lang } from "@/i18n";

/** Formats affichables dans le lecteur intégré. */
export type ViewerKind = "pdf" | "docx" | "other";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function viewerKind(file: Pick<DocFile, "mimeType" | "fileName">): ViewerKind {
  const name = file.fileName.toLowerCase();
  if (file.mimeType === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (file.mimeType === DOCX_MIME || name.endsWith(".docx")) return "docx";
  return "other";
}

export const canPreview = (file: Pick<DocFile, "mimeType" | "fileName">) =>
  viewerKind(file) !== "other";

/** Extension affichable d'un nom de fichier (« XLSX », « PPT »…). */
export const fileExt = (name: string) => (name.split(".").pop() ?? "").toUpperCase();

/**
 * Chargement différé de pdf.js : la bibliothèque (~1 Mo) n'est téléchargée
 * qu'à la première ouverture du lecteur. Build « legacy » : compatible avec
 * les navigateurs plus anciens encore présents dans certaines délégations.
 */
type PdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
let pdfjsPromise: Promise<PdfJs> | null = null;

export function loadPdfJs(): Promise<PdfJs> {
  pdfjsPromise ??= Promise.all([
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
  ]).then(([pdfjs, worker]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return pdfjs;
  });
  pdfjsPromise.catch(() => {
    pdfjsPromise = null; // nouvel essai possible (réseau)
  });
  return pdfjsPromise;
}

/** Document à afficher : métadonnées + un fichier par langue. */
export interface ViewerSource {
  title: string;
  /** Référence de la réunion, catégorie… (ligne secondaire de l'en-tête). */
  meta?: string;
  version?: number;
  isCoded?: boolean;
  files: Pick<DocFile, "lang" | "fileName" | "fileSize" | "mimeType">[];
  /** Lecture dans le lecteur (non comptée comme téléchargement). */
  viewUrl: (lang: Lang) => string;
  /** Téléchargement (compté dans les statistiques). */
  downloadUrl: (lang: Lang) => string;
}

/** Source du lecteur pour un document de la bibliothèque. */
export function documentSource(doc: Doc): ViewerSource {
  return {
    title: doc.title,
    meta: doc.sessionReference || doc.sessionTitle || doc.categoryName || undefined,
    version: doc.version,
    isCoded: doc.isCoded,
    files: doc.files,
    viewUrl: (lang) => `/api/documents/${doc.id}/download/${lang}?inline=1`,
    downloadUrl: (lang) => `/api/documents/${doc.id}/download/${lang}`,
  };
}

/**
 * Langue d'ouverture : la langue de l'interface si elle est disponible et
 * affichable, sinon la première version affichable.
 */
export function preferredLang(files: Pick<DocFile, "lang" | "fileName" | "mimeType">[], uiLang: Lang): Lang | null {
  const readable = files.filter(canPreview);
  return (readable.find((f) => f.lang === uiLang) ?? readable[0])?.lang ?? null;
}
