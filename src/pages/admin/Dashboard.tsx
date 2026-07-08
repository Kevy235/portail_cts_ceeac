import { useEffect, useState } from "react";
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
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Stats } from "@/lib/types";
import { formatDate, timeAgo } from "@/lib/format";
import { LoadingBlock } from "@/components/ui";

const ACTIVITY_ICONS: Record<string, { icon: React.ReactNode; bg: string }> = {
  participant_created: { icon: <UserPlus size={14} className="text-accent-dark" />, bg: "bg-accent-soft" },
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

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api
      .get<Stats>("/stats")
      .then(setStats)
      .catch((err) => toast.error(err.message));
  }, []);

  if (!stats) return <LoadingBlock label="Chargement du tableau de bord…" />;

  const cards = [
    {
      label: "Participants actifs",
      value: stats.participants.actifs,
      sub: `${stats.participants.total} compte(s) au total`,
      color: "border-l-brand",
      icon: <Users size={18} className="text-brand" />,
    },
    {
      label: "Documents publiés",
      value: stats.documents.publies,
      sub: `${stats.documents.brouillons} brouillon(s) en attente`,
      color: "border-l-accent",
      icon: <FileText size={18} className="text-accent-dark" />,
    },
    {
      label: "Sessions planifiées",
      value: stats.sessions.planifiees,
      sub: stats.sessions.prochaine
        ? `prochaine : ${formatDate(stats.sessions.prochaine.startDate)}`
        : "aucune session à venir",
      color: "border-l-violet-500",
      icon: <Calendar size={18} className="text-violet-500" />,
    },
    {
      label: "Téléchargements",
      value: stats.downloads.moisCourant,
      sub: `${stats.downloads.total} au total`,
      color: "border-l-amber-500",
      icon: <Download size={18} className="text-amber-500" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-ink text-xl font-bold font-title">Tableau de bord</h2>
        <p className="text-slate2 text-sm mt-0.5">
          Vue d'ensemble — données en temps réel de la plateforme
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, sub, color, icon }) => (
          <div
            key={label}
            className={`bg-white rounded-xl p-4 border border-line-soft border-l-4 ${color} shadow-sm`}
          >
            <div className="w-9 h-9 rounded-lg bg-mist flex items-center justify-center mb-3">
              {icon}
            </div>
            <p className="text-2xl font-bold text-ink">{value}</p>
            <p className="text-xs font-medium text-ink mt-0.5">{label}</p>
            <p className="text-[11px] text-slate2/70 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Activité récente */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-line-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-line-soft flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Activité récente</h3>
          </div>
          {stats.activity.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate2/70">
              Aucune activité enregistrée pour le moment
            </p>
          ) : (
            <div className="divide-y divide-line-soft">
              {stats.activity.map((item) => {
                const meta = ACTIVITY_ICONS[item.type] ?? ACTIVITY_ICONS.login;
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
                      <p className="text-xs font-medium text-ink">{item.message}</p>
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
            <div className="bg-brand-deep rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-accent" />
                <p className="text-white/60 text-xs uppercase tracking-wide">Prochaine session</p>
              </div>
              <p className="font-bold text-sm leading-snug mb-1 font-title">
                {stats.sessions.prochaine.title}
              </p>
              <p className="text-white/60 text-xs mb-3">
                {formatDate(stats.sessions.prochaine.startDate)} ·{" "}
                {stats.sessions.prochaine.location || "Lieu à confirmer"}
              </p>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-white/60">
                  <Users size={11} /> {stats.sessions.prochaine.participants} participants
                </span>
                <span className="flex items-center gap-1 text-white/60">
                  <FileText size={11} /> {stats.sessions.prochaine.documents} documents
                </span>
              </div>
              <Link
                to="/admin/sessions"
                className="mt-4 block text-center w-full bg-accent text-white text-xs font-medium py-2 rounded-lg hover:bg-accent-dark transition-colors"
              >
                Gérer les sessions
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-line-soft p-5 text-center">
              <Calendar size={22} className="mx-auto text-slate2/40 mb-2" />
              <p className="text-sm text-slate2">Aucune session planifiée</p>
              <Link to="/admin/sessions" className="text-brand text-xs hover:underline">
                Créer une session
              </Link>
            </div>
          )}

          {/* Actions rapides */}
          <div className="bg-white rounded-xl border border-line-soft p-4">
            <p className="text-xs font-semibold text-ink mb-3">Actions rapides</p>
            <div className="space-y-2">
              {[
                { label: "Ajouter un participant", to: "/admin/participants", icon: <UserPlus size={13} /> },
                { label: "Publier un document", to: "/admin/documents", icon: <Upload size={13} /> },
                { label: "Créer une session", to: "/admin/sessions", icon: <Calendar size={13} /> },
                { label: "Modifier les contenus", to: "/admin/parametres", icon: <Settings size={13} /> },
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
            <p className="text-[11px] text-slate2 leading-relaxed">
              Les mots de passe provisoires générés à la création d'un compte sont affichés une
              seule fois — transmettez-les au participant par un canal sûr.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
