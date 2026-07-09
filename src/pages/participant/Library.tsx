import { useMemo, useState } from "react";
import { Clock, Download, FileText, Search } from "lucide-react";
import { clsx } from "clsx";
import type { Doc } from "@/lib/types";
import { useApiResource } from "@/lib/useApiResource";
import { formatDate, formatSize } from "@/lib/format";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { LANG_LABELS, useI18n } from "@/i18n";
import {
  CodedBadge,
  EmptyState,
  ErrorBlock,
  inputClass,
  LangChip,
  LoadingBlock,
} from "@/components/ui";

export function ParticipantLibrary() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const { t } = useI18n();
  const resource = useApiResource<{ documents: Doc[] }>("/documents");
  const documents = resource.data?.documents ?? null;
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("tous");

  // Langues de documents choisies par le participant (profil)
  const docLangs = useMemo(
    () => new Set(user?.docLangs?.length ? user.docLangs : ["fr", "en", "pt", "es"]),
    [user]
  );

  // Documents ayant au moins une version dans les langues choisies
  const visible = useMemo(() => {
    if (!documents) return [];
    return documents.filter((d) => d.files.some((f) => docLangs.has(f.lang)));
  }, [documents, docLangs]);

  const categories = useMemo(() => {
    const names = new Set(
      visible.map((d) => d.categoryName).filter((n): n is string => Boolean(n))
    );
    return ["tous", ...Array.from(names).sort()];
  }, [visible]);

  const filtered = useMemo(() => {
    return visible
      .filter((d) => categoryFilter === "tous" || d.categoryName === categoryFilter)
      .filter((d) => d.title.toLowerCase().includes(search.toLowerCase()));
  }, [visible, categoryFilter, search]);

  if (resource.error && !documents)
    return <ErrorBlock message={resource.error} onRetry={resource.reload} />;
  if (!documents) return <LoadingBlock />;

  return (
    <div className="space-y-5">
      <div className="bg-brand-deep rounded-xl p-6 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest mb-1">
              {t("lib.kicker")}
            </p>
            <h2 className="text-xl font-bold font-title">{settings.org_full_name}</h2>
            <p className="text-white/60 text-sm mt-1">{t("lib.official")}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-accent">{visible.length}</p>
            <p className="text-white/50 text-xs">{t("lib.available")}</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate2/50" aria-hidden />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("lib.searchPh")}
          aria-label={t("lib.searchPh")}
          className={`${inputClass} pl-9 py-2`}
        />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                categoryFilter === cat
                  ? "bg-brand text-white"
                  : "bg-white border border-line text-slate2 hover:bg-mist"
              )}
            >
              {cat === "tous" ? t("lib.allCategories") : cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate2/70">{t("lib.langFilterNote")}</span>
          {Array.from(docLangs).map((l) => (
            <LangChip key={l} lang={l as "fr" | "en" | "pt" | "es"} />
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map((doc) => {
          const availableFiles = doc.files.filter((f) => docLangs.has(f.lang));
          return (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-line-soft p-4 hover:shadow-md hover:border-brand/20 transition-all"
            >
              <div className="flex items-start gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                <div className="w-10 h-10 rounded-xl bg-brand/10 hidden sm:flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-brand" />
                </div>
                <div className="flex-1 min-w-0 basis-full sm:basis-auto">
                  <h3 className="text-base font-semibold text-ink leading-snug mb-1.5">
                    {doc.title}
                    {doc.isCoded && (
                      <span className="ml-2 align-middle">
                        <CodedBadge />
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    {doc.categoryName && (
                      <span className="text-xs bg-brand-soft text-brand-dark px-2 py-0.5 rounded">
                        {doc.categoryName}
                      </span>
                    )}
                    {(doc.sessionReference || doc.sessionTitle) && (
                      <span className="text-xs text-slate2/70 font-mono">
                        {doc.sessionReference || doc.sessionTitle}
                      </span>
                    )}
                    <span className="text-xs text-slate2/70 flex items-center gap-1">
                      <Clock size={10} /> {formatDate(doc.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end flex-wrap">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-mono text-slate2/70">{doc.downloads}</p>
                    <p className="text-[10px] text-slate2/70">{t("lib.dlShort")}</p>
                  </div>
                  {availableFiles.map((f) => (
                    <a
                      key={f.lang}
                      href={`/api/documents/${doc.id}/download/${f.lang}`}
                      title={`${LANG_LABELS[f.lang]} · ${formatSize(f.fileSize)}`}
                      className="flex items-center gap-1.5 bg-brand text-white px-2.5 py-2 rounded-lg text-xs font-medium hover:bg-brand-dark transition-colors"
                    >
                      <Download size={12} />
                      <span className="uppercase font-bold">{f.lang}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <EmptyState
            icon={<FileText size={32} />}
            message={visible.length === 0 ? t("lib.emptyNone") : t("lib.emptyNoMatch")}
          />
        )}
      </div>
    </div>
  );
}
