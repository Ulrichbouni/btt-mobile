#!/usr/bin/env node
/**
 * Helpers de ports partagés par les lanceurs de serveur de dev
 * (`dev-web.cjs` et `dev-native.cjs`).
 *
 * Pourquoi ne pas se contenter du comportement par défaut d'Expo : le CLI
 * résout ses ports AVANT de lier le serveur. Si un port est occupé il ouvre un
 * prompt interactif (« Use port 8082 instead? ») qui, sans TTY, laisse le
 * process bloqué sans rien afficher. Mieux vaut échouer clairement.
 *
 * Détection par connexion TCP uniquement : on ne peut PAS se fier à un bind.
 * Sous Windows, un `listen` sur 0.0.0.0:19006 réussit même quand
 * 127.0.0.1:19006 est déjà pris — précisément l'angle mort qui fait croire à
 * Expo que le port est libre.
 */

"use strict";

const net = require("net");
const { execSync } = require("child_process");

/** true si quelque chose écoute déjà sur 127.0.0.1:port. */
function isPortBusy(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port });
    const finish = (busy) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(busy);
    };
    socket.setTimeout(1000);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

/** Retrouve le PID (et la commande) qui écoute sur un port. Windows uniquement. */
function findOwner(port) {
  if (process.platform !== "win32") return null;
  try {
    const lines = execSync("netstat -ano -p tcp", { encoding: "utf8" }).split(/\r?\n/);
    const line = lines.find(
      (l) => l.includes(`:${port} `) && /\bLISTENING\b/.test(l),
    );
    if (!line) return null;
    const pid = line.trim().split(/\s+/).pop();
    let command = "";
    try {
      const row = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
        encoding: "utf8",
      });
      // Sortie CSV localisée et verbeuse : on ne garde que le nom de l'image.
      command = row.match(/^"([^"]+)"/m)?.[1] || "";
    } catch {
      /* commande inconnue : on garde au moins le PID */
    }
    return { pid, command };
  } catch {
    return null;
  }
}

function killPid(pid) {
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /F /PID ${pid}`);
    } else {
      process.kill(Number(pid), "SIGKILL");
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Garantit que les ports cibles sont libres.
 *
 * @param {{name: string, port: number}[]} targets
 * @param {{kill?: boolean, hint?: string}} options
 *   kill — arrêter les processus qui occupent les ports
 *   hint — commande suggérée à l'utilisateur pour libérer les ports
 */
async function ensureFree(targets, { kill = false, hint } = {}) {
  const busy = [];
  for (const t of targets) {
    if (await isPortBusy(t.port)) busy.push(t);
  }
  if (busy.length === 0) return;

  for (const b of busy) {
    const owner = findOwner(b.port);
    const detail = owner
      ? ` par PID ${owner.pid}${owner.command ? ` (${owner.command})` : ""}`
      : "";
    console.error(`✗ Port ${b.port} (${b.name}) déjà utilisé${detail}.`);
    if (kill && owner?.pid) {
      const ok = killPid(owner.pid);
      console.error(
        ok ? `  → processus ${owner.pid} arrêté.` : `  → impossible d'arrêter ${owner.pid}.`,
      );
    }
  }

  if (!kill) {
    console.error("\nLibérez ces ports (arrêtez le serveur qui les occupe) puis relancez,");
    console.error(
      hint
        ? `ou lancez \`${hint}\` pour les libérer d'abord.`
        : "ou relancez avec `--kill` pour les libérer d'abord.",
    );
    process.exit(1);
  }

  await new Promise((r) => setTimeout(r, 1500));
  for (const b of busy) {
    if (await isPortBusy(b.port)) {
      console.error(`✗ Port ${b.port} (${b.name}) toujours occupé après --kill.`);
      process.exit(1);
    }
  }
}

module.exports = { isPortBusy, findOwner, killPid, ensureFree };
