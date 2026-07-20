import { useMemo, useState } from "react";
import { Clock, FileText, Search } from "lucide-react";
import { clsx } from "clsx";
import type { Doc } from "@/lib/types";
import { useApiResource } from "@/lib/useApiResource";
import { formatDate } from "@/lib/format";
import { useSettings } from "@/context/SettingsContext";
import { useI18n } from "@/i18n";
import { DownloadButton, ViewButton } from "@/components/DownloadButton";
import {
  CodedBadge,
  EmptyState,
  ErrorBlock,
  inputClass,
  LoadingBlock,
} from "@/components/ui";

export function ParticipantLibrary() {
  const { settings } = useSettings();
  const { t } = useI18n();
  const resource = useApiResource<{ documents: Doc[] }>("/documents");
  const documents = resource.data?.documents ?? null;
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("tous");
  const [sessionFilter, setSessionFilter] = useState("tous");

  const visible = documents ?? [];

  const categories = useMemo(() => {
    const names = new Set(
      visible.map((d) => d.categoryName).filter((n): n is string => Boolean(n))
    );
    return ["tous", ...Array.from(names).sort()];
  }, [visible]);

  // Sessions présentes parmi les documents visibles (pour le filtre).
  const docSessions = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of visible) {
      if (d.sessionId) map.set(d.sessionId, d.sessionReference || d.sessionTitle || "");
    }
    return Array.from(map.entries());
  }, [visible]);

  const filtered = useMemo(() => {
    return visible
      .filter((d) => categoryFilter === "tous" || d.categoryName === categoryFilter)
      .filter((d) => sessionFilter === "tous" || d.sessionId === sessionFilter)
      .filter((d) => d.title.toLowerCase().includes(search.toLowerCase()));
  }, [visible, categoryFilter, sessionFilter, search]);

  if (resource.error && !documents)
    return <ErrorBlock message={resource.error} onRetry={resource.reload} />;
  if (!documents) return <LoadingBlock />;

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-deep via-brand-dark to-brand-night rounded-2xl p-6 text-white shadow-md">
        {/* Halos décoratifs */}
        <div
          aria-hidden
          className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-accent/20 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -left-10 -bottom-20 w-48 h-48 rounded-full bg-brand/30 blur-3xl pointer-events-none"
        />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-1">
              {settings.library_title || t("lib.kicker")}
            </p>
            <h2 className="text-xl font-bold font-title">{settings.org_full_name}</h2>
            <p className="text-white/70 text-sm mt-1">
              {settings.library_notice || t("lib.official")}
            </p>
          </div>
          <div className="text-right bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 backdrop-blur-sm">
            <p className="text-3xl font-bold text-white tabular-nums">{visible.length}</p>
            <p className="text-white/70 text-xs">{t("lib.available")}</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand/60" aria-hidden />
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
          {docSessions.length > 0 && (
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              aria-label={t("docs.allSessions")}
              className={`${inputClass} py-1.5 w-auto max-w-52 text-xs`}
            >
              <option value="tous">{t("docs.allSessions")}</option>
              {docSessions.map(([id, label]) => (
                <option key={id} value={id}>
                  {label.length > 32 ? `${label.slice(0, 32)}…` : label}
                </option>
              ))}
            </select>
          )}
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={clsx(
                "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all",
                categoryFilter === cat
                  ? "bg-gradient-to-b from-brand to-brand-dark text-white shadow-sm shadow-brand/30"
                  : "bg-white border border-line text-slate2 hover:bg-mist hover:border-brand/40"
              )}
            >
              {cat === "tous" ? t("lib.allCategories") : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map((doc) => {
          return (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-line-soft shadow-sm p-4 hover:shadow-lg hover:border-brand/35 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-soft to-brand/20 border border-brand/15 hidden sm:flex items-center justify-center flex-shrink-0">
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
                      <Clock size={10} className="text-accent-dark" aria-hidden />{" "}
                      {formatDate(doc.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end flex-wrap">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-mono text-slate2/70">{doc.downloads}</p>
                    <p className="text-[10px] text-slate2/70">{t("lib.dlShort")}</p>
                  </div>
                  {doc.files.map((f) => (
                    <span key={f.lang} className="flex items-center gap-1">
                      <ViewButton docId={doc.id} file={f} />
                      <DownloadButton
                        url={`/api/documents/${doc.id}/download/${f.lang}`}
                        file={f}
                        onDone={resource.reload}
                      />
                    </span>
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
