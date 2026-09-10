import { useEffect, useState } from "react";
import clsx from "clsx";
import { Calendar, Edit3, FileText, KeyRound, Mail, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Category, CtsSession, Doc, SessionStatus } from "@/lib/types";
import { displayOrgan, ORGAN_SUGGESTION_KEYS } from "@/lib/organ";
import { useApiResource } from "@/lib/useApiResource";
import { useI18n } from "@/i18n";
import { useSettings } from "@/context/SettingsContext";
import { SessionCard } from "@/components/SessionCard";
import { BroadcastModal } from "@/components/BroadcastModal";
import { DocumentFormModal } from "@/components/DocumentFormModal";
import {
  ConfirmDialog,
  CopyButton,
  EmptyState,
  ErrorBlock,
  Field,
  inputClass,
  LoadingBlock,
  Modal,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
} from "@/components/ui";

interface FormState {
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  status: SessionStatus;
  organ: string;
  reference: string;
  description: string;
  // Chaîne (et non nombre) pour permettre un champ vide sans « 0 » collant.
  expectedParticipants: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  location: "",
  startDate: "",
  endDate: "",
  status: "à-venir",
  organ: "",
  reference: "",
  description: "",
  expectedParticipants: "",
};

/** Accès d'inscription de la session : identifiant + mot de passe + invitation. */
function AccessPanel({
  session,
  onRegenerate,
}: {
  session: CtsSession;
  onRegenerate: () => void;
}) {
  const { t } = useI18n();
  const { settings } = useSettings();
  if (!session.accessCode) return null;

  const inviteText = t("sess.access.invite", {
    platform: settings.platform_name,
    title: session.title,
    code: session.accessCode,
    password: session.accessPassword ?? "",
    url: `${window.location.origin}/inscription`,
  });

  return (
    <div className="mt-4 rounded-lg border border-brand/20 bg-brand-soft/50 p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
          <KeyRound size={15} aria-hidden />
          {t("sess.access.title")}
        </p>
        <div className="flex items-center gap-4">
          <CopyButton text={inviteText} label={t("sess.access.copyInvite")} />
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center gap-1 text-slate2 hover:text-danger transition-colors text-xs font-medium"
          >
            <RefreshCw size={13} aria-hidden />
            {t("sess.access.regenerate")}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-6 flex-wrap">
        <div>
          <p className="text-xs text-slate2/80 mb-0.5">{t("sess.access.code")}</p>
          <p className="flex items-center gap-2 font-mono text-base font-bold text-ink tracking-wide">
            {session.accessCode}
            <CopyButton text={session.accessCode} />
          </p>
        </div>
        <div>
          <p className="text-xs text-slate2/80 mb-0.5">{t("sess.access.password")}</p>
          <p className="flex items-center gap-2 font-mono text-base font-bold text-ink tracking-wide">
            {session.accessPassword}
            <CopyButton text={session.accessPassword ?? ""} />
          </p>
        </div>
      </div>
      <p className="text-xs text-slate2/80 mt-2">{t("sess.access.hint")}</p>
    </div>
  );
}

export function AdminSessions() {
  const { t } = useI18n();
  const resource = useApiResource<{ sessions: CtsSession[] }>("/sessions");
  const sessions = resource.data?.sessions ?? null;

  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<CtsSession | null>(null);
  const [deleting, setDeleting] = useState<CtsSession | null>(null);
  const [regenerating, setRegenerating] = useState<CtsSession | null>(null);
  const [broadcasting, setBroadcasting] = useState<CtsSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [openDocs, setOpenDocs] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [docModal, setDocModal] = useState<{ mode: "create" | "edit"; sessionId: string; doc?: Doc } | null>(null);

  const reloadDocs = () =>
    Promise.all([
      api.get<{ documents: Doc[] }>("/documents"),
      api.get<{ categories: Category[] }>("/categories"),
    ]).then(([d, c]) => {
      setDocuments(d.documents);
      setCategories(c.categories);
    });

  useEffect(() => {
    reloadDocs().catch(() => {});
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setModal("create");
  };

  const openEdit = (s: CtsSession) => {
    setForm({
      title: s.title,
      location: s.location,
      startDate: s.startDate.slice(0, 10),
      endDate: s.endDate ? s.endDate.slice(0, 10) : "",
      status: s.status,
      organ: displayOrgan(s.organ, t),
      reference: s.reference,
      description: s.description,
      expectedParticipants: s.expectedParticipants ? String(s.expectedParticipants) : "",
    });
    setEditing(s);
    setModal("edit");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (form.endDate && form.endDate < form.startDate) {
      toast.error(t("sess.endBeforeStart"));
      return;
    }
    setBusy(true);
    const payload = {
      ...form,
      organ: form.organ.trim(),
      endDate: form.endDate || null,
      expectedParticipants: Number(form.expectedParticipants) || 0,
    };
    try {
      if (modal === "create") {
        const { session } = await api.post<{ session: CtsSession }>("/sessions", payload);
        toast.success(t("sess.created"));
        setModal(null);
        await resource.reload();
        if (session.accessCode) {
          toast.info(t("sess.access.createdInfo", { code: session.accessCode }), {
            duration: 8000,
          });
        }
      } else if (editing) {
        await api.put(`/sessions/${editing.id}`, payload);
        toast.success(t("sess.updated"));
        setModal(null);
        await resource.reload();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      await api.delete(`/sessions/${deleting.id}`);
      toast.success(t("sess.deleted"));
      setDeleting(null);
      await resource.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async () => {
    if (!regenerating || busy) return;
    setBusy(true);
    try {
      await api.post(`/sessions/${regenerating.id}/regenerate-access`);
      toast.success(t("sess.access.regenerated"));
      setRegenerating(null);
      await resource.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  if (resource.loading && !sessions) return <LoadingBlock />;
  if (resource.error && !sessions)
    return <ErrorBlock message={resource.error} onRetry={resource.reload} />;
  if (!sessions) return <LoadingBlock />;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("sess.title")}
        subtitle={t("sess.subtitle")}
        action={
          <PrimaryButton onClick={openCreate}>
            <Plus size={15} aria-hidden />
            {t("sess.new")}
          </PrimaryButton>
        }
      />

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-line-soft">
          <EmptyState icon={<Calendar size={32} />} message={t("sess.empty")} />
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              discussionOpen={openThread === session.id}
              onToggleDiscussion={() =>
                setOpenThread((cur) => (cur === session.id ? null : session.id))
              }
              extras={
                openDocs === session.id ? (
                  <MeetingDocuments
                    documents={documents.filter((d) => d.sessionId === session.id)}
                    onAdd={() => setDocModal({ mode: "create", sessionId: session.id })}
                    onEdit={(doc) => setDocModal({ mode: "edit", sessionId: session.id, doc })}
                  />
                ) : null
              }
              actions={
                <>
                  <button
                    onClick={() =>
                      setOpenDocs((cur) => (cur === session.id ? null : session.id))
                    }
                    className="flex items-center gap-1.5 border border-line text-slate2 px-3 py-1.5 rounded-lg text-sm hover:bg-mist transition-colors"
                  >
                    <FileText size={14} aria-hidden />
                    {openDocs === session.id ? t("sess.docsClose") : t("sess.docsOpen")}
                  </button>
                  <button
                    onClick={() => setBroadcasting(session)}
                    className="flex items-center gap-1.5 border border-line text-slate2 px-3 py-1.5 rounded-lg text-sm hover:bg-mist transition-colors"
                  >
                    <Mail size={14} aria-hidden />
                    {t("sess.broadcast")}
                  </button>
                  <button
                    onClick={() => openEdit(session)}
                    className="flex items-center gap-1.5 border border-line text-slate2 px-3 py-1.5 rounded-lg text-sm hover:bg-mist transition-colors"
                  >
                    <Edit3 size={14} aria-hidden />
                    {t("common.edit")}
                  </button>
                  <button
                    onClick={() => setDeleting(session)}
                    className="p-1.5 rounded-lg text-slate2/60 hover:bg-danger-soft hover:text-danger transition-colors"
                    title={t("common.delete")}
                    aria-label={t("common.delete")}
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                </>
              }
              footer={
                <AccessPanel
                  session={session}
                  onRegenerate={() => setRegenerating(session)}
                />
              }
            />
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal === "create" ? t("sess.newTitle") : t("sess.editTitle")}
          onClose={() => setModal(null)}
          wide
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field label={t("sess.fieldTitle")} required>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t("sess.fieldTitlePh")}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t("sess.reference")}>
                {modal === "create" ? (
                  <input
                    disabled
                    value=""
                    placeholder={t("sess.referenceAuto")}
                    className={inputClass}
                  />
                ) : (
                  <input
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    placeholder={t("sess.referencePh")}
                    className={inputClass}
                  />
                )}
              </Field>
              <Field label={t("sess.location")}>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder={t("sess.locationPh")}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t("sess.startDate")} required>
                <input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label={t("sess.endDate")}>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <div>
              <label className="block">
                <span className="block text-sm font-semibold text-ink mb-1.5">
                  {t("sess.organ")}
                </span>
                <input
                  type="text"
                  value={form.organ}
                  onChange={(e) => setForm({ ...form, organ: e.target.value })}
                  placeholder={t("sess.organPh")}
                  maxLength={200}
                  autoComplete="off"
                  className={inputClass}
                />
              </label>
              <p className="mt-1.5 text-xs text-slate2/70">{t("sess.organHelp")}</p>
              <p className="mt-2.5 mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate2/55">
                {t("sess.organSuggest")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ORGAN_SUGGESTION_KEYS.map((key) => {
                  const label = t(key);
                  const active = form.organ.trim() === label;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm({ ...form, organ: label })}
                      aria-pressed={active}
                      className={clsx(
                        "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                        active
                          ? "bg-gradient-to-b from-brand to-brand-dark text-white shadow-sm shadow-brand/30"
                          : "bg-white border border-line text-slate2 hover:bg-mist hover:border-brand/40"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t("sess.status")}>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as SessionStatus })}
                  className={inputClass}
                >
                  <option value="à-venir">{t("status.à-venir")}</option>
                  <option value="en-cours">{t("status.en-cours")}</option>
                  <option value="terminé">{t("status.terminé")}</option>
                </select>
              </Field>
              <Field label={t("sess.expectedLbl")}>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="0"
                  value={form.expectedParticipants}
                  onChange={(e) =>
                    setForm({ ...form, expectedParticipants: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label={t("sess.description")}>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t("sess.descriptionPh")}
                className={inputClass}
              />
            </Field>

            {modal === "create" && (
              <p className="text-sm text-slate2/80 bg-mist rounded-lg px-3 py-2.5">
                {t("sess.access.willGenerate")}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <SecondaryButton type="button" className="flex-1" onClick={() => setModal(null)} disabled={busy}>
                {t("common.cancel")}
              </SecondaryButton>
              <PrimaryButton type="submit" className="flex-1" disabled={busy}>
                {busy
                  ? t("common.saving")
                  : modal === "create"
                    ? t("sess.createBtn")
                    : t("common.save")}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title={t("sess.deleteTitle")}
          message={t("sess.deleteMsg", { title: deleting.title })}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}

      {regenerating && (
        <ConfirmDialog
          title={t("sess.access.regenerateTitle")}
          message={t("sess.access.regenerateMsg", { title: regenerating.title })}
          confirmLabel={t("sess.access.regenerate")}
          onConfirm={handleRegenerate}
          onCancel={() => setRegenerating(null)}
          busy={busy}
        />
      )}

      {broadcasting && (
        <BroadcastModal session={broadcasting} onClose={() => setBroadcasting(null)} />
      )}

      {docModal && (
        <DocumentFormModal
          mode={docModal.mode}
          categories={categories}
          sessions={sessions}
          editing={docModal.doc ?? null}
          defaultSessionId={docModal.sessionId}
          lockSession
          onClose={() => setDocModal(null)}
          onSaved={async () => {
            setDocModal(null);
            await Promise.all([resource.reload(), reloadDocs()]);
          }}
        />
      )}
    </div>
  );
}

function MeetingDocuments({
  documents,
  onAdd,
  onEdit,
}: {
  documents: Doc[];
  onAdd: () => void;
  onEdit: (doc: Doc) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="mt-4 rounded-lg border border-line-soft bg-mist/50 p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
        <p className="text-sm font-semibold text-ink">{t("docs.meetingDocs")}</p>
        <PrimaryButton type="button" onClick={onAdd}>
          <Plus size={14} aria-hidden />
          {t("docs.addToMeeting")}
        </PrimaryButton>
      </div>
      <p className="text-xs text-slate2/80 mb-3">{t("docs.lifecycleNote")}</p>
      {documents.length === 0 ? (
        <p className="text-sm text-slate2/70">{t("docs.meetingDocsEmpty")}</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 bg-white border border-line-soft rounded-lg px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm text-ink truncate">
                  {doc.title}
                  {doc.version > 1 && (
                    <span className="ml-2 text-[10px] font-semibold text-brand">
                      {t("docs.version", { n: doc.version })}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate2/70">
                  {doc.categoryName || t("common.dash")}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={doc.status} />
                <button
                  type="button"
                  onClick={() => onEdit(doc)}
                  className="p-1.5 rounded-lg text-brand hover:bg-brand-soft transition-colors"
                  title={t("common.edit")}
                  aria-label={t("common.edit")}
                >
                  <Edit3 size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
