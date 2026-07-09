import { useMemo, useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { CtsSession, Doc } from "@/lib/types";
import { useApiResource } from "@/lib/useApiResource";
import { useI18n } from "@/i18n";
import {
  CodedBadge,
  ErrorBlock,
  Field,
  inputClass,
  LoadingBlock,
  Modal,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui";

/**
 * Diffusion d'un rapport de réunion par e-mail aux participants :
 * objet + message + liens de téléchargement des documents publiés de la session.
 */
export function BroadcastModal({
  session,
  onClose,
}: {
  session: CtsSession;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const docs = useApiResource<{ documents: Doc[] }>("/documents");
  const [subject, setSubject] = useState(session.title);
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<"all" | "session">(
    session.registeredCount > 0 ? "session" : "all"
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  // Documents publiés rattachés à cette session (proposés en premier),
  // puis les autres documents publiés.
  const { sessionDocs, otherDocs } = useMemo(() => {
    const published = (docs.data?.documents ?? []).filter((d) => d.status === "publié");
    return {
      sessionDocs: published.filter((d) => d.sessionId === session.id),
      otherDocs: published.filter((d) => d.sessionId !== session.id),
    };
  }, [docs.data, session.id]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const result = await api.post<{ sent: number; failed: number }>(
        `/sessions/${session.id}/broadcast`,
        { subject, message, documentIds: [...selected], scope }
      );
      if (result.failed > 0) {
        toast.warning(
          t("broadcast.partial", { sent: result.sent, failed: result.failed })
        );
      } else {
        toast.success(t("broadcast.sent", { sent: result.sent }));
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSending(false);
    }
  };

  const docRow = (d: Doc) => (
    <label
      key={d.id}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-line-soft hover:bg-mist cursor-pointer"
    >
      <input
        type="checkbox"
        checked={selected.has(d.id)}
        onChange={() => toggle(d.id)}
        className="w-4 h-4 accent-brand"
      />
      <span className="flex-1 text-sm text-ink">{d.title}</span>
      {d.isCoded && <CodedBadge compact />}
      <span className="text-xs text-slate2/70 uppercase">
        {d.files.map((f) => f.lang).join(" · ")}
      </span>
    </label>
  );

  return (
    <Modal
      title={t("broadcast.title")}
      subtitle={session.title}
      onClose={onClose}
      wide
    >
      {docs.loading ? (
        <LoadingBlock />
      ) : docs.error ? (
        <ErrorBlock message={docs.error} onRetry={docs.reload} />
      ) : (
        <form onSubmit={handleSend} className="p-6 space-y-4">
          <Field label={t("broadcast.subject")} required>
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              className={inputClass}
            />
          </Field>
          <Field label={t("broadcast.message")} required>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
              placeholder={t("broadcast.messagePh")}
              className={inputClass}
            />
          </Field>

          <Field label={t("broadcast.recipients")}>
            <div className="space-y-2">
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-line-soft hover:bg-mist cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === "session"}
                  onChange={() => setScope("session")}
                  className="w-4 h-4 accent-brand"
                />
                <span className="text-sm text-ink">
                  {t("broadcast.scopeSession", { n: session.registeredCount })}
                </span>
              </label>
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-line-soft hover:bg-mist cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                  className="w-4 h-4 accent-brand"
                />
                <span className="text-sm text-ink">{t("broadcast.scopeAll")}</span>
              </label>
            </div>
          </Field>

          <Field label={t("broadcast.docs")}>
            {sessionDocs.length === 0 && otherDocs.length === 0 ? (
              <p className="text-sm text-slate2/80 px-1">{t("broadcast.noDocs")}</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {sessionDocs.map(docRow)}
                {otherDocs.length > 0 && (
                  <>
                    <p className="text-xs text-slate2/70 uppercase tracking-wide pt-2 px-1">
                      {t("broadcast.otherDocs")}
                    </p>
                    {otherDocs.map(docRow)}
                  </>
                )}
              </div>
            )}
          </Field>

          <div className="flex gap-3 pt-1">
            <SecondaryButton type="button" className="flex-1" onClick={onClose} disabled={sending}>
              {t("common.cancel")}
            </SecondaryButton>
            <PrimaryButton type="submit" className="flex-1" disabled={sending}>
              <Mail size={15} aria-hidden />
              {sending ? t("broadcast.sending") : t("broadcast.send")}
            </PrimaryButton>
          </div>
        </form>
      )}
    </Modal>
  );
}
