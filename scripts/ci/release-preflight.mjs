import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const expectBlocked = process.argv.includes('--expect-blocked');
const cargo = path.join(root, 'src-tauri', 'Cargo.toml');
const tauriConfigCandidates = [
  path.join(root, 'src-tauri', 'tauri.conf.json'),
  path.join(root, 'src-tauri', 'tauri.conf.json5'),
  path.join(root, 'src-tauri', 'Tauri.toml')
];

const failures = [];
if (!fs.existsSync(cargo)) failures.push('Tauri-Quellstand fehlt: src-tauri/Cargo.toml ist nicht vorhanden.');
if (!tauriConfigCandidates.some((candidate) => fs.existsSync(candidate))) {
  failures.push('Tauri-Konfiguration fehlt.');
}

fs.mkdirSync(path.join(root, 'runtime', 'ci-evidence'), { recursive: true });
const result = {
  check: 'release_preflight',
  expected_blockade_test: expectBlocked,
  status: failures.length ? 'BLOCKIERT' : 'BESTANDEN',
  failures
};
fs.writeFileSync(path.join(root, 'runtime', 'ci-evidence', 'release-preflight.json'), `${JSON.stringify(result, null, 2)}\n`);

if (expectBlocked) {
  if (failures.length) {
    console.log('🟢 FREIGABE-Schutztest bestanden: Der Foundation-Stand wird erwartungsgemaess blockiert.');
    for (const failure of failures) console.log(`- ${failure}`);
    process.exit(0);
  }
  console.error('🔴 FREIGABE-Schutztest fehlgeschlagen: Der Stand ist unerwartet freigabefaehig.');
  process.exit(1);
}

if (failures.length) {
  console.error('🔴 FREIGABE ist bewusst blockiert.');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('Es wurde kein scheinbar fertiger Release erzeugt.');
  process.exit(1);
}

console.log('🟢 Tauri-Release-Vorpruefung bestanden.');
