import { useEffect, useState } from "react";
import { KeyRound, Languages, Shield } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { COUNTRY_FLAGS, type User } from "@/lib/types";
import { formatDate, initials } from "@/lib/format";
import { LANGS, LANG_LABELS, useI18n, type Lang } from "@/i18n";
import { Field, inputClass, PrimaryButton, StatusBadge } from "@/components/ui";

export function ParticipantProfile() {
  const { user, setUser } = useAuth();
  const { settings } = useSettings();
  const { t, setLang } = useI18n();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const [uiLang, setUiLang] = useState<Lang>(user?.uiLang ?? "fr");
  const [docLangs, setDocLangs] = useState<Lang[]>(user?.docLangs ?? [...LANGS]);
  const [prefsBusy, setPrefsBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setUiLang(user.uiLang);
      setDocLangs(user.docLangs);
    }
  }, [user]);

  if (!user) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (newPassword !== confirm) {
      toast.error(t("pwd.mismatch"));
      return;
    }
    setBusy(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      toast.success(t("pwd.updated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("pwd.updateFailed"));
    } finally {
      setBusy(false);
    }
  };

  const toggleDocLang = (lang: Lang) => {
    setDocLangs((prev) =>
      prev.includes(lang)
        ? prev.length > 1
          ? prev.filter((l) => l !== lang)
          : prev
        : [...prev, lang]
    );
  };

  const handleSavePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prefsBusy) return;
    setPrefsBusy(true);
    try {
      const { user: updated } = await api.put<{ user: User }>("/auth/preferences", {
        uiLang,
        docLangs,
      });
      setUser(updated);
      setLang(uiLang);
      toast.success(t("prof.prefsSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("prof.prefsFailed"));
    } finally {
      setPrefsBusy(false);
    }
  };

  const infos = [
    { label: t("prof.email"), value: user.email },
    { label: t("prof.institution"), value: user.institution || "—" },
    { label: t("prof.country"), value: user.country || "—" },
    { label: t("prof.function"), value: user.functionTitle || "—" },
    { label: t("prof.accreditedOn"), value: formatDate(user.createdAt) },
    ...(user.originSessionTitle
      ? [{ label: t("prof.originSession"), value: user.originSessionTitle }]
      : []),
  ];

  const [accredBefore, accredAfter] = t("prof.accredText", { email: "\u0000" }).split("\u0000");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-ink text-2xl font-bold font-title">{t("prof.title")}</h2>
        <p className="text-slate2 text-sm mt-0.5">{t("prof.subtitle")}</p>
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {infos.map(({ label, value }) => (
              <div key={label} className="bg-mist rounded-lg px-4 py-3">
                <p className="text-slate2/70 text-[11px] uppercase tracking-wide mb-1">{label}</p>
                <p className="text-ink text-sm font-medium break-words">{value}</p>
              </div>
            ))}
            <div className="bg-mist rounded-lg px-4 py-3">
              <p className="text-slate2/70 text-[11px] uppercase tracking-wide mb-1">
                {t("prof.status")}
              </p>
              <StatusBadge status={user.status} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Préférences de langue ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-line-soft p-6">
        <div className="flex items-center gap-2 mb-4">
          <Languages size={15} className="text-brand" />
          <h3 className="text-sm font-semibold text-ink">{t("prof.prefs")}</h3>
        </div>
        <form onSubmit={handleSavePrefs} className="space-y-4">
          <Field label={t("prof.uiLang")}>
            <select
              value={uiLang}
              onChange={(e) => setUiLang(e.target.value as Lang)}
              className={`${inputClass} max-w-xs`}
            >
              {LANGS.map((l) => (
                <option key={l} value={l}>
                  {LANG_LABELS[l]}
                </option>
              ))}
            </select>
          </Field>
          <div>
            <p className="block text-xs font-medium text-ink mb-1.5">{t("prof.docLangs")}</p>
            <p className="text-[11px] text-slate2/70 mb-2">{t("prof.docLangsNote")}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {LANGS.map((l) => {
                const active = docLangs.includes(l);
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => toggleDocLang(l)}
                    className={clsx(
                      "px-3 py-2 rounded-lg text-xs font-medium border transition-colors",
                      active
                        ? "bg-brand text-white border-brand"
                        : "bg-white border-line text-slate2 hover:bg-mist"
                    )}
                  >
                    <span className="uppercase font-bold mr-1.5">{l}</span>
                    {LANG_LABELS[l]}
                  </button>
                );
              })}
            </div>
          </div>
          <PrimaryButton type="submit" disabled={prefsBusy}>
            {prefsBusy ? t("common.saving") : t("common.save")}
          </PrimaryButton>
        </form>
      </div>

      {/* ─── Changement de mot de passe ────────────────────────────── */}
      <div className="bg-white rounded-xl border border-line-soft p-6">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={15} className="text-brand" />
          <h3 className="text-sm font-semibold text-ink">{t("prof.changePwd")}</h3>
        </div>
        <form onSubmit={handleChangePassword} className="grid sm:grid-cols-3 gap-4">
          <Field label={t("pwd.current")} required>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t("pwd.new")} required>
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
          <Field label={t("pwd.confirm")} required>
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
              {busy ? t("common.saving") : t("prof.update")}
            </PrimaryButton>
          </div>
        </form>
      </div>

      <div className="bg-accent-soft border border-accent/25 rounded-xl p-4 flex items-start gap-3">
        <Shield size={16} className="text-accent-dark flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-ink text-sm font-medium">{t("prof.accredTitle")}</p>
          <p className="text-slate2 text-xs mt-0.5">
            {accredBefore}
            <a href={`mailto:${settings.contact_email}`} className="text-brand hover:underline">
              {settings.contact_email}
            </a>
            {accredAfter}
          </p>
        </div>
      </div>
    </div>
  );
}
