const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const assert = require('assert');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const apk = path.join(root, 'android/app/build/outputs/apk/release/app-release.apk');
const sdk = process.env.ANDROID_HOME || path.join(process.env.LOCALAPPDATA, 'Android/Sdk');
const tools = path.join(sdk, 'build-tools/34.0.0');
assert.strictEqual(fs.readFileSync(path.join(root, 'release-final.exit.txt'), 'utf8').trim(), '0', 'Gradle did not succeed');
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
const config = JSON.parse(entries.get('assets/app.config')().toString());
assert.strictEqual(config.extra.apiUrl, 'https://btt-backend-sgas.onrender.com/api');
const bundle = entries.get('assets/index.android.bundle')();
assert(bundle.includes(Buffer.from(config.extra.apiUrl)), 'Render fallback absent from bundle');
const badging = spawnSync(path.join(tools, 'aapt2.exe'), ['dump', 'badging', apk], { encoding: 'utf8' });
assert.strictEqual(badging.status, 0, badging.stderr);
assert(/package: name='com.bttlux.app' versionCode='4' versionName='1.2'/.test(badging.stdout));
const signing = spawnSync('java', ['-jar', path.join(tools, 'lib/apksigner.jar'), 'verify', '--verbose', '--print-certs', apk], { encoding: 'utf8' });
assert.strictEqual(signing.status, 0, signing.stderr || signing.stdout);
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
  apk, bytes: buf.length, apiUrl: config.extra.apiUrl,
  metadata: badging.stdout.split('\n').filter(l => /^(package:|sdkVersion:|targetSdkVersion:|native-code:|application:)/.test(l)),
  signature: signing.stdout.trim(),
  librariesNotAligned16k: incompatible16k,
  deviceTest: 'Not performed: no connected device'
};
fs.writeFileSync(path.join(root, 'release-verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
