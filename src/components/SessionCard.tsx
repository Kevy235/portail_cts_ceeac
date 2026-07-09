import { Calendar, Clock, FileText, MapPin, MessagesSquare, UserCheck, Users } from "lucide-react";
import { clsx } from "clsx";
import type { ReactNode } from "react";
import type { CtsSession } from "@/lib/types";
import { formatDateRange } from "@/lib/format";
import { useI18n } from "@/i18n";
import { Discussion } from "@/components/Discussion";
import { StatusBadge } from "@/components/ui";

/**
 * Carte de session partagée entre l'espace admin et l'espace participant.
 * `actions` : boutons supplémentaires (édition, suppression…) ;
 * `footer` : contenu additionnel sous la carte (accès d'inscription côté admin).
 */
export function SessionCard({
  session,
  discussionOpen,
  onToggleDiscussion,
  actions,
  footer,
}: {
  session: CtsSession;
  discussionOpen: boolean;
  onToggleDiscussion: () => void;
  actions?: ReactNode;
  footer?: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="bg-white rounded-xl border border-line-soft shadow-sm p-5 hover:shadow-lg hover:border-brand/25 hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start gap-4 flex-wrap">
        <div
          className={clsx(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            session.status === "à-venir"
              ? "bg-violet-100"
              : session.status === "en-cours"
                ? "bg-accent-soft"
                : "bg-slate-100"
          )}
          aria-hidden
        >
          <Calendar
            size={20}
            className={
              session.status === "à-venir"
                ? "text-violet-600"
                : session.status === "en-cours"
                  ? "text-accent-dark"
                  : "text-slate-400"
            }
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-semibold text-ink text-base font-title">
                {session.title}
                {session.reference && (
                  <span className="ml-2 text-xs font-mono text-slate2/70 font-normal">
                    {session.reference}
                  </span>
                )}
              </h3>
              <p className="text-slate2/80 text-sm mt-0.5 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-brand" aria-hidden />{" "}
                  {formatDateRange(session.startDate, session.endDate)}
                </span>
                {session.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-danger/70" aria-hidden /> {session.location}
                  </span>
                )}
              </p>
            </div>
            <StatusBadge status={session.status} />
          </div>
          {session.description && (
            <p className="text-sm text-slate2 mt-2 line-clamp-3">{session.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm text-slate2">
              <Users size={14} className="text-brand" aria-hidden />
              {t("sess.expected", { n: session.expectedParticipants })}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-slate2">
              <UserCheck size={14} className="text-accent-dark" aria-hidden />
              {t("sess.registered", { n: session.registeredCount })}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-slate2">
              <FileText size={14} className="text-violet-500" aria-hidden />
              {t("sess.nDocs", { n: session.documentCount })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onToggleDiscussion}
            aria-expanded={discussionOpen}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors border",
              discussionOpen
                ? "bg-brand text-white border-brand"
                : "border-line text-slate2 hover:bg-mist"
            )}
          >
            <MessagesSquare size={14} aria-hidden />
            {t("sess.discussion")}
          </button>
          {actions}
        </div>
      </div>

      {discussionOpen && (
        <div className="mt-4">
          <Discussion sessionId={session.id} />
        </div>
      )}

      {footer}
    </div>
  );
}
