import { useAuth } from "@/context/AuthContext";
import { formatDate, initials } from "@/lib/format";
import { useI18n } from "@/i18n";
import { CountryFlag } from "@/components/CountryFlag";
import { StatusBadge } from "@/components/ui";

/**
 * Profil du participant : uniquement les informations de son accréditation.
 * Le nom et la fonction sont affichés DANS la bannière (texte blanc) :
 * aucun chevauchement possible, lisibilité garantie à toutes les tailles.
 */
export function ParticipantProfile() {
  const { user } = useAuth();
  const { t } = useI18n();

  if (!user) return null;

  const infos: { label: string; value: React.ReactNode }[] = [
    { label: t("prof.email"), value: user.email },
    { label: t("prof.institution"), value: user.institution || "—" },
    {
      label: t("prof.country"),
      value: user.country ? (
        <span className="flex items-center gap-2">
          <CountryFlag country={user.country} />
          {user.country}
        </span>
      ) : (
        "—"
      ),
    },
    { label: t("prof.function"), value: user.functionTitle || "—" },
    { label: t("prof.accreditedOn"), value: formatDate(user.createdAt) },
    ...(user.originSessionTitle
      ? [{ label: t("prof.originSession"), value: user.originSessionTitle }]
      : []),
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-ink text-2xl font-bold font-title">{t("prof.title")}</h2>
        <p className="text-slate2 text-sm mt-0.5">{t("prof.subtitle")}</p>
      </div>

      <div className="bg-white rounded-xl border border-line-soft shadow-sm overflow-hidden">
        {/* ─── Bannière : avatar + identité, tout en blanc sur le dégradé ── */}
        <div className="relative overflow-hidden bg-gradient-to-r from-brand-deep via-brand-dark to-brand-night px-6 py-6">
          <div
            aria-hidden
            className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-accent/25 blur-2xl pointer-events-none"
          />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-dark ring-2 ring-white/40 flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0">
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-lg font-title leading-tight">
                {user.name}
              </h3>
              <p className="text-white/80 text-sm mt-1 flex items-center gap-1.5 flex-wrap">
                {user.functionTitle && <span>{user.functionTitle}</span>}
                {user.functionTitle && user.country && <span aria-hidden>·</span>}
                {user.country && (
                  <span className="flex items-center gap-1.5">
                    <CountryFlag country={user.country} />
                    {user.country}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div
            className="absolute bottom-0 inset-x-0 h-[3px] bg-gradient-to-r from-brand via-accent to-brand"
            aria-hidden
          />
        </div>

        {/* ─── Informations d'accréditation ────────────────────────────── */}
        <div className="px-6 py-6">
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
    </div>
  );
}
