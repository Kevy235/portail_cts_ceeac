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
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  position: number;
}

export interface Doc {
  id: string;
  title: string;
  status: DocStatus;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  categoryName: string | null;
  sessionId: string | null;
  sessionTitle: string | null;
  sessionReference: string | null;
  downloads: number;
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
