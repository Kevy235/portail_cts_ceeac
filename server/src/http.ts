import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Enveloppe un handler `async` pour transmettre tout rejet de promesse au
 * middleware d'erreurs d'Express 4 (sinon : unhandled rejection → crash du
 * process Node).
 */
export function ah(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (v: string): boolean => UUID_RE.test(v);

/**
 * Valide que les paramètres d'URL indiqués sont des UUID.
 * Renvoie 404 sinon — évite une erreur PostgreSQL (22P02) sur les colonnes UUID.
 */
export function uuidParams(...names: string[]): RequestHandler {
  return (req, res, next) => {
    for (const name of names) {
      const value = req.params[name];
      if (!value || !UUID_RE.test(value)) {
        return res.status(404).json({ error: "Ressource introuvable" });
      }
    }
    next();
  };
}
