import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { AlertCircle, ChevronRight, CircleHelp, Globe, KeyRound, Lock, Mail } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useI18n } from "@/i18n";
import { ApiError } from "@/lib/api";
import { FontSizeControl, inputClass, LangSelector, PasswordInput } from "@/components/ui";
import logoCeeac from "@/assets/logo_ceeac.png";

/**
 * Connexion à deux modes :
 *  - « J'ai un compte » : e-mail + mot de passe (participants inscrits, admin) ;
 *  - « Codes de session » : les représentants des États membres saisissent les
 *    accès transmis pour la session CTS et consultent directement les documents
 *    en invité — l'inscription (création de compte) est facultative.
 */
export function LoginPage() {
  const { user, loading, login, sessionLogin } = useAuth();
  const { settings } = useSettings();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"account" | "codes">("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [accessPassword, setAccessPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Un utilisateur déjà connecté est renvoyé vers son espace.
  if (!loading && user && !busy) {
    if (user.mustChangePassword) return <Navigate to="/premiere-connexion" replace />;
    return <Navigate to={user.role === "admin" ? "/admin" : "/espace"} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(email, password);
      if (user.mustChangePassword) navigate("/premiere-connexion");
      else navigate(user.role === "admin" ? "/admin" : "/espace");
    } catch (err) {
      if (err instanceof ApiError && err.code === "invalid_credentials") {
        setError(t("login.invalidCredentials"));
      } else if (err instanceof ApiError && err.code === "account_disabled") {
        setError(t("login.accountDisabled"));
      } else {
        setError(err instanceof Error ? err.message : t("login.failed"));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSessionAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await sessionLogin(accessCode.trim(), accessPassword.trim());
      navigate("/espace");
    } catch (err) {
      if (err instanceof ApiError && err.code === "invalid_session_access") {
        setError(t("register.invalidAccess"));
      } else if (err instanceof ApiError && err.code === "session_closed") {
        setError(t("register.sessionClosed"));
      } else {
        setError(err instanceof Error ? err.message : t("login.failed"));
      }
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m: "account" | "codes") => {
    setMode(m);
    setError("");
  };

  const [noAccountBefore, noAccountAfter] = t("login.noAccount", {
    email: "\u0000",
  }).split("\u0000");

  const errorBlock = error && (
    <div className="flex items-center gap-2 p-3 bg-danger-soft border border-danger/25 rounded-lg" role="alert">
      <AlertCircle size={14} className="text-danger flex-shrink-0" aria-hidden />
      <p className="text-danger text-xs">{error}</p>
    </div>
  );

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
      <div className="relative border-b border-white/10 px-4 sm:px-6 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <Globe size={14} className="text-white/40" aria-hidden />
            <span className="text-white/40 text-xs">
              ceeac-eccas.org · {settings.platform_subtitle}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <FontSizeControl dark />
            <LangSelector dark />
          </div>
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-4xl grid lg:grid-cols-5 gap-0 shadow-2xl shadow-black/40 rounded-2xl overflow-hidden ring-1 ring-white/15">
          {/* ─── Panneau institutionnel : centré, très compact sur mobile ── */}
          <div className="lg:col-span-2 bg-brand-night px-6 py-5 lg:p-8 flex flex-col items-center text-center justify-between gap-4 lg:gap-8">
            <div className="flex flex-col items-center">
              <img
                src={logoCeeac}
                alt="Logo CEEAC-ECCAS"
                className="w-14 h-14 lg:w-20 lg:h-20 rounded-full bg-white object-contain shadow-lg mb-2.5 lg:mb-6"
              />
              <h1 className="text-white text-sm lg:text-2xl font-bold leading-snug lg:mb-3 font-title">
                {settings.org_full_name}
              </h1>
              {/* Description et pied de page : masqués sur mobile pour que le
                  formulaire de connexion apparaisse sans défilement. */}
              <p className="hidden lg:block text-white/50 text-sm leading-relaxed">
                {settings.org_description}
              </p>
            </div>

            <div className="hidden lg:block border-t border-white/10 pt-4 w-full">
              <p className="text-white/25 text-[11px]">{settings.footer_text}</p>
            </div>
          </div>

          {/* ─── Formulaires ──────────────────────────────────────────────── */}
          <div className="lg:col-span-3 bg-white p-6 sm:p-8 lg:p-10">
            <div className="max-w-sm mx-auto">
              <h2 className="text-ink text-xl font-bold mb-1 font-title">{t("login.title")}</h2>
              <p className="text-slate2 text-sm mb-5">{settings.login_notice}</p>

              {/* Bascule compte / codes de session */}
              <div className="flex rounded-xl bg-mist p-1 mb-6" role="tablist">
                {(
                  [
                    { key: "account", label: t("login.tabAccount"), icon: <Mail size={13} aria-hidden /> },
                    { key: "codes", label: t("login.tabCodes"), icon: <KeyRound size={13} aria-hidden /> },
                  ] as const
                ).map(({ key, label, icon }) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={mode === key}
                    onClick={() => switchMode(key)}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                      mode === key
                        ? "bg-white text-brand-dark shadow-sm"
                        : "text-slate2 hover:text-ink"
                    )}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>

              {mode === "account" ? (
                <>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="email" className="block text-ink text-sm font-medium mb-1.5">
                        {t("login.email")}
                      </label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand/60" aria-hidden />
                        <input
                          id="email"
                          type="email"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                          }}
                          placeholder={t("login.emailPlaceholder")}
                          className={`${inputClass} pl-9`}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-ink text-sm font-medium mb-1.5">
                        {t("login.password")}
                      </label>
                      <PasswordInput
                        id="password"
                        withIcon
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="••••••••"
                      />
                    </div>

                    {errorBlock}

                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full bg-gradient-to-b from-brand to-brand-dark text-white py-3 rounded-lg font-semibold text-sm shadow-md shadow-brand/30 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {busy ? t("login.submitting") : t("login.submit")}
                      {!busy && <ChevronRight size={16} aria-hidden />}
                    </button>
                  </form>

                  <p className="text-center text-slate2/80 text-xs mt-6 pt-5 border-t border-line-soft">
                    {noAccountBefore}
                    <a href={`mailto:${settings.contact_email}`} className="text-brand hover:underline">
                      {settings.contact_email}
                    </a>
                    {noAccountAfter}
                  </p>
                </>
              ) : (
                <>
                  <form onSubmit={handleSessionAccess} className="space-y-5">
                    <p className="text-xs text-slate2 bg-brand-soft/60 border border-brand/15 rounded-lg px-3 py-2.5">
                      {t("login.codesHint")}
                    </p>

                    <div>
                      <label htmlFor="access-code" className="block text-ink text-sm font-medium mb-1.5">
                        {t("register.accessCode")}
                      </label>
                      <div className="relative">
                        <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand/60" aria-hidden />
                        <input
                          id="access-code"
                          required
                          value={accessCode}
                          onChange={(e) => {
                            setAccessCode(e.target.value.toUpperCase());
                            setError("");
                          }}
                          placeholder="CTS-XXXXXX"
                          autoComplete="off"
                          className={`${inputClass} pl-9 font-mono tracking-wide uppercase`}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="access-password" className="block text-ink text-sm font-medium mb-1.5">
                        {t("register.accessPassword")}
                      </label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand/60" aria-hidden />
                        <input
                          id="access-password"
                          required
                          value={accessPassword}
                          onChange={(e) => {
                            setAccessPassword(e.target.value.toUpperCase());
                            setError("");
                          }}
                          placeholder="XXXX-XXXX"
                          autoComplete="off"
                          className={`${inputClass} pl-9 font-mono tracking-wide uppercase`}
                        />
                      </div>
                    </div>

                    {errorBlock}

                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full bg-gradient-to-b from-accent to-accent-dark text-white py-3 rounded-lg font-semibold text-sm shadow-md shadow-accent/30 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {busy ? t("login.submitting") : t("login.codesSubmit")}
                      {!busy && <ChevronRight size={16} aria-hidden />}
                    </button>
                  </form>

                  {/* Inscription : facultative — uniquement pour participer aux échanges */}
                  <p className="text-center text-slate2/80 text-xs mt-6 pt-5 border-t border-line-soft">
                    {t("login.codesOptional")}{" "}
                    <Link to="/inscription" className="text-brand hover:underline font-medium">
                      {t("login.registerLink")}
                    </Link>
                  </p>
                </>
              )}

              {/* Aide : guide utilisateur accessible sans connexion */}
              <p className="text-center mt-5">
                <Link
                  to="/guide"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                >
                  <CircleHelp size={14} aria-hidden />
                  {t("login.guideLink")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
