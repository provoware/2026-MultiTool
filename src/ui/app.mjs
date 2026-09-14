const $ = (id) => document.getElementById(id);
const live = (text) => { $('live').textContent = text; };

function runtimeInvoke() {
  const invoke = globalThis.__TAURI__?.core?.invoke;
  if (typeof invoke !== 'function') {
    throw new Error('Der Programmkern ist in dieser Ansicht nicht erreichbar.');
  }
  return invoke;
}

function setStorageActionsEnabled(enabled) {
  for (const id of ['checkpointBtn', 'shutdownBtn']) {
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

function statusIcon(state) {
  return {
    ready: '🟢',
    attention: '🟡',
    hidden: '⚪',
    disabled: '🔒',
    permission_missing: '🟡',
  }[state] ?? '🔵';
}

function toolIcon(state) {
  return statusIcon(state);
}

function renderSystemStatus(status) {
  $('osText').textContent = status.operating_system || 'Nicht verfügbar';
  $('versionText').textContent = status.program_version || 'Nicht verfügbar';
  $('sessionText').textContent = status.session ? `Aktiv · ${status.session}` : 'Nicht verfügbar';
  $('systemCoreText').textContent = `${statusIcon(status.core_status)} ${status.core_text}`;
  $('databaseText').textContent = `${statusIcon(status.database_status)} ${status.database_text}`;
  $('coreText').textContent = `${status.core_text} · Sitzung aktiv`;
  $('localText').textContent = status.local_only
    ? 'Bestanden: Der Programmkern arbeitet nur auf diesem Gerät.'
    : 'Hinweis: Der Programmkern meldet eine unerwartete Verbindung.';
  $('overall').textContent = `${statusIcon(status.status)} ${status.overall_text}`;
}

function renderTools(tools) {
  const list = $('toolsList');
  list.replaceChildren();

  for (const tool of tools) {
    const item = document.createElement('article');
    item.className = 'tool-item';
    item.dataset.toolId = tool.id;

    const head = document.createElement('div');
    head.className = 'tool-head';

    const title = document.createElement('strong');
    title.textContent = tool.name;

    const state = document.createElement('span');
    state.className = 'tool-state';
    state.textContent = `${toolIcon(tool.state)} ${tool.state_text}`;

    head.append(title, state);

    const description = document.createElement('p');
    description.textContent = tool.description;

    const mode = document.createElement('p');
    mode.className = 'small';
    mode.textContent = tool.read_only
      ? '🔵 Im Moment nur ansehen. Es wird nichts verändert.'
      : '🟡 Dieses Werkzeug kann Änderungen ausführen.';

    item.append(head, description, mode);
    list.append(item);
  }

  const ready = tools.filter((tool) => tool.state === 'ready').length;
  $('toolsSummary').textContent = `🟢 ${ready} von ${tools.length} Werkzeugen bereit`;
}

function markCoreUnavailable(error) {
  const message = error?.message ?? 'unbekannter Fehler';
  $('coreText').textContent = `Nicht bereit: ${message}`;
  $('projectStateText').textContent = 'Es wurden keine Projektdaten verändert.';
  $('osText').textContent = 'Nicht verfügbar';
  $('versionText').textContent = 'Nicht verfügbar';
  $('sessionText').textContent = 'Nicht verfügbar';
  $('systemCoreText').textContent = '🔴 Programmkern nicht erreichbar';
  $('databaseText').textContent = '🔵 Nicht geprüft · Programmkern nicht erreichbar';
  $('toolsSummary').textContent = '🔴 Werkzeugliste nicht erreichbar';
  $('toolsList').textContent = 'Es wurden keine Werkzeuge gestartet oder verändert.';
  $('overall').textContent = '🔴 Programmkern nicht erreichbar';
  setStorageActionsEnabled(false);
  live('Programmkern nicht erreichbar');
}

async function refresh() {
  setStorageActionsEnabled(false);
  $('refreshBtn').disabled = true;
  let coreAvailable = false;

  try {
    const status = await runtimeInvoke()('get_status');
    coreAvailable = true;
    renderSystemStatus(status);

    let toolsReady = true;
    try {
      renderTools(await runtimeInvoke()('list_tools'));
    } catch {
      toolsReady = false;
      $('toolsSummary').textContent = '🟡 Werkzeugliste braucht Aufmerksamkeit';
      $('toolsList').textContent = 'Die Werkzeugliste konnte nicht gelesen werden. Es wurde nichts verändert.';
    }

    let projectReady = true;
    try {
      await loadProjectState();
    } catch {
      projectReady = false;
      $('projectStateText').textContent = 'Aufmerksamkeit nötig · lokaler Projektspeicher nicht lesbar.';
      $('databaseText').textContent = '🟡 Aufmerksamkeit nötig · lokale Datenbank nicht bereit';
    }

    const ready = status.status === 'ready' && projectReady && toolsReady;
    $('overall').textContent = ready ? '🟢 Alles bereit' : '🟡 Aufmerksamkeit nötig';
    setStorageActionsEnabled(status.status === 'ready' && projectReady);
    live($('overall').textContent);
  } catch (error) {
    markCoreUnavailable(error);
  } finally {
    $('refreshBtn').disabled = !coreAvailable;
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

setStorageActionsEnabled(false);
await refresh();
