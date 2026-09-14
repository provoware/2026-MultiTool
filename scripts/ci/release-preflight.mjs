import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const selfTestBlocked = process.argv.includes('--self-test-blocked');

function collectFailures(base) {
  const failures = [];
  const cargo = path.join(base, 'src-tauri', 'Cargo.toml');
  const cargoLock = path.join(base, 'src-tauri', 'Cargo.lock');
  const tauriConfigCandidates = [
    path.join(base, 'src-tauri', 'tauri.conf.json'),
    path.join(base, 'src-tauri', 'tauri.conf.json5'),
    path.join(base, 'src-tauri', 'Tauri.toml'),
  ];
  const nativeE2e = path.join(base, 'tests', 'tauri-e2e', 'native_tauri_e2e.mjs');

  if (!fs.existsSync(cargo)) failures.push('Tauri-Quellstand fehlt: src-tauri/Cargo.toml ist nicht vorhanden.');
  if (!fs.existsSync(cargoLock)) failures.push('Gesperrte Rust-Abhaengigkeiten fehlen: src-tauri/Cargo.lock ist nicht vorhanden.');
  if (!tauriConfigCandidates.some((candidate) => fs.existsSync(candidate))) failures.push('Tauri-Konfiguration fehlt.');
  if (!fs.existsSync(nativeE2e)) failures.push('Nativer Tauri-Ende-zu-Ende-Test fehlt.');
  return failures;
}

if (selfTestBlocked) {
  const emptyFixture = path.join(root, 'runtime', 'release-preflight-empty-fixture');
  fs.rmSync(emptyFixture, { recursive: true, force: true });
  fs.mkdirSync(emptyFixture, { recursive: true });
  const failures = collectFailures(emptyFixture);
  fs.rmSync(emptyFixture, { recursive: true, force: true });
  if (failures.length < 4) {
    console.error('🔴 FREIGABE-Schutztest fehlgeschlagen: Eine unvollstaendige Anwendung wurde nicht vollstaendig blockiert.');
    process.exit(1);
  }
  console.log('🟢 FREIGABE-Schutztest bestanden: Fehlender Quellstand, Lockdatei, Konfiguration und nativer Test werden blockiert.');
  process.exit(0);
}

const failures = collectFailures(root);
fs.mkdirSync(path.join(root, 'runtime', 'ci-evidence'), { recursive: true });
const result = {
  check: 'release_preflight',
  status: failures.length ? 'BLOCKIERT' : 'BESTANDEN',
  failures,
};
fs.writeFileSync(path.join(root, 'runtime', 'ci-evidence', 'release-preflight.json'), `${JSON.stringify(result, null, 2)}\n`);

if (failures.length) {
  console.error('🔴 FREIGABE ist bewusst blockiert.');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('Es wurde kein scheinbar fertiger Release erzeugt.');
  process.exit(1);
}

console.log('🟢 Tauri-Kandidat besitzt die Mindestvoraussetzungen fuer den spaeteren Paketbau.');
