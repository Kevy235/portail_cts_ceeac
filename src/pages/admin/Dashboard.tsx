import { Link } from "react-router";
import {
  Calendar,
  Download,
  FileCheck,
  FileText,
  Mail,
  Settings,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import type { Stats } from "@/lib/types";
import { useApiResource } from "@/lib/useApiResource";
import { formatDate, timeAgoParts } from "@/lib/format";
import { useI18n } from "@/i18n";
import type { Dict } from "@/i18n/fr";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui";

const ACTIVITY_ICONS: Record<string, { icon: React.ReactNode; bg: string }> = {
  participant_created: { icon: <UserPlus size={14} className="text-accent-dark" />, bg: "bg-accent-soft" },
  participant_registered: { icon: <UserPlus size={14} className="text-violet-600" />, bg: "bg-violet-50" },
  broadcast_sent: { icon: <Mail size={14} className="text-brand" />, bg: "bg-brand-soft" },
  participant_updated: { icon: <Users size={14} className="text-brand" />, bg: "bg-brand-soft" },
  participant_deleted: { icon: <Trash2 size={14} className="text-danger" />, bg: "bg-danger-soft" },
  document_published: { icon: <Upload size={14} className="text-brand" />, bg: "bg-brand-soft" },
  document_updated: { icon: <FileText size={14} className="text-brand" />, bg: "bg-brand-soft" },
  document_deleted: { icon: <Trash2 size={14} className="text-danger" />, bg: "bg-danger-soft" },
  document_downloaded: { icon: <FileCheck size={14} className="text-violet-500" />, bg: "bg-violet-50" },
  session_created: { icon: <Calendar size={14} className="text-slate-500" />, bg: "bg-slate-100" },
  session_updated: { icon: <Calendar size={14} className="text-slate-500" />, bg: "bg-slate-100" },
  session_deleted: { icon: <Trash2 size={14} className="text-danger" />, bg: "bg-danger-soft" },
  settings_updated: { icon: <Settings size={14} className="text-amber-600" />, bg: "bg-amber-50" },
  login: { icon: <Users size={14} className="text-slate-400" />, bg: "bg-slate-100" },
};

const ACTIVITY_KEYS: Record<string, keyof Dict> = {
  participant_created: "activity.participant_created",
  participant_registered: "activity.participant_registered",
  broadcast_sent: "activity.broadcast_sent",
  participant_updated: "activity.participant_updated",
  participant_deleted: "activity.participant_deleted",
  document_published: "activity.document_published",
  document_updated: "activity.document_updated",
  document_deleted: "activity.document_deleted",
  document_downloaded: "activity.document_downloaded",
  session_created: "activity.session_created",
  session_updated: "activity.session_updated",
  session_deleted: "activity.session_deleted",
  settings_updated: "activity.settings_updated",
  login: "activity.login",
};

export function AdminDashboard() {
  const { t } = useI18n();
  const resource = useApiResource<Stats>("/stats");
  const stats = resource.data;

  if (resource.error && !stats)
    return <ErrorBlock message={resource.error} onRetry={resource.reload} />;
  if (!stats) return <LoadingBlock />;

  const timeAgo = (iso: string) => {
    const parts = timeAgoParts(iso);
    if (parts.key === "date") return parts.text;
    return t(parts.key, "n" in parts ? { n: parts.n } : undefined);
  };

  const cards = [
    {
      label: t("dash.activeParticipants"),
      value: stats.participants.actifs,
      sub: t("dash.totalAccounts", { n: stats.participants.total }),
      color: "border-l-brand",
      tile: "bg-gradient-to-br from-brand to-brand-deep",
      icon: <Users size={18} className="text-white" />,
    },
    {
      label: t("dash.publishedDocs"),
      value: stats.documents.publies,
      sub: t("dash.pendingDrafts", { n: stats.documents.brouillons }),
      color: "border-l-accent",
      tile: "bg-gradient-to-br from-accent to-accent-dark",
      icon: <FileText size={18} className="text-white" />,
    },
    {
      label: t("dash.plannedSessions"),
      value: stats.sessions.planifiees,
      sub: stats.sessions.prochaine
        ? t("dash.nextOn", { date: formatDate(stats.sessions.prochaine.startDate) })
        : t("dash.noUpcoming"),
      color: "border-l-violet-500",
      tile: "bg-gradient-to-br from-violet-500 to-violet-700",
      icon: <Calendar size={18} className="text-white" />,
    },
    {
      label: t("dash.downloads"),
      value: stats.downloads.moisCourant,
      sub: t("dash.totalDownloads", { n: stats.downloads.total }),
      color: "border-l-gold",
      tile: "bg-gradient-to-br from-gold to-amber-600",
      icon: <Download size={18} className="text-white" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("dash.title")} subtitle={t("dash.subtitle")} />

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {cards.map(({ label, value, sub, color, tile, icon }) => (
          <div
            key={label}
            className={`bg-white rounded-xl p-4 border border-line-soft border-l-4 ${color} shadow-sm flex items-center gap-3 md:block transition-all duration-200 hover:shadow-lg hover:-translate-y-1`}
          >
            <div
              className={`w-10 h-10 rounded-xl ${tile} shadow-md flex items-center justify-center flex-shrink-0 md:mb-3`}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-3xl font-bold text-ink leading-tight tabular-nums">{value}</p>
              <p className="text-xs font-semibold text-slate2 mt-0.5">{label}</p>
              <p className="text-[11px] text-slate2/70 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {/* Activité récente */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-line-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-line-soft flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">{t("dash.recentActivity")}</h3>
          </div>
          {stats.activity.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate2/70">
              {t("dash.noActivity")}
            </p>
          ) : (
            <div className="divide-y divide-line-soft">
              {stats.activity.map((item) => {
                const meta = ACTIVITY_ICONS[item.type] ?? ACTIVITY_ICONS.login;
                const labelKey = ACTIVITY_KEYS[item.type];
                return (
                  <div
                    key={item.id}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-mist transition-colors"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink">
                        {labelKey ? t(labelKey) : item.message}
                      </p>
                      <p className="text-[11px] text-slate2/70 truncate">{item.detail}</p>
                    </div>
                    <span className="text-[11px] text-slate2/70 flex-shrink-0">
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Prochaine session */}
          {stats.sessions.prochaine ? (
            <div className="relative overflow-hidden bg-gradient-to-br from-brand-deep to-brand-night rounded-xl p-5 text-white shadow-md">
              <div
                aria-hidden
                className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-accent/20 blur-2xl pointer-events-none"
              />
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-accent" />
                <p className="text-white/60 text-xs uppercase tracking-wide">
                  {t("dash.nextSession")}
                </p>
              </div>
              <p className="font-bold text-sm leading-snug mb-1 font-title">
                {stats.sessions.prochaine.title}
              </p>
              <p className="text-white/60 text-xs mb-3">
                {formatDate(stats.sessions.prochaine.startDate)} ·{" "}
                {stats.sessions.prochaine.location || t("dash.locationTbd")}
              </p>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-white/60">
                  <Users size={11} />{" "}
                  {t("dash.nParticipants", { n: stats.sessions.prochaine.participants })}
                </span>
                <span className="flex items-center gap-1 text-white/60">
                  <FileText size={11} />{" "}
                  {t("dash.nDocuments", { n: stats.sessions.prochaine.documents })}
                </span>
              </div>
              <Link
                to="/admin/sessions"
                className="relative mt-4 block text-center w-full bg-gradient-to-b from-accent to-accent-dark text-white text-xs font-semibold py-2.5 rounded-lg shadow-sm shadow-black/20 hover:brightness-110 transition-all"
              >
                {t("dash.manageSessions")}
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-line-soft p-5 text-center">
              <Calendar size={22} className="mx-auto text-slate2/40 mb-2" />
              <p className="text-sm text-slate2">{t("dash.noSessionPlanned")}</p>
              <Link to="/admin/sessions" className="text-brand text-xs hover:underline">
                {t("dash.createSession")}
              </Link>
            </div>
          )}

          {/* Actions rapides */}
          <div className="bg-white rounded-xl border border-line-soft p-4">
            <p className="text-xs font-semibold text-ink mb-3">{t("dash.quickActions")}</p>
            <div className="space-y-2">
              {[
                { label: t("dash.addParticipant"), to: "/admin/participants", icon: <UserPlus size={13} /> },
                { label: t("dash.publishDocument"), to: "/admin/documents", icon: <Upload size={13} /> },
                { label: t("dash.createSession"), to: "/admin/sessions", icon: <Calendar size={13} /> },
                { label: t("dash.editContents"), to: "/admin/parametres", icon: <Settings size={13} /> },
              ].map(({ label, to, icon }) => (
                <Link
                  key={label}
                  to={to}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-line-soft text-xs text-ink hover:bg-mist hover:border-brand/20 transition-all"
                >
                  <span className="text-brand">{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-line-soft p-4 flex items-start gap-2">
            <Mail size={14} className="text-brand flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate2 leading-relaxed">{t("dash.tempPwdNote")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
