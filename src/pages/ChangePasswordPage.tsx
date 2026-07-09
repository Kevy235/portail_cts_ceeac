import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { FontSizeControl, inputClass, LangSelector, LoadingBlock, PrimaryButton } from "@/components/ui";
import logoCeeac from "@/assets/logo_ceeac.png";

export function ChangePasswordPage() {
  const { user, loading, refresh } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingBlock />;
  if (!user) return <Navigate to="/connexion" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (newPassword !== confirm) {
      toast.error(t("pwd.mismatch"));
      return;
    }
    setBusy(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      await refresh();
      toast.success(t("pwd.updated"));
      navigate(user.role === "admin" ? "/admin" : "/espace");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("pwd.updateFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-deep flex flex-col items-center justify-center p-6 gap-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center gap-4 mb-6">
          <img
            src={logoCeeac}
            alt="Logo CEEAC-ECCAS"
            className="w-14 h-14 rounded-full object-contain bg-white shadow"
          />
          <div>
            <h1 className="text-ink font-bold font-title">
              {user.mustChangePassword ? t("pwd.firstTitle") : t("pwd.changeTitle")}
            </h1>
            <p className="text-slate2 text-xs mt-0.5">
              {user.mustChangePassword ? t("pwd.firstSubtitle") : t("pwd.changeSubtitle")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="current" className="block text-xs font-medium text-ink mb-1.5">
              {user.mustChangePassword ? t("pwd.currentTemp") : t("pwd.current")}
            </label>
            <input
              id="current"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="new" className="block text-xs font-medium text-ink mb-1.5">
              {t("pwd.new")}
            </label>
            <input
              id="new"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-xs font-medium text-ink mb-1.5">
              {t("pwd.confirm")}
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="bg-accent-soft border border-accent/25 rounded-lg p-3 flex items-start gap-2">
            <ShieldCheck size={14} className="text-accent-dark flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate2">{t("pwd.secureNote")}</p>
          </div>

          <PrimaryButton type="submit" disabled={busy} className="w-full">
            <KeyRound size={15} />
            {busy ? t("common.saving") : t("pwd.submit")}
          </PrimaryButton>
        </form>
      </div>
      <div className="flex items-center gap-2">
        <FontSizeControl dark />
        <LangSelector dark />
      </div>
    </div>
  );
}
