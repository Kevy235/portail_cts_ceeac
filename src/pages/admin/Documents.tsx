import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Edit3, FileText, Search, Trash2, Upload, X } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Category, CtsSession, Doc, DocStatus } from "@/lib/types";
import { formatDate, formatSize } from "@/lib/format";
import { LANGS, LANG_LABELS, useI18n, type Lang } from "@/i18n";
import {
  CodedBadge,
  ConfirmDialog,
  EmptyState,
  ErrorBlock,
  Field,
  inputClass,
  LangChip,
  LoadingBlock,
  Modal,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
} from "@/components/ui";
import { DownloadButton, ViewButton } from "@/components/DownloadButton";

interface FormState {
  title: string;
  categoryId: string;
  sessionId: string;
  status: DocStatus;
  isCoded: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  categoryId: "",
  sessionId: "",
  status: "publié",
  isCoded: false,
};

type FileMap = Partial<Record<Lang, File>>;

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
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [files, setFiles] = useState<FileMap>({});
  const [editing, setEditing] = useState<Doc | null>(null);
  const [deleting, setDeleting] = useState<Doc | null>(null);
  const [busy, setBusy] = useState(false);
  // Pourcentage d'envoi en cours (null = aucun envoi)
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const fileInputs = useRef<Partial<Record<Lang, HTMLInputElement | null>>>({});

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
        (d.title.toLowerCase().includes(q) ||
          d.files.some((f) => f.fileName.toLowerCase().includes(q)))
    );
  }, [documents, filter, search, categoryFilter, sessionFilter]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFiles({});
    setEditing(null);
    setModal("create");
  };

  const openEdit = (doc: Doc) => {
    setForm({
      title: doc.title,
      categoryId: doc.categoryId ?? "",
      sessionId: doc.sessionId ?? "",
      status: doc.status,
      isCoded: doc.isCoded,
    });
    setFiles({});
    setEditing(doc);
    setModal("edit");
  };

  const acceptFile = (lang: Lang, f: File | undefined) => {
    if (!f) return;
    setFiles((prev) => ({ ...prev, [lang]: f }));
    if (!form.title) {
      setForm((prev) => ({ ...prev, title: f.name.replace(/\.[^.]+$/, "") }));
    }
  };

  const submit = async (status: DocStatus) => {
    if (busy) return;
    setBusy(true);
    try {
      if (modal === "create") {
        const provided = LANGS.filter((l) => files[l]);
        if (provided.length === 0) {
          toast.error(t("docs.needFile"));
          return;
        }
        const fd = new FormData();
        fd.append("title", form.title);
        // Même convention que l'édition : champ omis = null côté serveur.
        if (form.categoryId) fd.append("categoryId", form.categoryId);
        if (form.sessionId) fd.append("sessionId", form.sessionId);
        fd.append("status", status);
        fd.append("isCoded", String(form.isCoded));
        for (const lang of provided) fd.append(`file_${lang}`, files[lang]!);
        setUploadPercent(0);
        await api.postFormWithProgress("/documents", fd, setUploadPercent);
        toast.success(status === "publié" ? t("docs.published") : t("docs.draftSaved"));
      } else if (editing) {
        await api.put(`/documents/${editing.id}`, {
          title: form.title,
          categoryId: form.categoryId || null,
          sessionId: form.sessionId || null,
          status,
          isCoded: form.isCoded,
        });
        toast.success(t("docs.updated"));
      }
      setModal(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
      setUploadPercent(null);
    }
  };

  // Ajout/remplacement immédiat d'une version linguistique en mode édition
  const uploadVersion = async (lang: Lang, f: File | undefined) => {
    if (!f || !editing) return;
    setBusy(true);
    setUploadPercent(0);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const { document } = await api.postFormWithProgress<{ document: Doc }>(
        `/documents/${editing.id}/files/${lang}`,
        fd,
        setUploadPercent
      );
      setEditing(document);
      toast.success(t("docs.fileAdded", { lang: LANG_LABELS[lang] }));
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
      setUploadPercent(null);
    }
  };

  const deleteVersion = async (lang: Lang) => {
    if (!editing) return;
    setBusy(true);
    try {
      const { document } = await api.delete<{ document: Doc }>(
        `/documents/${editing.id}/files/${lang}`
      );
      setEditing(document);
      toast.success(t("docs.fileDeleted"));
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
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

      {/* ─── Modale publication / édition ──────────────────────────── */}
      {modal && (
        <Modal
          title={modal === "create" ? t("docs.publishTitle") : t("docs.editTitle")}
          subtitle={modal === "create" ? t("docs.publishSubtitle") : editing?.title}
          onClose={() => setModal(null)}
          wide
        >
          <form
            className="p-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit(form.status);
            }}
          >
            <Field label={t("docs.docTitle")} required>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t("docs.docTitlePh")}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t("docs.category")}>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className={inputClass}
                >
                  <option value="">{t("common.none")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("docs.linkedSession")}>
                <select
                  value={form.sessionId}
                  onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
                  className={inputClass}
                >
                  <option value="">{t("common.none")}</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title.length > 40 ? `${s.title.slice(0, 40)}…` : s.title}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <label className="flex items-start gap-3 px-3 py-3 rounded-lg border border-line-soft hover:bg-mist cursor-pointer">
              <input
                type="checkbox"
                checked={form.isCoded}
                onChange={(e) => setForm({ ...form, isCoded: e.target.checked })}
                className="w-4 h-4 mt-0.5 accent-brand"
              />
              <span>
                <span className="block text-sm font-medium text-ink">{t("docs.codedLabel")}</span>
                <span className="block text-xs text-slate2/80 mt-0.5">{t("docs.codedHelp")}</span>
              </span>
            </label>

            {/* ─── Versions linguistiques ─────────────────────────── */}
            <div>
              <p className="text-xs font-medium text-ink mb-1.5">{t("docs.filesByLang")}</p>
              <p className="text-[11px] text-slate2/70 mb-3">
                {t("docs.filesNote", { n: 50 })}
              </p>
              <div className="space-y-2">
                {LANGS.map((lang) => {
                  const existing = editing?.files.find((f) => f.lang === lang);
                  const pending = files[lang];
                  return (
                    <div
                      key={lang}
                      className="flex items-center gap-3 border border-line-soft rounded-lg px-3 py-2.5"
                    >
                      <LangChip lang={lang} muted={!existing && !pending} />
                      <span className="text-xs text-slate2 w-20 flex-shrink-0 hidden sm:inline">
                        {LANG_LABELS[lang]}
                      </span>
                      <div className="flex-1 min-w-0">
                        {modal === "create" ? (
                          pending ? (
                            <p className="text-xs text-ink truncate">
                              {pending.name}{" "}
                              <span className="text-slate2/60">({formatSize(pending.size)})</span>
                            </p>
                          ) : (
                            <p className="text-xs text-slate2/50">{t("docs.noFile")}</p>
                          )
                        ) : existing ? (
                          <p className="text-xs text-ink truncate">
                            {existing.fileName}{" "}
                            <span className="text-slate2/60">
                              ({formatSize(existing.fileSize)})
                            </span>
                          </p>
                        ) : (
                          <p className="text-xs text-slate2/50">{t("docs.noFile")}</p>
                        )}
                      </div>
                      <input
                        ref={(el) => {
                          fileInputs.current[lang] = el;
                        }}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (modal === "create") acceptFile(lang, f);
                          else uploadVersion(lang, f);
                        }}
                      />
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => fileInputs.current[lang]?.click()}
                          className="text-xs text-brand hover:underline px-2 py-1 disabled:opacity-50"
                        >
                          {existing || pending ? t("docs.replaceFile") : t("docs.chooseFile")}
                        </button>
                        {modal === "create" && pending && (
                          <button
                            type="button"
                            onClick={() =>
                              setFiles((prev) => {
                                const next = { ...prev };
                                delete next[lang];
                                return next;
                              })
                            }
                            className="p-1 text-slate2/50 hover:text-danger transition-colors"
                            title={t("docs.deleteFile")}
                          >
                            <X size={13} />
                          </button>
                        )}
                        {modal === "edit" && existing && (editing?.files.length ?? 0) > 1 && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => deleteVersion(lang)}
                            className="p-1 text-slate2/50 hover:text-danger transition-colors disabled:opacity-50"
                            title={t("docs.deleteFile")}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Barre de progression de l'envoi */}
            {uploadPercent !== null && (
              <div aria-live="polite">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate2">{t("docs.uploading")}</span>
                  <span className="text-xs font-mono font-semibold text-brand tabular-nums">
                    {uploadPercent}%
                  </span>
                </div>
                <div className="h-2 bg-mist rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-[width] duration-200 ease-out"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <SecondaryButton
                type="button"
                className="flex-1"
                disabled={busy}
                onClick={() => submit("brouillon")}
              >
                {t("docs.saveDraft")}
              </SecondaryButton>
              <PrimaryButton
                type="button"
                className="flex-1"
                disabled={busy}
                onClick={() => submit("publié")}
              >
                {uploadPercent !== null
                  ? `${t("docs.uploading")} ${uploadPercent}%`
                  : busy
                    ? t("docs.uploading")
                    : t("docs.publishNow")}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
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
