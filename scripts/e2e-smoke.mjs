/**
 * Test de fumée E2E — BTT-LUX (web)
 *
 * Scénario : connexion réelle via le formulaire, puis vérification que les
 * écrans admin « Missions » et « Détails d'un chantier » affichent bien les
 * données renvoyées par le backend.
 *
 * Ce test ne code PAS les valeurs en dur : il interroge d'abord l'API pour
 * obtenir la « vérité terrain » (missions, chantiers, détail), puis vérifie
 * que ces mêmes valeurs apparaissent dans l'interface. Il reste donc valable
 * même quand les données de production évoluent.
 *
 * Prérequis (deux processus déjà lancés) :
 *   - proxy API : http://localhost:3002/api  (redirige vers le backend Render)
 *   - app web   : http://localhost:19006/    (export statique servi)
 *
 * Lancement :  npm run test:e2e
 * Variables d'environnement optionnelles :
 *   E2E_API_URL, E2E_APP_URL, E2E_EMAIL, E2E_PASSWORD
 *
 * Navigateur : Chrome installé sur la machine (aucun téléchargement, via
 * `playwright-core` et le channel « chrome »).
 */

import { chromium } from "playwright-core";

const API_URL = process.env.E2E_API_URL || "http://localhost:3002/api";
const APP_URL = process.env.E2E_APP_URL || "http://localhost:19006/";
const EMAIL = process.env.E2E_EMAIL || "admin@btt-lux.com";
const PASSWORD = process.env.E2E_PASSWORD || "Superman1@2026";

// Référentiel des étapes, aligné sur src/constants/etapes.js (via l'i18n fr).
const STEP_NAMES = [
  "Devis reçu",
  "Visite technique",
  "Commande validée",
  "Livraison",
  "Pose en cours",
  "Chantier terminé",
];

const NAV_TIMEOUT = 45_000; // Render peut être froid : on laisse le temps.
const WAIT = 20_000;

// ---------------------------------------------------------------------------
// Petit harnais d'assertions : on collecte les échecs plutôt que de tout
// interrompre, pour voir d'un coup d'œil ce qui casse.
// ---------------------------------------------------------------------------
let failures = 0;
let checks = 0;

function pass(label) {
  checks += 1;
  console.log(`  \u2713 ${label}`);
}

function fail(label, detail) {
  checks += 1;
  failures += 1;
  console.log(`  \u2717 ${label}${detail ? `\n      → ${detail}` : ""}`);
}

// React Navigation garde les écrans précédents montés mais masqués : on ne
// considère donc que les éléments réellement visibles.
function visibleText(page, text) {
  return page.getByText(text, { exact: true }).filter({ visible: true });
}

async function expectText(page, text, label) {
  try {
    await visibleText(page, text)
      .first()
      .waitFor({ state: "visible", timeout: WAIT });
    pass(label || `texte visible : « ${text} »`);
  } catch {
    fail(label || `texte visible : « ${text} »`, `introuvable dans la page`);
  }
}

async function clickText(page, text) {
  const loc = visibleText(page, text).first();
  await loc.waitFor({ state: "visible", timeout: NAV_TIMEOUT });
  await loc.click();
}

// ---------------------------------------------------------------------------
// Accès API (vérité terrain)
// ---------------------------------------------------------------------------
async function fetchJson(path, { token, method = "GET", body } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(NAV_TIMEOUT),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → HTTP ${res.status} ${text.slice(0, 200)}`);
  }
  return data;
}

async function main() {
  console.log(`\nE2E smoke — ${APP_URL}  (API ${API_URL})\n`);

  // 1. Vérité terrain : le backend renvoie-t-il des données ?
  console.log("1) Récupération des données réelles du backend");
  const login = await fetchJson("/auth/login", {
    method: "POST",
    body: { email: EMAIL, mot_de_passe: PASSWORD },
  });
  const token = login?.token;
  if (!token) throw new Error("Réponse /auth/login sans token");
  console.log(
    `   → connecté : ${login?.user?.email} (rôle ${login?.user?.role})`,
  );

  const missions = await fetchJson("/missions", { token });
  const chantiers = await fetchJson("/chantiers/admin/tous", { token });
  const mission = Array.isArray(missions) ? missions[0] : null;
  const chantier = Array.isArray(chantiers) ? chantiers[0] : null;
  console.log(
    `   → ${missions.length} mission(s), ${chantiers.length} chantier(s) côté backend`,
  );
  if (mission) {
    console.log(
      `   → mission #${mission.id} : client="${mission.client_nom}" technicien="${mission.technicien_nom}" statut="${mission.statut}"`,
    );
  }
  let detail = null;
  if (chantier) {
    detail = await fetchJson(`/chantiers/${chantier.id}`, { token });
    console.log(
      `   → chantier #${chantier.id} : ville="${detail.ville}" surface="${detail.surface}" étape="${detail.etape}"`,
    );
  }

  // 2. Interface : connexion réelle puis navigation admin.
  console.log("\n2) Connexion via l'interface");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  try {
    await page.goto(APP_URL, { waitUntil: "domcontentloaded" });

    // Accueil hors session → connexion.
    await clickText(page, "Commencer");
    await expectText(page, "Se connecter", "écran de connexion affiché");

    const inputs = page.locator("input");
    await inputs.nth(0).fill(EMAIL);
    await inputs.nth(1).fill(PASSWORD);
    await clickText(page, "Se connecter");

    // Après connexion : accueil authentifié (tuile « Admin » visible).
    await expectText(page, "Admin", "connexion réussie → accueil admin affiché");

    console.log("\n3) Écran admin « Missions »");
    await clickText(page, "Admin");
    await expectText(page, "Tableau de bord", "tableau de bord admin affiché");
    await clickText(page, "Missions");
    await expectText(
      page,
      `${missions.length} missions`,
      `compteur « ${missions.length} missions » (issu du backend)`,
    );
    if (mission) {
      await expectText(page, `Mission #${mission.id}`);
      if (mission.client_nom) {
        await expectText(page, `Client : ${mission.client_nom}`);
      }
      if (mission.technicien_nom) {
        await expectText(page, `Technicien : ${mission.technicien_nom}`);
      }
    }

    console.log("\n4) Écran admin « Chantiers » → détail");
    // Rechargement : remet la pile de navigation sur l'accueil (session
    // conservée), puis on repasse par le tableau de bord admin.
    await page.reload({ waitUntil: "domcontentloaded" });
    await expectText(page, "Admin", "accueil restauré après rechargement");
    await clickText(page, "Admin");
    await expectText(page, "Tableau de bord", "tableau de bord admin (2e passage)");
    await clickText(page, "Chantiers");
    await expectText(
      page,
      `${chantiers.length} chantiers`,
      `compteur « ${chantiers.length} chantiers » (issu du backend)`,
    );
    if (chantier) {
      await expectText(page, `Chantier #${chantier.id} \u2014 Devis #${chantier.devis_id}`);
      const idx = STEP_NAMES.indexOf(chantier.etape);
      if (idx >= 0) await expectText(page, STEP_NAMES[idx], `pilule d'étape « ${STEP_NAMES[idx]} »`);

      await clickText(page, "Détails");
      await expectText(page, `Chantier #${chantier.id}`, "détail du chantier ouvert");
      await expectText(page, `Devis #${detail.devis_id}`);
      if (detail.ville) await expectText(page, `${detail.ville} \u00b7 ${detail.adresse || "\u2014"}`);
      if (detail.surface) await expectText(page, `${detail.surface} m²`);
      const detailIdx = STEP_NAMES.indexOf(detail.etape);
      if (detailIdx >= 0) {
        await expectText(page, `Étape ${detailIdx + 1}/${STEP_NAMES.length}`);
      }
      await expectText(page, "Historique", "section Historique affichée");
    }
  } catch (err) {
    fail("exécution du parcours", err.message);
    try {
      const { tmpdir } = await import("node:os");
      const p = `${tmpdir()}/btt-e2e-failure.png`;
      await page.screenshot({ path: p, fullPage: true });
      console.log(`   (capture d'écran : ${p})`);
    } catch {
      /* capture best-effort */
    }
  } finally {
    await browser.close();
  }

  if (consoleErrors.length) {
    console.log(`\nAvertissements console (${consoleErrors.length}) :`);
    consoleErrors.slice(0, 5).forEach((e) => console.log(`   ! ${e.slice(0, 160)}`));
  }

  console.log(
    `\nRésultat : ${checks - failures}/${checks} vérifications OK, ${failures} échec(s).\n`,
  );
  return failures > 0 ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`\nERREUR FATALE : ${err.stack || err.message}\n`);
    process.exit(1);
  });
