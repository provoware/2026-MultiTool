import { appendFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { terminateOwnedProcess } from '../../src/core/lifecycle.mjs';

const [pidFile, markerFile] = process.argv.slice(2);
if (!pidFile || !markerFile) {
  console.error('fixture requires pidFile and markerFile');
  process.exit(64);
}

const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
  stdio: 'ignore',
});

await writeFile(pidFile, String(child.pid), 'utf8');
await appendFile(markerFile, 'CHILD_STARTED\n', 'utf8');

let shuttingDown = false;

async function shutdown(reason) {
  if (shuttingDown) return;
  shuttingDown = true;
  await appendFile(markerFile, `SHUTDOWN_REQUEST:${reason}\n`, 'utf8');
  const result = await terminateOwnedProcess(child, { timeoutMs: 800 });
  await appendFile(markerFile, `CHILD_STOPPED:${result.stopped}:ESCALATED:${result.escalated}\n`, 'utf8');
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

setInterval(() => {}, 1000);
