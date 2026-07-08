import bcrypt from "bcryptjs";
import { config } from "./config.js";
import { query } from "./db.js";

/** Crée le compte administrateur initial s'il n'existe aucun admin. */
export async function seedAdmin() {
  const { rows } = await query<{ count: string }>(
    "SELECT COUNT(*) AS count FROM users WHERE role = 'admin'"
  );
  if (Number(rows[0].count) > 0) return;

  const hash = await bcrypt.hash(config.admin.password, 12);
  await query(
    `INSERT INTO users (name, email, password_hash, role, status)
     VALUES ($1, $2, $3, 'admin', 'actif')`,
    [config.admin.name, config.admin.email.toLowerCase(), hash]
  );
  console.log(`[seed] compte administrateur créé : ${config.admin.email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      "[seed] ATTENTION : mot de passe admin par défaut utilisé. Définissez ADMIN_PASSWORD."
    );
  }
}
