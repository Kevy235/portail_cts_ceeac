import { Link } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  KeyRound,
  LifeBuoy,
  MessagesSquare,
  UserCircle,
  UserPlus,
  ZoomIn,
} from "lucide-react";
import type { ReactNode } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useI18n } from "@/i18n";
import type { Dict } from "@/i18n/fr";
import { FontSizeControl, LangSelector, PageHeader } from "@/components/ui";
import { GuideDownload } from "@/components/GuideDownload";
import logoCeeac from "@/assets/logo_ceeac.png";

/** Étape numérotée d'une procédure. */
function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="w-6 h-6 rounded-full bg-gradient-to-b from-brand to-brand-dark text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
        aria-hidden
      >
        {n}
      </span>
      <span className="text-sm text-ink leading-relaxed">{children}</span>
    </li>
  );
}

/** Section du guide : tuile d'icône colorée + titre + contenu. */
function Section({
  icon,
  tile,
  title,
  children,
}: {
  icon: ReactNode;
  tile: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-line-soft shadow-sm p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`w-9 h-9 rounded-xl ${tile} shadow-md flex items-center justify-center flex-shrink-0`}
          aria-hidden
        >
          {icon}
        </span>
        <h3 className="text-base font-bold text-ink font-title">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

const NOTE_CLASS =
  "text-xs text-slate2 bg-accent-soft/70 border border-accent/25 rounded-lg px-3 py-2.5";

/**
 * Contenu du guide utilisateur, réutilisé sur la page publique (/guide,
 * accessible depuis la connexion) et dans l'espace participant (/espace/guide).
 */
export function GuideContent() {
  const { t } = useI18n();
  const { settings } = useSettings();

  const steps = (keys: (keyof Dict)[]) => (
    <ol className="space-y-2.5">
      {keys.map((k, i) => (
        <Step key={k} n={i + 1}>
          {t(k)}
        </Step>
      ))}
    </ol>
  );

  return (
    <div className="space-y-5">
      <PageHeader title={t("guide.title")} subtitle={t("guide.subtitle")} />
      <p className="text-sm text-slate2 leading-relaxed max-w-3xl">{t("guide.intro")}</p>

      {/* Guide officiel téléchargeable (publié par l'administrateur) */}
      <GuideDownload />

      <Section
        icon={<KeyRound size={17} className="text-white" />}
        tile="bg-gradient-to-br from-accent to-accent-dark"
        title={t("guide.s1.title")}
      >
        <p className="text-sm text-slate2">{t("guide.s1.p")}</p>
        {steps(["guide.s1.1", "guide.s1.2", "guide.s1.3"])}
        <p className={NOTE_CLASS}>{t("guide.s1.note")}</p>
      </Section>

      <Section
        icon={<UserPlus size={17} className="text-white" />}
        tile="bg-gradient-to-br from-brand to-brand-deep"
        title={t("guide.s2.title")}
      >
        <p className="text-sm text-slate2">{t("guide.s2.p")}</p>
        {steps(["guide.s2.1", "guide.s2.2", "guide.s2.3"])}
        <p className={NOTE_CLASS}>{t("guide.s2.note")}</p>
      </Section>

      <Section
        icon={<BookOpen size={17} className="text-white" />}
        tile="bg-gradient-to-br from-violet-500 to-violet-700"
        title={t("guide.s3.title")}
      >
        <ul className="space-y-2.5 list-disc pl-5">
          {(["guide.s3.1", "guide.s3.2", "guide.s3.3"] as const).map((k) => (
            <li key={k} className="text-sm text-ink leading-relaxed">
              {t(k)}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        icon={<MessagesSquare size={17} className="text-white" />}
        tile="bg-gradient-to-br from-gold to-amber-600"
        title={t("guide.s4.title")}
      >
        <ul className="space-y-2.5 list-disc pl-5">
          {(["guide.s4.1", "guide.s4.2"] as const).map((k) => (
            <li key={k} className="text-sm text-ink leading-relaxed">
              {t(k)}
            </li>
          ))}
        </ul>
      </Section>

      <div className="grid sm:grid-cols-2 gap-5">
        <Section
          icon={<ZoomIn size={17} className="text-white" />}
          tile="bg-gradient-to-br from-brand to-brand-dark"
          title={t("guide.s5.title")}
        >
          <ul className="space-y-2.5 list-disc pl-5">
            {(["guide.s5.1", "guide.s5.2"] as const).map((k) => (
              <li key={k} className="text-sm text-ink leading-relaxed">
                {t(k)}
              </li>
            ))}
          </ul>
        </Section>

        <Section
          icon={<UserCircle size={17} className="text-white" />}
          tile="bg-gradient-to-br from-slate-500 to-slate-700"
          title={t("guide.s6.title")}
        >
          <p className="text-sm text-ink leading-relaxed">{t("guide.s6.1")}</p>
        </Section>
      </div>

      <section className="bg-gradient-to-br from-brand-deep to-brand-night rounded-xl shadow-md p-5 sm:p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <LifeBuoy size={18} className="text-accent" aria-hidden />
          <h3 className="text-base font-bold font-title">{t("guide.assistTitle")}</h3>
        </div>
        <p className="text-sm text-white/85">
          {t("guide.assist")}{" "}
          <a
            href={`mailto:${settings.contact_email}`}
            className="font-semibold text-accent hover:underline"
          >
            {settings.contact_email}
          </a>
        </p>
      </section>
    </div>
  );
}

/** Page publique du guide, accessible sans connexion depuis la page d'accueil. */
export function GuidePage() {
  const { t } = useI18n();
  const { settings } = useSettings();

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-b from-brand-deep to-brand-night">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <img
              src={logoCeeac}
              alt="Logo CEEAC-ECCAS"
              className="w-9 h-9 rounded-full bg-white object-contain shadow"
            />
            <p className="text-white text-sm font-bold font-title">{settings.platform_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <FontSizeControl dark />
            <LangSelector dark />
          </div>
        </div>
        <div className="h-[3px] bg-gradient-to-r from-brand via-accent to-brand" aria-hidden />
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Link
          to="/connexion"
          className="inline-flex items-center gap-1.5 text-sm text-brand font-medium hover:underline mb-5"
        >
          <ArrowLeft size={15} aria-hidden />
          {t("guide.backToLogin")}
        </Link>
        <GuideContent />
      </main>
    </div>
  );
}
