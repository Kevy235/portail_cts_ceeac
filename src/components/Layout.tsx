import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  BookOpen,
  Calendar,
  FileText,
  Info,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  Settings,
  UserCircle,
  UserPlus,
  Users,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useI18n } from "@/i18n";
import type { Dict } from "@/i18n/fr";
import { initials } from "@/lib/format";
import { FontSizeControl, LangSelector } from "@/components/ui";
import logoCeeac from "@/assets/logo_ceeac.png";

interface NavItem {
  to: string;
  icon: React.ReactNode;
  labelKey: keyof Dict;
  /** Clé de contenu éditable (Contenus du portail) qui remplace le libellé si renseignée. */
  settingsKey?: string;
}

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", icon: <LayoutDashboard size={16} />, labelKey: "nav.dashboard" },
  { to: "/admin/participants", icon: <Users size={16} />, labelKey: "nav.participants" },
  { to: "/admin/documents", icon: <FileText size={16} />, labelKey: "nav.documents" },
  { to: "/admin/sessions", icon: <Calendar size={16} />, labelKey: "nav.sessions" },
  { to: "/admin/parametres", icon: <Settings size={16} />, labelKey: "nav.settings" },
];

const PARTICIPANT_NAV: NavItem[] = [
  { to: "/espace", icon: <BookOpen size={16} />, labelKey: "nav.library", settingsKey: "nav_library" },
  { to: "/espace/sessions", icon: <MessagesSquare size={16} />, labelKey: "nav.psessions", settingsKey: "nav_psessions" },
  { to: "/espace/profil", icon: <UserCircle size={16} />, labelKey: "nav.profile", settingsKey: "nav_profile" },
];

export function AppLayout({ variant }: { variant: "admin" | "participant" }) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  // Invité (accès par codes de session) : bibliothèque uniquement.
  const isGuest = user?.role === "guest";
  const nav =
    variant === "admin"
      ? ADMIN_NAV
      : isGuest
        ? PARTICIPANT_NAV.filter((item) => item.to === "/espace")
        : PARTICIPANT_NAV;

  // Retour en haut de page à chaque changement de route.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/connexion");
    } catch {
      toast.error(t("header.logoutFailed"));
    }
  };

  return (
    /* Défilement au niveau de la page : le bandeau défile, le menu reste collé
       en haut, et le verrou de défilement des modales (overflow sur body) agit. */
    <div className="min-h-screen flex flex-col">
      {/* ─── Bandeau : utilitaires + logo centré (défile) ────────────── */}
      <header className="bg-gradient-to-b from-brand-deep to-brand-night relative overflow-hidden">
        {/* Halos décoratifs : bleu derrière le logo, vert en périphérie */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] rounded-full bg-brand/30 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -right-24 -top-24 w-[320px] h-[320px] rounded-full bg-accent/15 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 flex items-center justify-end gap-2 sm:gap-3 px-4 lg:px-6 pt-2">
          <FontSizeControl dark />
          <LangSelector dark />
          <div className="flex items-center gap-2 border-l border-white/20 pl-3 sm:pl-4">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md shadow-black/20">
              {initials(user?.name || t("guest.name"))}
            </div>
            <div className="hidden sm:block">
              <p className="text-white text-xs font-medium leading-tight">
                {user?.name || t("guest.name")}
              </p>
              <p className="text-white/75 text-[10px] leading-tight">
                {variant === "admin"
                  ? t("header.admin")
                  : isGuest
                    ? user?.originSessionTitle
                    : [user?.functionTitle, user?.country].filter(Boolean).join(" — ")}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/60 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded"
            title={t("header.logout")}
            aria-label={t("header.logout")}
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Bandeau compact : logo et textes alignés sur une même ligne,
            groupe centré avec une respiration en haut et en bas. */}
        <div className="relative flex items-center justify-center gap-3 sm:gap-4 px-4 pt-2 pb-4 sm:-mt-4">
          <img
            src={logoCeeac}
            alt="Logo CEEAC-ECCAS"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white object-contain shadow-lg shadow-black/25 ring-2 ring-white/30 transition-transform duration-300 hover:scale-105"
          />
          <div className="text-left">
            <p className="text-white font-bold text-sm sm:text-lg leading-tight font-title drop-shadow-sm">
              {settings.platform_name}
            </p>
            <p className="text-white/75 text-[9px] sm:text-[11px] uppercase tracking-widest leading-tight mt-0.5">
              {settings.platform_subtitle}
            </p>
          </div>
        </div>

        {/* Liseré identitaire bleu → vert sous le bandeau */}
        <div className="relative h-[3px] bg-gradient-to-r from-brand via-accent to-brand" aria-hidden />
      </header>

      {/* ─── Menu horizontal (reste fixe au défilement) ──────────────── */}
      <nav
        className="sticky top-0 z-40 bg-brand-night/95 backdrop-blur-sm shadow-lg shadow-brand-night/20 border-t border-white/10"
        aria-label={variant === "admin" ? t("nav.section.admin") : t("nav.section.menu")}
      >
        <div className="max-w-[1440px] mx-auto flex items-stretch justify-start sm:justify-center gap-1 px-2 overflow-x-auto scrollbar-hide">
          {nav.map(({ to, icon, labelKey, settingsKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin" || to === "/espace"}
              className={({ isActive }) =>
                clsx(
                  "group flex items-center gap-2 px-3 sm:px-4 py-3 text-sm whitespace-nowrap border-b-[3px] transition-all duration-200",
                  isActive
                    ? "border-white bg-gradient-to-b from-accent to-accent-dark text-white font-semibold shadow-inner"
                    : "border-transparent text-white/75 hover:text-white hover:bg-white/10 hover:border-accent/50"
                )
              }
            >
              <span className="opacity-80 transition-transform duration-200 group-hover:scale-110">
                {icon}
              </span>
              <span>{(settingsKey && settings[settingsKey]) || t(labelKey)}</span>
            </NavLink>
          ))}
          {/* Invité : l'inscription reste proposée (facultative) */}
          {isGuest && (
            <Link
              to="/inscription"
              className="group flex items-center gap-2 px-3 sm:px-4 py-3 text-sm whitespace-nowrap border-b-[3px] border-transparent text-accent hover:text-white hover:bg-accent/20 hover:border-accent/50 transition-all duration-200"
            >
              <UserPlus size={16} aria-hidden />
              <span>{t("guest.register")}</span>
            </Link>
          )}
        </div>
      </nav>

      {/* ─── Bandeau invité : consultation sans compte ────────────────── */}
      {isGuest && (
        <div className="bg-accent-soft border-b border-accent/25">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-2.5 flex items-center gap-2.5 flex-wrap">
            <Info size={14} className="text-accent-dark flex-shrink-0" aria-hidden />
            <p className="text-xs text-ink">
              {t("guest.banner", { title: user?.originSessionTitle ?? "" })}{" "}
              <Link to="/inscription" className="text-accent-dark font-semibold hover:underline">
                {t("guest.register")}
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* ─── Contenu (animé à chaque changement de page) ─────────────── */}
      <main className="flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
        <div
          key={location.pathname}
          className={clsx(
            "mx-auto w-full animate-fade-up",
            variant === "admin" ? "max-w-[1440px]" : "max-w-5xl"
          )}
        >
          <Outlet />
        </div>
      </main>

      {/* ─── Pied de page institutionnel ─────────────────────────────── */}
      <footer className="mt-auto border-t border-line-soft bg-white/70 backdrop-blur-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-slate2/80">{settings.footer_text}</p>
          <p className="text-[11px] text-slate2/60 uppercase tracking-wider">
            {settings.platform_subtitle}
          </p>
        </div>
      </footer>
    </div>
  );
}
