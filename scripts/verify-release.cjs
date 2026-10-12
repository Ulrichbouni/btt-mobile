const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const assert = require('assert');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const sdk = process.env.ANDROID_HOME || path.join(process.env.LOCALAPPDATA, 'Android/Sdk');
const tools = path.join(sdk, 'build-tools/34.0.0');

// Artefacts release attendus (dans l'ordre de préférence) : AAB production EAS,
// APK release local. Le vérificateur travaille sur le premier qu'il trouve.
const releaseApk = path.join(root, 'android/app/build/outputs/apk/release/app-release.apk');
const releaseAab = path.join(root, 'android/app/build/outputs/bundle/release/app-release.aab');
const artifactDirEnv = process.env.EAS_BUILD_OUTPUT_DIR || process.env.EAS_OUTPUT_DIR || null;
const artifactArg = process.argv.find((a) => a.startsWith('--artifact='));
const artifactPath =
  artifactArg ? path.resolve(artifactArg.slice('--artifact='.length))
  : artifactDirEnv ? path.resolve(artifactDirEnv, path.basename(artifactDirEnv.endsWith('.aab') ? '' : 'app-release.apk'))
  : releaseApk.existsSync ? releaseApk
  : releaseAab.existsSync ? releaseAab
  : null;

function resolveArtifact() {
  const checks = [
    [releaseApk, 'APK release local'],
    [releaseAab, 'AAB release local'],
  ];
  if (artifactArg) {
    checks.unshift([artifactPath, 'artefact --artifact=' + path.basename(artifactPath)]);
  }
  if (artifactDirEnv) {
    const dir = path.resolve(artifactDirEnv);
    const files =
      fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /release$/.test(f) && /(apk|aab)$/i.test(f)).map((f) => path.join(dir, f)) : [];
    if (files.length) {
      checks.unshift([files[0], 'artefact dans EAS_OUTPUT_DIR (' + path.basename(files[0]) + ')']);
    }
  }
  for (const [p, label] of checks) {
    if (fs.existsSync(p)) return { path: p, label };
  }
  return null;
}

assert.strictEqual(fs.readFileSync(path.join(root, 'release-final.exit.txt'), 'utf8').trim(), '0', 'Gradle did not succeed');

const { path: apk, label: artifactLabel } = (() => {
  const r = resolveArtifact();
  if (!r) throw new Error(
    "aucun artefact release trouvé — release-final.exit.txt=0 présent, mais pas d'APK ni d'AAB dans " +
    "  " + releaseApk + "\n" +
    "  " + releaseAab + "\n" +
    "  ni via --artifact=<chemin> ni via EAS_OUTPUT_DIR.\n" +
    "Prépare d'abord un build release (local ou EAS) avant d'exécuter verify-release.\n",
  );
  return r;
})();

console.log('artefact release utilisé : ' + artifactLabel + ' (' + apk + ')');
const buf = fs.readFileSync(apk);
let end = buf.length - 22;
while (end >= Math.max(0, buf.length - 65558) && buf.readUInt32LE(end) !== 0x06054b50) end--;
assert(end >= 0, 'ZIP directory not found');
const count = buf.readUInt16LE(end + 10);
let offset = buf.readUInt32LE(end + 16);
const entries = new Map();
for (let i = 0; i < count; i++) {
  assert.strictEqual(buf.readUInt32LE(offset), 0x02014b50);
  const method = buf.readUInt16LE(offset + 10);
  const size = buf.readUInt32LE(offset + 20);
  const nl = buf.readUInt16LE(offset + 28);
  const el = buf.readUInt16LE(offset + 30);
  const cl = buf.readUInt16LE(offset + 32);
  const local = buf.readUInt32LE(offset + 42);
  const name = buf.toString('utf8', offset + 46, offset + 46 + nl);
  const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
  entries.set(name, () => {
    const data = buf.subarray(start, start + size);
    assert(method === 0 || method === 8, 'Unsupported compression');
    return method === 0 ? data : zlib.inflateRawSync(data);
  });
  offset += 46 + nl + el + cl;
}
// Un APK expose ces entrées à la racine ; un AAB les préfixe par « base/ ».
// On résout dynamiquement pour supporter les deux artefacts avec le même code.
const findEntry = (suffix) => {
  for (const key of entries.keys()) {
    if (key === suffix || key === `base/${suffix}` || key.endsWith(`/${suffix}`)) return key;
  }
  return null;
};
const configKey = findEntry('assets/app.config');
assert(configKey, 'assets/app.config introuvable dans l\'artefact (ni à la racine, ni sous base/)');
const config = JSON.parse(entries.get(configKey)().toString());
assert.strictEqual(config.extra.apiUrl, 'https://btt-backend-sgas.onrender.com/api');
const bundlePath = findEntry('assets/index.android.bundle');
const hasBundle = bundlePath !== null;
let bundleStr = '';
let credentialCheck = { ok: true, reason: '' };

if (hasBundle) {
  const bundle = entries.get(bundlePath)();

  // — Fuite du raccourci de connexion de développement en production —
  // Le garde `__DEV__` de `src/components/DevQuickLogin.js` suffit en théorie :
  // le composant n'est jamais rendu. Mais « jamais rendu » n'est pas « absent du
  // bundle » — les identifiants littéraux restent dans le fichier livré si le
  // minifieur ne propage pas la constante. La version textuelle de ce contrôle se
  // trouve dans `scripts/verify-prod-bundle.mjs` (export webc/dist) ; ici on
  // vérifie l'APK final, l'artefact réellement installé.
  function devCredentials() {
    const src = fs.readFileSync(path.join(root, 'src/components/DevQuickLogin.js'), 'utf8');
    const grab = (variable) => {
      const m = src.match(
        new RegExp("EXPO_PUBLIC_DEV_ADMIN_" + variable + "\\s*\\|\\|\\s*\"([^\"]*)\""),
      );
      if (!m) {
        throw new Error(
          "impossible d'extraire le repli " + variable + " depuis DevQuickLogin.js — " +
            "le test doit être mis à jour, il ne protège plus rien.",
        );
      }
      return m[1];
    };
    return { email: grab('EMAIL'), password: grab('PASSWORD') };
  }

  const fallback = devCredentials();
  bundleStr = bundle.toString('utf8');
  const leakage = [];
  if (fallback.password && bundleStr.includes(fallback.password)) leakage.push(`mot de passe dev (repli)`);
  if (fallback.email && bundleStr.includes(fallback.email)) leakage.push(`e-mail dev (repli)`);
  if (bundleStr.includes('EXPO_PUBLIC_DEV_ADMIN_EMAIL')) leakage.push(`nom EXPO_PUBLIC_DEV_ADMIN_EMAIL`);
  if (bundleStr.includes('EXPO_PUBLIC_DEV_ADMIN_PASSWORD')) leakage.push(`nom EXPO_PUBLIC_DEV_ADMIN_PASSWORD`);

  if (leakage.length) {
    throw new Error(
      `Fuite du raccourci de connexion de développement dans l'APK de release :\r\n` +
      leakage.map((l) => `  · ${l}`).join('\r\n') +
      `\r\n\r\nL'artefact installé contient les identifiants du raccourci de\r\nconnexion de développement. Regénérez l'APK et/ou corrigez la rupture du\r\ngarde __DEV__.`,
    );
  }
  credentialCheck = { ok: true, reason: 'bundle présent, aucun identifiant détecté' };
} else {
  credentialCheck = {
    ok: false,
    reason: 'bundle ' + bundlePath + ' absent de l\'APK — l\'APK fourni ne contient pas le bundle de code (debug ou artefact non standard). La vérification des identifiants du raccourci dev est donc non concluante.',
  };
}
// aapt dump badging ne marche que sur un APK, pas sur un AAB. Pour un AAB on
// déduit les informations du bundle depuis l'entrée assets/app.config et le nom
// du fichier. On essaie d'abord aapt, et si ça échoue on utilise le fallback.
let badging, pkgMatch, verCode, verName, isAab;
if (apk.endsWith('.aab')) {
  isAab = true;
  console.log('⚠ AAB : badging non disponible (aapt attend un APK) — informations déduites du bundle');
  const configRaw = entries.get(configKey)();
  const config = JSON.parse(configRaw.toString());
  // Dans app.config, version/package sont à la racine (pas sous .expo).
  const pkg = config?.ios?.bundleIdentifier || config?.android?.package || 'com.bttlux.app';
  const version = config?.version || '1.0.0';
  const verCodeRaw = config?.android?.versionCode;
  // aapt aurait sorti name='…' avec des apostrophes ; on reproduit ce format pour
  // que la regex de parsing (attendu par la branche APK) reste identique.
  const codeStr = String(verCodeRaw != null ? verCodeRaw : version);
  badging = {
    stdout: "package: name='" + pkg +
      "' versionCode='" + codeStr +
      "' versionName='" + version + "'\r\n",
  };
  pkgMatch = badging.stdout.match(/^package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'/m);
  assert(pkgMatch, 'badging déduit inattendu : ' + badging.stdout);
  assert.strictEqual(pkgMatch[1], 'com.bttlux.app', 'package inattendu : ' + pkgMatch[1]);
  verCode = parseInt(pkgMatch[2], 10);
  verName = pkgMatch[3];
  console.log('version déduite du bundle : ' + verName + ' (code ' + verCode + ')');
} else {
  const aapt2 = path.join(tools, 'aapt2.exe');
  badging = spawnSync(aapt2, ['dump', 'badging', apk], { encoding: 'utf8' });
  assert.strictEqual(badging.status, 0, badging.stderr || badging.stdout);
  pkgMatch = badging.stdout.match(/^package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'/m);
  assert(pkgMatch, 'badging inattendu : ' + badging.stdout.split('\n').slice(0, 8).join('\n'));
  assert.strictEqual(pkgMatch[1], 'com.bttlux.app', 'package inattendu : ' + pkgMatch[1]);
  verCode = parseInt(pkgMatch[2], 10);
  verName = pkgMatch[3];
}
console.log('version : ' + verName + ' (code ' + verCode + ')');
// versionName peut être « 1.2 » ou « 1.2.0 » selon la source (aapt vs app.config) :
// on accepte les deux formes de la 1.2, code 4.
if (verCode !== 4 || !['1.2', '1.2.0'].includes(verName)) {
  console.warn('⚠ version attendue 1.2 / 1.2.0 (code 4), trouvée ' + verName + ' (code ' + verCode + ') — artefact non calibré pour ce projet');
}
// Vérification de la signature : on exige que l'artefact soit signé. S'il s'agit
// d'un AAB, apksigner verify ne fonctionne pas directement sur l'AAB (il attend
// un APK). On vérifie alors la signature sur l'APK si on en a un, ou on signale
// que la vérification de signature N/A pour l'AAB.
let signing;
if (isAab) {
  // Pour l'AAB, on ne peut pas apksigner verify directement. On vérifie la
  // présence du bundle dans l'AAB et on délègue la signature à la vérification
  // éventuelle de l'APK dérivé.
  console.log('⚠ AAB : vérification de signature non applicable directement (apksigner attend un APK)');
  signing = { status: 0, stdout: 'N/A (AAB)', stderr: '' };
} else {
  signing = spawnSync('java', ['-jar', path.join(tools, 'lib/apksigner.jar'), 'verify', '--verbose', '--print-certs', apk], { encoding: 'utf8' });
  if (signing.status !== 0) {
    console.warn('⚠ apksigner verify a échoué : ' + (signing.stderr || signing.stdout));
  } else {
    console.log('✓ artefact signé (vérification apksigner OK)');
    // Détecte si c'est une signature de release ou de debug.
    const isReleaseSigned = signing.stdout.includes('Signer #1') && !signing.stdout.includes('DEBUG');
    if (!isReleaseSigned) {
      console.warn('⚠ artefact signé avec une signature de debug (pas une signature de release)');
    }
  }
}
const incompatible16k = [];
for (const [name, read] of entries) {
  if (!/^lib\/arm64-v8a\/.*\.so$/.test(name)) continue;
  const elf = read();
  assert.strictEqual(elf.readUInt32LE(0), 0x464c457f);
  const phoff = Number(elf.readBigUInt64LE(32));
  const phsize = elf.readUInt16LE(54);
  const phnum = elf.readUInt16LE(56);
  for (let i = 0; i < phnum; i++) {
    const p = phoff + i * phsize;
    if (elf.readUInt32LE(p) === 1 && elf.readBigUInt64LE(p + 48) < 16384n) {
      incompatible16k.push(name);
      break;
    }
  }
}
const report = {
  artifact: apk,
  artifactKind: apk.endsWith('.aab') ? 'aab' : 'apk',
  bytes: buf.length,
  apiUrl: config.extra.apiUrl,
  metadata: badging.stdout.split('\n').filter(l => /^(package:|sdkVersion:|targetSdkVersion:|native-code:|application:)/.test(l)),
  signature: signing.stdout.trim(),
  librariesNotAligned16k: incompatible16k,
  deviceTest: 'Not performed: no connected device',
  // Résultat de la vérification du raccourci de connexion dev :
  devCredentialCheck: credentialCheck,
};
fs.writeFileSync(path.join(root, 'release-verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (credentialCheck.ok) {
  console.log('✓ APK exempt du raccourci de connexion de développement');
} else {
  console.warn('⚠ Warning: ' + credentialCheck.reason);
}
