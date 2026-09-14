const $ = (id) => document.getElementById(id);
const live = (text) => { $('live').textContent = text; };

function runtimeInvoke() {
  const invoke = globalThis.__TAURI__?.core?.invoke;
  if (typeof invoke !== 'function') {
    throw new Error('Der Programmkern ist in dieser Ansicht nicht erreichbar.');
  }
  return invoke;
}

function setActionsEnabled(enabled) {
  for (const id of ['checkpointBtn', 'refreshBtn', 'shutdownBtn']) {
    $(id).disabled = !enabled;
  }
}

async function loadProjectState() {
  const state = await runtimeInvoke()('load_or_create_project_state');
  const node = $('projectStateText');
  node.textContent = `Bereit · Revision ${state.revision} · Speicherung lokal`;
  node.dataset.projectId = state.project_id;
  node.dataset.revision = String(state.revision);
  return state;
}

async function refresh() {
  try {
    const [status] = await Promise.all([
      runtimeInvoke()('get_status'),
      loadProjectState(),
    ]);
    $('coreText').textContent = `Bereit · Sitzung ${status.session}`;
    $('localText').textContent = status.local_only
      ? 'Bestanden: Der Programmkern arbeitet nur auf diesem Gerät.'
      : 'Hinweis: Der Programmkern meldet eine unerwartete Verbindung.';
    $('overall').textContent = status.local_only ? '🟢 Alles bereit' : '🟡 Bitte prüfen';
    setActionsEnabled(true);
    live($('overall').textContent);
  } catch (error) {
    $('coreText').textContent = `Nicht bereit: ${error?.message ?? 'unbekannter Fehler'}`;
    $('projectStateText').textContent = 'Es wurden keine Projektdaten verändert.';
    $('overall').textContent = '🔴 Programmkern nicht erreichbar';
    setActionsEnabled(false);
    live('Programmkern nicht erreichbar');
  }
}

$('checkpointBtn').addEventListener('click', async () => {
  const button = $('checkpointBtn');
  button.disabled = true;
  try {
    const saved = await runtimeInvoke()('create_checkpoint', { reason: 'NUTZER_ZWISCHENSTAND' });
    $('checkpointText').textContent = `Gesichert: ${new Date(saved.at).toLocaleTimeString()}`;
    live('Zwischenstand wurde sicher gespeichert');
  } catch (error) {
    $('checkpointText').textContent = `Nicht gespeichert: ${error?.message ?? 'unbekannter Fehler'}`;
    live('Zwischenstand konnte nicht gespeichert werden');
  } finally {
    button.disabled = false;
  }
});

$('refreshBtn').addEventListener('click', refresh);

$('shutdownBtn').addEventListener('click', async () => {
  const button = $('shutdownBtn');
  button.disabled = true;
  $('shutdownText').textContent = 'Zwischenstand wird gesichert. Danach schließt das Programm …';
  $('overall').textContent = '🔵 Sicheres Beenden läuft …';
  live('Sicheres Beenden wurde gestartet');
  try {
    const saved = await runtimeInvoke()('request_shutdown');
    $('shutdownText').textContent = `Zwischenstand gesichert: ${new Date(saved.at).toLocaleTimeString()}`;
  } catch (error) {
    $('shutdownText').textContent = `Beenden wurde gestoppt: ${error?.message ?? 'unbekannter Fehler'}`;
    $('overall').textContent = '🔴 Sicheres Beenden nicht möglich';
    button.disabled = false;
  }
});

setActionsEnabled(false);
await refresh();
