import path from "node:path";

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const config = {
  env: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
  port: num(process.env.PORT, 3001),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/portail_cts",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  jwtExpiresIn: "7d" as const,
  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? "uploads"),
  maxUploadMb: num(process.env.MAX_UPLOAD_MB, 50),
  admin: {
    email: process.env.ADMIN_EMAIL ?? "admin@ceeac-eccas.org",
    password: process.env.ADMIN_PASSWORD ?? "ChangezMoi!2025",
    name: process.env.ADMIN_NAME ?? "Secrétariat APPS",
  },
};

export function assertProdConfig() {
  if (!config.isProd) return;
  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
  if (missing.length) {
    throw new Error(
      `Variables d'environnement manquantes en production : ${missing.join(", ")}`
    );
  }
}
