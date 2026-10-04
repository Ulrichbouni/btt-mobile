const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const root = __dirname;
const log = fs.openSync(path.join(root, 'compile-kotlin-check.log'), 'w');
const child = spawn('cmd.exe', ['/d', '/s', '/c', 'gradlew.bat :expo-modules-core:compileReleaseKotlin --console=plain --no-daemon --max-workers=2'], {
  cwd: path.join(root, 'android'), stdio: ['ignore', log, log], windowsHide: true
});
child.on('error', e => fs.writeFileSync(path.join(root, 'compile-kotlin-check.exit.txt'), e.message));
child.on('exit', code => {
  fs.closeSync(log);
  fs.writeFileSync(path.join(root, 'compile-kotlin-check.exit.txt'), String(code));
});
(async () => {
  const results = [];
  for (const [route, method] of [['/api/health', 'GET'], ['/api/auth/login', 'POST']]) {
    try {
      const response = await fetch('https://btt-backend-sgas.onrender.com' + route, {
        method, headers: { 'Content-Type': 'application/json' },
        ...(method === 'POST' ? { body: '{}' } : {}), signal: AbortSignal.timeout(60000)
      });
      results.push({ route, status: response.status, body: await response.text() });
    } catch (error) { results.push({ route, error: error.message }); }
  }
  fs.writeFileSync(path.join(root, 'render-final-check.json'), JSON.stringify(results, null, 2));
})();
