import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const requiredFiles = [
  'governance/BASELINE_0.3.0.json',
  'governance/RELEASE_CONTRACT.json',
  'PROJECT_STATUS.json',
  'package.json',
  'package-lock.json'
];

const failures = [];
for (const relative of requiredFiles) {
  if (!fs.existsSync(path.join(root, relative))) failures.push(`Fehlt: ${relative}`);
}

if (failures.length === 0) {
  const baseline = readJson('governance/BASELINE_0.3.0.json');
  const contract = readJson('governance/RELEASE_CONTRACT.json');
  const status = readJson('PROJECT_STATUS.json');

  if (baseline.governance_version !== '0.3.0') failures.push('Governance-Version ist nicht 0.3.0.');
  if (!/^[0-9a-f]{40}$/.test(baseline.baseline_commit ?? '')) failures.push('Baseline-Commit ist ungueltig.');
  if (baseline.release_ready !== false) failures.push('Governance-Basis darf nicht als releasebereit markiert sein.');
  if (status?.quality?.release_ready !== false) failures.push('PROJECT_STATUS muss release_ready=false bleiben.');

  const order = contract.pipeline_order ?? [];
  if (JSON.stringify(order) !== JSON.stringify(['SCHNELL', 'TIEF', 'FREIGABE'])) {
    failures.push('Pipeline-Reihenfolge muss SCHNELL -> TIEF -> FREIGABE sein.');
  }
  if (contract?.stages?.FREIGABE?.fail_if_tauri_missing !== true) {
    failures.push('FREIGABE muss ohne Tauri-Quellstand blockieren.');
  }
  if (contract?.promotion_policy?.release_requires_same_artifacts_as_fresh_test !== true) {
    failures.push('Getestetes Paket und freigegebenes Paket muessen identisch sein.');
  }
}

fs.mkdirSync(path.join(root, 'runtime', 'ci-evidence'), { recursive: true });
const result = {
  check: 'governance_contract',
  version: '0.3.0',
  status: failures.length ? 'BLOCKIERT' : 'BESTANDEN',
  failures,
  tauri_source_present: fs.existsSync(path.join(root, 'src-tauri', 'Cargo.toml'))
};
fs.writeFileSync(path.join(root, 'runtime', 'ci-evidence', 'governance.json'), `${JSON.stringify(result, null, 2)}\n`);

if (failures.length) {
  console.error('🔴 Governance-Pruefung blockiert:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('🟢 Governance-Basis 0.3.0 ist konsistent.');
console.log(`Tauri-Quellstand: ${result.tauri_source_present ? 'vorhanden' : 'noch nicht vorhanden'}.`);
