#!/usr/bin/env node
/**
 * Démarre le serveur de développement web (`expo start --web`) de façon fiable.
 *
 * Deux problèmes rendent la commande brute fragile sur ce projet :
 *
 *  1. Expo résout ses ports AVANT de lier le serveur. Si le port web (19006)
 *     est déjà pris, il ouvre un prompt interactif « Use port 19007 instead? »
 *     et reste bloqué : aucun port n'est lié et rien n'est affiché.
 *  2. Le CLI contacte https://api.expo.dev (validation des dépendances, ping de
 *     session). Sans accès réseau, la requête échoue après ~90 s et fait
 *     planter le process (TypeError « bodyStream ») juste après le démarrage.
 *
 * Ce script corrige les deux : il vérifie les ports (et échoue clairement au
 * lieu de rester bloqué) puis force le mode hors-ligne (EXPO_OFFLINE=1).
 *
 * Usage :
 *   npm run web            # démarre (échoue si un port est pris)
 *   npm run web -- --kill  # libère d'abord les ports occupés
 *
 * Variables d'environnement :
 *   RCT_METRO_PORT — port de Metro (défaut : 8081), honoré par Expo.
 *
 * Attention : le port web (19006) n'est PAS configurable. Le drapeau --port ne
 * déplace que Metro, et Expo ne lit aucune variable pour le port web. Le
 * préflight doit donc vérifier exactement 19006 : sinon il validerait un port
 * libre pendant qu'Expo se bat pour 19006 et meurt sur « Port 19006 not
 * available ».
 */

"use strict";

const path = require("path");
const { spawn } = require("child_process");
const { ensureFree } = require("./lib/dev-ports.cjs");

// Non configurable : Expo code ce port en dur dans le serveur webpack
// (WebpackBundlerDevServer : defaultPort ?? 19006).
const WEB_PORT = 19006;
const METRO_PORT = Number(process.env.RCT_METRO_PORT || 8081);
const KILL = process.argv.includes("--kill");
const ROOT = path.resolve(__dirname, "..");

async function main() {
  // Le serveur web reste sur 19006 (le drapeau --port ne déplace que Metro).
  await ensureFree(
    [
      { name: "web", port: WEB_PORT },
      { name: "Metro", port: METRO_PORT },
    ],
    { kill: KILL, hint: "npm run web -- --kill" },
  );

  console.log(
    `▶ Serveur web hors-ligne : http://localhost:${WEB_PORT} (Metro ${METRO_PORT})`,
  );
  console.log("  Premier bundle webpack : compilation longue (1-2 min).\n");

  // On lance le CLI Expo directement via Node. Passer par `npx.cmd` échoue sur
  // Node 24 (spawn refuse les .cmd sans shell) et un shell intermédiaire rendrait
  // le Ctrl+C peu fiable.
  const cli = require.resolve("expo/bin/cli", { paths: [ROOT] });
  const child = spawn(process.execPath, [cli, "start", "--web", "--offline"], {
    cwd: ROOT,
    stdio: "inherit",
    // --offline évite l'appel réseau qui fait planter le CLI sans internet.
    env: { ...process.env, EXPO_OFFLINE: "1" },
  });

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
