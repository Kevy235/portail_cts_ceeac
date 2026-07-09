import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Drapeaux SVG simplifiés des 11 États membres de la CEEAC.
 * Les emojis drapeaux ne s'affichent pas sous Windows : on dessine les
 * drapeaux en SVG (formes simplifiées mais reconnaissables).
 * Clés : noms exacts de la constante COUNTRIES (lib/types.ts).
 */
const COUNTRY_SHAPES: Record<string, ReactNode> = {
  Angola: (
    <>
      <rect width="60" height="20" fill="#CC092F" />
      <rect y="20" width="60" height="20" fill="#000" />
      <circle cx="30" cy="20" r="7" fill="none" stroke="#FFCB00" strokeWidth="2.5" />
    </>
  ),
  Burundi: (
    <>
      <rect width="60" height="40" fill="#1EB53A" />
      <path d="M0,0 L60,0 L30,20 Z M0,40 L60,40 L30,20 Z" fill="#CE1126" />
      <path d="M0,0 60,40 M60,0 0,40" stroke="#fff" strokeWidth="7" />
      <circle cx="30" cy="20" r="9" fill="#fff" />
      <circle cx="30" cy="20" r="4" fill="#CE1126" />
    </>
  ),
  Cameroun: (
    <>
      <rect width="20" height="40" fill="#007A5E" />
      <rect x="20" width="20" height="40" fill="#CE1126" />
      <rect x="40" width="20" height="40" fill="#FCD116" />
      <path d="M30,14 l1.8,5.2 5.5,0 -4.4,3.4 1.6,5.4 -4.5,-3.3 -4.5,3.3 1.6,-5.4 -4.4,-3.4 5.5,0 Z" fill="#FCD116" />
    </>
  ),
  Congo: (
    <>
      <rect width="60" height="40" fill="#FBDE4A" />
      <path d="M0,0 H38 L0,40 Z" fill="#009543" />
      <path d="M60,40 H22 L60,0 Z" fill="#DC241F" />
    </>
  ),
  Gabon: (
    <>
      <rect width="60" height="14" fill="#009E60" />
      <rect y="14" width="60" height="13" fill="#FCD116" />
      <rect y="27" width="60" height="13" fill="#3A75C4" />
    </>
  ),
  "Guinée Équatoriale": (
    <>
      <rect width="60" height="14" fill="#3E9A00" />
      <rect y="14" width="60" height="13" fill="#fff" />
      <rect y="27" width="60" height="13" fill="#E32118" />
      <path d="M0,0 L14,20 L0,40 Z" fill="#0073CE" />
    </>
  ),
  RCA: (
    <>
      <rect width="60" height="10" fill="#003082" />
      <rect y="10" width="60" height="10" fill="#fff" />
      <rect y="20" width="60" height="10" fill="#289728" />
      <rect y="30" width="60" height="10" fill="#FFCE00" />
      <rect x="24" width="12" height="40" fill="#D21034" />
      <path d="M9,2 l1.4,4 4.2,0 -3.4,2.6 1.3,4.1 -3.5,-2.5 -3.5,2.5 1.3,-4.1 -3.4,-2.6 4.2,0 Z" fill="#FFCE00" />
    </>
  ),
  RDC: (
    <>
      <rect width="60" height="40" fill="#007FFF" />
      <path d="M0,40 L0,30 L60,0 L60,10 Z" fill="#F7D618" />
      <path d="M0,40 L60,8 L60,16 L0,40 Z" fill="#CE1021" transform="translate(0,-4)" />
      <path d="M10,4 l2,5.7 6,0 -4.8,3.7 1.8,5.9 -5,-3.6 -5,3.6 1.8,-5.9 -4.8,-3.7 6,0 Z" fill="#F7D618" />
    </>
  ),
  Rwanda: (
    <>
      <rect width="60" height="20" fill="#00A1DE" />
      <rect y="20" width="60" height="10" fill="#FAD201" />
      <rect y="30" width="60" height="10" fill="#20603D" />
      <circle cx="48" cy="9" r="4" fill="#E5BE01" />
    </>
  ),
  "São Tomé et Príncipe": (
    <>
      <rect width="60" height="13" fill="#12AD2B" />
      <rect y="13" width="60" height="14" fill="#FFCE00" />
      <rect y="27" width="60" height="13" fill="#12AD2B" />
      <path d="M0,0 L18,20 L0,40 Z" fill="#D21034" />
      <circle cx="32" cy="20" r="3" fill="#000" />
      <circle cx="46" cy="20" r="3" fill="#000" />
    </>
  ),
  Tchad: (
    <>
      <rect width="20" height="40" fill="#002664" />
      <rect x="20" width="20" height="40" fill="#FECB00" />
      <rect x="40" width="20" height="40" fill="#C60C30" />
    </>
  ),
};

/** Repli neutre pour un pays inconnu : globe stylisé. */
function FallbackGlobe() {
  return (
    <>
      <rect width="60" height="40" fill="#e3eef8" />
      <circle cx="30" cy="20" r="12" fill="none" stroke="#7a94ad" strokeWidth="2.5" />
      <path d="M18,20 H42 M30,8 V32" stroke="#7a94ad" strokeWidth="2" />
    </>
  );
}

export function CountryFlag({
  country,
  className,
}: {
  country: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 60 40"
      aria-hidden
      className={clsx(
        "w-[18px] h-3 rounded-[2px] ring-1 ring-black/15 flex-shrink-0",
        className
      )}
    >
      {COUNTRY_SHAPES[country] ?? <FallbackGlobe />}
    </svg>
  );
}
