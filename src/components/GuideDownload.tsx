import { useState } from "react";
import { FileDown } from "lucide-react";
import type { GuideFile } from "@/lib/types";
import { useApiResource } from "@/lib/useApiResource";
import { useI18n, type Lang } from "@/i18n";
import { DownloadButton, ViewButton } from "@/components/DownloadButton";
import { DocumentViewer } from "@/components/DocumentViewer";

/**
 * Encart de téléchargement du guide utilisateur officiel (un fichier par
 * langue, publié par l'administrateur). Affiché sur la page publique du guide
 * et dans l'espace participant ; masqué tant qu'aucun fichier n'est publié.
 * Les versions PDF/Word peuvent aussi être lues dans le lecteur intégré.
 */
export function GuideDownload() {
  const { t } = useI18n();
  const resource = useApiResource<{ guides: GuideFile[] }>("/guide");
  const guides = resource.data?.guides ?? [];
  const [reading, setReading] = useState<Lang | null>(null);

  if (guides.length === 0) return null;

  return (
    <section className="bg-white rounded-xl border border-brand/25 shadow-sm p-5 sm:p-6">
      <div className="flex items-start gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
        <span
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand-deep shadow-md flex items-center justify-center flex-shrink-0"
          aria-hidden
        >
          <FileDown size={17} className="text-white" />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-ink font-title">{t("guide.dl.title")}</h3>
          <p className="text-sm text-slate2 mt-0.5">{t("guide.dl.desc")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {guides.map((g) => (
            <span key={g.lang} className="flex items-center gap-1">
              <ViewButton file={g} onOpen={() => setReading(g.lang)} />
              <DownloadButton url={`/api/guide/download/${g.lang}`} file={g} />
            </span>
          ))}
        </div>
      </div>

      {reading && (
        <DocumentViewer
          source={{
            title: t("guide.title"),
            files: guides,
            viewUrl: (lang) => `/api/guide/download/${lang}`,
            downloadUrl: (lang) => `/api/guide/download/${lang}`,
          }}
          initialLang={reading}
          onClose={() => setReading(null)}
        />
      )}
    </section>
  );
}
