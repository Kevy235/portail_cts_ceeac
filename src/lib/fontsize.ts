export type FontSize = "base" | "lg" | "xl";

const STORAGE_KEY = "cts_fontsize";
const CLASSES: Record<FontSize, string | null> = {
  base: null,
  lg: "fontsize-lg",
  xl: "fontsize-xl",
};

export const FONT_SIZES: FontSize[] = ["base", "lg", "xl"];

export function getFontSize(): FontSize {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "lg" || stored === "xl" ? stored : "base";
}

export function applyFontSize(size: FontSize) {
  const html = document.documentElement;
  html.classList.remove("fontsize-lg", "fontsize-xl");
  const cls = CLASSES[size];
  if (cls) html.classList.add(cls);
  localStorage.setItem(STORAGE_KEY, size);
}

/** À appeler au démarrage, avant le premier rendu (pas de saut de mise en page). */
export function initFontSize() {
  applyFontSize(getFontSize());
}
