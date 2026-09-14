import { spawn } from 'node:child_process';
import { access, mkdir, rm, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const EVIDENCE_DIR = resolve(ROOT, 'runtime/ci-evidence');
const DATA_DIR = resolve(ROOT, 'runtime/tauri-e2e-data');
const APP = process.env.TAURI_APP_BINARY ?? resolve(ROOT, 'src-tauri/target/debug/provoware-multitool');
const DRIVER = process.env.TAURI_DRIVER_BINARY ?? resolve(process.env.HOME ?? '', '.cargo/bin/tauri-driver');
const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf';
const BASE = 'http://127.0.0.1:4444';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const delay = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));

async function waitFor(check, { timeoutMs = 15000, label = 'Bedingung' } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try { const value = await check(); if (value) return value; } catch (error) { lastError = error; }
    await delay(120);
  }
  throw new Error(`${label} nicht erreicht.${lastError ? ` ${lastError.message}` : ''}`);
}

async function wd(method, path, body, timeoutMs = 12000) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'content-type':'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = { value:text }; }
  }
  if (!response.ok || payload?.value?.error) throw new Error(payload?.value?.message ?? text ?? `${response.status}`);
  return payload?.value ?? payload;
}

async function createSession() {
  const created = await wd('POST', '/session', {
    capabilities: {
      alwaysMatch: {
        'tauri:options': { application: APP },
      },
    },
  }, 30000);
  assert(created?.sessionId, 'Tauri-WebDriver lieferte keine Sitzungskennung.');
  return created.sessionId;
}

async function endSession(sessionId) {
  try { await wd('DELETE', `/session/${sessionId}`, undefined, 5000); } catch { /* App kann bereits beendet sein. */ }
}

const execute = (sessionId, script) => wd('POST', `/session/${sessionId}/execute/sync`, { script, args:[] });

async function findElement(sessionId, selector) {
  const result = await wd('POST', `/session/${sessionId}/element`, { using:'css selector', value:selector });
  const id = result?.[ELEMENT_KEY];
  assert(id, `Element '${selector}' wurde nicht gefunden.`);
  return id;
}

async function click(sessionId, selector) {
  const id = await findElement(sessionId, selector);
  await wd('POST', `/session/${sessionId}/element/${id}/click`, {});
}

async function waitReady(sessionId) {
  await waitFor(async () => {
    const text = await execute(sessionId, `return document.getElementById('overall')?.textContent || ''`);
    return text.includes('Alles bereit');
  }, { label:'native Tauri-Oberflaeche bereit' });
}

async function projectMarker(sessionId) {
  return await execute(sessionId, `const n=document.getElementById('projectStateText'); return {id:n?.dataset.projectId||'',revision:n?.dataset.revision||'',text:n?.textContent||''}`);
}

async function toolCenterMarker(sessionId) {
  return await execute(sessionId, `return {
    count: document.querySelectorAll('#toolsList .tool-item').length,
    text: document.getElementById('toolsList')?.textContent || '',
    summary: document.getElementById('toolsSummary')?.textContent || ''
  }`);
}

async function systemStatusMarker(sessionId) {
  return await execute(sessionId, `return {
    os: document.getElementById('osText')?.textContent || '',
    version: document.getElementById('versionText')?.textContent || '',
    session: document.getElementById('sessionText')?.textContent || '',
    core: document.getElementById('systemCoreText')?.textContent || '',
    database: document.getElementById('databaseText')?.textContent || ''
  }`);
}

async function storageOverviewMarker(sessionId) {
  return await execute(sessionId, `const first=document.querySelector('#storageList .storage-item'); return {
    count: document.querySelectorAll('#storageList .storage-item').length,
    summary: document.getElementById('storageSummary')?.textContent || '',
    text: document.getElementById('storageList')?.textContent || '',
    mountPoint: first?.dataset.mountPoint || '',
    totalBytes: first?.dataset.totalBytes || '0',
    freeBytes: first?.dataset.freeBytes || '0',
    state: first?.dataset.storageState || '',
    stateText: first?.querySelector('.storage-state')?.textContent || ''
  }`);
}

await access(APP, fsConstants.X_OK);
await access(DRIVER, fsConstants.X_OK);
await rm(DATA_DIR, { recursive:true, force:true });
await mkdir(DATA_DIR, { recursive:true });
await mkdir(EVIDENCE_DIR, { recursive:true });

const env = { ...process.env, XDG_DATA_HOME:DATA_DIR };
const driver = spawn(DRIVER, [], { cwd:ROOT, env, stdio:['ignore','pipe','pipe'] });
let driverOutput = '';
driver.stdout.on('data', (chunk) => { driverOutput += chunk.toString(); });
driver.stderr.on('data', (chunk) => { driverOutput += chunk.toString(); });

const evidence = {
  status:'RUNNING',
  projectPersistence:false,
  checkpoint:false,
  toolCenter:false,
  systemStatus:false,
  storageOverview:false,
  safeShutdown:false,
};
let firstSession = null;
let secondSession = null;

try {
  await waitFor(async () => {
    try { return (await fetch(`${BASE}/status`, { signal:AbortSignal.timeout(500) })).ok; } catch { return false; }
  }, { label:'tauri-driver bereit' });

  firstSession = await createSession();
  await waitReady(firstSession);
  const before = await projectMarker(firstSession);
  assert(before.id.length >= 8, 'Projektkennung fehlt im ersten Start.');
  assert(before.revision === '1', 'Unerwartete Projekt-Revision beim ersten Start.');

  const tools = await toolCenterMarker(firstSession);
  assert(tools.count >= 4, 'Werkzeug-Zentrale zeigt nicht alle eingebauten Werkzeuge.');
  assert(tools.text.includes('Werkzeug-Zentrale'), 'Werkzeug-Zentrale fehlt in der Werkzeugliste.');
  assert(tools.text.includes('Systemstatus'), 'Systemstatus fehlt in der Werkzeugliste.');
  assert(tools.text.includes('Speicherübersicht'), 'Speicherübersicht fehlt in der Werkzeugliste.');
  assert(tools.summary.includes('Werkzeugen bereit'), 'Werkzeug-Zentrale zeigt keinen verständlichen Gesamtzustand.');
  evidence.toolCenter = true;

  const system = await systemStatusMarker(firstSession);
  assert(system.os.trim().length > 0 && !system.os.includes('Wird geprüft'), 'Betriebssystem fehlt im Systemstatus.');
  assert(system.version.trim().length > 0 && !system.version.includes('Wird geprüft'), 'Programmversion fehlt im Systemstatus.');
  assert(system.session.includes('Aktiv · sitzung-'), 'Aktive Sitzung wird nicht verständlich angezeigt.');
  assert(system.core.includes('🟢') && system.core.includes('Bereit'), 'Programmkern wird nicht als bereit angezeigt.');
  assert(system.database.includes('🟢') && system.database.includes('SQLite'), 'Lokale Datenbank wird nicht als bereit angezeigt.');
  evidence.systemStatus = true;

  const storage = await storageOverviewMarker(firstSession);
  assert(storage.count >= 1, 'Speicherübersicht zeigt keinen aktiven Datenträger.');
  assert(storage.summary.includes('Datenträger'), 'Speicherübersicht zeigt keine verständliche Zusammenfassung.');
  assert(storage.mountPoint.trim().length > 0, 'Einhängeort des ersten Datenträgers fehlt.');
  const totalBytes = Number(storage.totalBytes);
  const freeBytes = Number(storage.freeBytes);
  assert(Number.isFinite(totalBytes) && totalBytes > 0, 'Gesamtgröße des Datenträgers ist ungültig.');
  assert(Number.isFinite(freeBytes) && freeBytes >= 0 && freeBytes <= totalBytes, 'Freier Speicher des Datenträgers ist ungültig.');
  assert(storage.text.includes('Gesamt:') && storage.text.includes('Frei:'), 'Speichergrößen werden nicht verständlich angezeigt.');
  const expectedStorageLabels = {
    NORMAL: '🟢 Normal',
    LOW: '🟡 Speicher wird knapp',
    CRITICAL: '🔴 Sehr wenig Speicher frei',
    READ_ONLY: '🔵 Nur Lesen',
    UNKNOWN: '⚪ Nicht prüfbar',
  };
  assert(Object.hasOwn(expectedStorageLabels, storage.state), `Unbekannter Speicherzustand aus dem Backend: ${storage.state}`);
  assert(storage.stateText.trim() === expectedStorageLabels[storage.state], 'Speicherzustand wird in der Oberfläche nicht exakt dargestellt.');
  evidence.storageOverview = true;

  await click(firstSession, '#checkpointBtn');
  await waitFor(async () => (await execute(firstSession, `return document.getElementById('checkpointText')?.textContent || ''`)).includes('Gesichert:'), { label:'Zwischenstand gesichert' });
  evidence.checkpoint = true;

  await endSession(firstSession);
  firstSession = null;

  secondSession = await createSession();
  await waitReady(secondSession);
  const after = await projectMarker(secondSession);
  assert(after.id === before.id, 'Projektkennung hat sich nach Neustart veraendert.');
  assert(after.revision === before.revision, 'Projektzustand wurde beim Neustart unnoetig veraendert.');
  evidence.projectPersistence = true;

  await click(secondSession, '#shutdownBtn');
  await waitFor(async () => {
    try { await execute(secondSession, 'return document.title'); return false; } catch { return true; }
  }, { timeoutMs:8000, label:'sicheres Beenden' });
  evidence.safeShutdown = true;
  secondSession = null;

  evidence.status = 'PASS';
  await writeFile(resolve(EVIDENCE_DIR, 'tauri-e2e.json'), JSON.stringify(evidence, null, 2));
  console.log('🟢 Native Tauri-E2E: Start · Systemstatus · Speicherzustand · Werkzeug-Zentrale · SQLite-Persistenz · Zwischenstand · Neustart · sicheres Beenden PASS');
} catch (error) {
  evidence.status = 'FAIL';
  evidence.message = error.message;
  evidence.driverOutput = driverOutput.slice(-6000);
  await writeFile(resolve(EVIDENCE_DIR, 'tauri-e2e.json'), JSON.stringify(evidence, null, 2));
  throw error;
} finally {
  if (firstSession) await endSession(firstSession);
  if (secondSession) await endSession(secondSession);
  if (driver.exitCode === null) driver.kill('SIGTERM');
  await delay(300);
  if (driver.exitCode === null) driver.kill('SIGKILL');
}
