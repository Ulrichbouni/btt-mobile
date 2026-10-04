const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const exitFile = path.join(__dirname, 'release-final.exit.txt');
if (fs.existsSync(exitFile)) fs.unlinkSync(exitFile);
const log = fs.openSync(path.join(__dirname, 'release-final.log'), 'w');
const child = spawn('cmd.exe', ['/d', '/s', '/c', 'gradlew.bat assembleRelease --console=plain --no-daemon --max-workers=2'], {
  cwd: path.join(__dirname, 'android'), stdio: ['ignore', log, log], windowsHide: true
});
child.on('error', e => fs.writeFileSync(path.join(__dirname, 'release-final.exit.txt'), e.message));
child.on('exit', code => {
  fs.closeSync(log);
  fs.writeFileSync(path.join(__dirname, 'release-final.exit.txt'), String(code));
  console.log('GRADLE_EXIT=' + code);
});
