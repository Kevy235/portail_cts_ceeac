import { useRef, useState } from "react";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Category, CtsSession, Doc, DocStatus, MeetingOrgan } from "@/lib/types";
import { formatSize } from "@/lib/format";
import { LANGS, LANG_LABELS, useI18n, type Lang } from "@/i18n";
import type { Dict } from "@/i18n/fr";
import {
  Field,
  inputClass,
  LangChip,
  Modal,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui";

interface FormState {
  title: string;
  categoryId: string;
  sessionId: string;
  status: DocStatus;
  isCoded: boolean;
}

export const EMPTY_DOC_FORM: FormState = {
  title: "",
  categoryId: "",
  sessionId: "",
  status: "publié",
  isCoded: false,
};

type FileMap = Partial<Record<Lang, File>>;

function organLabel(t: (key: keyof Dict) => string, organ?: MeetingOrgan | null) {
  if (!organ) return "";
  return t(`sess.organ.${organ}` as keyof Dict);
}

export function DocumentFormModal({
  mode,
  categories,
  sessions,
  editing,
  defaultSessionId,
  lockSession,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  categories: Category[];
  sessions: CtsSession[];
  editing?: Doc | null;
  defaultSessionId?: string;
  /** Empêche de changer la réunion (ouverture depuis la carte d'une réunion). */
  lockSession?: boolean;
  onClose: () => void;
  onSaved: (doc: Doc) => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState<FormState>(() =>
    editing
      ? {
          title: editing.title,
          categoryId: editing.categoryId ?? "",
          sessionId: editing.sessionId ?? "",
          status: editing.status,
          isCoded: editing.isCoded,
        }
      : { ...EMPTY_DOC_FORM, sessionId: defaultSessionId ?? "" }
  );
  const [files, setFiles] = useState<FileMap>({});
  const [current, setCurrent] = useState<Doc | null>(editing ?? null);
  const [busy, setBusy] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const fileInputs = useRef<Partial<Record<Lang, HTMLInputElement | null>>>({});

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
      if (mode === "create") {
        const provided = LANGS.filter((l) => files[l]);
        if (provided.length === 0) {
          toast.error(t("docs.needFile"));
          return;
        }
        const fd = new FormData();
        fd.append("title", form.title);
        if (form.categoryId) fd.append("categoryId", form.categoryId);
        if (form.sessionId) fd.append("sessionId", form.sessionId);
        fd.append("status", status);
        fd.append("isCoded", String(form.isCoded));
        for (const lang of provided) fd.append(`file_${lang}`, files[lang]!);
        setUploadPercent(0);
        const { document } = await api.postFormWithProgress<{ document: Doc }>(
          "/documents",
          fd,
          setUploadPercent
        );
        toast.success(status === "publié" ? t("docs.published") : t("docs.draftSaved"));
        onSaved(document);
        return;
      }

      if (!current) return;
      const { document: updated } = await api.put<{ document: Doc }>(`/documents/${current.id}`, {
        title: form.title,
        categoryId: form.categoryId || null,
        sessionId: form.sessionId || null,
        status,
        isCoded: form.isCoded,
      });

      const provided = LANGS.filter((l) => files[l]);
      if (provided.length > 0) {
        const fd = new FormData();
        for (const lang of provided) fd.append(`file_${lang}`, files[lang]!);
        setUploadPercent(0);
        const { document } = await api.postFormWithProgress<{ document: Doc }>(
          `/documents/${current.id}/versions`,
          fd,
          setUploadPercent
        );
        toast.success(t("docs.versionPublished", { n: document.version }));
        onSaved(document);
        return;
      }

      toast.success(t("docs.updated"));
      onSaved(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
      setUploadPercent(null);
    }
  };

  const deleteVersion = async (lang: Lang) => {
    if (!current) return;
    setBusy(true);
    try {
      const { document } = await api.delete<{ document: Doc }>(
        `/documents/${current.id}/files/${lang}`
      );
      setCurrent(document);
      toast.success(t("docs.fileDeleted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const pendingCount = LANGS.filter((l) => files[l]).length;

  return (
    <Modal
      title={mode === "create" ? t("docs.publishTitle") : t("docs.editTitle")}
      subtitle={mode === "create" ? t("docs.publishSubtitle") : current?.title}
      onClose={onClose}
      wide
    >
      <form
        className="p-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit(form.status);
        }}
      >
        <p className="text-xs text-slate2/80 bg-mist rounded-lg px-3 py-2.5">
          {t("docs.lifecycleNote")}
        </p>

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
              disabled={lockSession}
              onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
              className={inputClass}
            >
              <option value="">{t("common.none")}</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title.length > 40 ? `${s.title.slice(0, 40)}…` : s.title}
                  {s.organ ? ` — ${organLabel(t, s.organ)}` : ""}
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

        <div>
          <p className="text-xs font-medium text-ink mb-1.5">{t("docs.filesByLang")}</p>
          <p className="text-[11px] text-slate2/70 mb-3">
            {mode === "edit" ? t("docs.replaceAllHelp") : t("docs.filesNote", { n: 50 })}
          </p>
          {mode === "edit" && current && (
            <p className="text-[11px] font-semibold text-brand mb-2">
              {t("docs.version", { n: current.version })}
            </p>
          )}
          <div className="space-y-2">
            {LANGS.map((lang) => {
              const existing = current?.files.find((f) => f.lang === lang);
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
                    {pending ? (
                      <p className="text-xs text-ink truncate">
                        {pending.name}{" "}
                        <span className="text-slate2/60">({formatSize(pending.size)})</span>
                      </p>
                    ) : existing ? (
                      <p className="text-xs text-ink truncate">
                        {existing.fileName}{" "}
                        <span className="text-slate2/60">({formatSize(existing.fileSize)})</span>
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
                      acceptFile(lang, f);
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
                    {pending && (
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
                    {mode === "edit" && existing && !pending && (current?.files.length ?? 0) > 1 && (
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
                : mode === "edit" && pendingCount > 0
                  ? t("docs.replaceAllBtn")
                  : t("docs.publishNow")}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
