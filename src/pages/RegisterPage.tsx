import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { AlertCircle, ChevronRight, Globe, KeyRound, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useI18n } from "@/i18n";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { COUNTRIES } from "@/lib/types";
import { Field, FontSizeControl, inputClass, LangSelector } from "@/components/ui";
import { CountryFlag } from "@/components/CountryFlag";
import logoCeeac from "@/assets/logo_ceeac.png";

/**
 * Auto-inscription des participants : les États membres reçoivent l'identifiant
 * et le mot de passe d'accès générés pour chaque session CTS ; chaque expert
 * crée ensuite son compte lui-même avec ses propres informations.
 */
export function RegisterPage() {
  const { user, loading, setUser } = useAuth();
  const { settings } = useSettings();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    accessCode: "",
    accessPassword: "",
    name: "",
    email: "",
    country: "",
    functionTitle: "",
    institution: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Un titulaire de compte n'a rien à faire ici ; un invité (accès par codes
  // de session) peut en revanche créer son compte participant.
  if (!loading && user && user.role !== "guest") {
    return <Navigate to={user.role === "admin" ? "/admin" : "/espace"} replace />;
  }

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (form.password !== form.confirm) {
      setError(t("register.mismatch"));
      return;
    }
    setBusy(true);
    try {
      const { user } = await api.post<{ user: User }>("/auth/register", {
        accessCode: form.accessCode.trim(),
        accessPassword: form.accessPassword.trim(),
        name: form.name,
        email: form.email,
        country: form.country,
        functionTitle: form.functionTitle,
        institution: form.institution,
        password: form.password,
      });
      setUser(user);
      navigate("/espace");
    } catch (err) {
      if (err instanceof ApiError && err.code === "invalid_session_access") {
        setError(t("register.invalidAccess"));
      } else if (err instanceof ApiError && err.code === "session_closed") {
        setError(t("register.sessionClosed"));
      } else if (err instanceof ApiError && err.code === "email_taken") {
        setError(t("register.emailTaken"));
      } else {
        setError(err instanceof Error ? err.message : t("common.error"));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-brand-deep via-brand-deep to-brand-night flex flex-col overflow-hidden">
      {/* Halos décoratifs institutionnels */}
      <div
        aria-hidden
        className="absolute -left-32 top-1/4 w-[480px] h-[480px] rounded-full bg-brand/25 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -right-24 -bottom-24 w-[420px] h-[420px] rounded-full bg-accent/15 blur-3xl pointer-events-none"
      />
      <div className="relative border-b border-white/10 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-white/40" aria-hidden />
            <span className="text-white/40 text-xs">
              ceeac-eccas.org · {settings.platform_subtitle}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FontSizeControl dark />
            <LangSelector dark />
          </div>
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white shadow-2xl shadow-black/40 rounded-2xl overflow-hidden ring-1 ring-white/15">
          <div className="relative overflow-hidden bg-gradient-to-r from-brand-night to-brand-deep px-8 py-6 flex items-center gap-4">
            <div
              aria-hidden
              className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-accent/20 blur-2xl pointer-events-none"
            />
            <img
              src={logoCeeac}
              alt="Logo CEEAC-ECCAS"
              className="w-14 h-14 rounded-full bg-white object-contain shadow-lg"
            />
            <div>
              <h1 className="text-white text-xl font-bold font-title">
                {t("register.title")}
              </h1>
              <p className="text-white/60 text-sm mt-0.5">{t("register.subtitle")}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* ─── Accès de session (fournis par l'État membre) ─────────── */}
            <fieldset className="space-y-4">
              <legend className="flex items-center gap-2 text-brand-dark font-semibold text-sm mb-1">
                <KeyRound size={15} aria-hidden />
                {t("register.accessSection")}
              </legend>
              <p className="text-sm text-slate2/90 -mt-1">{t("register.accessHint")}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t("register.accessCode")} required>
                  <input
                    required
                    value={form.accessCode}
                    onChange={(e) => set("accessCode")(e.target.value.toUpperCase())}
                    placeholder="CTS-XXXXXX"
                    autoComplete="off"
                    className={`${inputClass} font-mono tracking-wide uppercase`}
                  />
                </Field>
                <Field label={t("register.accessPassword")} required>
                  <input
                    required
                    value={form.accessPassword}
                    onChange={(e) => set("accessPassword")(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX"
                    autoComplete="off"
                    className={`${inputClass} font-mono tracking-wide uppercase`}
                  />
                </Field>
              </div>
            </fieldset>

            {/* ─── Informations personnelles ────────────────────────────── */}
            <fieldset className="space-y-4">
              <legend className="flex items-center gap-2 text-brand-dark font-semibold text-sm mb-1">
                <UserPlus size={15} aria-hidden />
                {t("register.personalSection")}
              </legend>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t("part.fullName")} required>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => set("name")(e.target.value)}
                    placeholder={t("part.fullNamePh")}
                    autoComplete="name"
                    className={inputClass}
                  />
                </Field>
                <Field label={t("part.email")} required>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email")(e.target.value)}
                    placeholder={t("part.emailPh")}
                    autoComplete="email"
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t("part.country")} required>
                  <div className="relative">
                    {form.country && (
                      <CountryFlag
                        country={form.country}
                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      />
                    )}
                    <select
                      required
                      value={form.country}
                      onChange={(e) => set("country")(e.target.value)}
                      className={`${inputClass} ${form.country ? "pl-9" : ""}`}
                    >
                      <option value="">{t("common.select")}</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>
                <Field label={t("part.function")} hint={t("common.optional")}>
                  <input
                    value={form.functionTitle}
                    onChange={(e) => set("functionTitle")(e.target.value)}
                    placeholder={t("part.functionPh")}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label={t("part.institution")}>
                <input
                  value={form.institution}
                  onChange={(e) => set("institution")(e.target.value)}
                  placeholder={t("part.institutionPh")}
                  className={inputClass}
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label={t("register.password")} required>
                  <input
                    required
                    type="password"
                    minLength={8}
                    value={form.password}
                    onChange={(e) => set("password")(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </Field>
                <Field label={t("register.confirmPassword")} required>
                  <input
                    required
                    type="password"
                    minLength={8}
                    value={form.confirm}
                    onChange={(e) => set("confirm")(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </Field>
              </div>
              <p className="text-xs text-slate2/80">{t("register.passwordHint")}</p>
            </fieldset>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-danger-soft border border-danger/25 rounded-lg" role="alert">
                <AlertCircle size={14} className="text-danger flex-shrink-0" aria-hidden />
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-gradient-to-b from-brand to-brand-dark text-white py-3 rounded-lg font-semibold text-sm shadow-md shadow-brand/30 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? t("register.submitting") : t("register.submit")}
              {!busy && <ChevronRight size={16} aria-hidden />}
            </button>

            <p className="text-center text-slate2/80 text-sm">
              {t("register.haveAccount")}{" "}
              <Link to="/connexion" className="text-brand hover:underline font-medium">
                {t("register.loginLink")}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
