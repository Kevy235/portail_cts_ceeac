import { useState } from "react";
import { Calendar, KeyRound, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { CtsSession } from "@/lib/types";
import { useApiResource } from "@/lib/useApiResource";
import { useI18n } from "@/i18n";
import { SessionCard } from "@/components/SessionCard";
import {
  EmptyState,
  ErrorBlock,
  Field,
  inputClass,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
} from "@/components/ui";

/**
 * Déverrouillage d'une réunion supplémentaire avec ses codes d'accès.
 * Les codes n'ouvrent que la réunion concernée : c'est le seul moyen, pour un
 * participant, d'élargir son accès documentaire (hors décision de l'admin).
 */
function UnlockSessionForm({ onUnlocked }: { onUnlocked: () => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [accessPassword, setAccessPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const { sessionTitle } = await api.post<{ sessionId: string; sessionTitle: string }>(
        "/sessions/unlock",
        { accessCode, accessPassword }
      );
      toast.success(t("unlock.done", { title: sessionTitle }));
      setAccessCode("");
      setAccessPassword("");
      setOpen(false);
      onUnlocked();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("unlock.failed"));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-brand border border-brand/30 bg-brand-soft/50 hover:bg-brand-soft transition-colors"
      >
        <Plus size={14} aria-hidden />
        {t("unlock.title")}
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-xl border border-line-soft shadow-sm p-5 space-y-4"
    >
      <div>
        <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
          <KeyRound size={14} className="text-brand" aria-hidden />
          {t("unlock.title")}
        </h3>
        <p className="text-xs text-slate2 mt-1">{t("unlock.subtitle")}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("unlock.code")} required>
          <input
            required
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className={`${inputClass} font-mono uppercase`}
          />
        </Field>
        <Field label={t("unlock.password")} required>
          <input
            required
            value={accessPassword}
            onChange={(e) => setAccessPassword(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className={`${inputClass} font-mono uppercase`}
          />
        </Field>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-slate2 border border-line hover:bg-mist transition-colors"
        >
          {t("common.cancel")}
        </button>
        <PrimaryButton type="submit" disabled={busy}>
          <KeyRound size={14} />
          {busy ? t("common.saving") : t("unlock.submit")}
        </PrimaryButton>
      </div>
    </form>
  );
}

export function ParticipantSessions() {
  const { t } = useI18n();
  const resource = useApiResource<{ sessions: CtsSession[] }>("/sessions");
  const [openThread, setOpenThread] = useState<string | null>(null);

  if (resource.loading && !resource.data) return <LoadingBlock />;
  if (resource.error && !resource.data)
    return <ErrorBlock message={resource.error} onRetry={resource.reload} />;
  const sessions = resource.data?.sessions ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title={t("sess.title")} subtitle={t("sess.psubtitle")} />

      <UnlockSessionForm onUnlocked={resource.reload} />

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-line-soft">
          <EmptyState icon={<Calendar size={32} />} message={t("sess.pempty")} />
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
