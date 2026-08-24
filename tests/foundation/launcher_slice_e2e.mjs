import { spawn } from 'node:child_process';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { isProcessAlive } from '../../src/core/lifecycle.mjs';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const runtimeDir = resolve(ROOT, 'runtime');
const pidFile = join(runtimeDir, 'backend.pid');
const checkpointFile = join(runtimeDir, 'last-checkpoint.json');

function assert(condition, message){ if(!condition) throw new Error(message); }
async function waitUntil(fn, timeoutMs=7000, pollMs=80){ const started=Date.now(); while(Date.now()-started<timeoutMs){ try{const v=await fn(); if(v) return v;}catch{} await new Promise(r=>setTimeout(r,pollMs)); } throw new Error('Timeout beim Warten auf erwarteten Zustand.'); }

const port = 54000 + Math.floor(Math.random()*800);
const launcher = spawn(process.execPath, ['scripts/launcher.mjs','--no-open'], {
  cwd: ROOT,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore','pipe','pipe'],
});
let output=''; launcher.stdout.on('data',d=>output+=d); launcher.stderr.on('data',d=>output+=d);
let backendPid=null;

try {
  const health = await waitUntil(async()=>{ const r=await fetch(`http://127.0.0.1:${port}/api/health`,{signal:AbortSignal.timeout(400)}); return r.ok ? r.json() : false; });
  assert(health.status==='ok','Health-Status ist nicht ok.');
  assert(health.port===port,'Backend läuft nicht auf dem angeforderten freien Port.');

  backendPid = Number((await readFile(pidFile,'utf8')).trim());
  assert(Number.isInteger(backendPid)&&backendPid>0,'Backend-PID fehlt oder ist ungültig.');
  assert(isProcessAlive(backendPid),'Backend lebt nach Readiness nicht.');

  const checkpointResponse = await fetch(`http://127.0.0.1:${port}/api/checkpoint`,{method:'POST'});
  assert(checkpointResponse.ok,'Checkpoint-API fehlgeschlagen.');
  const checkpoint = JSON.parse(await readFile(checkpointFile,'utf8'));
  assert(checkpoint.session===health.session,'Checkpoint gehört nicht zur aktiven Session.');

  launcher.kill('SIGTERM');
  await waitUntil(()=>launcher.exitCode!==null,5000);
  assert(launcher.exitCode===0,`Launcher endete mit Code ${launcher.exitCode}. Ausgabe: ${output}`);
  await waitUntil(()=>!isProcessAlive(backendPid),3000);
  let pidExists=true; try{await access(pidFile);}catch{pidExists=false;}
  assert(!pidExists,'PID-Datei wurde nach Shutdown nicht entfernt.');
  let reachable=true; try{await fetch(`http://127.0.0.1:${port}/api/health`,{signal:AbortSignal.timeout(300)});}catch{reachable=false;}
  assert(!reachable,'Backend ist nach Verify Closed weiterhin erreichbar.');
  console.log('🟢 Launcher-E2E: Start → Readiness → Checkpoint → SIGTERM → Verify Closed PASS');
} finally {
  if(launcher.exitCode===null) launcher.kill('SIGKILL');
  if(backendPid && isProcessAlive(backendPid)){ try{process.kill(backendPid,'SIGKILL');}catch{} }
  await rm(pidFile,{force:true});
}
