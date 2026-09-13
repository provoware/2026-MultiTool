import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
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
  status: failures.length ? 'BLOCKIERT' : 'BESTANDEN',
  failures
};
fs.writeFileSync(path.join(root, 'runtime', 'ci-evidence', 'release-preflight.json'), `${JSON.stringify(result, null, 2)}\n`);

if (failures.length) {
  console.error('🔴 FREIGABE ist bewusst blockiert.');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('Es wurde kein scheinbar fertiger Release erzeugt.');
  process.exit(1);
}

console.log('🟢 Tauri-Release-Vorpruefung bestanden.');
