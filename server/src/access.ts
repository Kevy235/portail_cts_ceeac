import crypto from "node:crypto";
import type { AuthUser } from "./auth.js";
import { query } from "./db.js";

/**
 * Cloisonnement documentaire par réunion.
 *
 * Les codes d'accès d'une réunion (identifiant + mot de passe) n'ouvrent que
 * cette réunion : un invité ne voit que la réunion dont il a saisi les codes,
 * un participant ne voit que les réunions qui lui ont été ouvertes (table
 * `session_access`, alimentée à l'inscription, par déverrouillage avec les
 * codes, ou par l'administrateur).
 */

/** Réunions autorisées. `null` = aucune restriction (administrateur). */
export async function accessibleSessionIds(user: AuthUser): Promise<string[] | null> {
  if (user.role === "admin") return null;
  // Invité : la réunion embarquée dans son jeton, et elle seule.
  if (user.role === "guest") return user.sessionId ? [user.sessionId] : [];

  const { rows } = await query<{ session_id: string }>(
    "SELECT session_id FROM session_access WHERE user_id = $1",
    [user.id]
  );
  return rows.map((r) => r.session_id);
}

/** Droit d'accès à une réunion précise (documents, discussion). */
export async function canAccessSession(
  user: AuthUser,
  sessionId: string
): Promise<boolean> {
  if (user.role === "admin") return true;
  if (user.role === "guest") return user.sessionId === sessionId;

  const { rows } = await query<{ ok: boolean }>(
    "SELECT TRUE AS ok FROM session_access WHERE user_id = $1 AND session_id = $2",
    [user.id, sessionId]
  );
  return rows.length > 0;
}

// ─── Vérification des codes d'accès d'une réunion ─────────────────────────────

/** Comparaison à temps constant : pas d'oracle temporel sur le mot de passe. */
function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export interface SessionByCodes {
  id: string;
  title: string;
  status: string;
  accessCode: string;
}

/**
 * Réunion correspondant au couple identifiant + mot de passe d'accès.
 * `null` si l'un ou l'autre est incorrect (message d'erreur identique dans les
 * deux cas, pour ne pas révéler l'existence d'un identifiant).
 */
export async function findSessionByAccessCodes(
  accessCode: string,
  accessPassword: string
): Promise<SessionByCodes | null> {
  const { rows } = await query<{
    id: string;
    title: string;
    status: string;
    access_code: string;
    access_password: string;
  }>(
    `SELECT id, title, status, access_code, access_password
     FROM cts_sessions WHERE access_code = $1`,
    [accessCode.trim().toUpperCase()]
  );
  const session = rows[0];
  if (!session || session.access_password.length === 0) return null;
  if (
    !timingSafeEqualStr(
      accessPassword.trim().toUpperCase(),
      session.access_password
    )
  ) {
    return null;
  }
  return {
    id: session.id,
    title: session.title,
    status: session.status,
    accessCode: session.access_code,
  };
}

/** Ouvre l'accès d'un compte à une réunion. `true` si l'accès est nouveau. */
export async function grantSessionAccess(
  userId: string,
  sessionId: string
): Promise<boolean> {
  const { rows } = await query(
    `INSERT INTO session_access (user_id, session_id) VALUES ($1, $2)
     ON CONFLICT (user_id, session_id) DO NOTHING RETURNING session_id`,
    [userId, sessionId]
  );
  return rows.length > 0;
}
