import { clsx } from "clsx";
import { AlertTriangle, Check, Copy, Globe, Lock, RefreshCw, X, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { LANGS, LANG_LABELS, useI18n, type Lang } from "@/i18n";
import type { Dict } from "@/i18n/fr";
import { applyFontSize, getFontSize, type FontSize } from "@/lib/fontsize";

// ─── Badges de statut ──────────────────────────────────────────────────────────
const BADGE_STYLES: Record<string, string> = {
  actif: "bg-accent-soft text-accent-dark border-accent/30",
  "en-attente": "bg-amber-50 text-amber-700 border-amber-200",
  inactif: "bg-slate-100 text-slate-600 border-slate-200",
  publié: "bg-brand-soft text-brand-dark border-brand/25",
  brouillon: "bg-orange-50 text-orange-700 border-orange-200",
  "à-venir": "bg-violet-50 text-violet-700 border-violet-200",
  "en-cours": "bg-accent-soft text-accent-dark border-accent/30",
  terminé: "bg-slate-100 text-slate-600 border-slate-200",
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const label = t(`status.${status}` as keyof Dict);
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap",
        BADGE_STYLES[status] ?? "bg-gray-100 text-gray-600 border-gray-200"
      )}
    >
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

// ─── Pastille de langue (FR / EN / PT / ES) ────────────────────────────────────
export function LangChip({ lang, muted }: { lang: Lang; muted?: boolean }) {
  return (
    <span
      title={LANG_LABELS[lang]}
      className={clsx(
        "inline-flex items-center justify-center w-7 h-5 rounded text-[10px] font-bold uppercase border",
        muted
          ? "bg-slate-50 text-slate-400 border-slate-200"
          : "bg-brand-soft text-brand-dark border-brand/25"
      )}
    >
      {lang}
    </span>
  );
}

// ─── Sélecteur de langue ───────────────────────────────────────────────────────
export function LangSelector({ dark }: { dark?: boolean }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      className={clsx(
        "flex items-center gap-1.5 rounded px-2 py-1.5 border",
        dark ? "bg-white/10 border-white/20" : "bg-white border-line"
      )}
    >
      <Globe size={13} className={dark ? "text-white/50" : "text-slate2/60"} aria-hidden />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        aria-label={t("common.language")}
        className={clsx(
          "bg-transparent text-xs focus:outline-none cursor-pointer",
          dark ? "text-white/80 [&>option]:text-ink" : "text-slate2"
        )}
      >
        {LANGS.map((l) => (
          <option key={l} value={l}>
            {LANG_LABELS[l]}
          </option>
        ))}
      </select>
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
        "flex items-center justify-center gap-2 bg-brand text-white px-4 py-2.5 rounded-lg text-sm font-medium",
        "hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
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
        "flex items-center justify-center gap-2 border border-line text-slate2 px-4 py-2.5 rounded-lg text-sm",
        "hover:bg-mist transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
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
export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full px-3 py-2.5 border border-line rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all";

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
        onClose();
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
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
          "bg-white rounded-2xl shadow-2xl w-full max-h-[92vh] overflow-y-auto",
          wide ? "max-w-2xl" : "max-w-lg"
        )}
      >
        <div className="px-6 py-5 border-b border-line-soft flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h3 id="modal-title" className="text-ink font-bold font-title">
              {title}
            </h3>
            {subtitle && <p className="text-slate2/80 text-xs mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="text-slate2/70 hover:text-ink transition-colors p-1"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
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
      <div>
        <h2 className="text-ink text-2xl font-bold font-title">{title}</h2>
        {subtitle && <p className="text-slate2 text-sm mt-1">{subtitle}</p>}
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
      <div className="mx-auto mb-3 opacity-40 w-fit" aria-hidden>
        {icon}
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
