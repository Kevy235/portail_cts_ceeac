/**
 * Test de fumée de bout en bout :
 * démarre le serveur compilé sur une base PostgreSQL propre, puis déroule le
 * parcours complet admin/participant via l'API HTTP réelle.
 *
 * Usage : node scripts/smoke-test.mjs   (nécessite `npm run build:api` au préalable)
 *
 * Base de données :
 *  - si SMOKE_DATABASE_URL est défini (ex. en CI), cette base est utilisée
 *    (elle est réinitialisée : schéma public recréé) ;
 *  - sinon un PostgreSQL embarqué est lancé (npm i --no-save embedded-postgres).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PG_PORT = 5433;
const API_PORT = 3999;
const BASE = `http://localhost:${API_PORT}/api`;
const DATA_DIR = path.resolve(".pgdata-test");
const UPLOAD_DIR = path.resolve("uploads-test");

let passed = 0;
const check = (label, cond, extra = "") => {
  if (cond) {
    passed++;
    console.log(`  OK  ${label}`);
  } else {
    console.error(`ÉCHEC ${label} ${extra}`);
    process.exitCode = 1;
    throw new Error(`Échec : ${label}`);
  }
};

// Client HTTP minimal avec gestion du cookie de session
function makeClient() {
  let cookie = "";
  return async (method, url, { json, form } = {}) => {
    const headers = {};
    if (cookie) headers.cookie = cookie;
    let body;
    if (json !== undefined) {
      headers["content-type"] = "application/json";
      body = JSON.stringify(json);
    } else if (form) {
      body = form;
    }
    const res = await fetch(`${BASE}${url}`, { method, headers, body });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    let data = null;
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) data = await res.json();
    else data = await res.arrayBuffer();
    return { status: res.status, data, headers: res.headers };
  };
}

async function main() {
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
  fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });

  let pg = null;
  let databaseUrl = process.env.SMOKE_DATABASE_URL;

  if (databaseUrl) {
    console.log("· Utilisation de la base fournie (SMOKE_DATABASE_URL), réinitialisation…");
    const { default: pgLib } = await import("pg");
    const client = new pgLib.Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    await client.end();
  } else {
    console.log("· Démarrage de PostgreSQL embarqué…");
    const { default: EmbeddedPostgres } = await import("embedded-postgres");
    pg = new EmbeddedPostgres({
      databaseDir: DATA_DIR,
      user: "postgres",
      password: "postgres",
      port: PG_PORT,
      persistent: false,
    });
    await pg.initialise();
    await pg.start();
    await pg.createDatabase("portail_cts_test");
    databaseUrl = `postgresql://postgres:postgres@localhost:${PG_PORT}/portail_cts_test`;
  }

  console.log("· Démarrage du serveur API…");
  const server = spawn(process.execPath, ["server/dist/index.js"], {
    env: {
      ...process.env,
      PORT: String(API_PORT),
      DATABASE_URL: databaseUrl,
      JWT_SECRET: "secret-de-test",
      ADMIN_EMAIL: "admin@test.org",
      ADMIN_PASSWORD: "AdminTest#2025",
      UPLOAD_DIR,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (d) => process.stdout.write(`    [srv] ${d}`));
  server.stderr.on("data", (d) => process.stderr.write(`    [srv] ${d}`));

  try {
    // Attendre que l'API soit prête
    let ready = false;
    for (let i = 0; i < 60 && !ready; i++) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        const res = await fetch(`${BASE}/health`);
        ready = res.ok;
      } catch {}
    }
    check("l'API démarre et répond sur /api/health", ready);

    const admin = makeClient();

    // ─── Authentification ───────────────────────────────────────────
    let r = await admin("POST", "/auth/login", {
      json: { email: "admin@test.org", password: "mauvais" },
    });
    check("mot de passe erroné refusé (401)", r.status === 401);

    r = await admin("POST", "/auth/login", {
      json: { email: "admin@test.org", password: "AdminTest#2025" },
    });
    check("connexion admin", r.status === 200 && r.data.user.role === "admin");

    r = await admin("GET", "/auth/me");
    check("session persistée via cookie (/auth/me)", r.status === 200);

    const anon = makeClient();
    r = await anon("GET", "/participants");
    check("accès anonyme bloqué (401)", r.status === 401);

    // ─── Participants ───────────────────────────────────────────────
    r = await admin("POST", "/participants", {
      json: {
        name: "Dr. Test Expert",
        email: "expert@test.cd",
        country: "RDC",
        functionTitle: "Expert Senior",
        institution: "MAE",
      },
    });
    check(
      "création participant + mot de passe provisoire",
      r.status === 201 && typeof r.data.temporaryPassword === "string"
    );
    const participantId = r.data.participant.id;
    const tempPwd = r.data.temporaryPassword;

    r = await admin("POST", "/participants", {
      json: {
        name: "Doublon",
        email: "expert@test.cd",
        country: "RDC",
        functionTitle: "X",
      },
    });
    check("e-mail en double refusé (409)", r.status === 409);

    // ─── Sessions ───────────────────────────────────────────────────
    r = await admin("POST", "/sessions", {
      json: {
        title: "3ème Session Ordinaire CTS-APPS 2026",
        location: "Brazzaville, Congo",
        startDate: "2026-09-25",
        endDate: "2026-09-27",
        reference: "CTS-APPS/2026/03",
        expectedParticipants: 38,
      },
    });
    check("création session", r.status === 201);
    const sessionId = r.data.session.id;

    // ─── Documents ──────────────────────────────────────────────────
    r = await admin("GET", "/categories");
    check("catégories initialisées (7)", r.data.categories.length === 7);
    const categoryId = r.data.categories[0].id;

    const pdfBytes = new TextEncoder().encode("%PDF-1.4\n%contenu de test\n%%EOF");
    const form = new FormData();
    form.append("file", new Blob([pdfBytes], { type: "application/pdf" }), "rapport-test.pdf");
    form.append("title", "Rapport de test T1 2026");
    form.append("categoryId", categoryId);
    form.append("sessionId", sessionId);
    form.append("status", "publié");
    r = await admin("POST", "/documents", { form });
    check("téléversement + publication d'un document", r.status === 201);
    const docId = r.data.document.id;

    const badForm = new FormData();
    badForm.append("file", new Blob([new Uint8Array(10)], { type: "application/x-msdownload" }), "virus.exe");
    badForm.append("title", "Fichier interdit");
    r = await admin("POST", "/documents", { form: badForm });
    check("type de fichier interdit refusé (400)", r.status === 400);

    // ─── Parcours participant ───────────────────────────────────────
    const participant = makeClient();
    r = await participant("POST", "/auth/login", {
      json: { email: "expert@test.cd", password: tempPwd },
    });
    check(
      "connexion participant avec mot de passe provisoire",
      r.status === 200 && r.data.user.mustChangePassword === true
    );

    r = await participant("POST", "/auth/change-password", {
      json: { currentPassword: tempPwd, newPassword: "NouveauMdp#2026" },
    });
    check("changement de mot de passe (première connexion)", r.status === 200);

    r = await participant("GET", "/documents");
    check(
      "le participant voit uniquement les documents publiés",
      r.status === 200 && r.data.documents.length === 1
    );

    r = await participant("GET", `/documents/${docId}/download`);
    check(
      "téléchargement du document",
      r.status === 200 && r.headers.get("content-type") === "application/pdf"
    );

    r = await participant("GET", "/stats");
    check("les statistiques sont réservées à l'admin (403)", r.status === 403);

    r = await participant("PUT", `/participants/${participantId}`, {
      json: { name: "X", email: "x@x.x", country: "RDC", functionTitle: "X" },
    });
    check("un participant ne peut pas gérer les comptes (403)", r.status === 403);

    // ─── Statistiques et contenus ───────────────────────────────────
    r = await admin("GET", "/stats");
    check(
      "statistiques dynamiques exactes",
      r.data.participants.total === 1 &&
        r.data.documents.publies === 1 &&
        r.data.sessions.planifiees === 1 &&
        r.data.downloads.total === 1 &&
        r.data.activity.length > 0
    );

    r = await admin("PUT", "/settings/admin", {
      json: { settings: { platform_name: "CEEAC · Portail modifié" } },
    });
    check(
      "l'admin modifie les contenus du portail",
      r.status === 200 && r.data.settings.platform_name === "CEEAC · Portail modifié"
    );

    r = await anon("GET", "/settings");
    check(
      "les contenus modifiés sont visibles publiquement (page de connexion)",
      r.data.settings.platform_name === "CEEAC · Portail modifié"
    );

    // ─── Suppression ────────────────────────────────────────────────
    r = await admin("DELETE", `/documents/${docId}`);
    check("suppression document (fichier inclus)", r.status === 200);
    r = await admin("DELETE", `/participants/${participantId}`);
    check("suppression participant", r.status === 200);

    console.log(`\nRésultat : ${passed} vérifications réussies, 0 échec.`);
  } finally {
    server.kill();
    if (pg) await pg.stop();
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
    fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
