/**
 * Captures d'écran réelles de la plateforme pour le guide utilisateur,
 * dans les 4 langues de la CEEAC (FR, EN, PT, ES).
 * - Crée des données de démonstration via l'API (réunion, documents PDF et
 *   Word réels générés à la volée, comptes participants)
 * - Photographie le parcours complet dans chaque langue d'interface,
 *   y compris le lecteur de documents intégré
 * - Supprime toutes les données de démonstration à la fin (même en cas d'échec)
 *
 * Usage : node screenshots.mjs [fr en pt es]   (par défaut : les 4 langues)
 */
import { chromium } from "playwright";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, "../..");
const BASE = process.env.BASE ?? "http://localhost:3001";
const OUT = path.join(HERE, "captures");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@ceeac-eccas.org";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ChangezMoi!2025";
const DEMO_EMAIL = "a.ndoye.demo@exemple.org";
const DEMO_PASSWORD = "Participant#2026";
const INVITED_EMAIL = "c.mbemba.demo@exemple.org";

const ALL_LANGS = ["fr", "en", "pt", "es"];
const LANG_LABELS = { fr: "Français", en: "English", pt: "Português", es: "Español" };
const LANGS = process.argv.slice(2).filter((l) => ALL_LANGS.includes(l));
if (LANGS.length === 0) LANGS.push(...ALL_LANGS);

/** Dictionnaire d'interface d'une langue (src/i18n/<lang>.ts), pour les libellés. */
function loadDict(lang) {
  const src = fs.readFileSync(path.join(PROJECT, "src", "i18n", `${lang}.ts`), "utf8");
  const start = src.indexOf("{", src.indexOf("export const"));
  const end = src.lastIndexOf("}");
  return Function(`"use strict"; return (${src.slice(start, end + 1)});`)();
}

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

// ─── Données de démonstration ────────────────────────────────────────────────
const DEMO_SESSION_TITLE = "33ème Session ordinaire du Conseil des Ministres de la CEEAC";
const DOCS = {
  report: "Rapport de la 33ème Session ordinaire du Conseil des Ministres",
  agenda: "Ordre du jour provisoire — 33ème Session ordinaire",
  note: "Note conceptuelle — Mécanisme de financement autonome",
  resolution: "Projet de résolution sur la libre circulation des personnes",
};
const DEMO_TITLES = Object.values(DOCS);

/** Contenu (fictif) du rapport de démonstration, par langue. */
const REPORT = {
  fr: {
    org: "Communauté Économique des États de l'Afrique Centrale",
    title: "Rapport de la 33ème Session ordinaire du Conseil des Ministres",
    place: "Malabo, 24 – 26 septembre 2026",
    sections: [
      ["1. Ouverture des travaux", "La 33ème Session ordinaire du Conseil des Ministres s'est tenue à Malabo, en présence des délégations des onze États membres. Le Président du Conseil a souligné l'importance de la paix et de la sécurité régionales pour l'intégration économique de l'Afrique centrale."],
      ["2. Adoption de l'ordre du jour", "Le Conseil a adopté l'ordre du jour provisoire soumis par la Commission, après y avoir ajouté un point relatif au financement autonome de la Communauté."],
      ["3. Paix et sécurité", "Les Ministres ont examiné le rapport sur la situation sécuritaire dans la sous-région. Ils ont salué les progrès réalisés dans la mise en œuvre de l'architecture régionale de paix et de sécurité et encouragé le renforcement de la coopération transfrontalière."],
      ["4. Libre circulation des personnes", "Le Conseil a pris acte des avancées enregistrées dans la mise en œuvre de la libre circulation des personnes et des biens, et a recommandé l'harmonisation des documents de voyage."],
      ["5. Recommandations", "Le Conseil recommande à la Conférence des Chefs d'État et de Gouvernement d'adopter le projet de résolution sur la libre circulation et d'approuver le mécanisme de financement autonome."],
    ],
  },
  en: {
    org: "Economic Community of Central African States",
    title: "Report of the 33rd Ordinary Session of the Council of Ministers",
    place: "Malabo, 24 – 26 September 2026",
    sections: [
      ["1. Opening of the proceedings", "The 33rd Ordinary Session of the Council of Ministers was held in Malabo, in the presence of the delegations of the eleven Member States. The Chair of the Council stressed the importance of regional peace and security for the economic integration of Central Africa."],
      ["2. Adoption of the agenda", "The Council adopted the provisional agenda submitted by the Commission, after adding an item on the autonomous financing of the Community."],
      ["3. Peace and security", "The Ministers considered the report on the security situation in the sub-region. They welcomed the progress made in implementing the regional peace and security architecture and encouraged stronger cross-border cooperation."],
      ["4. Free movement of persons", "The Council took note of the progress achieved in implementing the free movement of persons and goods, and recommended the harmonisation of travel documents."],
      ["5. Recommendations", "The Council recommends that the Conference of Heads of State and Government adopt the draft resolution on free movement and approve the autonomous financing mechanism."],
    ],
  },
  pt: {
    org: "Comunidade Económica dos Estados da África Central",
    title: "Relatório da 33.ª Sessão Ordinária do Conselho de Ministros",
    place: "Malabo, 24 – 26 de setembro de 2026",
    sections: [
      ["1. Abertura dos trabalhos", "A 33.ª Sessão Ordinária do Conselho de Ministros realizou-se em Malabo, na presença das delegações dos onze Estados-Membros. O Presidente do Conselho sublinhou a importância da paz e da segurança regionais para a integração económica da África Central."],
      ["2. Adoção da ordem do dia", "O Conselho adotou a ordem do dia provisória apresentada pela Comissão, após aditar um ponto relativo ao financiamento autónomo da Comunidade."],
      ["3. Paz e segurança", "Os Ministros examinaram o relatório sobre a situação de segurança na sub-região. Saudaram os progressos realizados na implementação da arquitetura regional de paz e segurança e incentivaram o reforço da cooperação transfronteiriça."],
      ["4. Livre circulação de pessoas", "O Conselho tomou nota dos avanços registados na implementação da livre circulação de pessoas e bens e recomendou a harmonização dos documentos de viagem."],
      ["5. Recomendações", "O Conselho recomenda à Conferência dos Chefes de Estado e de Governo que adote o projeto de resolução sobre a livre circulação e aprove o mecanismo de financiamento autónomo."],
    ],
  },
  es: {
    org: "Comunidad Económica de los Estados de África Central",
    title: "Informe de la 33.ª Sesión Ordinaria del Consejo de Ministros",
    place: "Malabo, 24 – 26 de septiembre de 2026",
    sections: [
      ["1. Apertura de los trabajos", "La 33.ª Sesión Ordinaria del Consejo de Ministros se celebró en Malabo, en presencia de las delegaciones de los once Estados miembros. El Presidente del Consejo destacó la importancia de la paz y la seguridad regionales para la integración económica de África Central."],
      ["2. Aprobación del orden del día", "El Consejo aprobó el orden del día provisional presentado por la Comisión, tras añadir un punto relativo a la financiación autónoma de la Comunidad."],
      ["3. Paz y seguridad", "Los Ministros examinaron el informe sobre la situación de seguridad en la subregión. Celebraron los avances logrados en la aplicación de la arquitectura regional de paz y seguridad y alentaron el refuerzo de la cooperación transfronteriza."],
      ["4. Libre circulación de personas", "El Consejo tomó nota de los avances registrados en la aplicación de la libre circulación de personas y bienes, y recomendó la armonización de los documentos de viaje."],
      ["5. Recomendaciones", "El Consejo recomienda a la Conferencia de Jefes de Estado y de Gobierno que adopte el proyecto de resolución sobre la libre circulación y apruebe el mecanismo de financiación autónoma."],
    ],
  },
};

/** Mot recherché dans le lecteur (présent dans le rapport de démonstration). */
const SEARCH_WORD = { fr: "sécurité", en: "security", pt: "segurança", es: "seguridad" };

const DEMO_MESSAGES = {
  fr: [
    ["admin", "Bienvenue à toutes et à tous. Les documents de travail de la session sont disponibles dans la bibliothèque, dans les quatre langues."],
    ["participant", "Merci. Le projet de résolution sera-t-il examiné dès la première journée ?"],
    ["admin", "Oui, il est inscrit au point 4 de l'ordre du jour provisoire."],
  ],
  en: [
    ["admin", "Welcome, everyone. The working documents of the session are available in the library, in all four languages."],
    ["participant", "Thank you. Will the draft resolution be considered on the first day?"],
    ["admin", "Yes, it is item 4 of the provisional agenda."],
  ],
  pt: [
    ["admin", "Bem-vindos a todos. Os documentos de trabalho da sessão estão disponíveis na biblioteca, nas quatro línguas."],
    ["participant", "Obrigada. O projeto de resolução será examinado logo no primeiro dia?"],
    ["admin", "Sim, está inscrito no ponto 4 da ordem do dia provisória."],
  ],
  es: [
    ["admin", "Bienvenidos a todos. Los documentos de trabajo de la sesión están disponibles en la biblioteca, en los cuatro idiomas."],
    ["participant", "Gracias. ¿Se examinará el proyecto de resolución el primer día?"],
    ["admin", "Sí, figura en el punto 4 del orden del día provisional."],
  ],
};

const logoDataUrl = `data:image/png;base64,${fs
  .readFileSync(path.join(PROJECT, "logo_ceeac.png"))
  .toString("base64")}`;

/** HTML d'un document officiel de démonstration (rendu en PDF par Chromium). */
function reportHtml(c, pages = 3) {
  const per = Math.ceil(c.sections.length / pages);
  const chunks = Array.from({ length: pages }, (_, i) => c.sections.slice(i * per, (i + 1) * per));
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 22mm 20mm; }
    body { font-family: "Times New Roman", serif; color: #111; font-size: 12.5pt; line-height: 1.55; }
    .head { text-align: center; border-bottom: 2px solid #0077c8; padding-bottom: 10px; margin-bottom: 26px; }
    .head img { width: 70px; height: 70px; }
    .org { font-family: Arial, sans-serif; font-size: 10pt; letter-spacing: .04em; text-transform: uppercase; color: #073e63; margin-top: 6px; }
    h1 { font-family: Arial, sans-serif; font-size: 17pt; text-align: center; color: #073e63; margin: 0 0 6px; }
    .place { text-align: center; font-style: italic; color: #444; margin-bottom: 26px; }
    h2 { font-family: Arial, sans-serif; font-size: 12.5pt; color: #0077c8; margin: 22px 0 6px; }
    p { text-align: justify; margin: 0 0 10px; }
    .page { page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .foot { margin-top: 40px; text-align: right; font-style: italic; }
  </style></head><body>
  ${chunks
    .map(
      (secs, i) => `<div class="page">
      ${i === 0 ? `<div class="head"><img src="${logoDataUrl}"><div class="org">${c.org}</div></div><h1>${c.title}</h1><div class="place">${c.place}</div>` : ""}
      ${secs.map(([h, t]) => `<h2>${h}</h2><p>${t}</p><p>${t}</p>`).join("")}
      ${i === pages - 1 ? `<p class="foot">${c.place}</p>` : ""}
    </div>`
    )
    .join("")}
  </body></html>`;
}

async function makePdf(browser, html) {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  const buf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
  await page.close();
  return buf;
}

/** Document Word (.docx) de démonstration : projet de résolution. */
async function makeDocx() {
  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 24 } } } },
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "COMMUNAUTÉ ÉCONOMIQUE DES ÉTATS DE L'AFRIQUE CENTRALE", bold: true, color: "073E63" })],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 300 },
            children: [new TextRun({ text: "Projet de résolution sur la libre circulation des personnes", bold: true, size: 32, color: "0077C8" })],
          }),
          ...[
            "Le Conseil des Ministres,",
            "Vu le Traité instituant la Communauté Économique des États de l'Afrique Centrale ;",
            "Considérant l'importance de la libre circulation des personnes et des biens pour l'intégration régionale ;",
            "Article 1 — Les États membres s'engagent à harmoniser leurs documents de voyage avant la fin de l'année 2027.",
            "Article 2 — La Commission est chargée du suivi de la mise en œuvre de la présente résolution et en rend compte à la prochaine session ordinaire.",
          ].map((text) => new Paragraph({ spacing: { after: 200, line: 320 }, children: [new TextRun(text)] })),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

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
  const browser = await chromium
    .launch()
    .catch(() => chromium.launch({ channel: "msedge" })); // Edge du poste (Windows)

  const admin = makeClient();
  console.log("· Connexion admin + création des données de démonstration…");
  await admin("POST", "/auth/login", { json: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  await purgeDemoData(admin);

  const { session } = await admin("POST", "/sessions", {
    json: {
      title: DEMO_SESSION_TITLE,
      organ: "Conseil des Ministres",
      location: "Malabo, Guinée Équatoriale",
      startDate: "2026-11-24",
      endDate: "2026-11-26",
      status: "en-cours",
      description:
        "Session ordinaire consacrée à la paix et à la sécurité régionales, à la libre circulation des personnes et au financement autonome de la Communauté.",
      expectedParticipants: 60,
    },
  });

  const { categories } = await admin("GET", "/categories");
  const catId = (name) => categories.find((c) => c.name === name)?.id;
  // Noms de fichiers en ASCII : la base de dev locale peut être en WIN1252.
  const addDoc = async (title, files, { category, coded = false } = {}) => {
    const fd = new FormData();
    for (const [lang, { buf, name, type }] of Object.entries(files)) {
      fd.append(`file_${lang}`, new Blob([buf], { type }), name);
    }
    fd.append("title", title);
    if (catId(category)) fd.append("categoryId", catId(category));
    fd.append("sessionId", session.id);
    fd.append("status", "publié");
    fd.append("isCoded", String(coded));
    return admin("POST", "/documents", { form: fd });
  };
  const PDF = "application/pdf";
  const reportFiles = {};
  for (const l of ALL_LANGS) {
    reportFiles[l] = { buf: await makePdf(browser, reportHtml(REPORT[l])), name: `rapport-cm33-${l}.pdf`, type: PDF };
  }
  await addDoc(DOCS.report, reportFiles, { category: "Rapport" });
  await addDoc(
    DOCS.agenda,
    {
      fr: { buf: await makePdf(browser, reportHtml({ ...REPORT.fr, title: DOCS.agenda }, 1)), name: "ordre-du-jour-fr.pdf", type: PDF },
      en: { buf: await makePdf(browser, reportHtml({ ...REPORT.en, title: "Provisional agenda — 33rd Ordinary Session" }, 1)), name: "agenda-en.pdf", type: PDF },
    },
    { category: "Ordre du Jour" }
  );
  await addDoc(
    DOCS.note,
    { fr: { buf: await makePdf(browser, reportHtml({ ...REPORT.fr, title: DOCS.note }, 1)), name: "note-conceptuelle-fr.pdf", type: PDF } },
    { category: "Note Conceptuelle", coded: true }
  );
  await addDoc(
    DOCS.resolution,
    {
      fr: {
        buf: await makeDocx(),
        name: "projet-resolution-fr.docx",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    },
    { category: "Résolution" }
  );

  // Participant créé par l'admin (écran « première connexion »)
  const invited = await admin("POST", "/participants", {
    json: {
      name: "Mme Clarisse Mbemba",
      email: INVITED_EMAIL,
      country: "Congo",
      functionTitle: "Conseillère Juridique",
      institution: "Ministère des Affaires Étrangères",
      status: "actif",
    },
  });

  // Participant auto-inscrit (compte utilisé pour les captures de l'espace)
  const registrant = makeClient();
  await registrant("POST", "/auth/register", {
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

  try {
    for (const lang of LANGS) {
      const t = loadDict(lang);
      const dir = path.join(OUT, lang);
      fs.mkdirSync(dir, { recursive: true });
      console.log(`· Captures en ${lang.toUpperCase()}…`);

      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 2,
        locale: lang,
      });
      await context.addInitScript((l) => {
        try {
          localStorage.setItem("cts_lang", l);
        } catch {
          /* stockage indisponible */
        }
      }, lang);
      const page = await context.newPage();
      const shot = async (name, opts = {}) => {
        await page.waitForTimeout(700);
        await page.screenshot({ path: path.join(dir, `${name}.png`), ...opts });
        console.log(`  ✓ ${lang}/${name}.png`);
      };
      const login = async (email, password) => {
        await page.goto(`${BASE}/connexion`, { waitUntil: "networkidle" });
        await page.locator("#email").fill(email);
        await page.locator("#password").fill(password);
        await page.locator("form button[type=submit]").first().click();
      };
      const openViewer = async (title) => {
        await page.getByRole("button", { name: title, exact: true }).click();
        await page.getByRole("dialog").waitFor();
        await page.waitForSelector("[role=dialog] [data-page='1']", { timeout: 20000 });
        await page.waitForTimeout(1200);
      };

      // 1. Connexion — onglet « J'ai un compte »
      await page.goto(`${BASE}/connexion`, { waitUntil: "networkidle" });
      await shot("01-connexion");

      // 1b. Onglet « Codes de réunion » (accès invité)
      await page.locator("[role=tab]").nth(1).click();
      await page.locator("#access-code").fill(session.accessCode);
      await page.locator("#access-password").fill(session.accessPassword);
      await shot("01b-connexion-codes");

      // 1c. Espace invité (bibliothèque + bandeau invité)
      await page.locator("form button[type=submit]").first().click();
      await page.waitForURL("**/espace");
      await page.waitForSelector(`text=${DOCS.report}`);
      await shot("03b-espace-invite");
      await context.clearCookies();

      // 2. Inscription (préremplie de façon réaliste)
      await page.goto(`${BASE}/inscription`, { waitUntil: "networkidle" });
      await page.getByPlaceholder("CEEAC-XXXXXX").fill(session.accessCode);
      await page.getByPlaceholder("XXXX-XXXX").fill(session.accessPassword);
      await page.getByPlaceholder(t["part.fullNamePh"]).fill("Dr. Amina Ndoye");
      await page.getByPlaceholder(t["part.emailPh"]).fill("a.ndoye@interieur.gouv.cd");
      await page.locator("form select").first().selectOption("RDC");
      await page.getByPlaceholder(t["part.functionPh"]).fill("Experte en Sécurité Régionale");
      await page.getByPlaceholder(t["part.institutionPh"]).fill("Ministère de l'Intérieur");
      await shot("02-inscription");

      // 3. Première connexion (compte créé par le Secrétariat)
      await login(INVITED_EMAIL, invited.temporaryPassword);
      await page.waitForURL("**/premiere-connexion");
      // La langue enregistrée du compte (fr) s'applique à la connexion : on
      // choisit la langue du guide avec les drapeaux, comme l'utilisateur.
      await page.getByRole("button", { name: LANG_LABELS[lang], exact: true }).first().click();
      await shot("03-premiere-connexion");
      await context.clearCookies();

      // 4. Bibliothèque du participant (langue d'interface enregistrée sur le compte)
      await registrant("PUT", "/auth/preferences", { json: { uiLang: lang } });
      await login(DEMO_EMAIL, DEMO_PASSWORD);
      await page.waitForURL("**/espace");
      await page.waitForSelector(`text=${DOCS.report}`);
      await shot("04-bibliotheque");

      // 4b. Lecteur intégré : rapport (version de la langue d'interface)
      await openViewer(DOCS.report);
      await shot("04b-lecteur");

      // 4c. Recherche plein texte dans le lecteur
      await page.getByRole("button", { name: t["viewer.search"] }).click();
      await page.getByRole("textbox", { name: t["viewer.search"] }).fill(SEARCH_WORD[lang]);
      await page.keyboard.press("Enter");
      await page.waitForSelector("[role=dialog] .viewer-hit", { timeout: 15000 });
      await shot("04c-lecteur-recherche");
      await page.keyboard.press("Escape"); // ferme la recherche
      await page.keyboard.press("Escape"); // ferme le lecteur
      await page.getByRole("dialog").waitFor({ state: "detached" });

      // 4d. Lecteur : document Word
      await openViewer(DOCS.resolution);
      await shot("04d-lecteur-word");
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "detached" });

      // 5. Réunions + fil de discussion (messages dans la langue du guide)
      const posted = [];
      for (const [who, body] of DEMO_MESSAGES[lang]) {
        const client = who === "admin" ? admin : registrant;
        const res = await client("POST", `/sessions/${session.id}/messages`, { json: { body } });
        if (res?.message?.id) posted.push(res.message.id);
      }
      await page.goto(`${BASE}/espace/reunions`, { waitUntil: "networkidle" });
      const card = page
        .locator("div.bg-white.rounded-xl")
        .filter({ hasText: DEMO_SESSION_TITLE })
        .first();
      await card.scrollIntoViewIfNeeded();
      await card.getByRole("button", { name: t["sess.discussion"] }).click();
      await page.waitForSelector(`text=${DEMO_MESSAGES[lang][0][1]}`, { timeout: 10000 });
      await shot("05-reunions-discussion");
      for (const id of posted) {
        await admin("DELETE", `/sessions/${session.id}/messages/${id}`).catch(() => {});
      }

      // 5b. Ajouter une réunion (codes d'une autre réunion)
      await page.goto(`${BASE}/espace/reunions`, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: t["unlock.title"] }).click();
      await shot("05b-ajouter-reunion");

      // 6. Profil
      await page.goto(`${BASE}/espace/profil`, { waitUntil: "networkidle" });
      await shot("06-profil");

      // 7. Gros plan sur l'en-tête (taille du texte, langues, profil)
      await page.goto(`${BASE}/espace`, { waitUntil: "networkidle" });
      await shot("07-entete-outils", { clip: { x: 520, y: 0, width: 760, height: 52 } });

      // 8. Guide intégré
      await page.goto(`${BASE}/espace/guide`, { waitUntil: "networkidle" });
      await shot("08-guide-integre");

      await context.close();
    }
  } finally {
    await browser.close();
    console.log("· Nettoyage des données de démonstration…");
    await purgeDemoData(admin).catch((err) =>
      console.warn(`  ! échec du nettoyage : ${err.message}`)
    );
  }
  console.log("Terminé — captures dans", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
