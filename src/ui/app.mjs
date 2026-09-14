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

function toolIcon(state) {
  return {
    ready: '🟢',
    hidden: '⚪',
    disabled: '🔒',
    permission_missing: '🟡',
  }[state] ?? '🔵';
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

async function refresh() {
  try {
    const [status, , tools] = await Promise.all([
      runtimeInvoke()('get_status'),
      loadProjectState(),
      runtimeInvoke()('list_tools'),
    ]);
    $('coreText').textContent = `Bereit · Sitzung ${status.session}`;
    $('localText').textContent = status.local_only
      ? 'Bestanden: Der Programmkern arbeitet nur auf diesem Gerät.'
      : 'Hinweis: Der Programmkern meldet eine unerwartete Verbindung.';
    renderTools(tools);
    $('overall').textContent = status.local_only ? '🟢 Alles bereit' : '🟡 Bitte prüfen';
    setActionsEnabled(true);
    live($('overall').textContent);
  } catch (error) {
    $('coreText').textContent = `Nicht bereit: ${error?.message ?? 'unbekannter Fehler'}`;
    $('projectStateText').textContent = 'Es wurden keine Projektdaten verändert.';
    $('toolsSummary').textContent = '🔴 Werkzeugliste nicht erreichbar';
    $('toolsList').textContent = 'Es wurden keine Werkzeuge gestartet oder verändert.';
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
