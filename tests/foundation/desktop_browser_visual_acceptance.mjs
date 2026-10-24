import http from 'node:http';
import { spawn } from 'node:child_process';
import { access, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { formatWebDriverDiagnostic } from './webdriver_failure_context.mjs';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const PUBLIC = resolve(ROOT, 'src/ui');
const EVIDENCE = resolve(ROOT, 'runtime/browser-acceptance');
const browsers = ['firefox', 'chrome'];
const trace = { browser:'unknown', version:'unknown', phase:'initial', viewport:null, request:null };
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
      res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(data);
    } catch (error) {
      res.writeHead(error?.code === 'ENOENT' ? 404 : 500).end('error');
    }
  });
  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  const port = server.address().port;
  return { server, url: `http://127.0.0.1:${port}/` };
}

async function wd(base, method, path, body, timeoutMs = 10000) {
  // Nur der letzte fehlgeschlagene Transportaufruf wird protokolliert.
  // Weder Session-IDs noch Anfragedaten gehören in den Fehlernachweis.
  trace.request = { method, path, timeoutMs };
  const response = await fetch(`${base}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'content-type':'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok || payload?.value?.error) throw new Error(payload?.value?.message ?? text ?? `${response.status}`);
  trace.request = null;
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
  try {
    const base = `http://127.0.0.1:${port}`;
    trace.phase = 'driver-ready';
    await waitFor(async () => (await fetch(`${base}/status`, { signal: AbortSignal.timeout(500) })).ok, { label:`${browser} WebDriver` });
    const alwaysMatch = browser === 'firefox'
      ? { browserName:'firefox', 'moz:firefoxOptions':{ args:['-headless'], prefs:{ 'ui.prefersReducedMotion':1 } } }
      : { browserName:'chrome', 'goog:chromeOptions':{ args:['--headless=new','--no-sandbox','--disable-dev-shm-usage','--force-prefers-reduced-motion'] } };
    trace.phase = 'session-create';
    const created = await wd(base, 'POST', '/session', { capabilities:{ alwaysMatch } }, browser === 'firefox' ? 45000 : 15000);
    trace.version = created.capabilities?.browserVersion ?? 'unknown';
    return { browser, child, base, sessionId:created.sessionId, output:() => output, capabilities:created.capabilities ?? {} };
  } catch (error) {
    // Bei gescheiterter Readiness oder Session-Erstellung keinen Testtreiber zurücklassen.
    if (child.exitCode === null) child.kill('SIGTERM');
    throw error;
  }
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

async function verifySongEditorSmallViewport(driver, url) {
  const matrix = [
    { width:800, height:600, zoom:100 },
    { width:457, height:343, zoom:175 },
    { width:400, height:300, zoom:200 },
  ];
  // iframe benutzt echte CSS-Viewports mit den äquivalenten Größen
  // eines 800×600-Ausgangsfensters bei 175 % bzw. 200 %.
  await wd(driver.base, 'POST', `/session/${driver.sessionId}/window/rect`, { width:1000, height:800 });
  const results = [];
  for (const item of matrix) {
    trace.phase = 'song-editor-layout';
    trace.viewport = item;
    const frameScript = [
      "document.getElementById('songTestFrame')?.remove();",
      "const frame=document.createElement('iframe');",
      "frame.id='songTestFrame';",
      "frame.title='Songtext-Editor Layouttest';",
      "frame.src=" + JSON.stringify(url) + ";",
      "frame.style.cssText=" + JSON.stringify('position:fixed;top:0;left:0;z-index:2147483647;background:white;border:0;width:' + item.width + 'px;height:' + item.height + 'px;') + ";",
      "document.body.append(frame);",
      "return true;",
    ].join('\n');
    await execute(driver, frameScript);
    await waitFor(async () => await execute(driver,
      "const frame=document.getElementById('songTestFrame');return Boolean(frame?.contentDocument?.getElementById('songEditorDialog') && frame.contentDocument.readyState==='complete');"),
    { label:`${driver.browser}: Songdialog bei ${item.zoom}% geladen` });
    const metrics = await execute(driver, "const frame=document.getElementById('songTestFrame');\nconst d=frame.contentDocument;\nconst win=frame.contentWindow;\nconst dialog=d.getElementById('songEditorDialog');\ndialog.showModal();\nconst change=(id,value)=>{const el=d.getElementById(id);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));};\nchange('songFileName','arbeitsdatei_09');\nchange('songTitle','Interner Titel');\nchange('songAltTitle','Der öffentliche Titel');\nd.getElementById('songAltEnabled').click();\nconst alternativeIsVisible=!d.getElementById('songAltContainer').hidden;\nconst published=d.getElementById('songPublishedPreview').textContent;\nconst ids=['songFileName','songTitle','songAltTitle','songLyrics','songList','songNewBtn','songCloseBtn','songSaveBtn','songExportBtn','songCopyBtn','songImportBtn','songBackupBtn'];\nconst elements=ids.map(id=>{const el=d.getElementById(id),r=el.getBoundingClientRect();return {id,left:r.left,right:r.right,width:r.width,height:r.height};});\nconst check=d.querySelector('.song-check').getBoundingClientRect();\nconst rect=dialog.getBoundingClientRect();\nconst viewport={width:win.innerWidth,height:win.innerHeight};\ndialog.scrollTop=dialog.scrollHeight;\nconst atBottom=d.getElementById('songCopyBtn').getBoundingClientRect();\nreturn {viewport,screenOverflow:d.documentElement.scrollWidth,dialogScrollWidth:dialog.scrollWidth,dialogClientWidth:dialog.clientWidth,dialogScrollHeight:dialog.scrollHeight,dialogClientHeight:dialog.clientHeight,rect:{left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom},elements,checkHeight:check.height,alternativeIsVisible,published,exportDisabled:d.getElementById('songExportBtn').disabled,buttonBottom:atBottom.bottom,buttonTop:atBottom.top};");
    assert(metrics.viewport.width === item.width && metrics.viewport.height === item.height,
      `${driver.browser}@${item.zoom}%: Testfenster hat falsche effektive Größe.`);
    assert(metrics.screenOverflow <= item.width + 2,
      `${driver.browser}@${item.zoom}%: Hauptansicht hat horizontales Überlaufen.`);
    assert(metrics.rect.left >= -1 && metrics.rect.right <= item.width + 1,
      `${driver.browser}@${item.zoom}%: Dialog horizontal abgeschnitten.`);
    assert(metrics.rect.top >= -1 && metrics.rect.bottom <= item.height + 1,
      `${driver.browser}@${item.zoom}%: Dialog vertikal nicht im Testfenster.`);
    assert(metrics.dialogScrollWidth <= metrics.dialogClientWidth + 2,
      `${driver.browser}@${item.zoom}%: Dialog benötigt horizontales Scrollen.`);
    assert(metrics.elements.every(el=>el.width >= 1 && el.height >= 44 && el.left >= -1 && el.right <= item.width + 1),
      `${driver.browser}@${item.zoom}%: Formularfeld oder Schaltfläche abgeschnitten/zu klein.`);
    assert(metrics.checkHeight >= 44, `${driver.browser}@${item.zoom}%: Umschalter zu klein.`);
    assert(metrics.alternativeIsVisible && metrics.published === 'Der öffentliche Titel' && metrics.exportDisabled,
      `${driver.browser}@${item.zoom}%: Titelschalter oder ungespeicherter Exportzustand fehlerhaft.`);
    assert(metrics.buttonTop >= -1 && metrics.buttonBottom <= item.height + 1,
      `${driver.browser}@${item.zoom}%: Schaltfläche am Dialogende nicht durch vertikales Scrollen erreichbar.`);
    if (item.zoom > 100) {
      assert(metrics.dialogScrollHeight > metrics.dialogClientHeight,
        `${driver.browser}@${item.zoom}%: Ein kleiner Dialog muss vertikal scrollbar bleiben.`);
    }
    await screenshot(driver, `${driver.browser}-song-editor-${item.zoom}.png`);
    results.push({ zoom:item.zoom, viewport:metrics.viewport, verticalScroll:metrics.dialogScrollHeight > metrics.dialogClientHeight });
  }
  await execute(driver, "document.getElementById('songTestFrame')?.remove();return true;");
  return results;
}

async function runBrowser(browser, url) {
  trace.browser = browser;
  trace.version = 'unknown';
  trace.phase = 'driver-start';
  trace.viewport = null;
  trace.request = null;
  let driver;
  try {
    driver = await startDriver(browser);
    trace.phase = 'safe-state';
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

    trace.phase = 'workspace-visibility';
    const workspaceInitial = await execute(driver, `return {
      toggles:[...document.querySelectorAll('[data-workspace-toggle]')].map(e=>({id:e.dataset.workspaceToggle,checked:e.checked,label:document.querySelector('label[for="'+e.id+'"]')?.textContent.trim()||''})),
      panels:[...document.querySelectorAll('[data-workspace-panel]')].map(e=>({id:e.dataset.workspacePanel,hidden:e.hidden})),
      summary:document.getElementById('workspaceSummary')?.textContent||''
    }`);
    assert(workspaceInitial.toggles.length === 4 && workspaceInitial.toggles.every((item) => item.checked && item.label), `${browser}: Arbeitsflächen-Schalter sind nicht vollständig zugänglich.`);
    assert(workspaceInitial.panels.length === 4 && workspaceInitial.panels.every((item) => item.hidden === false), `${browser}: Standardansicht zeigt nicht alle Bereiche.`);
    assert(workspaceInitial.summary.includes('Standardansicht'), `${browser}: Standardstatus der Arbeitsfläche fehlt.`);

    await execute(driver, `document.querySelector('[data-workspace-toggle="storage"]').click(); return true;`);
    await waitFor(async () => (await execute(driver, `return document.getElementById('live').textContent`)).includes('ausgeblendet'), { label:`${browser}: Speicherbereich ausgeblendet` });
    const hiddenStorage = await execute(driver, `return {
      hidden:document.querySelector('[data-workspace-panel="storage"]').hidden,
      checked:document.querySelector('[data-workspace-toggle="storage"]').checked,
      summary:document.getElementById('workspaceSummary').textContent,
      help:document.getElementById('workspaceHelp').textContent
    }`);
    assert(hiddenStorage.hidden && !hiddenStorage.checked && hiddenStorage.summary.includes('3 von 4'), `${browser}: Speicherbereich nicht korrekt ausgeblendet.`);
    assert(hiddenStorage.help.includes('Sitzung'), `${browser}: Browser-Fallback ohne nativen Kern nicht erklärt.`);

    await execute(driver, `document.querySelector('[data-workspace-toggle="tools"]').click();return true;`);
    await waitFor(async () => (await execute(driver, `return document.getElementById('live').textContent`)).includes('Werkzeug-Zentrale'), { label:`${browser}: Werkzeug-Zentrale ausgeblendet` });
    await execute(driver, `document.getElementById('workspaceResetBtn').click();return true;`);
    await waitFor(async () => (await execute(driver, `return document.getElementById('live').textContent`)).includes('Standardansicht'), { label:`${browser}: Ansicht zurückgesetzt` });
    const resetWorkspace = await execute(driver, `return {
      allVisible:[...document.querySelectorAll('[data-workspace-panel]')].every(e=>e.hidden===false),
      allChecked:[...document.querySelectorAll('[data-workspace-toggle]')].every(e=>e.checked===true),
      summary:document.getElementById('workspaceSummary').textContent
    }`);
    assert(resetWorkspace.allVisible && resetWorkspace.allChecked && resetWorkspace.summary.includes('Standardansicht'), `${browser}: Reset unvollständig.`);

    await execute(driver, `document.querySelector('[data-workspace-toggle="system-status"]').click(); return true;`);
    await waitFor(async () => (await execute(driver, `return document.getElementById('live').textContent`)).includes('Systemstatus'), { label:`${browser}: Systemstatus ausgeblendet` });
    await wd(driver.base, 'POST', `/session/${driver.sessionId}/url`, { url });
    await waitFor(async () => (await execute(driver, `return document.getElementById('overall')?.textContent || ''`)).includes('Programmkern nicht erreichbar'), { label:`${browser}: Sitzungslokalität` });
    const afterReload = await execute(driver, `return {
      systemVisible:document.querySelector('[data-workspace-panel="system-status"]').hidden===false,
      toggleChecked:document.querySelector('[data-workspace-toggle="system-status"]').checked===true,
      summary:document.getElementById('workspaceSummary').textContent
    }`);
    assert(afterReload.systemVisible && afterReload.toggleChecked && afterReload.summary.includes('Standardansicht'), `${browser}: Browser-Fallback wurde unerlaubt dauerhaft gespeichert.`);

    trace.phase = 'contrast-motion';
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
      trace.phase = 'responsive-layout';
      trace.viewport = { width, height, zoom };
      await wd(driver.base, 'POST', `/session/${driver.sessionId}/window/rect`, { width, height });
      const metrics = await execute(driver, `const ids=['overall','workspaceResetBtn','checkpointBtn','refreshBtn','shutdownBtn']; return {w:innerWidth,sw:document.documentElement.scrollWidth,els:ids.map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return{id,left:r.left,right:r.right,width:r.width,height:r.height,display:getComputedStyle(e).display}})}`);
      assert(metrics.sw <= metrics.w + 2, `${browser}@${zoom}%: horizontales Ueberlaufen.`);
      for (const item of metrics.els) {
        assert(item.width > 0 && item.height > 0 && item.left >= -1 && item.right <= metrics.w + 1 && item.display !== 'none', `${browser}@${zoom}%: ${item.id} nicht voll sichtbar.`);
        if (item.id.endsWith('Btn')) assert(item.height >= 44, `${browser}@${zoom}%: ${item.id} kleiner als 44px.`);
      }
      await screenshot(driver, `${browser}-${zoom}.png`);
    }

    const songEditorViewports = await verifySongEditorSmallViewport(driver, url);
    return { browser, version:driver.capabilities.browserVersion ?? 'unknown', safeWithoutNativeCore:'PASS', workspaceVisibility:'PASS', workspaceSessionOnly:'PASS', contrast:'PASS', reducedMotion:'PASS', layoutLevels:matrix.length, songEditorViewports, driverTail:driver.output().slice(-300) };
  } catch (error) {
    console.error(formatWebDriverDiagnostic({ ...trace, error }));
    throw error;
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
  console.log('🟢 Browser-Ansicht: Firefox + Chrome PASS · flexible Sitzungssicht · 100–200 % · Songtext-Editor bei 800×600/175–200 % · Kontrast · Reduced Motion · sicherer Zustand ohne nativen Kern');
} finally {
  await new Promise((resolveClose) => staticServer.server.close(resolveClose));
}
