import { useState } from "react";
import { Check, Download, Eye } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import type { DocFile } from "@/lib/types";
import { downloadWithProgress } from "@/lib/download";
import { formatSize } from "@/lib/format";
import { LANG_LABELS, useI18n } from "@/i18n";
import { FlagIcon } from "@/components/ui";

/**
 * Bouton « Consulter » : ouvre le document dans un nouvel onglet du navigateur
 * (affichage direct, sans téléchargement). Proposé pour les PDF uniquement —
 * les autres formats seraient téléchargés de toute façon.
 */
export function ViewButton({
  docId,
  file,
  compact,
}: {
  docId: string;
  file: DocFile;
  compact?: boolean;
}) {
  const { t } = useI18n();
  if (file.mimeType !== "application/pdf") return null;
  return (
    <button
      type="button"
      onClick={() =>
        window.open(`/api/documents/${docId}/download/${file.lang}?inline=1`, "_blank", "noopener")
      }
      title={`${t("docs.view")} — ${LANG_LABELS[file.lang]}`}
      aria-label={`${t("docs.view")} — ${LANG_LABELS[file.lang]}`}
      className={clsx(
        "flex items-center justify-center rounded-lg border transition-colors",
        "border-brand/30 text-brand hover:bg-brand-soft hover:border-brand",
        compact ? "px-1.5 py-1" : "px-2 py-2"
      )}
    >
      <Eye size={compact ? 12 : 14} aria-hidden />
    </button>
  );
}

/**
 * Bouton de téléchargement d'une version linguistique avec progression :
 * le fond se remplit de gauche à droite et le pourcentage remplace le libellé.
 */
export function DownloadButton({
  docId,
  file,
  compact,
  onDone,
}: {
  docId: string;
  file: DocFile;
  compact?: boolean;
  onDone?: () => void;
}) {
  const { t } = useI18n();
  const [percent, setPercent] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const busy = percent !== null;

  const handleClick = async () => {
    if (busy) return;
    setPercent(0);
    try {
      await downloadWithProgress(
        `/api/documents/${docId}/download/${file.lang}`,
        file.fileName,
        (p) => setPercent(p)
      );
      setDone(true);
      onDone?.();
      setTimeout(() => setDone(false), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setPercent(null);
    }
  };

  const fill = percent !== null && percent >= 0 ? percent : 0;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      title={`${t("docs.download")} — ${LANG_LABELS[file.lang]} (${formatSize(file.fileSize)})`}
      aria-label={`${t("docs.download")} — ${LANG_LABELS[file.lang]}`}
      className={clsx(
        "relative overflow-hidden flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors",
        compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-2 text-xs",
        done
          ? "bg-accent text-white"
          : busy
            ? "bg-brand/70 text-white cursor-wait"
            : "bg-brand text-white hover:bg-brand-dark"
      )}
    >
      {/* Remplissage de progression */}
      {busy && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-accent/80 transition-[width] duration-200 ease-out"
          style={{ width: `${fill}%` }}
        />
      )}
      <span className="relative flex items-center gap-1.5">
        {done ? (
          <Check size={compact ? 11 : 12} aria-hidden />
        ) : (
          <Download size={compact ? 11 : 12} aria-hidden className={busy ? "animate-bounce" : undefined} />
        )}
        <FlagIcon lang={file.lang} className="w-[14px] h-[9px] ring-white/40" />
        <span className="uppercase font-bold">{file.lang}</span>
        {busy && (
          <span className="font-mono tabular-nums">
            {percent !== null && percent >= 0 ? `${percent}%` : "…"}
          </span>
        )}
      </span>
    </button>
  );
}
