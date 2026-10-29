/**
 * Vérification rapide du lecteur intégré (PDF + Word) sur l'app locale :3001.
 * Ouvre chaque document consultable depuis la gestion documentaire, attend le
 * rendu, puis signale les erreurs de console. Captures dans ./captures/check-*.png
 */
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE ?? "http://localhost:3001";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "captures");

// Navigateur Playwright, sinon Edge installé sur le poste (Windows).
const browser = await chromium.launch().catch(() => chromium.launch({ channel: "msedge" }));
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];

await page.goto(`${BASE}/connexion`);
await page.locator("#email").fill(process.env.ADMIN_EMAIL ?? "admin@ceeac-eccas.org");
await page.locator("#password").fill(process.env.ADMIN_PASSWORD ?? "ChangezMoi!2025");
await page.locator("form button[type=submit]").first().click();
await page.waitForURL("**/admin");
// Console surveillée après connexion (le 401 de /auth/me avant connexion est normal).
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(`${BASE}/admin/documents`, { waitUntil: "networkidle" });

const eyes = page.locator("button:has(svg.lucide-eye)");
const count = await eyes.count();
console.log(`${count} bouton(s) de lecture`);
for (let i = 0; i < count; i++) {
  await eyes.nth(i).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await page
    .waitForSelector("[role=dialog] [data-page='1'], [role=dialog] h3", { timeout: 20000 })
    .catch(() => {});
  await page.waitForTimeout(1500);
  const pages = await dialog.locator("[data-page]").count();
  const state = await dialog.locator("h3").allTextContents();
  console.log(`  document ${i + 1} : ${pages} page(s) rendue(s) ${state.join(" / ")}`);
  await page.screenshot({ path: path.join(OUT, `check-${i + 1}.png`) });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
}

await browser.close();
if (errors.length) {
  console.log("Erreurs console :\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
console.log("Aucune erreur console.");
