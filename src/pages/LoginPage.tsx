import { useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  ChevronRight,
  FileCheck,
  Globe,
  Lock,
  Mail,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { inputClass } from "@/components/ui";
import logoCeeac from "@/assets/logo_ceeac.png";

export function LoginPage() {
  const { login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(email, password);
      if (user.mustChangePassword) navigate("/premiere-connexion");
      else navigate(user.role === "admin" ? "/admin" : "/espace");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-deep flex flex-col">
      <div className="border-b border-white/10 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-white/40" />
            <span className="text-white/40 text-xs">
              ceeac-eccas.org · {settings.platform_subtitle}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl grid lg:grid-cols-5 gap-0 shadow-2xl rounded-xl overflow-hidden">
          {/* Panneau institutionnel */}
          <div className="lg:col-span-2 bg-brand-night p-8 flex flex-col justify-between gap-8">
            <div>
              <img
                src={logoCeeac}
                alt="Logo CEEAC-ECCAS"
                className="w-20 h-20 rounded-full bg-white object-contain shadow-lg mb-6"
              />
              <h1 className="text-white text-2xl font-bold leading-snug mb-3 font-title">
                {settings.org_full_name}
              </h1>
              <p className="text-white/50 text-sm leading-relaxed">
                {settings.org_description}
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: <Lock size={14} />, text: "Accès sécurisé par invitation" },
                { icon: <FileCheck size={14} />, text: "Documents officiels CEEAC" },
                { icon: <Globe size={14} />, text: "11 États membres de la CEEAC" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">
                    {icon}
                  </div>
                  <span className="text-white/50 text-xs">{text}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-white/25 text-[11px]">{settings.footer_text}</p>
            </div>
          </div>

          {/* Formulaire */}
          <div className="lg:col-span-3 bg-white p-8 lg:p-10">
            <div className="max-w-sm mx-auto">
              <h2 className="text-ink text-xl font-bold mb-1 font-title">
                Connexion à la plateforme
              </h2>
              <p className="text-slate2 text-sm mb-8">{settings.login_notice}</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-ink text-sm font-medium mb-1.5">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate2/50" />
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
                      placeholder="votre.nom@institution.pays"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-ink text-sm font-medium mb-1.5">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate2/50" />
                    <input
                      id="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="••••••••"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-danger-soft border border-danger/25 rounded-lg">
                    <AlertCircle size={14} className="text-danger flex-shrink-0" />
                    <p className="text-danger text-xs">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-brand text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {busy ? "Connexion…" : "Se connecter"}
                  {!busy && <ChevronRight size={16} />}
                </button>
              </form>

              <p className="text-center text-slate2/70 text-xs mt-8">
                Vous n'avez pas de compte ? Contactez le Secrétariat DAPPS (
                <a href={`mailto:${settings.contact_email}`} className="text-brand hover:underline">
                  {settings.contact_email}
                </a>
                ) pour une accréditation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
