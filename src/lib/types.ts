import type { Lang } from "@/i18n";

export type Role = "admin" | "participant";
export type UserStatus = "actif" | "en-attente" | "inactif";
export type DocStatus = "publié" | "brouillon";
export type SessionStatus = "à-venir" | "en-cours" | "terminé";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  country: string;
  functionTitle: string;
  institution: string;
  status: UserStatus;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  uiLang: Lang;
  docLangs: Lang[];
  /** Session CTS via laquelle le participant s'est auto-inscrit (le cas échéant). */
  originSessionId?: string | null;
  originSessionTitle?: string | null;
}

export interface CtsSession {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string | null;
  status: SessionStatus;
  reference: string;
  description: string;
  expectedParticipants: number;
  documentCount: number;
  /** Participants auto-inscrits via les accès de cette session. */
  registeredCount: number;
  createdAt: string;
  /** Identifiants d'accès — présents uniquement pour l'administrateur. */
  accessCode?: string;
  accessPassword?: string;
}

export interface Category {
  id: string;
  name: string;
  position: number;
}

export interface DocFile {
  lang: Lang;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface Doc {
  id: string;
  title: string;
  status: DocStatus;
  /** Document chiffré/codé par l'administrateur avant téléversement. */
  isCoded: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  categoryName: string | null;
  sessionId: string | null;
  sessionTitle: string | null;
  sessionReference: string | null;
  files: DocFile[];
  downloads: number;
}

export interface ChatMessage {
  id: number;
  body: string;
  createdAt: string;
  authorId: string | null;
  authorName: string;
  authorCountry: string;
  authorRole: string;
}

export interface ActivityItem {
  id: number;
  type: string;
  message: string;
  detail: string;
  createdAt: string;
  actorName?: string | null;
}

export interface Stats {
  participants: { total: number; actifs: number };
  documents: { publies: number; brouillons: number };
  sessions: {
    planifiees: number;
    prochaine: {
      id: string;
      title: string;
      startDate: string;
      location: string;
      documents: number;
      participants: number;
    } | null;
  };
  downloads: { moisCourant: number; total: number };
  activity: ActivityItem[];
}

export type Settings = Record<string, string>;

export const COUNTRIES = [
  "Angola",
  "Burundi",
  "Cameroun",
  "Congo",
  "Gabon",
  "Guinée Équatoriale",
  "RCA",
  "RDC",
  "Rwanda",
  "São Tomé et Príncipe",
  "Tchad",
];

export const COUNTRY_FLAGS: Record<string, string> = {
  Angola: "🇦🇴",
  Burundi: "🇧🇮",
  Cameroun: "🇨🇲",
  Congo: "🇨🇬",
  Gabon: "🇬🇦",
  "Guinée Équatoriale": "🇬🇶",
  RCA: "🇨🇫",
  RDC: "🇨🇩",
  Rwanda: "🇷🇼",
  "São Tomé et Príncipe": "🇸🇹",
  Tchad: "🇹🇩",
};
