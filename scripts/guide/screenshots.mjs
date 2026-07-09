/**
 * Captures d'écran réelles de la plateforme pour le guide participant.
 * - Crée des données de démonstration via l'API (session, documents, comptes)
 * - Photographie le parcours participant complet
 * - Supprime toutes les données de démonstration à la fin
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "http://localhost:3001";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "captures");
fs.mkdirSync(OUT, { recursive: true });

const ADMIN_EMAIL = "admin@ceeac-eccas.org";
const ADMIN_PASSWORD = "ChangezMoi!2025";
const DEMO_EMAIL = "a.ndoye.demo@exemple.org";
const DEMO_PASSWORD = "Participant#2026";

// ─── Client API minimal avec cookie ─────────────────────────────────────────
function makeClient() {
  let cookie = "";
  return async (method, url, { json, form } = {}) => {
    const headers = {};
    if (cookie) headers.cookie = cookie;
    let body;
    if (json !== undefined) {
      headers["content-type"] = "application/json";
      body = JSON.stringify(json);
    } else if (form) body = form;
    const res = await fetch(`${BASE}/api${url}`, { method, headers, body });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : null;
    if (res.status >= 400) {
      throw new Error(`${method} ${url} → ${res.status} ${JSON.stringify(data)}`);
    }
    return data;
  };
}

const pdf = () =>
  new Blob([new TextEncoder().encode("%PDF-1.4\n% document de démonstration\n%%EOF")], {
    type: "application/pdf",
  });

const DEMO_TITLES = [
  "Rapport de la 2ème Session Ordinaire du CTS-APPS",
  "Note Conceptuelle — Réforme du COPAX",
  "Ordre du Jour Provisoire — 3ème Session Ordinaire",
];
const DEMO_SESSION_TITLE = "3ème Session Ordinaire du CTS-APPS";

/** Supprime toute donnée de démonstration (résidus d'exécutions échouées inclus). */
async function purgeDemoData(admin) {
  const { documents } = await admin("GET", "/documents");
  for (const d of documents.filter((d) => DEMO_TITLES.includes(d.title))) {
    await admin("DELETE", `/documents/${d.id}`).catch(() => {});
  }
  const { participants } = await admin("GET", "/participants");
  for (const p of participants.filter((p) => p.email.endsWith("demo@exemple.org"))) {
    await admin("DELETE", `/participants/${p.id}`).catch(() => {});
  }
  const { sessions } = await admin("GET", "/sessions");
  for (const s of sessions.filter((s) => s.title === DEMO_SESSION_TITLE)) {
    await admin("DELETE", `/sessions/${s.id}`).catch(() => {});
  }
}

async function main() {
  const admin = makeClient();
  console.log("· Connexion admin + création des données de démonstration…");
  await admin("POST", "/auth/login", {
    json: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  await purgeDemoData(admin);

  // Session de démonstration
  const { session } = await admin("POST", "/sessions", {
    json: {
      title: "3ème Session Ordinaire du CTS-APPS",
      location: "Brazzaville, République du Congo",
      startDate: "2026-09-22",
      endDate: "2026-09-25",
      status: "à-venir",
      description:
        "Session ordinaire consacrée à l'examen du rapport d'activités du DAPPS, à la réforme du COPAX et à l'adoption de la feuille de route 2027.",
      expectedParticipants: 45,
    },
  });

  // Documents de démonstration (noms de fichiers en ASCII pur : la base de
  // dev locale peut être encodée en WIN1252)
  const slug = (s) =>
    s
      .normalize("NFD")
      .replace(/[^\x20-\x7E]/g, "")
      .toLowerCase()
      .replaceAll(" ", "-")
      .replace(/-+/g, "-")
      .slice(0, 30);
  const mkForm = (title, coded, categoryId) => {
    const fd = new FormData();
    fd.append("file_fr", pdf(), `${slug(title)}-fr.pdf`);
    fd.append("file_en", pdf(), `${slug(title)}-en.pdf`);
    fd.append("title", title);
    if (categoryId) fd.append("categoryId", categoryId);
    fd.append("sessionId", session.id);
    fd.append("status", "publié");
    fd.append("isCoded", String(coded));
    return fd;
  };
  const { categories } = await admin("GET", "/categories");
  const catId = (name) => categories.find((c) => c.name === name)?.id;

  const doc1 = await admin("POST", "/documents", {
    form: mkForm("Rapport de la 2ème Session Ordinaire du CTS-APPS", false, catId("Rapport")),
  });
  const doc2 = await admin("POST", "/documents", {
    form: mkForm("Note Conceptuelle — Réforme du COPAX", true, catId("Note Conceptuelle")),
  });
  const doc3 = await admin("POST", "/documents", {
    form: mkForm("Ordre du Jour Provisoire — 3ème Session Ordinaire", false, catId("Ordre du Jour")),
  });

  // Participant créé par l'admin (pour l'écran « première connexion »)
  const invited = await admin("POST", "/participants", {
    json: {
      name: "Mme Clarisse Mbemba",
      email: "c.mbemba.demo@exemple.org",
      country: "Congo",
      functionTitle: "Conseillère Juridique",
      institution: "Ministère des Affaires Étrangères",
      status: "actif",
    },
  });

  // Participant auto-inscrit (compte utilisé pour les captures de l'espace)
  const registrant = makeClient();
  const reg = await registrant("POST", "/auth/register", {
    json: {
      accessCode: session.accessCode,
      accessPassword: session.accessPassword,
      name: "Dr. Amina Ndoye",
      email: DEMO_EMAIL,
      country: "RDC",
      functionTitle: "Experte en Sécurité Régionale",
      institution: "Ministère de l'Intérieur",
      password: DEMO_PASSWORD,
    },
  });

  // Messages dans le fil de discussion
  await admin("POST", `/sessions/${session.id}/messages`, {
    json: {
      body: "Bienvenue à toutes et à tous. Les documents de travail de la session sont désormais disponibles dans la bibliothèque.",
    },
  });
  await registrant("POST", `/sessions/${session.id}/messages`, {
    json: {
      body: "Merci. La version anglaise du rapport sera-t-elle également disponible avant l'ouverture ?",
    },
  });
  await admin("POST", `/sessions/${session.id}/messages`, {
    json: { body: "Oui, toutes les versions linguistiques sont déjà en ligne (FR et EN)." },
  });

  console.log("· Lancement du navigateur…");
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    locale: "fr-FR",
  });
  const page = await context.newPage();
  const shot = async (name) => {
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log(`  ✓ ${name}.png`);
  };

  try {
    // 1. Page de connexion (onglet « J'ai un compte »)
    await page.goto(`${BASE}/connexion`, { waitUntil: "networkidle" });
    await shot("01-connexion");

    // 1b. Onglet « Codes de session » (accès invité)
    await page.getByRole("tab", { name: "Codes de session" }).click();
    await page.locator("#access-code").fill(session.accessCode);
    await page.locator("#access-password").fill(session.accessPassword);
    await shot("01b-connexion-codes");

    // 1c. Espace invité (bibliothèque + bandeau invité)
    await page.getByRole("button", { name: "Accéder aux documents" }).click();
    await page.waitForURL("**/espace");
    await page.waitForSelector("text=Rapport de la 2ème Session");
    await shot("03b-espace-invite");
    await page.context().clearCookies();

    // 2. Page d'inscription (préremplie de façon réaliste)
    await page.goto(`${BASE}/inscription`, { waitUntil: "networkidle" });
    await page.getByPlaceholder("CTS-XXXXXX").fill(session.accessCode);
    await page.getByPlaceholder("XXXX-XXXX").fill(session.accessPassword);
    await page.getByPlaceholder("Dr. Prénom Nom").fill("Dr. Amina Ndoye");
    await page.getByPlaceholder("prenom.nom@institution.pays").fill("a.ndoye@interieur.gouv.cd");
    await page
      .getByRole("group", { name: "Vos informations" })
      .getByRole("combobox")
      .selectOption({ label: "RDC" });
    await page.getByPlaceholder("Expert Principal").fill("Experte en Sécurité Régionale");
    await page
      .getByPlaceholder("Ministère des Affaires Étrangères")
      .fill("Ministère de l'Intérieur");
    await shot("02-inscription");

    // 3. Première connexion (compte créé par l'admin, mot de passe provisoire)
    await page.goto(`${BASE}/connexion`, { waitUntil: "networkidle" });
    await page.locator("#email").fill("c.mbemba.demo@exemple.org");
    await page.locator("#password").fill(invited.temporaryPassword);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.waitForURL("**/premiere-connexion");
    await shot("03-premiere-connexion");
    await page.context().clearCookies();

    // 4. Connexion du participant de démonstration
    await page.goto(`${BASE}/connexion`, { waitUntil: "networkidle" });
    await page.locator("#email").fill(DEMO_EMAIL);
    await page.locator("#password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.waitForURL("**/espace");
    await page.waitForSelector("text=Rapport de la 2ème Session");
    await shot("04-bibliotheque");

    // 5. Sessions + fil de discussion ouvert (carte de NOTRE session de démo)
    await page.goto(`${BASE}/espace/sessions`, { waitUntil: "networkidle" });
    const demoCard = page
      .locator("div.bg-white.rounded-xl")
      .filter({ hasText: "3ème Session Ordinaire du CTS-APPS" })
      .first();
    await demoCard.scrollIntoViewIfNeeded();
    await demoCard.getByRole("button", { name: "Discussion" }).click();
    try {
      await page.waitForSelector("text=Bienvenue à toutes et à tous", { timeout: 8000 });
    } catch {
      await page.screenshot({ path: path.join(OUT, "debug-05.png"), fullPage: true });
      console.log("DEBUG card HTML:", (await demoCard.innerHTML()).slice(0, 2000));
      throw new Error("messages non visibles — voir debug-05.png");
    }
    await shot("05-sessions-discussion");

    // 6. Profil et préférences
    await page.goto(`${BASE}/espace/profil`, { waitUntil: "networkidle" });
    await shot("06-profil");

    // 7. Gros plan sur l'en-tête (taille de texte + langues avec drapeaux)
    await page.goto(`${BASE}/espace`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(OUT, "07-entete-outils.png"),
      clip: { x: 520, y: 0, width: 760, height: 52 },
    });
    console.log("  ✓ 07-entete-outils.png");
  } finally {
    await browser.close();

    console.log("· Nettoyage des données de démonstration…");
    await purgeDemoData(admin).catch((err) =>
      console.warn(`  ! échec du nettoyage : ${err.message}`)
    );
    void reg;
    void doc1;
    void doc2;
    void doc3;
  }
  console.log("Terminé — captures dans", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
