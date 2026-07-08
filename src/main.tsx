import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { AppLayout } from "@/components/Layout";
import { LoadingBlock } from "@/components/ui";
import { LoginPage } from "@/pages/LoginPage";
import { ChangePasswordPage } from "@/pages/ChangePasswordPage";
import { AdminDashboard } from "@/pages/admin/Dashboard";
import { AdminParticipants } from "@/pages/admin/Participants";
import { AdminDocuments } from "@/pages/admin/Documents";
import { AdminSessions } from "@/pages/admin/Sessions";
import { AdminSettings } from "@/pages/admin/Settings";
import { ParticipantLibrary } from "@/pages/participant/Library";
import { ParticipantProfile } from "@/pages/participant/Profile";
import "@/styles/index.css";

function Guard({
  role,
  children,
}: {
  role?: "admin" | "participant";
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingBlock label="Vérification de la session…" />;
  if (!user) return <Navigate to="/connexion" replace />;
  if (user.mustChangePassword) return <Navigate to="/premiere-connexion" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/espace"} replace />;
  }
  return <>{children}</>;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingBlock label="Chargement…" />;
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
        <Route path="/premiere-connexion" element={<ChangePasswordPage />} />

        <Route
          path="/admin"
          element={
            <Guard role="admin">
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
            <Guard role="participant">
              <AppLayout variant="participant" />
            </Guard>
          }
        >
          <Route index element={<ParticipantLibrary />} />
          <Route path="profil" element={<ParticipantProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SettingsProvider>
      <AuthProvider>
        <App />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </SettingsProvider>
  </StrictMode>
);
