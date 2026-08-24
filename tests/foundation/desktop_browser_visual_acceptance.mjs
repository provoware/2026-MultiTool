import { spawn } from 'node:child_process';
import { access, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { findAvailablePort, resolveExecutable } from '../../src/core/lifecycle.mjs';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const EVIDENCE_DIR = resolve(ROOT, 'runtime/browser-acceptance');
const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf';
const TAB = '\uE004';
const browsers = ['firefox', 'chrome'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

async function waitFor(check, { timeoutMs = 8000, pollMs = 100, label = 'Bedingung' } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const value = await check();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await delay(pollMs);
  }
  throw new Error(`${label} nicht innerhalb von ${timeoutMs} ms erreicht.${lastError ? ` Letzter Fehler: ${lastError.message}` : ''}`);
}

async function executableFromEnv(envName, binaryName) {
  const configured = process.env[envName];
  if (!configured) return null;
  try {
    const info = await stat(configured);
    const candidate = info.isDirectory() ? resolve(configured, binaryName) : configured;
    await access(candidate);
    return candidate;
  } catch {
    return null;
  }
}

async function browserDriver(browser) {
  if (browser === 'chrome') {
    return await resolveExecutable('chromedriver')
      ?? await executableFromEnv('CHROMEWEBDRIVER', 'chromedriver');
  }
  return await resolveExecutable('geckodriver')
    ?? await executableFromEnv('GECKOWEBDRIVER', 'geckodriver');
}

async function wd(base, method, path, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = { value: text }; }
  }
  if (!response.ok || payload?.value?.error) {
    const detail = payload?.value?.message ?? text ?? `${response.status}`;
    throw new Error(`WebDriver ${method} ${path}: ${detail}`);
  }
  return payload?.value ?? payload;
}

async function startDriver(browser) {
  const executable = await browserDriver(browser);
  assert(executable, `${browser}: nativer WebDriver wurde auf dem Runner nicht gefunden.`);
  const port = await findAvailablePort(browser === 'firefox' ? 4444 : 9515, { host: '127.0.0.1', attempts: 40 });
  const args = browser === 'firefox' ? ['--port', String(port)] : [`--port=${port}`];
  const child = spawn(executable, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  const base = `http://127.0.0.1:${port}`;
  await waitFor(async () => {
    const response = await fetch(`${base}/status`, { signal: AbortSignal.timeout(500) });
    return response.ok;
  }, { label: `${browser} WebDriver Readiness` });

  const alwaysMatch = browser === 'firefox'
    ? {
        browserName: 'firefox',
        'moz:firefoxOptions': {
          args: ['-headless'],
          prefs: { 'ui.prefersReducedMotion': 1 },
        },
      }
    : {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--force-prefers-reduced-motion'],
        },
      };

  const created = await wd(base, 'POST', '/session', { capabilities: { alwaysMatch } });
  const sessionId = created?.sessionId;
  assert(sessionId, `${browser}: WebDriver-Session-ID fehlt.`);
  return {
    browser,
    child,
    base,
    sessionId,
    capabilities: created.capabilities ?? {},
    output: () => output,
  };
}

async function stopDriver(driver) {
  if (!driver) return;
  try { await wd(driver.base, 'DELETE', `/session/${driver.sessionId}`); } catch { /* cleanup */ }
  if (driver.child.exitCode === null && driver.child.signalCode === null) driver.child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolveExit) => driver.child.once('exit', resolveExit)),
    delay(1500),
  ]);
  if (driver.child.exitCode === null && driver.child.signalCode === null) driver.child.kill('SIGKILL');
}

function startLauncher() {
  const child = spawn(process.execPath, ['scripts/launcher.mjs', '--no-open'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  return { child, output: () => output };
}

async function launcherUrl(launcher) {
  return await waitFor(() => {
    const match = launcher.output().match(/🟢 BEREIT\s+(http:\/\/127\.0\.0\.1:\d+)/);
    return match?.[1] ?? false;
  }, { label: 'Launcher USER_READY', timeoutMs: 7000 });
}

async function waitForLauncherExit(launcher, label) {
  if (launcher.child.exitCode !== null || launcher.child.signalCode !== null) {
    return { code: launcher.child.exitCode, signal: launcher.child.signalCode };
  }
  return await Promise.race([
    new Promise((resolveExit) => launcher.child.once('exit', (code, signal) => resolveExit({ code, signal }))),
    delay(7000).then(() => {
      throw new Error(`${label}: Launcher-Exit Timeout. Ausgabe: ${launcher.output()}`);
    }),
  ]);
}

async function navigate(driver, url) {
  await wd(driver.base, 'POST', `/session/${driver.sessionId}/url`, { url });
}

async function execute(driver, script, args = []) {
  return await wd(driver.base, 'POST', `/session/${driver.sessionId}/execute/sync`, { script, args });
}

async function findElement(driver, selector) {
  const result = await wd(driver.base, 'POST', `/session/${driver.sessionId}/element`, {
    using: 'css selector',
    value: selector,
  });
  const id = result?.[ELEMENT_KEY];
  assert(id, `${driver.browser}: Element '${selector}' nicht gefunden.`);
  return id;
}

async function click(driver, selector) {
  const id = await findElement(driver, selector);
  await wd(driver.base, 'POST', `/session/${driver.sessionId}/element/${id}/click`, {});
}

async function pressTab(driver) {
  await wd(driver.base, 'POST', `/session/${driver.sessionId}/actions`, {
    actions: [{
      type: 'key',
      id: 'keyboard',
      actions: [
        { type: 'keyDown', value: TAB },
        { type: 'keyUp', value: TAB },
      ],
    }],
  });
  await wd(driver.base, 'DELETE', `/session/${driver.sessionId}/actions`);
}

async function screenshot(driver, filename) {
  const base64 = await wd(driver.base, 'GET', `/session/${driver.sessionId}/screenshot`);
  assert(typeof base64 === 'string' && base64.length > 1000, `${driver.browser}: Screenshot '${filename}' ist leer.`);
  await writeFile(resolve(EVIDENCE_DIR, filename), Buffer.from(base64, 'base64'));
}

const visualMetricsScript = `
const ids=['overall','checkpointBtn','refreshBtn','shutdownBtn'];
const elements=ids.map(id=>{const e=document.getElementById(id);const r=e.getBoundingClientRect();return{id,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,display:getComputedStyle(e).display,visibility:getComputedStyle(e).visibility};});
return {innerWidth,innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,elements};
`;

function validateMetrics(browser, label, metrics) {
  assert(metrics.scrollWidth <= metrics.innerWidth + 2, `${browser} ${label}: horizontales Überlaufen ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  for (const item of metrics.elements) {
    assert(item.width > 0 && item.height > 0, `${browser} ${label}: '${item.id}' hat keine sichtbare Größe.`);
    assert(item.left >= -1 && item.right <= metrics.innerWidth + 1, `${browser} ${label}: '${item.id}' horizontal abgeschnitten.`);
    assert(item.display !== 'none' && item.visibility !== 'hidden', `${browser} ${label}: '${item.id}' ist ausgeblendet.`);
    if (item.id.endsWith('Btn')) assert(item.height >= 44, `${browser} ${label}: '${item.id}' Klickziel < 44px.`);
  }
}

async function testKeyboardAndFocus(driver) {
  await execute(driver, `document.documentElement.style.zoom='1'; document.body.setAttribute('tabindex','-1'); document.body.focus(); return document.activeElement===document.body;`);
  const expected = ['checkpointBtn', 'refreshBtn', 'shutdownBtn'];
  for (const id of expected) {
    await pressTab(driver);
    const focused = await execute(driver, 'return document.activeElement?.id || null;');
    assert(focused === id, `${driver.browser}: Tastaturreihenfolge erwartet '${id}', erhalten '${focused}'.`);
    const focusStyle = await execute(driver, `const s=getComputedStyle(document.activeElement); return {style:s.outlineStyle,width:s.outlineWidth};`);
    assert(focusStyle.style !== 'none' && parseFloat(focusStyle.width) >= 2, `${driver.browser}: sichtbarer Fokus für '${id}' fehlt.`);
  }
  await execute(driver, `document.body.removeAttribute('tabindex'); return true;`);
}

async function testReducedMotion(driver) {
  const result = await execute(driver, `const card=document.querySelector('.card'); const s=getComputedStyle(card); return {reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,transition:s.transitionDuration};`);
  assert(result.reduce === true, `${driver.browser}: prefers-reduced-motion wurde im Browser-Test nicht aktiviert.`);
  assert(result.transition === '0s' || result.transition === '0s, 0s', `${driver.browser}: Animation bleibt bei reduced motion aktiv (${result.transition}).`);
}

async function testContrast(driver) {
  const result = await execute(driver, `
  function rgb(v){const m=v.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);return m?[+m[1],+m[2],+m[3]]:null}
  function lum(c){return c.map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0)}
  function ratio(a,b){a=lum(rgb(a));b=lum(rgb(b));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)}
  const body=getComputedStyle(document.body), primary=getComputedStyle(document.querySelector('button.primary')), danger=getComputedStyle(document.querySelector('button.danger'));
  return {body:ratio(body.color,body.backgroundColor),primary:ratio(primary.color,primary.backgroundColor),danger:ratio(danger.color,danger.backgroundColor)};
  `);
  for (const [name, ratio] of Object.entries(result)) assert(ratio >= 4.5, `${driver.browser}: Kontrast '${name}' nur ${ratio.toFixed(2)}:1.`);
}

async function runBrowser(browser) {
  let driver = null;
  let launcher = null;
  try {
    launcher = startLauncher();
    const url = await launcherUrl(launcher);
    driver = await startDriver(browser);
    await navigate(driver, url);
    await waitFor(async () => (await execute(driver, `return document.getElementById('overall')?.textContent || '';`)).includes('Start erfolgreich'), {
      label: `${browser} UI Startstatus`,
    });

    await testReducedMotion(driver);
    await testContrast(driver);

    const matrix = [
      { screen: 'desktop', baseWidth: 1280, baseHeight: 800, zoom: 100 },
      { screen: 'desktop', baseWidth: 1280, baseHeight: 800, zoom: 125 },
      { screen: 'desktop', baseWidth: 1280, baseHeight: 800, zoom: 150 },
      { screen: 'desktop', baseWidth: 1280, baseHeight: 800, zoom: 175 },
      { screen: 'desktop', baseWidth: 1280, baseHeight: 800, zoom: 200 },
      { screen: 'small', baseWidth: 760, baseHeight: 720, zoom: 100 },
      { screen: 'small', baseWidth: 760, baseHeight: 720, zoom: 200 },
    ];

    const measurements = [];
    for (const entry of matrix) {
      const scale = entry.zoom / 100;
      const width = Math.max(320, Math.round(entry.baseWidth / scale));
      const height = Math.max(320, Math.round(entry.baseHeight / scale));
      await wd(driver.base, 'POST', `/session/${driver.sessionId}/window/rect`, { width, height });
      await execute(driver, `document.documentElement.style.zoom='1'; return true;`);
      const metrics = await execute(driver, visualMetricsScript);
      const label = `${entry.screen}@${entry.zoom}%`;
      validateMetrics(browser, label, metrics);
      measurements.push({ ...entry, effectiveViewport: { width: metrics.innerWidth, height: metrics.innerHeight }, scrollWidth: metrics.scrollWidth });
      await screenshot(driver, `${browser}-${entry.screen}-${entry.zoom}.png`);
    }

    await wd(driver.base, 'POST', `/session/${driver.sessionId}/window/rect`, { width: 1280, height: 800 });
    await testKeyboardAndFocus(driver);

    await click(driver, '#checkpointBtn');
    await waitFor(async () => (await execute(driver, `return document.getElementById('checkpointText')?.textContent || '';`)).includes('Bestanden:'), {
      label: `${browser} Checkpoint UI`,
    });

    await screenshot(driver, `${browser}-checkpoint-pass.png`);
    await click(driver, '#shutdownBtn');
    const exit = await waitForLauncherExit(launcher, `${browser} UI_LOGOUT`);
    assert(exit.code === 0 && exit.signal === null, `${browser}: Launcher nach UI-Logout Code ${exit.code}, Signal ${exit.signal}. Ausgabe: ${launcher.output()}`);
    await waitFor(async () => {
      try {
        await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(250) });
        return false;
      } catch {
        return true;
      }
    }, { timeoutMs: 3500, label: `${browser} Verify Closed` });

    return {
      browser,
      browserVersion: driver.capabilities.browserVersion ?? driver.capabilities.version ?? 'unknown',
      platformName: driver.capabilities.platformName ?? 'unknown',
      matrix: measurements,
      keyboardOrder: ['checkpointBtn', 'refreshBtn', 'shutdownBtn'],
      checkpoint: 'PASS',
      uiLogout: 'PASS',
      verifyClosed: 'PASS',
      reducedMotion: 'PASS',
      contrast: 'PASS',
    };
  } finally {
    await stopDriver(driver);
    if (launcher?.child && launcher.child.exitCode === null && launcher.child.signalCode === null) {
      launcher.child.kill('SIGTERM');
      await delay(300);
      if (launcher.child.exitCode === null && launcher.child.signalCode === null) launcher.child.kill('SIGKILL');
    }
  }
}

await rm(EVIDENCE_DIR, { recursive: true, force: true });
await mkdir(EVIDENCE_DIR, { recursive: true });
const evidence = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  method: 'native WebDriver, no added npm browser dependency',
  zoomMethod: 'native-layout-equivalent viewport reduction for 100/125/150/175/200 percent plus real browser rendering',
  browsers: [],
};

for (const browser of browsers) {
  const result = await runBrowser(browser);
  evidence.browsers.push(result);
  console.log(`🟢 ${browser}: Desktop-Browser-Acceptance PASS · 7 Layoutstufen · Tastatur/Fokus · Checkpoint · UI-Logout · Verify Closed`);
}

await writeFile(resolve(EVIDENCE_DIR, 'evidence.json'), JSON.stringify(evidence, null, 2));
console.log('🟢 C3 Desktop-Browser-Visual-Acceptance: Firefox + Chrome PASS');
