import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { COUNTRY_FLAGS } from "@/lib/types";
import { formatTime, initials } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { ConfirmDialog } from "@/components/ui";

const POLL_MS = 5000;

/**
 * Fil de discussion d'une session. À chaque cycle (5 s), la fenêtre des 200
 * derniers messages est rechargée et remplace l'état local : les suppressions
 * effectuées par d'autres utilisateurs sont ainsi répercutées, pas seulement
 * les ajouts. Le polling est suspendu quand l'onglet est en arrière-plan.
 */
export function Discussion({ sessionId }: { sessionId: string }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [toDelete, setToDelete] = useState<ChatMessage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  // Invalide les réponses en vol après démontage ou changement de session.
  const generationRef = useRef(0);
  const lastCountRef = useRef(0);

  const fetchMessages = useCallback(async () => {
    const gen = generationRef.current;
    try {
      const { messages } = await api.get<{ messages: ChatMessage[] }>(
        `/sessions/${sessionId}/messages`
      );
      if (gen !== generationRef.current) return;
      setMessages(messages);
    } catch {
      /* nouvelle tentative au prochain cycle */
    }
  }, [sessionId]);

  useEffect(() => {
    generationRef.current++;
    setMessages([]);
    setLoaded(false);
    fetchMessages().finally(() => setLoaded(true));

    const timer = setInterval(() => {
      if (!document.hidden) fetchMessages();
    }, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) fetchMessages();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      generationRef.current++;
    };
  }, [fetchMessages]);

  // Défilement automatique uniquement si l'utilisateur est déjà près du bas
  // (ne pas l'arracher à la lecture de l'historique).
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const isInitial = lastCountRef.current === 0;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isInitial || nearBottom) el.scrollTop = el.scrollHeight;
    lastCountRef.current = messages.length;
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const { message } = await api.post<{ message: ChatMessage }>(
        `/sessions/${sessionId}/messages`,
        { body: text }
      );
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message]
      );
      setBody("");
      // Après un envoi, toujours défiler vers le bas.
      requestAnimationFrame(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("chat.sendFailed"));
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/sessions/${sessionId}/messages/${toDelete.id}`);
      setMessages((prev) => prev.filter((m) => m.id !== toDelete.id));
      setToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col bg-mist/60 rounded-lg border border-line-soft overflow-hidden">
      <div
        ref={listRef}
        className="max-h-80 min-h-32 overflow-y-auto p-4 space-y-3"
        aria-live="polite"
      >
        {!loaded ? (
          <p className="text-sm text-slate2/70 text-center py-6">{t("common.loading")}</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate2/70 text-center py-6">{t("chat.empty")}</p>
        ) : (
          messages.map((m) => {
            const mine = m.authorId === user?.id;
            const canDelete = mine || user?.role === "admin";
            return (
              <div key={m.id} className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${
                    m.authorRole === "admin" ? "bg-brand" : "bg-accent"
                  }`}
                  title={m.authorName}
                >
                  {initials(m.authorName)}
                </div>
                <div className={`max-w-[80%] group ${mine ? "text-right" : ""}`}>
                  <div className="flex items-baseline gap-2 mb-0.5 flex-wrap"
                    style={mine ? { justifyContent: "flex-end" } : undefined}
                  >
                    <span className="text-xs font-semibold text-ink">
                      {mine ? t("chat.you") : m.authorName}
                      {!mine && m.authorRole === "admin" && (
                        <span className="ml-1 text-brand font-normal">· {t("header.admin")}</span>
                      )}
                      {!mine && m.authorCountry && (
                        <span className="ml-1 font-normal text-slate2/80">
                          {COUNTRY_FLAGS[m.authorCountry] ?? ""} {m.authorCountry}
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-slate2/60">{formatTime(m.createdAt)}</span>
                    {canDelete && (
                      <button
                        onClick={() => setToDelete(m)}
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-slate2/50 hover:text-danger transition-all"
                        title={t("chat.deleteTitle")}
                        aria-label={t("chat.deleteTitle")}
                      >
                        <Trash2 size={11} aria-hidden />
                      </button>
                    )}
                  </div>
                  <div
                    className={`inline-block px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words text-left ${
                      mine
                        ? "bg-brand text-white rounded-tr-none"
                        : "bg-white border border-line-soft text-ink rounded-tl-none"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 p-3 bg-white border-t border-line-soft"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          placeholder={t("chat.placeholder")}
          aria-label={t("chat.placeholder")}
          rows={1}
          maxLength={2000}
          className="flex-1 resize-none border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="bg-brand text-white p-2.5 rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-40"
          title={t("chat.send")}
          aria-label={t("chat.send")}
        >
          <Send size={15} aria-hidden />
        </button>
      </form>

      {toDelete && (
        <ConfirmDialog
          title={t("chat.deleteTitle")}
          message={t("chat.deleteMsg")}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          busy={deleting}
        />
      )}
    </div>
  );
}
