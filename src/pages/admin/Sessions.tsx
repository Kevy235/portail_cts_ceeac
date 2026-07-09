import { useState } from "react";
import { Calendar, Edit3, KeyRound, Mail, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { CtsSession, SessionStatus } from "@/lib/types";
import { useApiResource } from "@/lib/useApiResource";
import { useI18n } from "@/i18n";
import { SessionCard } from "@/components/SessionCard";
import { BroadcastModal } from "@/components/BroadcastModal";
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
} from "@/components/ui";

interface FormState {
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  status: SessionStatus;
  reference: string;
  description: string;
  expectedParticipants: number;
}

const EMPTY_FORM: FormState = {
  title: "",
  location: "",
  startDate: "",
  endDate: "",
  status: "à-venir",
  reference: "",
  description: "",
  expectedParticipants: 0,
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
  if (!session.accessCode) return null;

  const inviteText = t("sess.access.invite", {
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
      reference: s.reference,
      description: s.description,
      expectedParticipants: s.expectedParticipants,
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
              actions={
                <>
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
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("sess.reference")}>
                {modal === "create" ? (
                  <input
                    disabled
                    value=""
                    placeholder={t("sess.referenceAuto")}
                    className={`${inputClass} bg-mist text-slate2 cursor-not-allowed`}
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
                  value={form.expectedParticipants}
                  onChange={(e) =>
                    setForm({ ...form, expectedParticipants: Number(e.target.value) })
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
    </div>
  );
}
