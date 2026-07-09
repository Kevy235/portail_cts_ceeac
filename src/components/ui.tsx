import { clsx } from "clsx";
import { AlertTriangle, Check, Copy, Eye, EyeOff, Lock, RefreshCw, X, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { LANGS, LANG_LABELS, useI18n, type Lang } from "@/i18n";
import type { Dict } from "@/i18n/fr";
import { applyFontSize, getFontSize, type FontSize } from "@/lib/fontsize";

// ─── Badges de statut ──────────────────────────────────────────────────────────
const BADGE_STYLES: Record<string, { chip: string; dot: string }> = {
  actif: { chip: "bg-accent-soft text-accent-dark border-accent/35", dot: "bg-accent" },
  "en-attente": { chip: "bg-amber-50 text-amber-700 border-amber-300", dot: "bg-amber-500" },
  inactif: { chip: "bg-slate-100 text-slate-600 border-slate-300", dot: "bg-slate-400" },
  publié: { chip: "bg-brand-soft text-brand-dark border-brand/35", dot: "bg-brand" },
  brouillon: { chip: "bg-orange-50 text-orange-700 border-orange-300", dot: "bg-orange-500" },
  "à-venir": { chip: "bg-violet-50 text-violet-700 border-violet-300", dot: "bg-violet-500" },
  "en-cours": { chip: "bg-accent-soft text-accent-dark border-accent/35", dot: "bg-accent" },
  terminé: { chip: "bg-slate-100 text-slate-600 border-slate-300", dot: "bg-slate-400" },
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const label = t(`status.${status}` as keyof Dict);
  const style = BADGE_STYLES[status] ?? {
    chip: "bg-gray-100 text-gray-600 border-gray-300",
    dot: "bg-gray-400",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap",
        style.chip
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", style.dot)} aria-hidden />
      {label}
    </span>
  );
}

// ─── Badge « document codé » ───────────────────────────────────────────────────
export function CodedBadge({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <span
      title={t("doc.codedHint")}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap bg-danger-soft text-danger border-danger/25"
    >
      <Lock size={11} aria-hidden />
      {compact ? t("doc.codedShort") : t("doc.coded")}
    </span>
  );
}

// ─── Pastille de langue (drapeau + code) ───────────────────────────────────────
export function LangChip({ lang, muted }: { lang: Lang; muted?: boolean }) {
  return (
    <span
      title={LANG_LABELS[lang]}
      className={clsx(
        "inline-flex items-center gap-1 px-1.5 h-5 rounded text-[10px] font-bold uppercase border whitespace-nowrap",
        muted
          ? "bg-slate-50 text-slate-400 border-slate-200"
          : "bg-brand-soft text-brand-dark border-brand/25"
      )}
    >
      <FlagIcon
        lang={lang}
        className={clsx("w-[14px] h-[9px]", muted && "opacity-40 grayscale")}
      />
      {lang}
    </span>
  );
}

// ─── Drapeaux SVG ──────────────────────────────────────────────────────────────
// Les emojis drapeaux (🇫🇷…) ne s'affichent pas sous Windows : on dessine de
// vrais drapeaux SVG, nets à toutes les tailles.
const FLAG_SHAPES: Record<Lang, ReactNode> = {
  fr: (
    <>
      <rect width="20" height="40" fill="#0055A4" />
      <rect x="20" width="20" height="40" fill="#fff" />
      <rect x="40" width="20" height="40" fill="#EF4135" />
    </>
  ),
  en: (
    <>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0,0 60,40 M60,0 0,40" stroke="#fff" strokeWidth="8" />
      <path d="M0,0 60,40 M60,0 0,40" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="14" />
      <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="8" />
    </>
  ),
  pt: (
    <>
      <rect width="24" height="40" fill="#046A38" />
      <rect x="24" width="36" height="40" fill="#DA291C" />
      <circle cx="24" cy="20" r="8" fill="#FFE900" />
      <circle cx="24" cy="20" r="4.5" fill="#fff" stroke="#DA291C" strokeWidth="1.5" />
    </>
  ),
  es: (
    <>
      <rect width="60" height="40" fill="#AA151B" />
      <rect y="10" width="60" height="20" fill="#F1BF00" />
      <circle cx="18" cy="20" r="4" fill="#AA151B" />
    </>
  ),
};

export function FlagIcon({ lang, className }: { lang: Lang; className?: string }) {
  return (
    <svg
      viewBox="0 0 60 40"
      aria-hidden
      className={clsx(
        "w-[18px] h-3 rounded-[2px] ring-1 ring-black/15 flex-shrink-0",
        className
      )}
    >
      {FLAG_SHAPES[lang]}
    </svg>
  );
}

// ─── Sélecteur de langue (boutons alignés avec drapeaux) ───────────────────────
export function LangSelector({ dark }: { dark?: boolean }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className={clsx(
        "flex items-center gap-0.5 rounded-lg p-0.5 border",
        dark ? "bg-white/10 border-white/20" : "bg-white border-line"
      )}
    >
      {LANGS.map((l) => {
        const active = l === lang;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={active}
            title={LANG_LABELS[l]}
            aria-label={LANG_LABELS[l]}
            className={clsx(
              "flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-bold uppercase transition-all",
              active
                ? dark
                  ? "bg-white text-brand-deep shadow-sm"
                  : "bg-gradient-to-b from-brand to-brand-dark text-white shadow-sm"
                : dark
                  ? "text-white/70 hover:text-white hover:bg-white/15"
                  : "text-slate2 hover:bg-mist"
            )}
          >
            <FlagIcon lang={l} />
            <span className="hidden md:inline">{l}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Taille du texte (accessibilité basse vision) ──────────────────────────────
const FONT_LABELS: Record<FontSize, string> = { base: "A", lg: "A+", xl: "A++" };
const NEXT_SIZE: Record<FontSize, FontSize> = { base: "lg", lg: "xl", xl: "base" };

export function FontSizeControl({ dark }: { dark?: boolean }) {
  const { t } = useI18n();
  const [size, setSize] = useState<FontSize>(() => getFontSize());

  const cycle = () => {
    const next = NEXT_SIZE[size];
    applyFontSize(next);
    setSize(next);
  };

  return (
    <button
      onClick={cycle}
      aria-label={t("common.fontSize")}
      title={t("common.fontSize")}
      className={clsx(
        "flex items-center gap-1.5 rounded px-2.5 py-1.5 border text-xs font-semibold transition-colors",
        dark
          ? "bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
          : "bg-white border-line text-slate2 hover:bg-mist"
      )}
    >
      <ZoomIn size={13} aria-hidden />
      {FONT_LABELS[size]}
    </button>
  );
}

// ─── Boutons ───────────────────────────────────────────────────────────────────
export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={clsx(
        "flex items-center justify-center gap-2 bg-gradient-to-b from-brand to-brand-dark text-white px-4 py-2.5 rounded-lg text-sm font-semibold",
        "shadow-sm shadow-brand/30 hover:from-brand-dark hover:to-brand-dark hover:shadow-md hover:shadow-brand/35",
        "active:scale-[0.98] transition-all duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
        className
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={clsx(
        "flex items-center justify-center gap-2 bg-white border border-line text-slate2 px-4 py-2.5 rounded-lg text-sm font-medium",
        "shadow-sm hover:bg-mist hover:border-brand/40 hover:text-brand-dark active:scale-[0.98] transition-all duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

// ─── Copie dans le presse-papiers (avec repli et retour visuel) ────────────────
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Repli pour les contextes non sécurisés ou permission refusée.
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error(t("common.copyFailed"));
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label ?? t("common.copy")}
      title={label ?? t("common.copy")}
      className="inline-flex items-center gap-1 text-brand hover:text-brand-dark transition-colors text-xs font-medium"
    >
      {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
      {copied ? t("common.copied") : (label ?? t("common.copy"))}
    </button>
  );
}

// ─── Champs de formulaire ──────────────────────────────────────────────────────
// Le libellé enveloppe le champ : cliquer sur le texte donne le focus au champ.
export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-ink mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
        {hint && <span className="ml-1.5 font-normal text-xs text-slate2/70">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full px-3 py-2.5 border border-line rounded-lg text-sm bg-white shadow-sm transition-all " +
  "placeholder:text-slate2/45 hover:border-brand/50 " +
  "focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 " +
  "disabled:bg-mist disabled:text-slate2 disabled:cursor-not-allowed disabled:shadow-none";

// ─── Champ mot de passe avec œil afficher/masquer ──────────────────────────────
export function PasswordInput({
  withIcon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  /** Affiche un cadenas à gauche (style des pages de connexion). */
  withIcon?: boolean;
}) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      {withIcon && (
        <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand/60" aria-hidden />
      )}
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={clsx(inputClass, "pr-10", withIcon && "pl-9", className)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t("common.hidePwd") : t("common.showPwd")}
        title={visible ? t("common.hidePwd") : t("common.showPwd")}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate2/60 hover:text-brand hover:bg-brand-soft transition-colors"
      >
        {visible ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
      </button>
    </div>
  );
}

// ─── Modale accessible ─────────────────────────────────────────────────────────
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);

  /* onClose change à chaque rendu du parent (fonction fléchée) : on le lit via
     une ref pour que l'effet ne tourne qu'au montage. Sinon, chaque frappe
     re-déclenchait l'effet et volait le focus vers le premier champ. */
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Verrou du défilement de l'arrière-plan.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus initial sur le premier élément interactif du contenu.
    const focusables = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE);
    (focusables && focusables.length > 1 ? focusables[1] : focusables?.[0])?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      // Piège de focus : Tab reste à l'intérieur de la modale.
      if (e.key === "Tab" && dialog) {
        const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null
        );
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !dialog.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
    // Montage uniquement : le focus initial et le piège ne doivent pas se rejouer.
  }, []);

  /* Portail vers <body> : la modale échappe aux contextes d'empilement créés
     par les animations du contenu et passe toujours au-dessus du menu fixe. */
  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-overlay-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={clsx(
          "bg-white rounded-2xl shadow-2xl w-full max-h-[92vh] overflow-y-auto animate-modal-in",
          wide ? "max-w-2xl" : "max-w-lg"
        )}
      >
        <div className="sticky top-0 bg-white rounded-t-2xl z-10">
          {/* Liseré identitaire bleu → vert en tête de modale */}
          <div className="h-1 rounded-t-2xl bg-gradient-to-r from-brand via-brand-dark to-accent" aria-hidden />
          <div className="px-6 py-5 border-b border-line-soft flex items-center justify-between">
            <div>
              <h3 id="modal-title" className="text-ink text-lg font-bold font-title">
                {title}
              </h3>
              {subtitle && <p className="text-slate2/80 text-xs mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label={t("common.close")}
              className="text-slate2/70 hover:text-ink hover:bg-mist rounded-lg transition-colors p-1.5"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

// ─── Confirmation d'action destructive ─────────────────────────────────────────
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  busy,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="p-6 space-y-5">
        <p className="text-sm text-slate2">{message}</p>
        <div className="flex gap-3">
          <SecondaryButton className="flex-1" onClick={onCancel} disabled={busy}>
            {t("common.cancel")}
          </SecondaryButton>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 bg-danger text-white py-2.5 rounded-lg text-sm font-medium hover:bg-danger/85 transition-colors disabled:opacity-50"
          >
            {busy ? t("common.deleting") : (confirmLabel ?? t("common.delete"))}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── En-tête de page ───────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-stretch gap-3">
        {/* Barre identitaire bleu → vert devant le titre */}
        <span
          className="w-1 rounded-full bg-gradient-to-b from-brand to-accent flex-shrink-0"
          aria-hidden
        />
        <div>
          <h2 className="text-ink text-2xl font-bold font-title">{title}</h2>
          {subtitle && <p className="text-slate2 text-sm mt-1">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ─── États vides / chargement / erreur ─────────────────────────────────────────
export function LoadingBlock({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate2/80" role="status">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mb-3" aria-hidden />
      <p className="text-sm">{label ?? t("common.loading")}</p>
    </div>
  );
}

export function ErrorBlock({
  message,
  onRetry,
}: {
  message?: string | null;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center" role="alert">
      <div className="w-12 h-12 rounded-full bg-danger-soft flex items-center justify-center mb-4">
        <AlertTriangle size={22} className="text-danger" aria-hidden />
      </div>
      <p className="text-ink font-medium text-sm mb-1">{t("common.loadError")}</p>
      {message && <p className="text-slate2 text-sm mb-5 max-w-md">{message}</p>}
      <SecondaryButton onClick={onRetry}>
        <RefreshCw size={14} aria-hidden />
        {t("common.retry")}
      </SecondaryButton>
    </div>
  );
}

export function EmptyState({
  icon,
  message,
}: {
  icon: ReactNode;
  message: string;
}) {
  return (
    <div className="text-center py-16 text-slate2/80">
      <div
        className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-soft to-mist border border-line-soft flex items-center justify-center text-brand/50"
        aria-hidden
      >
        {icon}
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
