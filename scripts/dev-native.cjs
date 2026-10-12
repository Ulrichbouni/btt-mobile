#!/usr/bin/env node
/**
 * Démarre le serveur de développement natif (`expo start`, Metro) de façon fiable.
 *
 * Même famille de problèmes que `dev-web.cjs`, sans le volet webpack :
 *
 *  1. Expo résout ses ports AVANT de lier le serveur. Si Metro (8081) est déjà
 *     pris — typiquement parce qu'un `npm run web` tourne encore — il ouvre un
 *     prompt interactif « Use port 8082 instead? » et reste bloqué : aucun port
 *     n'est lié et rien n'est affiché.
 *  2. Le CLI contacte https://api.expo.dev (validation des dépendances, ping de
 *     session). Sans accès réseau, la requête échoue après ~90 s et fait
 *     planter le process (TypeError « bodyStream ») juste après le démarrage.
 *
 * Ce script vérifie donc les ports (échec clair au lieu d'un blocage) et force
 * le mode hors-ligne (EXPO_OFFLINE=1).
 *
 * Usage :
 *   npm start            # démarre (échoue si un port est pris)
 *   npm start -- --kill  # libère d'abord le port Metro occupé
 *
 * Variables d'environnement :
 *   EXPO_METRO_PORT / RCT_METRO_PORT — port Metro (défaut : 8081)
 */

"use strict";

const path = require("path");
const { spawn } = require("child_process");
const { ensureFree } = require("./lib/dev-ports.cjs");

const METRO_PORT = Number(
  process.env.EXPO_METRO_PORT || process.env.RCT_METRO_PORT || 8081,
);
const KILL = process.argv.includes("--kill");
const ROOT = path.resolve(__dirname, "..");

async function main() {
  await ensureFree([{ name: "Metro", port: METRO_PORT }], {
    kill: KILL,
    hint: "npm start -- --kill",
  });

  console.log(`▶ Metro hors-ligne sur le port ${METRO_PORT}.`);
  console.log("  Scannez le QR code avec Expo Go, ou appuyez sur a / i.\n");

  // On lance le CLI Expo directement via Node. Passer par `npx.cmd` échoue sur
  // Node 24 (spawn refuse les .cmd sans shell) et un shell intermédiaire rendrait
  // le Ctrl+C peu fiable.
  const cli = require.resolve("expo/bin/cli", { paths: [ROOT] });
  const child = spawn(
    process.execPath,
    [cli, "start", "--port", String(METRO_PORT), "--offline"],
    {
      cwd: ROOT,
      stdio: "inherit",
      // --offline évite l'appel réseau qui fait planter le CLI sans internet.
      env: { ...process.env, EXPO_OFFLINE: "1", RCT_METRO_PORT: String(METRO_PORT) },
    },
  );

  const stop = () => {
    try {
      child.kill("SIGINT");
    } catch {
      /* ignore */
    }
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  child.on("exit", (code, signal) => {
    if (signal) process.exit(0);
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(`✗ ${err.stack || err.message}`);
  process.exit(1);
});
