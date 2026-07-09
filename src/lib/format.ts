const LOCALES: Record<string, string> = {
  fr: "fr-FR",
  en: "en-GB",
  pt: "pt-PT",
  es: "es-ES",
};

let currentLocale = "fr-FR";
let dateFormatter = new Intl.DateTimeFormat(currentLocale, {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
let timeFormatter = new Intl.DateTimeFormat(currentLocale, {
  hour: "2-digit",
  minute: "2-digit",
});
// Unités d'octets localisées (o/Ko/Mo en français, B/KB/MB ailleurs).
let sizeUnits: [string, string, string] = ["o", "Ko", "Mo"];

/** Aligne le format des dates, heures et tailles sur la langue de l'interface. */
export function setFormatLocale(lang: string) {
  currentLocale = LOCALES[lang] ?? "fr-FR";
  dateFormatter = new Intl.DateTimeFormat(currentLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  timeFormatter = new Intl.DateTimeFormat(currentLocale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  sizeUnits = lang === "fr" ? ["o", "Ko", "Mo"] : ["B", "KB", "MB"];
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateFormatter.format(d);
}

export function formatDateRange(start: string, end: string | null): string {
  if (!end || end === start) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function formatSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} ${sizeUnits[0]}`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} ${sizeUnits[1]}`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} ${sizeUnits[2]}`;
}

export type TimeAgo =
  | { key: "time.now" }
  | { key: "time.minutes" | "time.hours" | "time.days"; n: number }
  | { key: "time.yesterday" }
  | { key: "date"; text: string };

/** Décompose l'ancienneté pour traduction par le composant appelant. */
export function timeAgoParts(iso: string): TimeAgo {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return { key: "time.now" };
  if (minutes < 60) return { key: "time.minutes", n: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { key: "time.hours", n: hours };
  const days = Math.floor(hours / 24);
  if (days === 1) return { key: "time.yesterday" };
  if (days < 30) return { key: "time.days", n: days };
  return { key: "date", text: formatDate(iso) };
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${formatDate(iso)} ${timeFormatter.format(d)}`;
}

export function initials(name: string): string {
  const fromCapitals = name
    .split(" ")
    .filter((part) => /^[A-ZÀ-Ý]/.test(part))
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  if (fromCapitals) return fromCapitals;
  // Repli : premières lettres des deux premiers mots, quel que soit leur casse.
  const fallback = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return fallback || "?";
}
