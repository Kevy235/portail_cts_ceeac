import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { I18nProvider, useI18n } from "@/i18n";
import { AppLayout } from "@/components/Layout";
import { LoadingBlock } from "@/components/ui";
import { initFontSize } from "@/lib/fontsize";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ChangePasswordPage } from "@/pages/ChangePasswordPage";
import { AdminDashboard } from "@/pages/admin/Dashboard";
import { AdminParticipants } from "@/pages/admin/Participants";
import { AdminDocuments } from "@/pages/admin/Documents";
import { AdminSessions } from "@/pages/admin/Sessions";
import { AdminSettings } from "@/pages/admin/Settings";
import { ParticipantLibrary } from "@/pages/participant/Library";
import { ParticipantSessions } from "@/pages/participant/Sessions";
import { ParticipantProfile } from "@/pages/participant/Profile";
import "@/styles/index.css";

function Guard({
  roles,
  children,
}: {
  roles?: Array<"admin" | "participant" | "guest">;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  if (loading) return <LoadingBlock label={t("common.sessionCheck")} />;
  if (!user) return <Navigate to="/connexion" replace />;
  if (user.mustChangePassword) return <Navigate to="/premiere-connexion" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/espace"} replace />;
  }
  return <>{children}</>;
}

/** Sous-pages réservées aux comptes : les invités restent sur la bibliothèque. */
function AccountOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role === "guest") return <Navigate to="/espace" replace />;
  return <>{children}</>;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingBlock />;
  if (!user) return <Navigate to="/connexion" replace />;
  if (user.mustChangePassword) return <Navigate to="/premiere-connexion" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/espace"} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<RegisterPage />} />
        <Route path="/premiere-connexion" element={<ChangePasswordPage />} />

        <Route
          path="/admin"
          element={
            <Guard roles={["admin"]}>
              <AppLayout variant="admin" />
            </Guard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="participants" element={<AdminParticipants />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="sessions" element={<AdminSessions />} />
          <Route path="parametres" element={<AdminSettings />} />
        </Route>

        <Route
          path="/espace"
          element={
            <Guard roles={["participant", "guest"]}>
              <AppLayout variant="participant" />
            </Guard>
          }
        >
          <Route index element={<ParticipantLibrary />} />
          <Route
            path="sessions"
            element={
              <AccountOnly>
                <ParticipantSessions />
              </AccountOnly>
            }
          />
          <Route
            path="profil"
            element={
              <AccountOnly>
                <ParticipantProfile />
              </AccountOnly>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Applique la taille de texte choisie avant le premier rendu.
initFontSize();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <SettingsProvider>
        <AuthProvider>
          <App />
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </SettingsProvider>
    </I18nProvider>
  </StrictMode>
);
