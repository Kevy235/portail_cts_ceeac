import { useMemo, useRef, useState } from "react";
import { FileUp, Mail, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { CtsSession, Doc } from "@/lib/types";
import { useApiResource } from "@/lib/useApiResource";
import { formatSize } from "@/lib/format";
import { useI18n } from "@/i18n";
import {
  CodedBadge,
  ErrorBlock,
  Field,
  inputClass,
  LangChip,
  LoadingBlock,
  Modal,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui";

// Limites des pièces jointes (alignées sur le serveur).
const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_MB = 10;
const MAX_TOTAL_MB = 15;
const ACCEPT_EXT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

/**
 * Diffusion d'un rapport de réunion par e-mail aux participants :
 * objet + message + liens de téléchargement des documents publiés de la
 * session + pièces jointes envoyées directement dans l'e-mail.
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
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Ajout de pièces jointes avec validation (nombre, taille unitaire, total).
  const addAttachments = (files: FileList | null) => {
    if (!files) return;
    setAttachments((prev) => {
      const next = [...prev];
      for (const f of Array.from(files)) {
        if (next.length >= MAX_ATTACHMENTS) {
          toast.error(t("broadcast.attachMax", { n: MAX_ATTACHMENTS }));
          break;
        }
        if (f.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
          toast.error(t("broadcast.attachTooBig", { name: f.name, n: MAX_ATTACHMENT_MB }));
          continue;
        }
        // Doublon (même nom + même taille) ignoré silencieusement.
        if (next.some((x) => x.name === f.name && x.size === f.size)) continue;
        next.push(f);
      }
      const total = next.reduce((sum, f) => sum + f.size, 0);
      if (total > MAX_TOTAL_MB * 1024 * 1024) {
        toast.error(t("broadcast.attachTotal", { n: MAX_TOTAL_MB }));
        return prev;
      }
      return next;
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      // FormData : requis pour transporter les pièces jointes.
      const fd = new FormData();
      fd.append("subject", subject);
      fd.append("message", message);
      fd.append("scope", scope);
      fd.append("documentIds", JSON.stringify([...selected]));
      for (const f of attachments) fd.append("attachments", f);
      const result = await api.postForm<{ sent: number; failed: number }>(
        `/sessions/${session.id}/broadcast`,
        fd
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
      <span className="flex items-center gap-1">
        {d.files.map((f) => (
          <LangChip key={f.lang} lang={f.lang} />
        ))}
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

          {/* ─── Pièces jointes de l'e-mail ─────────────────────────── */}
          <Field label={t("broadcast.attachments")}>
            <div className="space-y-2">
              <p className="text-[11px] text-slate2/70">
                {t("broadcast.attachNote", {
                  max: MAX_ATTACHMENTS,
                  mb: MAX_ATTACHMENT_MB,
                  total: MAX_TOTAL_MB,
                })}
              </p>
              {attachments.map((f) => (
                <div
                  key={`${f.name}-${f.size}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-line-soft bg-mist/50"
                >
                  <Paperclip size={14} className="text-brand flex-shrink-0" aria-hidden />
                  <span className="flex-1 text-sm text-ink truncate">{f.name}</span>
                  <span className="text-xs text-slate2/70 whitespace-nowrap">
                    {formatSize(f.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAttachments((prev) => prev.filter((x) => x !== f))
                    }
                    className="p-1 text-slate2/50 hover:text-danger transition-colors"
                    title={t("common.delete")}
                    aria-label={`${t("common.delete")} ${f.name}`}
                  >
                    <X size={14} aria-hidden />
                  </button>
                </div>
              ))}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPT_EXT}
                className="hidden"
                onChange={(e) => {
                  addAttachments(e.target.files);
                  e.target.value = "";
                }}
              />
              {attachments.length < MAX_ATTACHMENTS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 w-full justify-center px-3 py-2.5 rounded-lg border border-dashed border-brand/40 text-brand text-sm font-medium hover:bg-brand-soft/50 hover:border-brand transition-all"
                >
                  <FileUp size={15} aria-hidden />
                  {t("broadcast.attachBtn")}
                </button>
              )}
            </div>
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
