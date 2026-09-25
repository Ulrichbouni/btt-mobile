const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const inputPath = 'D:/agence-IA/gestion/logo.jpg';
const assetsDir = 'D:/agence-IA/gestion/mobile/assets';

async function main() {
  // Lire le logo source
  const image = await Jimp.read(inputPath);
  console.log('Logo source lu:', image.bitmap.width, 'x', image.bitmap.height);

  // 1. icon.png - 1024x1024
  const icon = image.clone().resize({ w: 1024, h: 1024 });
    const iconBuffer = await icon.getBuffer('image/png');
  fs.writeFileSync(path.join(assetsDir, 'icon.png'), iconBuffer);
  console.log('✅ icon.png généré (' + icon.bitmap.width + 'x' + icon.bitmap.height + ') - ' + iconBuffer.length + ' bytes');

  // 2. adaptive-icon.png - 1024x1024
  const adaptive = image.clone().resize({ w: 1024, h: 1024 });
  const adaptiveBuffer = await adaptive.getBuffer('image/png');
  fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), adaptiveBuffer);
  console.log('✅ adaptive-icon.png généré (' + adaptive.bitmap.width + 'x' + adaptive.bitmap.height + ') - ' + adaptiveBuffer.length + ' bytes');

  console.log('✨ Tous les logos ont été générés avec succès !');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});