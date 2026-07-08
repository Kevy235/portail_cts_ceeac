import { clsx } from "clsx";
import { X } from "lucide-react";
import type { ReactNode } from "react";

// ─── Badges de statut ──────────────────────────────────────────────────────────
const BADGE_STYLES: Record<string, string> = {
  actif: "bg-accent-soft text-accent-dark border-accent/30",
  "en-attente": "bg-amber-50 text-amber-700 border-amber-200",
  inactif: "bg-slate-100 text-slate-500 border-slate-200",
  publié: "bg-brand-soft text-brand-dark border-brand/25",
  brouillon: "bg-orange-50 text-orange-700 border-orange-200",
  "à-venir": "bg-violet-50 text-violet-700 border-violet-200",
  "en-cours": "bg-accent-soft text-accent-dark border-accent/30",
  terminé: "bg-slate-100 text-slate-500 border-slate-200",
};

const BADGE_LABELS: Record<string, string> = {
  actif: "Actif",
  "en-attente": "En attente",
  inactif: "Inactif",
  publié: "Publié",
  brouillon: "Brouillon",
  "à-venir": "À venir",
  "en-cours": "En cours",
  terminé: "Terminé",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap",
        BADGE_STYLES[status] ?? "bg-gray-100 text-gray-600 border-gray-200"
      )}
    >
      {BADGE_LABELS[status] ?? status}
    </span>
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
      <label className="block text-xs font-medium text-ink mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full px-3 py-2.5 border border-line rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all";

// ─── Modale ────────────────────────────────────────────────────────────────────
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
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={clsx(
          "bg-white rounded-2xl shadow-2xl w-full max-h-[92vh] overflow-y-auto",
          wide ? "max-w-2xl" : "max-w-lg"
        )}
      >
        <div className="px-6 py-5 border-b border-line-soft flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h3 className="text-ink font-bold font-title">{title}</h3>
            {subtitle && <p className="text-slate2/70 text-xs mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="text-slate2/60 hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Confirmation de suppression ───────────────────────────────────────────────
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Supprimer",
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
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="p-6 space-y-5">
        <p className="text-sm text-slate2">{message}</p>
        <div className="flex gap-3">
          <SecondaryButton className="flex-1" onClick={onCancel} disabled={busy}>
            Annuler
          </SecondaryButton>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 bg-danger text-white py-2.5 rounded-lg text-sm font-medium hover:bg-danger/85 transition-colors disabled:opacity-50"
          >
            {busy ? "Suppression…" : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── États vides / chargement ──────────────────────────────────────────────────
export function LoadingBlock({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate2/70">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-sm">{label}</p>
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
    <div className="text-center py-16 text-slate2/70">
      <div className="mx-auto mb-3 opacity-40 w-fit">{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
