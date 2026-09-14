import http from 'node:http';
import { spawn } from 'node:child_process';
import { access, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const PUBLIC = resolve(ROOT, 'src/ui');
const EVIDENCE = resolve(ROOT, 'runtime/browser-acceptance');
const browsers = ['firefox', 'chrome'];
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.mjs':'text/javascript; charset=utf-8' };

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const delay = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));

async function waitFor(check, { timeoutMs = 10000, label = 'Bedingung' } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try { const value = await check(); if (value) return value; } catch (error) { lastError = error; }
    await delay(100);
  }
  throw new Error(`${label} nicht erreicht.${lastError ? ` ${lastError.message}` : ''}`);
}

async function resolveExecutable(name) {
  const envName = name === 'chromedriver' ? 'CHROMEWEBDRIVER' : 'GECKOWEBDRIVER';
  const configured = process.env[envName];
  if (configured) {
    try {
      const info = await stat(configured);
      const candidate = info.isDirectory() ? join(configured, name) : configured;
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch { /* use PATH */ }
  }
  for (const dir of (process.env.PATH ?? '').split(':')) {
    if (!dir) continue;
    const candidate = join(dir, name);
    try { await access(candidate, fsConstants.X_OK); return candidate; } catch { /* continue */ }
  }
  return null;
}

async function startStaticServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const requested = req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      const safe = normalize(requested).replace(/^(\.\.[/\\])+/, '');
      const file = resolve(PUBLIC, safe);
      if (!file.startsWith(`${PUBLIC}/`) && file !== resolve(PUBLIC, 'index.html')) {
        res.writeHead(403).end('forbidden'); return;
      }
      const data = await readFile(file);
      res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream', 'cache-control':'no-store' });
      res.end(data);
    } catch (error) {
      res.writeHead(error?.code === 'ENOENT' ? 404 : 500).end('error');
    }
  });
  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  const port = server.address().port;
  return { server, url:`http://127.0.0.1:${port}/` };
}

async function wd(base, method, path, body, timeoutMs = 10000) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers:body === undefined ? undefined : { 'content-type':'application/json' },
    body:body === undefined ? undefined : JSON.stringify(body),
    signal:AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok || payload?.value?.error) throw new Error(payload?.value?.message ?? text ?? `${response.status}`);
  return payload?.value ?? payload;
}

async function startDriver(browser) {
  const executable = await resolveExecutable(browser === 'firefox' ? 'geckodriver' : 'chromedriver');
  assert(executable, `${browser}: WebDriver fehlt.`);
  const args = browser === 'firefox' ? ['--port', '4444'] : ['--port=9515'];
  const port = browser === 'firefox' ? 4444 : 9515;
  const child = spawn(executable, args, { stdio:['ignore','pipe','pipe'] });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  const base = `http://127.0.0.1:${port}`;
  await waitFor(async () => (await fetch(`${base}/status`, { signal:AbortSignal.timeout(500) })).ok, { label:`${browser} WebDriver` });
  const alwaysMatch = browser === 'firefox'
    ? { browserName:'firefox', 'moz:firefoxOptions':{ args:['-headless'], prefs:{ 'ui.prefersReducedMotion':1 } } }
    : { browserName:'chrome', 'goog:chromeOptions':{ args:['--headless=new','--no-sandbox','--disable-dev-shm-usage','--force-prefers-reduced-motion'] } };
  const created = await wd(base, 'POST', '/session', { capabilities:{ alwaysMatch } }, browser === 'firefox' ? 45000 : 15000);
  return { browser, child, base, sessionId:created.sessionId, output:() => output, capabilities:created.capabilities ?? {} };
}

async function stopDriver(driver) {
  if (!driver) return;
  try { await wd(driver.base, 'DELETE', `/session/${driver.sessionId}`); } catch { /* cleanup */ }
  if (driver.child.exitCode === null) driver.child.kill('SIGTERM');
}

const execute = (driver, script) => wd(driver.base, 'POST', `/session/${driver.sessionId}/execute/sync`, { script, args:[] });

async function screenshot(driver, filename) {
  const base64 = await wd(driver.base, 'GET', `/session/${driver.sessionId}/screenshot`);
  await writeFile(resolve(EVIDENCE, filename), Buffer.from(base64, 'base64'));
}

async function runBrowser(browser, url) {
  const driver = await startDriver(browser);
  try {
    await wd(driver.base, 'POST', `/session/${driver.sessionId}/url`, { url });
    await waitFor(async () => (await execute(driver, `return document.getElementById('overall')?.textContent || ''`)).includes('Programmkern nicht erreichbar'), { label:`${browser} sicherer Browserzustand` });

    const safety = await execute(driver, `return {
      overall:document.getElementById('overall')?.textContent||'',
      project:document.getElementById('projectStateText')?.textContent||'',
      disabled:['checkpointBtn','refreshBtn','shutdownBtn'].every(id=>document.getElementById(id)?.disabled===true),
      live:document.getElementById('live')?.getAttribute('aria-live')||''
    }`);
    assert(safety.project.includes('keine Projektdaten verändert'), `${browser}: sicherer Datenhinweis fehlt.`);
    assert(safety.disabled, `${browser}: Aktionen sind ohne nativen Programmkern nicht gesperrt.`);
    assert(safety.live === 'polite', `${browser}: ARIA-Live-Region fehlt.`);

    const workspaceInitial = await execute(driver, `return {
      toggles:[...document.querySelectorAll('[data-workspace-toggle]')].map(e=>({id:e.dataset.workspaceToggle,checked:e.checked,label:document.querySelector('label[for="'+e.id+'"]')?.textContent.trim()||''})),
      panels:[...document.querySelectorAll('[data-workspace-panel]')].map(e=>({id:e.dataset.workspacePanel,hidden:e.hidden})),
      summary:document.getElementById('workspaceSummary')?.textContent||''
    }`);
    assert(workspaceInitial.toggles.length === 4 && workspaceInitial.toggles.every((item) => item.checked && item.label), `${browser}: Arbeitsflächen-Schalter sind nicht vollständig zugänglich.`);
    assert(workspaceInitial.panels.length === 4 && workspaceInitial.panels.every((item) => item.hidden === false), `${browser}: Standardansicht zeigt nicht alle Bereiche.`);
    assert(workspaceInitial.summary.includes('Standardansicht'), `${browser}: Standardstatus der Arbeitsfläche fehlt.`);

    const hiddenStorage = await execute(driver, `
      document.querySelector('[data-workspace-toggle="storage"]').click();
      return {
        hidden:document.querySelector('[data-workspace-panel="storage"]').hidden,
        checked:document.querySelector('[data-workspace-toggle="storage"]').checked,
        summary:document.getElementById('workspaceSummary').textContent,
        live:document.getElementById('live').textContent
      };
    `);
    assert(hiddenStorage.hidden === true && hiddenStorage.checked === false, `${browser}: Speicherbereich lässt sich nicht ausblenden.`);
    assert(hiddenStorage.summary.includes('3 von 4'), `${browser}: Sichtbarkeitsstatus wird nicht verständlich aktualisiert.`);
    assert(hiddenStorage.live.includes('Speicherübersicht') && hiddenStorage.live.includes('ausgeblendet'), `${browser}: Screenreader-Rückmeldung beim Ausblenden fehlt.`);

    const resetWorkspace = await execute(driver, `
      document.querySelector('[data-workspace-toggle="tools"]').click();
      document.getElementById('workspaceResetBtn').click();
      return {
        allVisible:[...document.querySelectorAll('[data-workspace-panel]')].every(e=>e.hidden===false),
        allChecked:[...document.querySelectorAll('[data-workspace-toggle]')].every(e=>e.checked===true),
        summary:document.getElementById('workspaceSummary').textContent,
        live:document.getElementById('live').textContent
      };
    `);
    assert(resetWorkspace.allVisible && resetWorkspace.allChecked, `${browser}: Ansicht zurücksetzen stellt die Standardansicht nicht wieder her.`);
    assert(resetWorkspace.summary.includes('Standardansicht'), `${browser}: Reset-Status fehlt.`);
    assert(resetWorkspace.live.includes('Standardansicht'), `${browser}: Screenreader-Rückmeldung beim Reset fehlt.`);

    await execute(driver, `document.querySelector('[data-workspace-toggle="system-status"]').click(); return true;`);
    await wd(driver.base, 'POST', `/session/${driver.sessionId}/url`, { url });
    await waitFor(async () => (await execute(driver, `return document.getElementById('overall')?.textContent || ''`)).includes('Programmkern nicht erreichbar'), { label:`${browser} Sitzungslokalität` });
    const afterReload = await execute(driver, `return {
      systemVisible:document.querySelector('[data-workspace-panel="system-status"]').hidden===false,
      toggleChecked:document.querySelector('[data-workspace-toggle="system-status"]').checked===true,
      summary:document.getElementById('workspaceSummary').textContent
    }`);
    assert(afterReload.systemVisible && afterReload.toggleChecked && afterReload.summary.includes('Standardansicht'), `${browser}: Sichtbarkeit wurde unerlaubt dauerhaft gespeichert.`);

    await execute(driver, `
      globalThis.__workspaceReviewState = { loadCount:0, persisted:{ today:true, 'system-status':true, storage:true, tools:true } };
      globalThis.__TAURI__ = { core:{ invoke:async (command) => {
        const state = globalThis.__workspaceReviewState;
        if (command === 'get_status') return {
          operating_system:'Testsystem', program_version:'Test', session:'Browser',
          core_status:'ready', core_text:'Programmkern bereit', database_status:'ready',
          database_text:'Lokale Datenbank bereit', local_only:true, status:'ready', overall_text:'Alles bereit'
        };
        if (command === 'load_workspace_visibility') { state.loadCount += 1; return { ...state.persisted }; }
        if (command === 'set_workspace_visibility' || command === 'reset_workspace_visibility') throw new Error('Simulierter Schreibfehler');
        if (command === 'list_tools' || command === 'list_storage_volumes') return [];
        if (command === 'load_or_create_project_state') return { project_id:'browser-review', revision:1 };
        throw new Error('Unerwarteter Testbefehl: ' + command);
      } } };
      document.getElementById('refreshBtn').disabled = false;
      document.getElementById('refreshBtn').click();
      return true;
    `);
    await waitFor(async () => (await execute(driver, `return document.getElementById('overall')?.textContent || ''`)).includes('Alles bereit'), { label:`${browser} simulierte native Ansicht` });

    await execute(driver, `
      const toggle = document.querySelector('[data-workspace-toggle="storage"]');
      toggle.focus();
      toggle.click();
      return true;
    `);
    const failedSave = await waitFor(async () => {
      const state = await execute(driver, `return {
        focused:document.activeElement?.dataset?.workspaceToggle === 'storage',
        disabled:document.querySelector('[data-workspace-toggle="storage"]').disabled,
        hidden:document.querySelector('[data-workspace-panel="storage"]').hidden,
        help:document.getElementById('workspaceHelp').textContent,
        loadCount:globalThis.__workspaceReviewState.loadCount
      }`);
      return !state.disabled && state.hidden && state.help.includes('diese Sitzung') ? state : false;
    }, { label:`${browser} fehlgeschlagenes Speichern bleibt sitzungslokal` });
    assert(failedSave.focused, `${browser}: Fokus ging nach fehlgeschlagenem Speichern verloren.`);
    assert(failedSave.loadCount === 1, `${browser}: Gespeicherte Ansicht wurde unerwartet mehrfach geladen.`);

    await execute(driver, `document.getElementById('refreshBtn').click(); return true;`);
    await waitFor(async () => (await execute(driver, `return document.getElementById('overall')?.textContent || ''`)).includes('Alles bereit'), { label:`${browser} Status-Neupruefung nach Speicherfehler` });
    const afterFailedSaveRefresh = await execute(driver, `return {
      hidden:document.querySelector('[data-workspace-panel="storage"]').hidden,
      checked:document.querySelector('[data-workspace-toggle="storage"]').checked,
      loadCount:globalThis.__workspaceReviewState.loadCount
    }`);
    assert(afterFailedSaveRefresh.hidden && !afterFailedSaveRefresh.checked, `${browser}: Status-Neupruefung verwirft den sitzungslokalen Zustand.`);
    assert(afterFailedSaveRefresh.loadCount === 1, `${browser}: Status-Neupruefung lädt die Persistenz unerwartet erneut.`);

    await execute(driver, `
      const button = document.getElementById('workspaceResetBtn');
      button.focus();
      button.click();
      return true;
    `);
    const failedReset = await waitFor(async () => {
      const state = await execute(driver, `return {
        focused:document.activeElement?.id === 'workspaceResetBtn',
        disabled:document.getElementById('workspaceResetBtn').disabled,
        allVisible:[...document.querySelectorAll('[data-workspace-panel]')].every(e=>e.hidden===false),
        help:document.getElementById('workspaceHelp').textContent
      }`);
      return !state.disabled && state.allVisible && state.help.includes('diese Sitzung') ? state : false;
    }, { label:`${browser} fehlgeschlagener Reset bleibt sitzungslokal` });
    assert(failedReset.focused, `${browser}: Fokus ging nach fehlgeschlagenem Reset verloren.`);

    await execute(driver, `document.getElementById('refreshBtn').click(); return true;`);
    await waitFor(async () => (await execute(driver, `return document.getElementById('overall')?.textContent || ''`)).includes('Alles bereit'), { label:`${browser} Status-Neupruefung nach Resetfehler` });
    const afterFailedResetRefresh = await execute(driver, `return {
      allVisible:[...document.querySelectorAll('[data-workspace-panel]')].every(e=>e.hidden===false),
      allChecked:[...document.querySelectorAll('[data-workspace-toggle]')].every(e=>e.checked===true),
      loadCount:globalThis.__workspaceReviewState.loadCount
    }`);
    assert(afterFailedResetRefresh.allVisible && afterFailedResetRefresh.allChecked, `${browser}: Status-Neupruefung verwirft den sitzungslokalen Reset.`);
    assert(afterFailedResetRefresh.loadCount === 1, `${browser}: Persistenz wurde nach Resetfehler unerwartet erneut geladen.`);

    const contrast = await execute(driver, `
      function rgb(v){const m=v.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);return m?[+m[1],+m[2],+m[3]]:null}
      function lum(c){return c.map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0)}
      function ratio(a,b){a=lum(rgb(a));b=lum(rgb(b));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)}
      const body=getComputedStyle(document.body), primary=getComputedStyle(document.querySelector('button.primary'));
      return {body:ratio(body.color,body.backgroundColor),primary:ratio(primary.color,primary.backgroundColor),reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,transition:getComputedStyle(document.querySelector('.card')).transitionDuration};
    `);
    assert(contrast.body >= 4.5 && contrast.primary >= 4.5, `${browser}: Kontrast unter 4.5:1.`);
    assert(contrast.reduce === true && (contrast.transition === '0s' || contrast.transition === '0s, 0s'), `${browser}: reduzierte Bewegung nicht beachtet.`);

    const matrix = [
      [1280,800,100], [1024,640,125], [853,533,150], [731,457,175], [640,400,200], [760,720,100], [380,360,200]
    ];
    for (const [width,height,zoom] of matrix) {
      await wd(driver.base, 'POST', `/session/${driver.sessionId}/window/rect`, { width, height });
      const metrics = await execute(driver, `const ids=['overall','workspaceResetBtn','checkpointBtn','refreshBtn','shutdownBtn']; return {w:innerWidth,sw:document.documentElement.scrollWidth,els:ids.map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return{id,left:r.left,right:r.right,width:r.width,height:r.height,display:getComputedStyle(e).display}})}`);
      assert(metrics.sw <= metrics.w + 2, `${browser}@${zoom}%: horizontales Ueberlaufen.`);
      for (const item of metrics.els) {
        assert(item.width > 0 && item.height > 0 && item.left >= -1 && item.right <= metrics.w + 1 && item.display !== 'none', `${browser}@${zoom}%: ${item.id} nicht voll sichtbar.`);
        if (item.id.endsWith('Btn')) assert(item.height >= 44, `${browser}@${zoom}%: ${item.id} kleiner als 44px.`);
      }
      await screenshot(driver, `${browser}-${zoom}.png`);
    }

    return { browser, version:driver.capabilities.browserVersion ?? 'unknown', safeWithoutNativeCore:'PASS', workspaceVisibility:'PASS', workspaceSessionOnly:'PASS', workspaceReviewHardening:'PASS', contrast:'PASS', reducedMotion:'PASS', layoutLevels:matrix.length, driverTail:driver.output().slice(-300) };
  } finally {
    await stopDriver(driver);
  }
}

await rm(EVIDENCE, { recursive:true, force:true });
await mkdir(EVIDENCE, { recursive:true });
const staticServer = await startStaticServer();
const results = [];
try {
  for (const browser of browsers) results.push(await runBrowser(browser, staticServer.url));
  await writeFile(resolve(EVIDENCE, 'evidence.json'), JSON.stringify({ status:'PASS', method:'static browser visual acceptance; native behavior is tested separately in Tauri E2E', results }, null, 2));
  console.log('🟢 Browser-Ansicht: Firefox + Chrome PASS · flexible Sitzungssicht · Review-Hardening · 100–200 % · Kontrast · Reduced Motion · sicherer Zustand ohne nativen Kern');
} finally {
  await new Promise((resolveClose) => staticServer.server.close(resolveClose));
}