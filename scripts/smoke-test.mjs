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

    // ─── Mise à jour du compte (nom d'utilisateur + e-mail) ─────────
    r = await admin("PUT", "/auth/me", {
      json: { name: "Secrétariat DAPPS", email: "admin@test.org" },
    });
    check(
      "l'admin modifie son nom d'utilisateur",
      r.status === 200 && r.data.user.name === "Secrétariat DAPPS"
    );
    r = await admin("PUT", "/auth/me", { json: { name: "X", email: "admin@test.org" } });
    check("nom trop court refusé (400)", r.status === 400);

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
    check(
      "accès d'inscription générés (identifiant + mot de passe)",
      /^CTS-[A-Z0-9]{6}$/.test(r.data.session.accessCode) &&
        typeof r.data.session.accessPassword === "string" &&
        r.data.session.accessPassword.length >= 8
    );
    const sessionId = r.data.session.id;
    const accessCode = r.data.session.accessCode;
    const accessPassword = r.data.session.accessPassword;

    r = await admin("POST", "/sessions", {
      json: {
        title: "Session avec dates inversées",
        startDate: "2026-09-25",
        endDate: "2026-09-20",
      },
    });
    check("date de fin antérieure au début refusée (400)", r.status === 400);

    // ─── Documents ──────────────────────────────────────────────────
    r = await admin("GET", "/categories");
    check("catégories initialisées (7)", r.data.categories.length === 7);
    const categoryId = r.data.categories[0].id;

    const pdfBytes = new TextEncoder().encode("%PDF-1.4\n%contenu de test\n%%EOF");
    const form = new FormData();
    form.append("file_fr", new Blob([pdfBytes], { type: "application/pdf" }), "rapport-test-fr.pdf");
    form.append("file_en", new Blob([pdfBytes], { type: "application/pdf" }), "test-report-en.pdf");
    form.append("title", "Rapport de test T1 2026");
    form.append("categoryId", categoryId);
    form.append("sessionId", sessionId);
    form.append("status", "publié");
    form.append("isCoded", "true");
    r = await admin("POST", "/documents", { form });
    check(
      "publication d'un document en 2 langues (fr + en)",
      r.status === 201 && r.data.document.files.length === 2
    );
    check("le document est marqué « codé »", r.data.document.isCoded === true);
    const docId = r.data.document.id;

    const ptForm = new FormData();
    ptForm.append("file", new Blob([pdfBytes], { type: "application/pdf" }), "relatorio-pt.pdf");
    r = await admin("POST", `/documents/${docId}/files/pt`, { form: ptForm });
    check(
      "ajout d'une version portugaise au document",
      r.status === 200 && r.data.document.files.length === 3
    );

    r = await admin("DELETE", `/documents/${docId}/files/pt`);
    check("suppression d'une version linguistique", r.status === 200);

    const noFileForm = new FormData();
    noFileForm.append("title", "Document sans fichier");
    r = await admin("POST", "/documents", { form: noFileForm });
    check("document sans aucun fichier refusé (400)", r.status === 400);

    const badForm = new FormData();
    badForm.append("file_fr", new Blob([new Uint8Array(10)], { type: "application/x-msdownload" }), "virus.exe");
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

    r = await participant("GET", `/documents/${docId}/download/en`);
    check(
      "téléchargement de la version anglaise du document",
      r.status === 200 && r.headers.get("content-type") === "application/pdf"
    );

    r = await participant("GET", `/documents/${docId}/download/es`);
    check("version espagnole inexistante (404)", r.status === 404);

    // Consultation dans le navigateur : disposition inline, non comptée
    // comme téléchargement (le total reste à 1 dans les statistiques).
    r = await participant("GET", `/documents/${docId}/download/en?inline=1`);
    check(
      "consultation inline du document (Content-Disposition: inline)",
      r.status === 200 &&
        (r.headers.get("content-disposition") ?? "").startsWith("inline")
    );

    // ─── Préférences de langue ──────────────────────────────────────
    r = await participant("PUT", "/auth/preferences", {
      json: { uiLang: "en", docLangs: ["en", "pt"] },
    });
    check(
      "enregistrement des préférences de langue",
      r.status === 200 &&
        r.data.user.uiLang === "en" &&
        r.data.user.docLangs.length === 2
    );

    r = await participant("PUT", "/auth/preferences", { json: { docLangs: [] } });
    check("liste de langues vide refusée (400)", r.status === 400);

    // ─── Fil de discussion de session ───────────────────────────────
    r = await participant("POST", `/sessions/${sessionId}/messages`, {
      json: { body: "Bonjour à tous, à quelle heure commence la session ?" },
    });
    check("le participant publie un message", r.status === 201);

    r = await admin("POST", `/sessions/${sessionId}/messages`, {
      json: { body: "La session commence à 9h00 précises." },
    });
    check("l'admin répond dans le fil", r.status === 201);
    const adminMsgId = r.data.message.id;

    r = await participant("GET", `/sessions/${sessionId}/messages`);
    check(
      "lecture du fil de discussion (2 messages, auteurs renseignés)",
      r.status === 200 &&
        r.data.messages.length === 2 &&
        r.data.messages.every((m) => m.authorName)
    );

    r = await participant("GET", `/sessions/${sessionId}/messages?after=${r.data.messages[0].id}`);
    check("récupération incrémentale (after)", r.status === 200 && r.data.messages.length === 1);

    r = await participant("DELETE", `/sessions/${sessionId}/messages/${adminMsgId}`);
    check(
      "un participant ne peut pas supprimer le message d'autrui (404)",
      r.status === 404
    );

    r = await admin("DELETE", `/sessions/${sessionId}/messages/${adminMsgId}`);
    check("l'admin supprime son message", r.status === 200);

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
      json: {
        settings: {
          fr: { platform_name: "CEEAC · Portail modifié", nav_library: "Mes documents" },
          en: { platform_name: "ECCAS · Updated portal" },
        },
      },
    });
    check(
      "l'admin modifie les contenus du portail (fr + en)",
      r.status === 200 && r.data.settings.fr.platform_name === "CEEAC · Portail modifié"
    );

    r = await anon("GET", "/settings");
    check(
      "les contenus modifiés sont visibles publiquement (page de connexion)",
      r.data.settings.platform_name === "CEEAC · Portail modifié"
    );
    check(
      "le libellé de menu participant personnalisé est servi",
      r.data.settings.nav_library === "Mes documents"
    );

    r = await anon("GET", "/settings?lang=en");
    check(
      "les contenus anglais sont servis pour lang=en",
      r.data.settings.platform_name === "ECCAS · Updated portal"
    );

    r = await anon("GET", "/settings?lang=pt");
    check(
      "les contenus portugais par défaut sont présents (lang=pt)",
      typeof r.data.settings.org_full_name === "string" &&
        r.data.settings.org_full_name.includes("Comité Técnico")
    );

    // ─── Robustesse : paramètres invalides ne tuent pas le serveur ──
    r = await admin("GET", "/sessions/pas-un-uuid/messages");
    check("UUID invalide → 404 propre (pas de crash)", r.status === 404);
    r = await admin("GET", "/documents/pas-un-uuid/download/fr");
    check("téléchargement avec id invalide → 404", r.status === 404);
    r = await admin("GET", "/health");
    check("le serveur répond toujours après les requêtes invalides", r.status === 200);

    // ─── Accès de session non visibles par les participants ─────────
    r = await participant("GET", "/sessions");
    check(
      "les accès de session sont masqués aux participants",
      r.status === 200 && r.data.sessions[0].accessCode === undefined
    );
    check(
      "le compteur d'inscrits est exposé",
      typeof r.data.sessions[0].registeredCount === "number"
    );

    // ─── Auto-inscription avec les accès de session ──────────────────
    const registrant = makeClient();
    r = await registrant("POST", "/auth/register", {
      json: {
        accessCode,
        accessPassword: "MAUVAIS-MDP",
        name: "Mme Intruse",
        email: "intruse@test.td",
        country: "Tchad",
        functionTitle: "X",
        password: "MotDePasse#1",
      },
    });
    check("mot de passe de session erroné refusé (401)", r.status === 401);

    r = await registrant("POST", "/auth/register", {
      json: {
        accessCode,
        accessPassword,
        name: "Dr. Auto Inscrit",
        email: "auto.inscrit@test.td",
        country: "Tchad",
        functionTitle: "Conseiller Politique",
        institution: "Ministère de la Défense",
        password: "MotDePasse#1",
      },
    });
    check(
      "auto-inscription réussie (compte actif, sans changement forcé)",
      r.status === 201 &&
        r.data.user.status === "actif" &&
        r.data.user.mustChangePassword === false
    );
    const registrantId = r.data.user.id;

    r = await registrant("POST", "/auth/register", {
      json: {
        accessCode,
        accessPassword,
        name: "Doublon",
        email: "auto.inscrit@test.td",
        country: "Tchad",
        functionTitle: "X",
        password: "MotDePasse#2",
      },
    });
    check("e-mail déjà inscrit refusé (409)", r.status === 409);

    r = await registrant("GET", `/documents/${docId}/download/fr`);
    check(
      "l'auto-inscrit télécharge les documents de la session",
      r.status === 200
    );
    r = await registrant("GET", "/documents");
    check(
      "le flag « codé » est visible par les participants",
      r.status === 200 && r.data.documents[0].isCoded === true
    );

    r = await admin("GET", "/sessions");
    check(
      "le compteur d'inscrits de la session est incrémenté",
      r.data.sessions.find((s) => s.id === sessionId)?.registeredCount === 1
    );

    // ─── Accès invité : codes de session seuls, sans compte ─────────
    const guest = makeClient();
    r = await guest("POST", "/auth/session-login", {
      json: { accessCode, accessPassword: "MAUVAIS-CODE" },
    });
    check("accès invité : mot de passe erroné refusé (401)", r.status === 401);

    r = await guest("POST", "/auth/session-login", {
      json: { accessCode, accessPassword },
    });
    check(
      "accès invité avec les codes de session (rôle guest)",
      r.status === 200 && r.data.user.role === "guest"
    );

    r = await guest("GET", "/auth/me");
    check(
      "session invité persistée (/auth/me → guest + titre de session)",
      r.status === 200 &&
        r.data.user.role === "guest" &&
        typeof r.data.user.originSessionTitle === "string"
    );

    r = await guest("GET", "/documents");
    check(
      "l'invité voit uniquement les documents publiés",
      r.status === 200 && r.data.documents.every((d) => d.status === "publié")
    );

    r = await guest("GET", `/documents/${docId}/download/fr`);
    check("l'invité télécharge un document publié", r.status === 200);

    r = await guest("POST", `/sessions/${sessionId}/messages`, {
      json: { body: "Message d'invité" },
    });
    check(
      "l'invité ne peut pas écrire dans les discussions (403)",
      r.status === 403 && r.data.code === "guest_not_allowed"
    );

    r = await guest("POST", "/auth/change-password", {
      json: { currentPassword: "x", newPassword: "MotDePasse#9" },
    });
    check("l'invité ne peut pas changer de mot de passe (403)", r.status === 403);

    r = await guest("GET", "/participants");
    check("l'invité n'accède pas à l'administration (403)", r.status === 403);

    // ─── Régénération des accès ──────────────────────────────────────
    r = await admin("POST", `/sessions/${sessionId}/regenerate-access`);
    check(
      "régénération des accès de session",
      r.status === 200 && r.data.session.accessCode !== accessCode
    );
    r = await registrant("POST", "/auth/register", {
      json: {
        accessCode,
        accessPassword,
        name: "Retardataire",
        email: "retard@test.td",
        country: "Tchad",
        functionTitle: "X",
        password: "MotDePasse#3",
      },
    });
    check("les anciens accès ne fonctionnent plus (401)", r.status === 401);

    // Le jeton invité embarque l'ancien code : il est révoqué lui aussi.
    r = await guest("GET", "/documents");
    check(
      "les invités sont révoqués après régénération des accès (401)",
      r.status === 401
    );

    // ─── Référence auto-générée ──────────────────────────────────────
    r = await admin("POST", "/sessions", {
      json: { title: "Session sans référence explicite", startDate: "2026-11-10" },
    });
    check(
      "référence auto-générée au format CTS-APPS/AAAA/NN",
      r.status === 201 && /^CTS-APPS\/2026\/\d{2}$/.test(r.data.session.reference)
    );
    await admin("DELETE", `/sessions/${r.data.session.id}`);

    // ─── Diffusion par e-mail (SMTP non configuré → 503 explicite) ──
    r = await admin("POST", `/sessions/${sessionId}/broadcast`, {
      json: {
        subject: "Rapport final",
        message: "Veuillez trouver le rapport de la session.",
        documentIds: [docId],
        scope: "all",
      },
    });
    check(
      "diffusion sans SMTP → 503 avec code explicite",
      r.status === 503 && r.data.code === "smtp_not_configured"
    );

    // ─── Révocation des jetons ───────────────────────────────────────
    r = await admin("POST", `/participants/${registrantId}/reset-password`);
    check("réinitialisation du mot de passe de l'auto-inscrit", r.status === 200);
    r = await registrant("GET", "/auth/me");
    check(
      "les sessions ouvertes sont révoquées après réinitialisation (401)",
      r.status === 401
    );

    r = await admin("PUT", `/participants/${participantId}`, {
      json: {
        name: "Dr. Test Expert",
        email: "expert@test.cd",
        country: "RDC",
        functionTitle: "Expert Senior",
        institution: "MAE",
        status: "inactif",
      },
    });
    check("désactivation du participant", r.status === 200);
    r = await participant("GET", "/documents");
    check(
      "un compte désactivé perd l'accès immédiatement (401)",
      r.status === 401
    );

    // ─── Suppression ────────────────────────────────────────────────
    r = await admin("DELETE", `/documents/${docId}`);
    check("suppression document (fichier inclus)", r.status === 200);
    r = await admin("DELETE", `/participants/${participantId}`);
    check("suppression participant", r.status === 200);
    r = await admin("DELETE", `/participants/${registrantId}`);
    check("suppression de l'auto-inscrit", r.status === 200);

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
