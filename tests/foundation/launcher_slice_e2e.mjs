import { spawn } from 'node:child_process';
import { access, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { findAvailablePort, isProcessAlive } from '../../src/core/lifecycle.mjs';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const runtimeDir = resolve(ROOT, 'runtime');
const pidFile = join(runtimeDir, 'backend.pid');
const checkpointFile = join(runtimeDir, 'last-checkpoint.json');

function assert(condition, message){ if(!condition) throw new Error(message); }
async function waitUntil(fn, timeoutMs=7000, pollMs=80, label='Zustand'){
  const started=Date.now();
  while(Date.now()-started<timeoutMs){
    try{
      const value=await fn();
      if(value)return value;
    }catch(error){
      if(error?.name!=='TimeoutError' && error?.cause?.code!=='ECONNREFUSED') void error;
    }
    await new Promise(resolveWait=>setTimeout(resolveWait,pollMs));
  }
  throw new Error(`Timeout beim Warten auf: ${label}.`);
}
async function waitForLauncherExit(launcher, timeoutMs, name, outputRef){
  if(launcher.exitCode!==null || launcher.signalCode!==null){
    return {code:launcher.exitCode, signal:launcher.signalCode};
  }
  return await new Promise((resolveExit,rejectExit)=>{
    let settled=false;
    let timer;
    const finish=(fn,value)=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      launcher.removeListener('exit',onExit);
      fn(value);
    };
    const onExit=(code,signal)=>finish(resolveExit,{code,signal});
    launcher.once('exit',onExit);
    timer=setTimeout(()=>finish(rejectExit,new Error(`${name}: Launcher-Exit nach ${timeoutMs} ms nicht eingetreten. Ausgabe: ${outputRef()}`)),timeoutMs);
    if(launcher.exitCode!==null || launcher.signalCode!==null) finish(resolveExit,{code:launcher.exitCode,signal:launcher.signalCode});
  });
}
async function pathExists(path){try{await access(path);return true;}catch{return false;}}

async function runScenario(name, shutdownAction){
  await rm(pidFile,{force:true});
  const port=await findAvailablePort(54000+Math.floor(Math.random()*600),{attempts:100});
  const launcher=spawn(process.execPath,['scripts/launcher.mjs','--no-open'],{
    cwd:ROOT,
    env:{...process.env,PORT:String(port)},
    stdio:['ignore','pipe','pipe'],
  });
  let output='';
  launcher.stdout.on('data',data=>output+=data);
  launcher.stderr.on('data',data=>output+=data);
  let backendPid=null;
  try{
    const readyStatus=await waitUntil(async()=>{
      const response=await fetch(`http://127.0.0.1:${port}/api/status`,{signal:AbortSignal.timeout(400),cache:'no-store'});
      if(!response.ok)return false;
      const body=await response.json();
      return body.status==='ready'&&body.userReady===true?body:false;
    },7000,80,`${name}: launcher-autorisierte USER_READY-Readiness`);

    backendPid=Number((await readFile(pidFile,'utf8')).trim());
    assert(Number.isInteger(backendPid)&&backendPid>0,`${name}: Backend-PID ungültig.`);
    assert(isProcessAlive(backendPid),`${name}: Backend lebt nach Readiness nicht.`);

    const checkpointResponse=await fetch(`http://127.0.0.1:${port}/api/checkpoint`,{method:'POST'});
    assert(checkpointResponse.ok,`${name}: Checkpoint-API fehlgeschlagen.`);
    const checkpoint=JSON.parse(await readFile(checkpointFile,'utf8'));
    assert(checkpoint.session===readyStatus.session,`${name}: Checkpoint gehört nicht zur aktiven Session.`);

    await shutdownAction({launcher,port});
    const exit=await waitForLauncherExit(launcher,5000,name,()=>output);
    assert(exit.code===0,`${name}: Launcher endete mit Code ${exit.code}, Signal ${exit.signal}. Ausgabe: ${output}`);
    await waitUntil(()=>!isProcessAlive(backendPid),3000,80,`${name}: Backend-Prozessende`);
    assert(!(await pathExists(pidFile)),`${name}: PID-Datei blieb nach Shutdown liegen.`);
    let reachable=true;
    try{
      await fetch(`http://127.0.0.1:${port}/api/health`,{signal:AbortSignal.timeout(300)});
    }catch(error){
      reachable=false;
      void error;
    }
    assert(!reachable,`${name}: Backend nach Verify Closed weiterhin erreichbar.`);
    console.log(`🟢 Launcher-E2E ${name}: Checkpoint → Shutdown → Verify Closed PASS`);
  }finally{
    if(launcher.exitCode===null && launcher.signalCode===null)launcher.kill('SIGKILL');
    if(backendPid&&isProcessAlive(backendPid)){
      try{process.kill(backendPid,'SIGKILL');}catch(error){void error;}
    }
    await rm(pidFile,{force:true});
  }
}

await runScenario('SIGTERM',async({launcher})=>{launcher.kill('SIGTERM');});
await runScenario('UI_LOGOUT',async({port})=>{
  const response=await fetch(`http://127.0.0.1:${port}/api/shutdown`,{method:'POST'});
  assert(response.status===202,`UI_LOGOUT: 202 erwartet, erhalten ${response.status}.`);
});

console.log('🟢 Launcher-Slice E2E: 2/2 Endpfade PASS');
