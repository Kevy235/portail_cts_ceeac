import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import {
  BookOpen,
  Calendar,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Settings,
  UserCircle,
  Users,
  X,
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
  { to: "/admin", icon: <LayoutDashboard size={17} />, labelKey: "nav.dashboard" },
  { to: "/admin/participants", icon: <Users size={17} />, labelKey: "nav.participants" },
  { to: "/admin/documents", icon: <FileText size={17} />, labelKey: "nav.documents" },
  { to: "/admin/sessions", icon: <Calendar size={17} />, labelKey: "nav.sessions" },
  { to: "/admin/parametres", icon: <Settings size={17} />, labelKey: "nav.settings" },
];

const PARTICIPANT_NAV: NavItem[] = [
  { to: "/espace", icon: <BookOpen size={17} />, labelKey: "nav.library" },
  { to: "/espace/sessions", icon: <MessagesSquare size={17} />, labelKey: "nav.psessions" },
  { to: "/espace/profil", icon: <UserCircle size={17} />, labelKey: "nav.profile" },
];

export function AppLayout({ variant }: { variant: "admin" | "participant" }) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="h-screen flex flex-col overflow-hidden bg-mist">
      {/* ─── En-tête ─────────────────────────────────────────────────── */}
      <header className="h-16 bg-brand-deep flex items-center justify-between px-4 lg:px-6 shadow-lg z-40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={t("header.openMenu")}
            className="lg:hidden text-white/70 hover:text-white transition-colors p-1"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <img
            src={logoCeeac}
            alt="Logo CEEAC-ECCAS"
            className="w-10 h-10 rounded-full bg-white object-contain shadow"
          />
          <div className="hidden sm:block">
            <p className="text-white font-semibold text-sm leading-tight font-title">
              {settings.platform_name}
            </p>
            <p className="text-white/50 text-[10px] uppercase tracking-widest leading-tight">
              {settings.platform_subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2">
            <FontSizeControl dark />
            <LangSelector dark />
          </div>
          <div className="flex items-center gap-2 border-l border-white/20 pl-3 sm:pl-4">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
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
      </header>

      {/* ─── Corps ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={clsx(
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            "lg:translate-x-0 fixed lg:static top-16 left-0 bottom-0 w-64 bg-brand-night flex flex-col z-30 transition-transform duration-200"
          )}
        >
          <div className="px-4 pt-6 pb-3">
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-medium px-2">
              {variant === "admin" ? t("nav.section.admin") : t("nav.section.menu")}
            </p>
          </div>
          <nav className="flex-1 px-3 space-y-0.5">
            {nav.map(({ to, icon, labelKey }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/admin" || to === "/espace"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all",
                    isActive
                      ? "bg-accent text-white font-medium"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )
                }
              >
                <span className="opacity-80">{icon}</span>
                <span className="flex-1 text-left">{t(labelKey)}</span>
              </NavLink>
            ))}
          </nav>
          <div className="px-3 pb-2 md:hidden flex items-center gap-2">
            <FontSizeControl dark />
            <LangSelector dark />
          </div>
          <div className="p-3 m-3 mt-0 rounded bg-white/5 border border-white/10">
            <p className="text-white/40 text-[11px] text-center">{settings.platform_subtitle}</p>
            <p className="text-accent text-[11px] text-center font-medium mt-0.5">
              {t("header.secureAccess")}
            </p>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 top-16 bg-black/30 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-10 lg:py-7 scrollbar-hide">
          <div
            className={clsx(
              "mx-auto w-full",
              variant === "admin" ? "max-w-[1440px]" : "max-w-5xl"
            )}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
