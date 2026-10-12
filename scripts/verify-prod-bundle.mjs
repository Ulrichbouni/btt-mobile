#!/usr/bin/env node
/**
 * Vérifie qu'un bundle de *production* ne contient aucun reliquat du raccourci
 * de connexion de développement (bouton « Connexion admin (dev) »).
 *
 * Le garde `__DEV__` de `src/components/DevQuickLogin.js` suffit en théorie :
 * `__DEV__` vaut `false` dans un bundle de production, le composant n'est donc
 * jamais rendu. Mais « jamais rendu » n'est pas « absent du bundle » — les
 * identifiants littéraux restent dans le fichier livré si le minifieur ne
 * propage pas la constante et n'élimine pas la branche morte. Ce script
 * transforme cette hypothèse en test.
 *
 * Ce qui est recherché, ce sont donc *les identifiants*, pas le nom du
 * composant : dans un bundle Hermes, les chaînes sont stockées dans une table
 * compactée sans séparateur, où « DevQuickLogin » se confond avec la clé i18n
 * légitime « auth.devQuickLogin » (qui, elle, doit être livrée). Chercher le nom
 * du composant produirait un faux positif systématique ; chercher le mot de
 * passe ne peut pas se tromper.
 *
 * Les identifiants sont *extraits de la source* (et du `.env` s'il existe)
 * plutôt que recopiés ici : si quelqu'un change la valeur de repli, le test suit
 * automatiquement et ne peut pas devenir silencieusement inopérant.
 *
 * Un témoin positif (`btt-backend-sgas.onrender.com`) est exigé dans le bundle :
 * sans lui, un export vide ou un scan cassé ferait passer le test à tort.
 *
 * Usage :
 *   npm run verify:prod-bundle                    # exporte (android) puis vérifie
 *   npm run verify:prod-bundle -- --platform web
 *   npm run verify:prod-bundle -- --scan <chemin> # vérifie un bundle existant
 *   npm run verify:prod-bundle -- --self-test     # exporte en mode DEV et exige
 *                                                 # que la fuite SOIT détectée
 *   npm run verify:prod-bundle -- --keep          # conserve le dossier exporté
 *
 * `--self-test` répond à la question « ce test prouve-t-il quelque chose ? » :
 * il exporte avec le drapeau `--dev`, où `__DEV__` vaut `true` et où les
 * identifiants sont donc bel et bien présents. Si le détecteur ne les trouve
 * pas là, il ne les trouverait pas non plus en production et le test serait
 * vert à tort.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "src/components/DevQuickLogin.js");
const POSITIVE_CONTROL = "btt-backend-sgas.onrender.com";
const ENV_FILE = path.join(ROOT, ".env");

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const value = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? null : argv[i + 1];
};

const PLATFORM = value("--platform") || "android";
const SCAN_TARGET = value("--scan");
const KEEP = flag("--keep");
const SELF_TEST = flag("--self-test");

const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

/** Les littéraux de repli réellement compilés dans le composant dev. */
function devCredentials() {
  const source = fs.readFileSync(SOURCE, "utf8");
  const grab = (variable) => {
    const m = source.match(
      new RegExp(`EXPO_PUBLIC_DEV_ADMIN_${variable}\\s*\\|\\|\\s*"([^"]*)"`),
    );
    // Un repli vide est desormais normal (mot de passe en dur supprime) :
    // seule l'absence de correspondance (source restructuree) fait echouer.
    if (!m) {
      fail(
        `impossible d'extraire le repli ${variable} depuis ${path.relative(ROOT, SOURCE)} — ` +
          "le test doit être mis à jour, il ne protège plus rien.",
      );
    }
    return m[1];
  };
  return { email: grab("EMAIL"), password: grab("PASSWORD") };
}

/** Valeurs réellement configurées dans `.env`, si le fichier existe. */
function configuredCredentials() {
  if (!fs.existsSync(ENV_FILE)) return { email: null, password: null };
  const lines = fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/);
  const read = (name) => {
    const line = lines.find((l) => l.trim().startsWith(`${name}=`));
    return line ? line.slice(line.indexOf("=") + 1).trim() : null;
  };
  return {
    email: read("EXPO_PUBLIC_DEV_ADMIN_EMAIL"),
    password: read("EXPO_PUBLIC_DEV_ADMIN_PASSWORD"),
  };
}

/** Liste récursivement les fichiers d'un dossier. */
function walk(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full));
    else if (entry.isFile()) found.push(full);
  }
  return found;
}

function scan(target, needles) {
  const files = fs.statSync(target).isDirectory() ? walk(target) : [target];
  const hits = [];
  let totalBytes = 0;
  for (const file of files) {
    const buf = fs.readFileSync(file);
    totalBytes += buf.length;
    for (const { label, value: needle } of needles) {
      if (buf.includes(Buffer.from(needle))) {
        hits.push({ file: path.relative(ROOT, file), label });
      }
    }
  }
  return { files, hits, totalBytes };
}

function exportBundle({ dev = false } = {}) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "btt-prod-bundle-"));
  console.log(
    `▶ Export ${PLATFORM} en mode ${dev ? "DÉVELOPPEMENT" : "production"} → ${outDir}\n`,
  );
  const cli = spawnSync(
    process.execPath,
    [
      fileURLToPath(import.meta.resolve("expo/bin/cli")),
      "export",
      "--platform",
      PLATFORM,
      "--output-dir",
      outDir,
      ...(dev ? ["--dev"] : []),
    ],
    {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, EXPO_OFFLINE: "1", EXPO_NO_TELEMETRY: "1" },
    },
  );
  if (cli.status !== 0) fail(`l'export a échoué (code ${cli.status}).`);
  return outDir;
}

const fallback = devCredentials();
const configured = configuredCredentials();

// Les litteraux de repli peuvent etre vides (mot de passe en dur supprime).
// Une aiguille vide serait pathologique : `buf.includes("")` est toujours vrai.
const needles = [];
if (fallback.password) {
  needles.push({ label: "mot de passe dev (repli source)", value: fallback.password });
}
if (fallback.email) {
  needles.push({ label: "e-mail dev (repli source)", value: fallback.email });
}
needles.push({ label: "nom de variable EXPO_PUBLIC_DEV_ADMIN_EMAIL", value: "EXPO_PUBLIC_DEV_ADMIN_EMAIL" });
needles.push({ label: "nom de variable EXPO_PUBLIC_DEV_ADMIN_PASSWORD", value: "EXPO_PUBLIC_DEV_ADMIN_PASSWORD" });
if (configured.password) {
  needles.push({ label: "mot de passe dev (.env)", value: configured.password });
}
if (configured.email) {
  needles.push({ label: "e-mail dev (.env)", value: configured.email });
}

console.log("Reliquats recherchés :");
for (const { label } of needles) console.log(`  · ${label}`);
if (!configured.password && !configured.email) {
  console.log("  (.env absent ou vide : seuls les replis de la source sont vérifiés)");
}

const exported = SCAN_TARGET ? null : exportBundle({ dev: SELF_TEST });
const target = SCAN_TARGET || exported;

const { files, hits, totalBytes } = scan(target, needles);

console.log(`\n${files.length} fichier(s) analysé(s), ${totalBytes} octet(s).`);

if (!SCAN_TARGET) {
  if (!scan(target, [{ label: "témoin", value: POSITIVE_CONTROL }]).hits.length) {
    fail(
      `témoin positif absent : « ${POSITIVE_CONTROL} » introuvable dans le bundle. ` +
        "Le bundle est vide, tronqué ou le scan est cassé — résultat non concluant.",
    );
  }
  console.log(`Témoin positif présent : ${POSITIVE_CONTROL}`);
}

if (SELF_TEST) {
  if (!hits.length) {
    fail(
      "auto-test non concluant : les identifiants de développement sont introuvables " +
        "même dans un bundle `--dev` — le détecteur ne détecte rien, le test de production est donc vide de sens.",
    );
  }
  console.log(`\n✓ Auto-test concluant : le détecteur a bien trouvé ${hits.length} reliquat(s) dans un bundle de développement.`);
  for (const hit of hits) console.log(`  · ${hit.label}`);
  if (exported && !KEEP) fs.rmSync(exported, { recursive: true, force: true });
  process.exit(0);
}

if (hits.length) {
  console.error("\n✗ Fuite détectée dans un bundle de production :");
  for (const hit of hits) console.error(`  · ${hit.label} — présent dans ${hit.file}`);
  if (exported) console.error(`\nBundle conservé pour inspection : ${exported}`);
  fail(`${hits.length} occurrence(s) interdite(s).`);
}

console.log(
  SCAN_TARGET
    ? "\n✓ Aucun identifiant trouvé. Attention : en mode --scan, le témoin positif n'est pas vérifié."
    : `\n✓ Aucun identifiant du raccourci de développement dans le bundle ${PLATFORM} de production.`,
);

if (exported && !KEEP) fs.rmSync(exported, { recursive: true, force: true });
process.exit(0);
