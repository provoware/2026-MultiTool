import { access, readFile, rm } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { createServer } from 'node:net';
import { delimiter, join } from 'node:path';

export async function isPortAvailable(port, host = '127.0.0.1') {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new RangeError(`Ungültiger Port: ${port}`);
  }

  return await new Promise((resolve) => {
    const server = createServer();
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    server.once('error', () => finish(false));
    server.once('listening', () => server.close(() => finish(true)));
    server.listen({ host, port, exclusive: true });
  });
}

export async function findAvailablePort(preferredPort, options = {}) {
  const host = options.host ?? '127.0.0.1';
  const attempts = options.attempts ?? 20;

  for (let offset = 0; offset < attempts; offset += 1) {
    const candidate = preferredPort + offset;
    if (candidate > 65535) break;
    if (await isPortAvailable(candidate, host)) return candidate;
  }

  throw new Error(`Kein freier Port ab ${preferredPort} innerhalb von ${attempts} Versuchen gefunden.`);
}

export function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === 'EPERM';
  }
}

export async function inspectPidFile(pidFile, options = {}) {
  const alive = options.isAlive ?? isProcessAlive;
  let raw;

  try {
    raw = (await readFile(pidFile, 'utf8')).trim();
  } catch (error) {
    if (error?.code === 'ENOENT') return { state: 'MISSING', pid: null };
    throw error;
  }

  if (!/^\d+$/.test(raw)) return { state: 'INVALID', pid: null };

  const pid = Number(raw);
  if (!Number.isSafeInteger(pid) || pid <= 0) return { state: 'INVALID', pid: null };

  return alive(pid) ? { state: 'LIVE', pid } : { state: 'STALE', pid };
}

export async function removePidFileIfStale(pidFile, options = {}) {
  const info = await inspectPidFile(pidFile, options);
  if (info.state !== 'STALE' && info.state !== 'INVALID') return { removed: false, ...info };
  await rm(pidFile, { force: true });
  return { removed: true, ...info };
}

export async function resolveExecutable(command, env = process.env) {
  if (typeof command !== 'string' || !/^[A-Za-z0-9._+-]+$/.test(command)) {
    throw new TypeError('Kommandoname enthält unzulässige Zeichen.');
  }

  const pathValue = env.PATH ?? '';
  if (!pathValue) return null;

  for (const directory of pathValue.split(delimiter)) {
    if (!directory) continue;
    const candidate = join(directory, command);
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // Nächsten PATH-Eintrag prüfen.
    }
  }

  return null;
}

export async function waitForChildReadiness(child, options = {}) {
  const readinessProbe = options.readinessProbe ?? (() => false);
  const timeoutMs = options.timeoutMs ?? 1500;
  const pollMs = options.pollMs ?? 25;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    if (child.exitCode !== null) {
      return { ready: false, reason: 'EXITED_BEFORE_READY', exitCode: child.exitCode };
    }

    if (await readinessProbe()) return { ready: true, reason: 'READY', exitCode: null };
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  return { ready: false, reason: 'READINESS_TIMEOUT', exitCode: child.exitCode };
}

export async function waitForProcessExit(child, timeoutMs = 1200) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return true;

  return await new Promise((resolve) => {
    let settled = false;
    let timer;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      child.removeListener('exit', onExit);
      resolve(value);
    };
    const onExit = () => finish(true);

    child.once('exit', onExit);
    timer = setTimeout(() => finish(child.exitCode !== null || child.signalCode !== null), timeoutMs);

    // Race-Schutz: Prozess kann zwischen obiger Vorprüfung und Listener-Registrierung beendet worden sein.
    if (child.exitCode !== null || child.signalCode !== null) finish(true);
  });
}

export async function terminateOwnedProcess(child, options = {}) {
  const timeoutMs = options.timeoutMs ?? 1200;
  const escalationTimeoutMs = options.escalationTimeoutMs ?? Math.max(500, timeoutMs);
  const signal = options.signal ?? 'SIGTERM';
  if (!child || child.exitCode !== null || child.signalCode !== null) return { stopped: true, escalated: false };

  child.kill(signal);
  if (await waitForProcessExit(child, timeoutMs)) return { stopped: true, escalated: false };

  child.kill('SIGKILL');
  const stoppedAfterEscalation = await waitForProcessExit(child, escalationTimeoutMs);
  return { stopped: stoppedAfterEscalation, escalated: true };
}
