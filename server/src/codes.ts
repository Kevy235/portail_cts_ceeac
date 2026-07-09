import crypto from "node:crypto";

/** Alphabet sans caractères ambigus (pas de O/0, I/1, etc.). */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomChars(length: number): string {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Identifiant d'accès d'une session CTS, ex. `CTS-7KM2QX`. */
export const generateAccessCode = () => `CTS-${randomChars(6)}`;

/** Mot de passe d'accès d'une session, ex. `MZT4-QP8W`. */
export const generateAccessPassword = () =>
  `${randomChars(4)}-${randomChars(4)}`;

/** Mot de passe provisoire d'un compte participant créé par l'admin. */
export const generateTempPassword = () =>
  crypto.randomBytes(9).toString("base64url");
