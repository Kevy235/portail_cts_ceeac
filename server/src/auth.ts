import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { query } from "./db.js";

export interface AuthUser {
  id: string;
  role: "admin" | "participant";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const AUTH_COOKIE = "cts_token";

export function signToken(user: AuthUser, tokenVersion: number): string {
  return jwt.sign(
    { sub: user.id, role: user.role, ver: tokenVersion },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE, { path: "/" });
}

// ─── Vérification en base à chaque requête (avec micro-cache) ────────────────
// Permet la révocation effective : compte supprimé, désactivé, ou jeton émis
// avant un changement de mot de passe (token_version) → accès refusé.
interface UserAuthState {
  role: "admin" | "participant";
  status: string;
  tokenVersion: number;
}

const CACHE_TTL_MS = 10_000;
const authCache = new Map<string, { state: UserAuthState | null; at: number }>();

/** À appeler après toute mutation de compte (mot de passe, statut, suppression). */
export function invalidateAuthCache(userId?: string) {
  if (userId) authCache.delete(userId);
  else authCache.clear();
}

async function getAuthState(userId: string): Promise<UserAuthState | null> {
  const cached = authCache.get(userId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.state;

  const { rows } = await query<{
    role: "admin" | "participant";
    status: string;
    token_version: number;
  }>("SELECT role, status, token_version FROM users WHERE id = $1", [userId]);
  const state = rows[0]
    ? { role: rows[0].role, status: rows[0].status, tokenVersion: rows[0].token_version }
    : null;
  authCache.set(userId, { state, at: Date.now() });
  return state;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
  } catch {
    clearAuthCookie(res);
    return res.status(401).json({ error: "Session expirée, veuillez vous reconnecter" });
  }

  const userId = String(payload.sub);
  getAuthState(userId)
    .then((state) => {
      if (!state || state.status === "inactif" || state.tokenVersion !== (payload.ver ?? 0)) {
        clearAuthCookie(res);
        return res
          .status(401)
          .json({ error: "Session expirée, veuillez vous reconnecter" });
      }
      req.user = { id: userId, role: state.role };
      next();
    })
    .catch(next);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Accès réservé aux administrateurs" });
  }
  next();
}
