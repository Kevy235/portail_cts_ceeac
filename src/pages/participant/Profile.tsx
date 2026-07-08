import { useState } from "react";
import { KeyRound, Shield } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { COUNTRY_FLAGS } from "@/lib/types";
import { formatDate, initials } from "@/lib/format";
import {
  Field,
  inputClass,
  PrimaryButton,
  StatusBadge,
} from "@/components/ui";

export function ParticipantProfile() {
  const { user } = useAuth();
  const { settings } = useSettings();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error("Les deux mots de passe ne correspondent pas");
      return;
    }
    setBusy(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      toast.success("Mot de passe mis à jour");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la mise à jour");
    } finally {
      setBusy(false);
    }
  };

  const infos = [
    { label: "Adresse e-mail", value: user.email },
    { label: "Institution", value: user.institution || "—" },
    { label: "Pays représenté", value: user.country || "—" },
    { label: "Fonction", value: user.functionTitle || "—" },
    { label: "Date d'accréditation", value: formatDate(user.createdAt) },
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-ink text-xl font-bold font-title">Mon profil</h2>
        <p className="text-slate2 text-sm mt-0.5">Informations de votre accréditation CTS-APPS</p>
      </div>

      <div className="bg-white rounded-xl border border-line-soft overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-deep to-brand-night" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-8 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-accent border-4 border-white flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {initials(user.name)}
            </div>
            <div className="pb-1">
              <h3 className="font-bold text-ink text-lg font-title">{user.name}</h3>
              <p className="text-slate2/80 text-sm">
                {user.functionTitle}
                {user.country && (
                  <>
                    {" · "}
                    {COUNTRY_FLAGS[user.country] ?? ""} {user.country}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {infos.map(({ label, value }) => (
              <div key={label} className="bg-mist rounded-lg px-4 py-3">
                <p className="text-slate2/70 text-[11px] uppercase tracking-wide mb-1">{label}</p>
                <p className="text-ink text-sm font-medium break-words">{value}</p>
              </div>
            ))}
            <div className="bg-mist rounded-lg px-4 py-3">
              <p className="text-slate2/70 text-[11px] uppercase tracking-wide mb-1">
                Statut d'accréditation
              </p>
              <StatusBadge status={user.status} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Changement de mot de passe ────────────────────────────── */}
      <div className="bg-white rounded-xl border border-line-soft p-6">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={15} className="text-brand" />
          <h3 className="text-sm font-semibold text-ink">Changer mon mot de passe</h3>
        </div>
        <form onSubmit={handleChangePassword} className="grid sm:grid-cols-3 gap-4">
          <Field label="Mot de passe actuel" required>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Nouveau mot de passe" required>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Confirmation" required>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-3">
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? "Enregistrement…" : "Mettre à jour"}
            </PrimaryButton>
          </div>
        </form>
      </div>

      <div className="bg-accent-soft border border-accent/25 rounded-xl p-4 flex items-start gap-3">
        <Shield size={16} className="text-accent-dark flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-ink text-sm font-medium">Accréditation CTS-APPS</p>
          <p className="text-slate2 text-xs mt-0.5">
            Votre accès à cette plateforme a été accordé par le Secrétariat du DAPPS-CEEAC. Pour
            toute modification de vos informations, veuillez contacter{" "}
            <a href={`mailto:${settings.contact_email}`} className="text-brand hover:underline">
              {settings.contact_email}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
