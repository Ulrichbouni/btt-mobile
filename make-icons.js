/**
 * make-icons.js - Genere toutes les icones Android depuis logo.jpg (version 1.2)
 * Meme methode que pour les versions 1.0 et 1.1.
 */
const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

const SRC = 'D:/agence-IA/gestion/logo.jpg';
const ROOT = 'D:/agence-IA/gestion/mobile';
const RES = ROOT + '/android/app/src/main/res';
const ASSETS = ROOT + '/assets';
const log = [];
function L() { const s = Array.prototype.join.call(arguments, ' '); log.push(s); console.log(s); }

const WHITE = 0xffffffff;

function blank(w, h, colorInt) { return new Jimp({ width: w, height: h, color: colorInt }); }

function fitInside(img, maxW, maxH) {
  const r = Math.min(maxW / img.bitmap.width, maxH / img.bitmap.height);
  const w = Math.max(1, Math.round(img.bitmap.width * r));
  const h = Math.max(1, Math.round(img.bitmap.height * r));
  return img.clone().resize({ w, h });
}

/** Fond -> transparent via la distance a la couleur de fond */
function cutBackground(img, bg, lo, hi) {
  const d = img.bitmap.data;
  const W = img.bitmap.width, H = img.bitmap.height;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const dist = Math.max(
        Math.abs(d[i] - bg[0]), Math.abs(d[i + 1] - bg[1]), Math.abs(d[i + 2] - bg[2])
      );
      let a;
      if (dist <= lo) a = 0;
      else if (dist >= hi) a = 255;
      else a = Math.round(((dist - lo) / (hi - lo)) * 255);
      d[i + 3] = a;
    }
  }
  return img;
}

/** Masque circulaire centre */
function applyCircleMask(img) {
  const d = img.bitmap.data;
  const W = img.bitmap.width, H = img.bitmap.height;
  const cx = (W - 1) / 2, cy = (H - 1) / 2, r = Math.min(W, H) / 2;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const i = (y * W + x) * 4;
      let f;
      if (dist <= r - 1) f = 1;
      else if (dist >= r) f = 0;
      else f = r - dist;
      d[i + 3] = Math.round(d[i + 3] * f);
    }
  }
  return img;
}

function write(img, p) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  return img.write(p).then(function () { return p; });
}

/* ================= 1. ANALYSE DU LOGO ================= */
async function analyse(src) {
  const W = src.bitmap.width, H = src.bitmap.height;
  L('Source : ' + SRC + '  (' + W + 'x' + H + ')');

  const get = function (x, y) {
    const i = (y * W + x) * 4;
    return [src.bitmap.data[i], src.bitmap.data[i + 1], src.bitmap.data[i + 2]];
  };

  const corners = [get(1, 1), get(W - 2, 1), get(1, H - 2), get(W - 2, H - 2)];
  const bg = [0, 1, 2].map(function (c) {
    return Math.round(corners.reduce(function (a, p) { return a + p[c]; }, 0) / corners.length);
  });
  L('Fond detecte RGB = ' + JSON.stringify(bg));

  function isInk(x, y) {
    const p = get(x, y);
    return Math.max(Math.abs(p[0] - bg[0]), Math.abs(p[1] - bg[1]), Math.abs(p[2] - bg[2])) > 40;
  }

  function bbox(x0, y0, x1, y1) {
    let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!isInk(x, y)) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) return null;
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }

  // Bandes horizontales de contenu
  const rowPx = new Array(H).fill(0);
  for (let y = 0; y < H; y++) {
    for (let x = 1; x < W - 1; x++) if (isInk(x, y)) rowPx[y]++;
  }
  const solid = rowPx.map(function (c) { return c > W * 0.02; });
  const bands = [];
  let start = null;
  for (let y = 0; y <= H; y++) {
    const s = y < H ? solid[y] : false;
    if (s && start === null) start = y;
    if (!s && start !== null) { bands.push([start, y - 1]); start = null; }
  }
  L('Bandes de contenu : ' + JSON.stringify(bands));

  // L'embleme = la bande la plus haute situee sous le filet du haut (y > 25)
  const cands = bands.filter(function (b) { return b[0] > 25; })
    .map(function (b) { return { b: b, h: b[1] - b[0] + 1 }; });
  if (!cands.length) throw new Error('Aucune bande de contenu detectee sous y=25');
  cands.sort(function (a, z) { return z.h - a.h; });
  const emBand = cands[0].b;
  const emblemBox = bbox(1, emBand[0], W - 2, emBand[1]);
  L('Embleme (BT + arbre + bois) y ' + emBand[0] + '..' + emBand[1] + ' -> bbox ' + JSON.stringify(emblemBox));

  const textBox = bbox(1, emBand[1] + 1, W - 2, H - 2);
  L('Texte              y ' + (emBand[1] + 1) + '..' + (H - 1) + ' -> bbox ' + JSON.stringify(textBox));

  return { W: W, H: H, bg: bg, emblemBox: emblemBox, emBand: emBand, textBox: textBox };
}

/* ================= 2. GENERATION ================= */
async function main() {
  const src = await Jimp.read(SRC);
  const info = await analyse(src);

  const m = 6;
  const eb = {
    x: Math.max(0, info.emblemBox.x - m),
    y: Math.max(0, info.emblemBox.y - m),
    w: 0, h: 0,
  };
  eb.w = Math.min(info.W - eb.x, info.emblemBox.w + m * 2);
  eb.h = Math.min(info.H - eb.y, info.emblemBox.h + m * 2);

  const emblemT = cutBackground(src.clone().crop({ x: eb.x, y: eb.y, w: eb.w, h: eb.h }), info.bg, 12, 48);
  L('Embleme decoupe : ' + eb.w + 'x' + eb.h + ' -> fond transparent');

  const fb = {
    x: Math.max(0, info.emblemBox.x - m),
    y: eb.y,
    w: 0, h: 0,
  };
  fb.w = Math.min(info.W - fb.x, Math.max(info.emblemBox.w, info.textBox ? info.textBox.w + (info.textBox.x - fb.x) : 0) + m * 2);
  fb.h = Math.min(info.H - fb.y, Math.max(info.emblemBox.h, (info.textBox.y + info.textBox.h) - fb.y) + m);
  const fullT = cutBackground(src.clone().crop({ x: fb.x, y: fb.y, w: fb.w, h: fb.h }), info.bg, 12, 48);
  L('Logo complet decoupe : ' + fb.w + 'x' + fb.h + ' -> fond transparent');

  const tasks = [];

  /* ---- 3. ASSETS EXPO (1024x1024) ---- */
  {
    const c = blank(1024, 1024, WHITE);
    const e = fitInside(emblemT, 758, 758);
    c.composite(e, Math.round((1024 - e.bitmap.width) / 2), Math.round((1024 - e.bitmap.height) / 2));
    tasks.push(write(c, ASSETS + '/icon.png').then(function (p) { L('OK ' + p + ' 1024x1024'); }));
  }
  {
    const c = blank(1024, 1024, 0xffffff00);
    c.bitmap.data.fill(0);
    const e = fitInside(emblemT, 635, 635);
    c.composite(e, Math.round((1024 - e.bitmap.width) / 2), Math.round((1024 - e.bitmap.height) / 2));
    tasks.push(write(c, ASSETS + '/adaptive-icon.png').then(function (p) { L('OK ' + p + ' 1024x1024 transparent'); }));
  }

  /* ---- 4. MIPMAPS ANDROID ---- */
  const DENS = [
    ['mdpi', 48, 108],
    ['hdpi', 72, 162],
    ['xhdpi', 96, 216],
    ['xxhdpi', 144, 324],
    ['xxxhdpi', 192, 432],
  ];
  for (let k = 0; k < DENS.length; k++) {
    const dens = DENS[k][0], legacy = DENS[k][1], adaptive = DENS[k][2];
    const dir = RES + '/mipmap-' + dens;

    const sq = blank(legacy, legacy, WHITE);
    const es = fitInside(emblemT, Math.round(legacy * 0.72), Math.round(legacy * 0.72));
    sq.composite(es, Math.round((legacy - es.bitmap.width) / 2), Math.round((legacy - es.bitmap.height) / 2));
    tasks.push(write(sq, dir + '/ic_launcher.png').then(function (p) { L('OK ' + p + ' ' + legacy + 'x' + legacy); }));

    const rd = blank(legacy, legacy, WHITE);
    applyCircleMask(rd);
    const er = fitInside(emblemT, Math.round(legacy * 0.58), Math.round(legacy * 0.58));
    rd.composite(er, Math.round((legacy - er.bitmap.width) / 2), Math.round((legacy - er.bitmap.height) / 2));
    tasks.push(write(rd, dir + '/ic_launcher_round.png').then(function (p) { L('OK ' + p + ' ' + legacy + ' rond'); }));

    const fg = blank(adaptive, adaptive, 0xffffff00);
    fg.bitmap.data.fill(0);
    const ef = fitInside(emblemT, Math.round(adaptive * 0.62), Math.round(adaptive * 0.62));
    fg.composite(ef, Math.round((adaptive - ef.bitmap.width) / 2), Math.round((adaptive - ef.bitmap.height) / 2));
    tasks.push(write(fg, dir + '/ic_launcher_foreground.png').then(function (p) { L('OK ' + p + ' ' + adaptive + ' adaptive'); }));
  }

  /* ---- 5. XML ICONE ADAPTIVE (Android 8+) ---- */
  const adaptiveXml = '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n' +
    '  <background android:drawable="@color/ic_launcher_background"/>\n' +
    '  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n' +
    '</adaptive-icon>\n';
  fs.mkdirSync(RES + '/mipmap-anydpi-v26', { recursive: true });
  const A26 = ['ic_launcher.xml', 'ic_launcher_round.xml'];
  for (let k = 0; k < A26.length; k++) {
    fs.writeFileSync(RES + '/mipmap-anydpi-v26/' + A26[k], adaptiveXml, 'utf8');
    L('OK ' + RES + '/mipmap-anydpi-v26/' + A26[k]);
  }
  fs.writeFileSync(RES + '/values/ic_launcher_background.xml',
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <color name="ic_launcher_background">#FFFFFF</color>\n</resources>\n', 'utf8');
  L('OK ' + RES + '/values/ic_launcher_background.xml');

  /* ---- 6. SPLASH : logo complet transparent ---- */
  {
    const c = blank(1024, 1024, 0xffffff00);
    c.bitmap.data.fill(0);
    const e = fitInside(fullT, 780, 780);
    c.composite(e, Math.round((1024 - e.bitmap.width) / 2), Math.round((1024 - e.bitmap.height) / 2));
    tasks.push(write(c, RES + '/drawable/splashscreen_image.png').then(function (p) { L('OK ' + p + ' logo complet'); }));
  }

  await Promise.all(tasks);

  /* ---- 7. PLANCHE DE CONTROLE ---- */
  try {
    const strip = blank(1024, 400, 0xd0d0d0ff);
    const a = fitInside(emblemT, 320, 340);
    strip.composite(a, 20 + Math.round((320 - a.bitmap.width) / 2), 30 + Math.round((340 - a.bitmap.height) / 2));
    const b = fitInside(fullT, 340, 340);
    strip.composite(b, 370 + Math.round((340 - b.bitmap.width) / 2), 30 + Math.round((340 - b.bitmap.height) / 2));
    const rnd = await Jimp.read(RES + '/mipmap-xxhdpi/ic_launcher_round.png');
    const r2 = fitInside(rnd, 290, 290);
    strip.composite(r2, 740 + Math.round((290 - r2.bitmap.width) / 2), 55 + Math.round((290 - r2.bitmap.height) / 2));
    await strip.write(ROOT + '/_icon-preview.png');
    L('OK ' + ROOT + '/_icon-preview.png (planche de controle)');
  } catch (e) {
    L('preview KO: ' + e.message);
  }

  fs.writeFileSync(ROOT + '/_icons-report.txt', log.join('\r\n'), 'utf8');
  L('TERMINE');
}

main().catch(function (e) { console.error('ERREUR', e); process.exit(1); });