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

const evidence = { status:'RUNNING', projectPersistence:false, checkpoint:false, safeShutdown:false };
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
  console.log('🟢 Native Tauri-E2E: Start · SQLite-Persistenz · Zwischenstand · Neustart · sicheres Beenden PASS');
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
