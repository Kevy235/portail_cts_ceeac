import { useEffect, useMemo, useState } from "react";
import { Download, Edit3, FileText, RotateCcw, Search, Trash2, Upload } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Category, CtsSession, Doc, DocStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { LANGS, LANG_LABELS, useI18n, type Lang } from "@/i18n";
import {
  CodedBadge,
  ConfirmDialog,
  EmptyState,
  ErrorBlock,
  FlagIcon,
  inputClass,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
  StatusBadge,
} from "@/components/ui";
import { DownloadButton, ViewButton } from "@/components/DownloadButton";
import { DocumentFormModal } from "@/components/DocumentFormModal";

export function AdminDocuments() {
  const { t } = useI18n();
  const [documents, setDocuments] = useState<Doc[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sessions, setSessions] = useState<CtsSession[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"tous" | DocStatus>("tous");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("tous");
  const [sessionFilter, setSessionFilter] = useState("tous");
  const [langFilter, setLangFilter] = useState<"tous" | Lang>("tous");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [deleting, setDeleting] = useState<Doc | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoadError(null);
    return Promise.all([
      api.get<{ documents: Doc[] }>("/documents"),
      api.get<{ categories: Category[] }>("/categories"),
      api.get<{ sessions: CtsSession[] }>("/sessions"),
    ])
      .then(([d, c, s]) => {
        setDocuments(d.documents);
        setCategories(c.categories);
        setSessions(s.sessions);
      })
      .catch((err) => {
        // État d'erreur persistant (avec bouton réessayer) si rien n'est affiché.
        if (documents) toast.error(err.message);
        else setLoadError(err instanceof Error ? err.message : String(err));
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!documents) return [];
    const q = search.toLowerCase();
    return documents.filter(
      (d) =>
        (filter === "tous" || d.status === filter) &&
        (categoryFilter === "tous" || d.categoryId === categoryFilter) &&
        (sessionFilter === "tous" || d.sessionId === sessionFilter) &&
        (langFilter === "tous" || d.files.some((f) => f.lang === langFilter)) &&
        (d.title.toLowerCase().includes(q) ||
          d.files.some((f) => f.fileName.toLowerCase().includes(q)))
    );
  }, [documents, filter, search, categoryFilter, sessionFilter, langFilter]);

  const filtersActive =
    filter !== "tous" ||
    search !== "" ||
    categoryFilter !== "tous" ||
    sessionFilter !== "tous" ||
    langFilter !== "tous";

  const resetFilters = () => {
    setFilter("tous");
    setSearch("");
    setCategoryFilter("tous");
    setSessionFilter("tous");
    setLangFilter("tous");
  };

  const openCreate = () => {
    setEditing(null);
    setModal("create");
  };

  const openEdit = (doc: Doc) => {
    setEditing(doc);
    setModal("edit");
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/documents/${deleting.id}`);
      toast.success(t("docs.deleted"));
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  if (loadError && !documents) return <ErrorBlock message={loadError} onRetry={load} />;
  if (!documents) return <LoadingBlock />;

  const columns = [
    t("docs.colDocument"),
    t("docs.colCategory"),
    t("docs.colSession"),
    t("docs.colDate"),
    t("docs.colLangs"),
    t("docs.colDl"),
    t("docs.colStatus"),
    t("docs.colActions"),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("docs.title")}
        subtitle={t("docs.subtitle")}
        action={
          <PrimaryButton onClick={openCreate}>
            <Upload size={15} />
            {t("docs.publish")}
          </PrimaryButton>
        }
      />

      {/* ─── Recherche + filtres (statut, catégorie, session) ────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand/60" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("lib.searchPh")}
            aria-label={t("lib.searchPh")}
            className={`${inputClass} pl-9 py-2`}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              { key: "tous", label: t("docs.filterAll") },
              { key: "publié", label: t("docs.filterPublished") },
              { key: "brouillon", label: t("docs.filterDrafts") },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={clsx(
                "px-3.5 py-1.5 rounded-full text-sm font-medium transition-all",
                filter === key
                  ? "bg-gradient-to-b from-brand to-brand-dark text-white shadow-sm shadow-brand/30"
                  : "bg-white border border-line text-slate2 hover:bg-mist hover:border-brand/40"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label={t("lib.allCategories")}
            className={`${inputClass} py-2 w-auto`}
          >
            <option value="tous">{t("lib.allCategories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        {sessions.length > 0 && (
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            aria-label={t("docs.allSessions")}
            className={`${inputClass} py-2 w-auto max-w-56`}
          >
            <option value="tous">{t("docs.allSessions")}</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.reference || (s.title.length > 32 ? `${s.title.slice(0, 32)}…` : s.title)}
              </option>
            ))}
          </select>
        )}

        {/* Filtre par langue disponible */}
        <div
          className="flex items-center gap-1.5 flex-wrap"
          role="group"
          aria-label={t("filter.byLang")}
        >
          <button
            onClick={() => setLangFilter("tous")}
            aria-pressed={langFilter === "tous"}
            className={clsx(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              langFilter === "tous"
                ? "bg-gradient-to-b from-brand to-brand-dark text-white shadow-sm shadow-brand/30"
                : "bg-white border border-line text-slate2 hover:bg-mist hover:border-brand/40"
            )}
          >
            {t("filter.allLangs")}
          </button>
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLangFilter(l)}
              aria-pressed={langFilter === l}
              title={LANG_LABELS[l]}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold uppercase transition-all",
                langFilter === l
                  ? "bg-gradient-to-b from-brand to-brand-dark text-white shadow-sm shadow-brand/30"
                  : "bg-white border border-line text-slate2 hover:bg-mist hover:border-brand/40"
              )}
            >
              <FlagIcon lang={l} />
              {l}
            </button>
          ))}
        </div>

        {/* Réinitialisation + compteur de résultats */}
        {filtersActive && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-danger border border-danger/25 bg-danger-soft/60 hover:bg-danger-soft transition-colors"
          >
            <RotateCcw size={12} aria-hidden />
            {t("filter.reset")}
          </button>
        )}
        <span className="text-xs text-slate2/80 tabular-nums ml-auto" aria-live="polite">
          {t("filter.results", { n: filtered.length })}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-line-soft shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-b from-mist to-brand-soft/40 border-b-2 border-line">
              <tr>
                {columns.map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-bold text-brand-deep uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-mist/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 max-w-xs">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-soft to-brand/20 border border-brand/15 flex items-center justify-center flex-shrink-0">
                        <FileText size={15} className="text-brand" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-ink leading-snug line-clamp-2">
                          {doc.title}
                          {doc.version > 1 && (
                            <span className="ml-2 text-[10px] font-semibold text-brand align-middle">
                              {t("docs.version", { n: doc.version })}
                            </span>
                          )}
                          {doc.isCoded && (
                            <span className="ml-2 align-middle">
                              <CodedBadge compact />
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate2/70 truncate">
                          {doc.files[0]?.fileName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {doc.categoryName ? (
                      <span className="text-xs bg-brand-soft text-brand-dark px-2 py-1 rounded whitespace-nowrap">
                        {doc.categoryName}
                      </span>
                    ) : (
                      <span className="text-xs text-slate2/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate2/70 font-mono whitespace-nowrap">
                    {doc.sessionReference || doc.sessionTitle || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate2/70 whitespace-nowrap">
                    {formatDate(doc.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {doc.files.map((f) => (
                        <span key={f.lang} className="flex items-center gap-0.5">
                          <ViewButton docId={doc.id} file={f} compact />
                          <DownloadButton
                            url={`/api/documents/${doc.id}/download/${f.lang}`}
                            file={f}
                            compact
                            onDone={load}
                          />
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate2 tabular-nums"
                      title={t("docs.colDlFull")}
                    >
                      <Download size={12} className="text-brand/60" aria-hidden />
                      {doc.downloads}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(doc)}
                        className="p-1.5 rounded-lg text-brand hover:bg-brand-soft transition-colors"
                        title={t("common.edit")}
                        aria-label={t("common.edit")}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => setDeleting(doc)}
                        className="p-1.5 rounded-lg text-danger/80 hover:text-danger hover:bg-danger-soft transition-colors"
                        title={t("common.delete")}
                        aria-label={t("common.delete")}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState icon={<FileText size={32} />} message={t("docs.empty")} />
          )}
        </div>
      </div>

      {modal && (
        <DocumentFormModal
          mode={modal}
          categories={categories}
          sessions={sessions}
          editing={modal === "edit" ? editing : null}
          onClose={() => setModal(null)}
          onSaved={async () => {
            setModal(null);
            await load();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={t("docs.deleteTitle")}
          message={t("docs.deleteMsg", { title: deleting.title })}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  );
}
