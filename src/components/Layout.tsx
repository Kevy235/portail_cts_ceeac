import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  BookOpen,
  Calendar,
  FileText,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  Settings,
  UserCircle,
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
}

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", icon: <LayoutDashboard size={16} />, labelKey: "nav.dashboard" },
  { to: "/admin/participants", icon: <Users size={16} />, labelKey: "nav.participants" },
  { to: "/admin/documents", icon: <FileText size={16} />, labelKey: "nav.documents" },
  { to: "/admin/sessions", icon: <Calendar size={16} />, labelKey: "nav.sessions" },
  { to: "/admin/parametres", icon: <Settings size={16} />, labelKey: "nav.settings" },
];

const PARTICIPANT_NAV: NavItem[] = [
  { to: "/espace", icon: <BookOpen size={16} />, labelKey: "nav.library" },
  { to: "/espace/sessions", icon: <MessagesSquare size={16} />, labelKey: "nav.psessions" },
  { to: "/espace/profil", icon: <UserCircle size={16} />, labelKey: "nav.profile" },
];

export function AppLayout({ variant }: { variant: "admin" | "participant" }) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const nav = variant === "admin" ? ADMIN_NAV : PARTICIPANT_NAV;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/connexion");
    } catch {
      toast.error(t("header.logoutFailed"));
    }
  };

  return (
    /* Un seul conteneur de défilement : le bandeau défile, le menu reste collé en haut. */
    <div className="h-screen overflow-y-auto bg-mist">
      {/* ─── Bandeau : utilitaires + logo centré (défile) ────────────── */}
      <header className="bg-gradient-to-b from-brand-deep to-brand-night relative overflow-hidden">
        {/* Halo décoratif derrière le logo */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-brand/25 blur-3xl pointer-events-none"
        />

        <div className="relative flex items-center justify-end gap-2 sm:gap-3 px-4 lg:px-6 pt-3">
          <FontSizeControl dark />
          <LangSelector dark />
          <div className="flex items-center gap-2 border-l border-white/20 pl-3 sm:pl-4">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md shadow-black/20">
              {initials(user?.name ?? "?")}
            </div>
            <div className="hidden sm:block">
              <p className="text-white text-xs font-medium leading-tight">{user?.name}</p>
              <p className="text-white/40 text-[10px] leading-tight">
                {variant === "admin"
                  ? t("header.admin")
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

        <div className="relative flex flex-col items-center text-center px-4 pb-5 pt-1">
          <img
            src={logoCeeac}
            alt="Logo CEEAC-ECCAS"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white object-contain shadow-lg shadow-black/25 ring-2 ring-white/30 mb-2.5 transition-transform duration-300 hover:scale-105"
          />
          <p className="text-white font-bold text-base sm:text-lg leading-tight font-title drop-shadow-sm">
            {settings.platform_name}
          </p>
          <p className="text-white/75 text-[10px] sm:text-[11px] uppercase tracking-widest leading-tight mt-1">
            {settings.platform_subtitle}
          </p>
        </div>
      </header>

      {/* ─── Menu horizontal (reste fixe au défilement) ──────────────── */}
      <nav
        className="sticky top-0 z-40 bg-brand-night/95 backdrop-blur-sm shadow-lg shadow-brand-night/20 border-t border-white/10"
        aria-label={variant === "admin" ? t("nav.section.admin") : t("nav.section.menu")}
      >
        <div className="max-w-[1440px] mx-auto flex items-stretch justify-start sm:justify-center gap-1 px-2 overflow-x-auto scrollbar-hide">
          {nav.map(({ to, icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin" || to === "/espace"}
              className={({ isActive }) =>
                clsx(
                  "group flex items-center gap-2 px-3 sm:px-4 py-3 text-sm whitespace-nowrap border-b-[3px] transition-all duration-200",
                  isActive
                    ? "border-accent-dark bg-accent text-white font-semibold shadow-inner"
                    : "border-transparent text-white/75 hover:text-white hover:bg-white/10 hover:border-accent/40"
                )
              }
            >
              <span className="opacity-80 transition-transform duration-200 group-hover:scale-110">
                {icon}
              </span>
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ─── Contenu (animé à chaque changement de page) ─────────────── */}
      <main className="px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
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
    </div>
  );
}
