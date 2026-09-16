import http from 'node:http';
import { spawn } from 'node:child_process';
import { access, readFile, stat } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const PUBLIC = resolve(ROOT, 'src/ui');
const browsers = ['firefox', 'chrome'];
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.mjs':'text/javascript; charset=utf-8' };
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const delay = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));

async function waitFor(check, { timeoutMs = 10000, label = 'Bedingung' } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await check();
    if (value) return value;
    await delay(50);
  }
  throw new Error(`${label} nicht erreicht.`);
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
      res.writeHead(200, { 'content-type':types[extname(file)] ?? 'application/octet-stream', 'cache-control':'no-store' });
      res.end(data);
    } catch (error) {
      res.writeHead(error?.code === 'ENOENT' ? 404 : 500).end('error');
    }
  });
  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  return { server, url:`http://127.0.0.1:${server.address().port}/` };
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
  const base = `http://127.0.0.1:${port}`;
  await waitFor(async () => {
    try { return (await fetch(`${base}/status`, { signal:AbortSignal.timeout(500) })).ok; }
    catch { return false; }
  }, { label:`${browser} WebDriver` });
  const alwaysMatch = browser === 'firefox'
    ? { browserName:'firefox', 'moz:firefoxOptions':{ args:['-headless'] } }
    : { browserName:'chrome', 'goog:chromeOptions':{ args:['--headless=new','--no-sandbox','--disable-dev-shm-usage'] } };
  const created = await wd(base, 'POST', '/session', { capabilities:{ alwaysMatch } }, browser === 'firefox' ? 45000 : 15000);
  return { child, base, sessionId:created.sessionId };
}

async function stopDriver(driver) {
  try { await wd(driver.base, 'DELETE', `/session/${driver.sessionId}`); } catch { /* cleanup */ }
  if (driver.child.exitCode === null) driver.child.kill('SIGTERM');
}

const execute = (driver, script) => wd(driver.base, 'POST', `/session/${driver.sessionId}/execute/sync`, { script, args:[] });

async function installNativeStub(driver, failLoads) {
  await execute(driver, `
    const script = document.createElement('script');
    script.textContent = [
      "globalThis.__workspaceFocusState = { failLoads:${failLoads}, loadCount:0 };",
      "globalThis.__TAURI__ = { core:{ invoke:async (command) => {",
      "const state = globalThis.__workspaceFocusState;",
      "if (command === 'get_status') return { operating_system:'Testsystem', program_version:'Test', session:'Browser', core_status:'ready', core_text:'Programmkern bereit', database_status:'ready', database_text:'Lokale Datenbank bereit', local_only:true, status:'ready', overall_text:'Alles bereit' };",
      "if (command === 'load_workspace_visibility') { state.loadCount += 1; await new Promise((resolveDelay) => setTimeout(resolveDelay, 120)); if (state.failLoads > 0) { state.failLoads -= 1; throw new Error('Simulierter Lesefehler'); } return { today:true, 'system-status':true, storage:true, tools:true }; }",
      "if (command === 'list_tools' || command === 'list_storage_volumes') return [];",
      "if (command === 'load_or_create_project_state') return { project_id:'focus-test', revision:1 };",
      "throw new Error('Unerwarteter Testbefehl: ' + command);",
      "} } };"
    ].join('\\n');
    document.documentElement.append(script);
    script.remove();
    document.getElementById('refreshBtn').disabled = false;
    return true;
  `);
}

async function installPreLoadRaceStub(driver, failLoads) {
  await execute(driver, `
    const script = document.createElement('script');
    script.textContent = [
      "globalThis.__workspacePreLoadState = { failLoads:${failLoads}, loadCount:0, saveCount:0, statusStarted:false, persisted:{ today:true, 'system-status':true, storage:true, tools:false } };",
      "globalThis.__TAURI__ = { core:{ invoke:async (command, args={}) => {",
      "const state = globalThis.__workspacePreLoadState;",
      "if (command === 'get_status') { state.statusStarted = true; await new Promise((resolveDelay) => setTimeout(resolveDelay, 90)); return { operating_system:'Testsystem', program_version:'Test', session:'Browser', core_status:'ready', core_text:'Programmkern bereit', database_status:'ready', database_text:'Lokale Datenbank bereit', local_only:true, status:'ready', overall_text:'Alles bereit' }; }",
      "if (command === 'load_workspace_visibility') { state.loadCount += 1; if (state.failLoads > 0) { state.failLoads -= 1; throw new Error('Simulierter Lesefehler'); } return { ...state.persisted }; }",
      "if (command === 'set_workspace_visibility') { state.saveCount += 1; await new Promise((resolveDelay) => setTimeout(resolveDelay, 220)); state.persisted[args.panel] = args.visible; return { ...state.persisted }; }",
      "if (command === 'reset_workspace_visibility') return { ...state.persisted };",
      "if (command === 'list_tools' || command === 'list_storage_volumes') return [];",
      "if (command === 'load_or_create_project_state') return { project_id:'preload-race-test', revision:1 };",
      "throw new Error('Unerwarteter Testbefehl: ' + command);",
      "} } };"
    ].join('\\n');
    document.documentElement.append(script);
    script.remove();
    document.getElementById('refreshBtn').disabled = false;
    return true;
  `);
}

async function assertLoadFocus(driver, browser, url, { retry, targetSelector, label }) {
  const caseUrl = `${url}index.html?focusCase=${encodeURIComponent(`${label}-${retry ? 'retry' : 'initial'}-${Date.now()}`)}`;
  await wd(driver.base, 'POST', `/session/${driver.sessionId}/url`, { url:caseUrl });
  await waitFor(async () => (await execute(driver, `return document.readyState`)) === 'complete', { label:`${browser} ${label} Dokument bereit` });
  await waitFor(async () => (await execute(driver, `return document.getElementById('overall')?.textContent || ''`)).includes('Programmkern nicht erreichbar'), { label:`${browser} ${label} Browser-Fallback` });

  await installNativeStub(driver, retry ? 1 : 0);
  assert(await execute(driver, `return Boolean(globalThis.__workspaceFocusState)`), `${browser}: Stub für ${label} wurde nicht im aktuellen Dokument installiert.`);

  if (retry) {
    await execute(driver, `document.getElementById('refreshBtn').click(); return true;`);
    await waitFor(async () => (await execute(driver, `return document.getElementById('workspaceHelp')?.textContent || ''`)).includes('konnte nicht geladen werden'), { label:`${browser} ${label} erster Load-Fehler` });
  }

  await execute(driver, `
    const target = document.querySelector(${JSON.stringify(targetSelector)});
    target.focus();
    document.getElementById('refreshBtn').click();
    return document.activeElement === target;
  `);

  const result = await waitFor(async () => {
    const state = await execute(driver, `
      const target = document.querySelector(${JSON.stringify(targetSelector)});
      const focusState = globalThis.__workspaceFocusState;
      return {
        focused:document.activeElement === target,
        disabled:target.disabled,
        loadCount:focusState?.loadCount ?? -1,
        stubReady:Boolean(focusState),
        overall:document.getElementById('overall')?.textContent || ''
      };
    `);
    return state.stubReady && !state.disabled && state.overall.includes('Alles bereit') ? state : false;
  }, { label:`${browser} ${label} Fokus-Wiederherstellung` });

  assert(result.focused, `${browser}: Fokus nach ${label} nicht wiederhergestellt.`);
  assert(result.loadCount === (retry ? 2 : 1), `${browser}: Unerwartete Load-Anzahl bei ${label}.`);
}

async function assertPreLoadRaceRetry(driver, browser, url, { failFirstLoad }) {
  const label = failFirstLoad ? 'Pre-Load-Race mit Lesefehler' : 'Pre-Load-Race';
  const caseUrl = `${url}index.html?preLoadCase=${encodeURIComponent(`${label}-${Date.now()}`)}`;
  await wd(driver.base, 'POST', `/session/${driver.sessionId}/url`, { url:caseUrl });
  await waitFor(async () => (await execute(driver, `return document.readyState`)) === 'complete', { label:`${browser} ${label} Dokument bereit` });
  await waitFor(async () => (await execute(driver, `return document.getElementById('overall')?.textContent || ''`)).includes('Programmkern nicht erreichbar'), { label:`${browser} ${label} Browser-Fallback` });

  await installPreLoadRaceStub(driver, failFirstLoad ? 1 : 0);
  await execute(driver, `document.getElementById('refreshBtn').click(); return true;`);
  await waitFor(async () => await execute(driver, `return globalThis.__workspacePreLoadState?.statusStarted === true`), { label:`${browser} ${label} get_status gestartet` });
  await execute(driver, `
    const toggle = document.querySelector('[data-workspace-toggle="storage"]');
    toggle.focus();
    toggle.click();
    return true;
  `);

  const firstResult = await waitFor(async () => {
    const state = await execute(driver, `
      const testState = globalThis.__workspacePreLoadState;
      return {
        loadCount:testState?.loadCount ?? -1,
        saveCount:testState?.saveCount ?? -1,
        storageHidden:document.querySelector('[data-workspace-panel="storage"]')?.hidden === true,
        toolsHidden:document.querySelector('[data-workspace-panel="tools"]')?.hidden === true,
        help:document.getElementById('workspaceHelp')?.textContent || ''
      };
    `);
    if (failFirstLoad) return state.saveCount === 1 && state.loadCount === 1 && state.help.includes('konnte nicht geladen werden') ? state : false;
    return state.saveCount === 1 && state.loadCount === 1 && state.storageHidden && state.toolsHidden ? state : false;
  }, { label:`${browser} ${label} automatischer Nachhol-Load` });

  assert(firstResult.storageHidden, `${browser}: Nutzeränderung ging beim ${label} verloren.`);
  if (!failFirstLoad) {
    assert(firstResult.toolsHidden, `${browser}: Persistierte Sichtbarkeit der übrigen Panels wurde nicht automatisch nachgeladen.`);
    return;
  }

  assert(!firstResult.toolsHidden, `${browser}: Fehlgeschlagener Nachhol-Load darf alte Persistenz nicht vortäuschen.`);
  await execute(driver, `document.getElementById('refreshBtn').click(); return true;`);
  const retryResult = await waitFor(async () => {
    const state = await execute(driver, `return {
      loadCount:globalThis.__workspacePreLoadState?.loadCount ?? -1,
      storageHidden:document.querySelector('[data-workspace-panel="storage"]')?.hidden === true,
      toolsHidden:document.querySelector('[data-workspace-panel="tools"]')?.hidden === true,
      help:document.getElementById('workspaceHelp')?.textContent || ''
    }`);
    return state.loadCount === 2 && state.storageHidden && state.toolsHidden ? state : false;
  }, { label:`${browser} ${label} manueller Retry` });
  assert(retryResult.loadCount === 2, `${browser}: Nach fehlgeschlagenem Nachhol-Load wurde nicht genau einmal retryt.`);
}

const server = await startStaticServer();
try {
  for (const browser of browsers) {
    const driver = await startDriver(browser);
    try {
      await assertLoadFocus(driver, browser, server.url, { retry:false, targetSelector:'[data-workspace-toggle="storage"]', label:'Initial-Load mit Toggle' });
      await assertLoadFocus(driver, browser, server.url, { retry:false, targetSelector:'#workspaceResetBtn', label:'Initial-Load mit Reset' });
      await assertLoadFocus(driver, browser, server.url, { retry:true, targetSelector:'[data-workspace-toggle="storage"]', label:'Retry-Load mit Toggle' });
      await assertLoadFocus(driver, browser, server.url, { retry:true, targetSelector:'#workspaceResetBtn', label:'Retry-Load mit Reset' });
      await assertPreLoadRaceRetry(driver, browser, server.url, { failFirstLoad:false });
      await assertPreLoadRaceRetry(driver, browser, server.url, { failFirstLoad:true });
      console.log(`🟢 ${browser}: Load-Fokus und Pre-Load-Retry sind deterministisch abgesichert.`);
    } finally {
      await stopDriver(driver);
    }
  }
} finally {
  await new Promise((resolveClose) => server.server.close(resolveClose));
}

console.log('🟢 Workspace-Load-Hardening: Firefox + Chrome PASS.');