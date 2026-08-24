import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import {
  findAvailablePort,
  inspectPidFile,
  isProcessAlive,
  removePidFileIfStale,
  resolveExecutable,
  waitForChildReadiness,
} from '../../src/core/lifecycle.mjs';

const results = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForFile(path, timeoutMs = 1500) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      return await readFile(path, 'utf8');
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
  throw new Error(`Timeout beim Warten auf Datei: ${path}`);
}

async function runCase(id, title, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ id, title, status: 'PASS', durationMs: Date.now() - started });
    console.log(`🟢 ${id} ${title}`);
  } catch (error) {
    results.push({ id, title, status: 'FAIL', durationMs: Date.now() - started, error: error.message });
    console.error(`🔴 ${id} ${title}: ${error.message}`);
  }
}

await runCase('REG-LIFE-001', 'Port belegt → sicherer Fallback', async () => {
  const holder = createServer();
  await new Promise((resolve, reject) => {
    holder.once('error', reject);
    holder.listen({ host: '127.0.0.1', port: 0, exclusive: true }, resolve);
  });

  try {
    const preferred = holder.address().port;
    const selected = await findAvailablePort(preferred, { attempts: 12 });
    assert(selected !== preferred, 'Belegter Port wurde fälschlich wiederverwendet.');
    assert(selected > 0 && selected <= 65535, 'Fallback-Port ist ungültig.');
  } finally {
    await new Promise((resolve) => holder.close(resolve));
  }
});

await runCase('REG-LIFE-002', 'Backend startet nicht → kein falsches Ready', async () => {
  const child = spawn(process.execPath, ['-e', 'process.exit(23)'], { stdio: 'ignore' });
  const result = await waitForChildReadiness(child, {
    readinessProbe: () => false,
    timeoutMs: 1000,
    pollMs: 20,
  });

  assert(result.ready === false, 'Fehlgeschlagener Backendstart wurde als READY gemeldet.');
  assert(result.reason === 'EXITED_BEFORE_READY', `Unerwarteter Grund: ${result.reason}`);
  assert(result.exitCode === 23, `Exit-Code 23 erwartet, erhalten: ${result.exitCode}`);
});

await runCase('REG-LIFE-003', 'Ctrl+C → Child wird kontrolliert beendet', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'provoware-lifecycle-'));
  const pidFile = join(dir, 'child.pid');
  const markerFile = join(dir, 'marker.log');
  const fixture = new URL('../fixtures/lifecycle_supervisor_fixture.mjs', import.meta.url);
  const supervisor = spawn(process.execPath, [fixture.pathname, pidFile, markerFile], { stdio: 'ignore' });

  try {
    const pidText = await waitForFile(pidFile);
    const childPid = Number(pidText.trim());
    assert(Number.isInteger(childPid) && childPid > 0, 'Fixture lieferte keine gültige Child-PID.');
    assert(isProcessAlive(childPid), 'Child-Prozess war vor SIGINT nicht aktiv.');

    supervisor.kill('SIGINT');
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Supervisor reagierte nicht rechtzeitig auf SIGINT.')), 2000);
      supervisor.once('exit', (code) => {
        clearTimeout(timer);
        if (code !== 0) reject(new Error(`Supervisor endete mit Code ${code}.`));
        else resolve();
      });
    });

    const marker = await readFile(markerFile, 'utf8');
    assert(marker.includes('SHUTDOWN_REQUEST:SIGINT'), 'SIGINT-Shutdown wurde nicht protokolliert.');
    assert(marker.includes('CHILD_STOPPED:true'), 'Child-Shutdown wurde nicht bestätigt.');
    assert(!isProcessAlive(childPid), 'Child-Prozess lebt nach Supervisor-Shutdown weiter.');
  } finally {
    if (supervisor.exitCode === null) supervisor.kill('SIGKILL');
    await rm(dir, { recursive: true, force: true });
  }
});

await runCase('REG-LIFE-004', 'Stale PID → erkennen und nur stale entfernen', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'provoware-pid-'));
  const pidFile = join(dir, 'backend.pid');

  try {
    await writeFile(pidFile, '424242', 'utf8');
    const inspected = await inspectPidFile(pidFile, { isAlive: () => false });
    assert(inspected.state === 'STALE', `STALE erwartet, erhalten: ${inspected.state}`);

    const cleaned = await removePidFileIfStale(pidFile, { isAlive: () => false });
    assert(cleaned.removed === true, 'Stale PID-Datei wurde nicht entfernt.');

    await writeFile(pidFile, String(process.pid), 'utf8');
    const live = await removePidFileIfStale(pidFile, { isAlive: () => true });
    assert(live.state === 'LIVE', `LIVE erwartet, erhalten: ${live.state}`);
    assert(live.removed === false, 'Lebende PID-Datei wurde fälschlich entfernt.');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

await runCase('REG-LIFE-005', 'Dependency fehlt → Preflight erkennt sie', async () => {
  const command = `provoware-definitely-missing-${process.pid}-${Date.now()}`;
  const resolved = await resolveExecutable(command);
  assert(resolved === null, 'Garantiert fehlendes Kommando wurde fälschlich gefunden.');
});

const failed = results.filter((entry) => entry.status === 'FAIL');
console.log(`\nLifecycle-Failure-Matrix: ${results.length - failed.length}/${results.length} PASS`);

if (failed.length) {
  console.error(JSON.stringify({ status: 'FAIL', results }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ status: 'PASS', results }, null, 2));
