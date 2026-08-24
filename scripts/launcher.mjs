import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  terminateOwnedProcess,
  waitForChildReadiness,
  findAvailablePort,
  resolveExecutable,
} from '../src/core/lifecycle.mjs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const runtime = resolve(ROOT, 'runtime');
const pidFile = resolve(runtime, 'backend.pid');
const checkpointFile = resolve(runtime, 'last-checkpoint.json');
const host = '127.0.0.1';
const preferredPort = Number(process.env.PORT || 5000);
await mkdir(runtime, { recursive: true });
const port = await findAvailablePort(preferredPort, { host, attempts: 30 });
const session = `${Date.now()}-${process.pid}`;
const controlToken = randomUUID();

const status = (symbol, phase, text) => console.log(`${symbol} ${phase}  ${text}`);
status('🔵','BACKEND',`Session ${session}, Port ${port}`);

const child = spawn(process.execPath, ['src/backend/server.mjs'], {
  cwd: ROOT,
  env: {
    ...process.env,
    PROVOWARE_HOST: host,
    PROVOWARE_PORT: String(port),
    PROVOWARE_SESSION: session,
    PROVOWARE_PROCESS_OWNER: 'launcher',
    PROVOWARE_CONTROL_TOKEN: controlToken,
  },
  stdio: ['ignore','inherit','inherit'],
});
await writeFile(pidFile, String(child.pid), 'utf8');

let closing = false;
async function shutdown(reason) {
  if (closing) return;
  closing = true;
  status('🔵','CHECKPOINT',`Sichere Session vor ${reason} …`);
  try {
    await fetch(`http://${host}:${port}/api/checkpoint`, { method: 'POST', signal: AbortSignal.timeout(1000) });
  } catch {
    await writeFile(checkpointFile, JSON.stringify({ session, reason, at: new Date().toISOString(), fallback: true }, null, 2));
  }

  status('🔵','SHUTDOWN','Beende eigenes Backend kontrolliert …');
  const result = await terminateOwnedProcess(child, { timeoutMs:1500, escalationTimeoutMs:1500 });
  await rm(pidFile, { force: true });
  status(result.stopped ? '🟢' : '🔴','SHUTDOWN',result.escalated ? 'Backend beendet (Eskalation nötig)' : 'Backend sauber beendet');
  process.exit(result.stopped ? 0 : 31);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGHUP', () => void shutdown('SIGHUP'));

const healthUrl = `http://${host}:${port}/api/health`;
const ready = await waitForChildReadiness(child, {
  timeoutMs: 5000,
  pollMs: 100,
  readinessProbe: async () => {
    try {
      const response = await fetch(healthUrl, { signal: AbortSignal.timeout(500) });
      return response.ok;
    } catch { return false; }
  },
});
if (!ready.ready) {
  if (!closing) {
    status('🔴','BLOCKIERT',`Backend nicht bereit: ${ready.reason}`);
    await terminateOwnedProcess(child, { timeoutMs: 800 });
    await rm(pidFile, { force: true });
    process.exit(30);
  }
} else if (!closing) {
  const authorize = await fetch(`http://${host}:${port}/api/launcher-ready`, {
    method:'POST',
    headers:{'x-provoware-control-token':controlToken},
    signal:AbortSignal.timeout(1000),
  });
  if (!authorize.ok) {
    status('🔴','BLOCKIERT',`Launcher-Readiness konnte nicht autorisiert werden (${authorize.status})`);
    await terminateOwnedProcess(child, { timeoutMs:800 });
    await rm(pidFile,{force:true});
    process.exit(33);
  }
  status('🟢','BACKEND','Readiness bestätigt');
  status('🟢','BEREIT',`http://${host}:${port}`);
}

if (!closing && !process.argv.includes('--no-open')) {
  const xdgOpen = process.platform === 'linux' ? await resolveExecutable('xdg-open') : null;
  if (xdgOpen) {
    const p = spawn(xdgOpen, [`http://${host}:${port}`], { stdio: 'ignore', detached: true });
    p.once('error', () => status('🟡','BROWSER','Automatisches Öffnen fehlgeschlagen; URL bitte manuell öffnen.'));
    p.unref();
    status('🟢','BROWSER','Oberfläche wird geöffnet');
  } else {
    status('🟡','BROWSER',`Kein sicherer Auto-Opener gefunden. Bitte http://${host}:${port} manuell öffnen.`);
  }
}

child.once('exit', async (code) => {
  await rm(pidFile, { force: true });
  if (closing) return;

  let checkpoint;
  try {
    checkpoint = JSON.parse(await readFile(checkpointFile, 'utf8'));
  } catch {
    // Fehlender oder ungültiger Checkpoint kann keinen verifizierten UI-Logout belegen.
  }

  const verifiedUiLogout = code === 0
    && checkpoint?.session === session
    && checkpoint?.reason === 'UI_LOGOUT';

  if (verifiedUiLogout) {
    status('🟢','SHUTDOWN','UI-Logout bestätigt; Backend sauber beendet und Session-Checkpoint verifiziert');
    process.exit(0);
  }

  status('🔴','BACKEND',`Backend unerwartet beendet (Code ${code})`);
  process.exit(code ?? 32);
});
setInterval(() => {}, 1000);
