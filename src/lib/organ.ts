import type { Dict } from "@/i18n/fr";

/** Anciens codes figés — encore affichés correctement s'ils restent en base. */
const LEGACY_ORGANS: Record<string, keyof Dict> = {
  conference: "sess.organ.conference",
  conseil: "sess.organ.conseil",
  comite: "sess.organ.comite",
  cts: "sess.organ.cts",
  autre: "sess.organ.autre",
};

/** Suggestions proposées à la saisie (l'admin peut écrire un autre intitulé). */
export const ORGAN_SUGGESTION_KEYS = [
  "sess.organ.conference",
  "sess.organ.conseil",
  "sess.organ.comite",
  "sess.organ.cts",
  "sess.organ.parlement",
  "sess.organ.cour",
] as const satisfies readonly (keyof Dict)[];

export function displayOrgan(
  organ: string | null | undefined,
  t: (key: keyof Dict) => string
): string {
  if (!organ) return "";
  const key = LEGACY_ORGANS[organ];
  return key ? t(key) : organ;
}