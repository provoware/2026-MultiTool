import { storageStatePresentation } from './storage-display.mjs';
import { createWorkspaceMutationGuard } from './workspace-mutation-guard.mjs';
import {
  WORKSPACE_PANELS,
  defaultWorkspaceVisibility,
  resetWorkspaceVisibility,
  setWorkspacePanelVisibility,
  visibleWorkspaceCount,
  workspaceVisibilityFromBackend,
} from './workspace-visibility.mjs';

const $ = (id) => document.getElementById(id);
const live = (text) => { $('live').textContent = text; };
let workspaceVisibility = defaultWorkspaceVisibility();
let workspaceVisibilityInitialized = false;
let workspaceSessionOverrides = {};
const workspaceMutationGuard = createWorkspaceMutationGuard();

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

function workspacePanelElement(panelId) {
  return document.querySelector(`[data-workspace-panel="${panelId}"]`);
}

function workspaceToggleElement(panelId) {
  return document.querySelector(`[data-workspace-toggle="${panelId}"]`);
}

function setWorkspaceControlsEnabled(enabled) {
  for (const panel of WORKSPACE_PANELS) {
    const toggle = workspaceToggleElement(panel.id);
    if (toggle) toggle.disabled = !enabled;
  }
  $('workspaceResetBtn').disabled = !enabled;
}

function beginWorkspaceMutation() {
  if (!workspaceMutationGuard.tryBegin()) {
    renderWorkspaceVisibility();
    return false;
  }
  setWorkspaceControlsEnabled(false);
  return true;
}

function endWorkspaceMutation() {
  workspaceMutationGuard.end();
  setWorkspaceControlsEnabled(true);
}

function restoreWorkspaceControlFocus(control, hadFocus) {
  if (!hadFocus) return;
  const active = document.activeElement;
  if (active === document.body || active === null) control.focus({ preventScroll:true });
}

function rememberWorkspaceSessionOverride(panelId, visible) {
  workspaceSessionOverrides = { ...workspaceSessionOverrides, [panelId]: visible };
}

function clearWorkspaceSessionOverride(panelId) {
  const remaining = { ...workspaceSessionOverrides };
  delete remaining[panelId];
  workspaceSessionOverrides = remaining;
}

function applyWorkspaceSessionOverrides(visibility) {
  let merged = visibility;
  for (const [panelId, visible] of Object.entries(workspaceSessionOverrides)) {
    merged = setWorkspacePanelVisibility(merged, panelId, visible);
  }
  return merged;
}

function updateWorkspacePersistenceHelp() {
  $('workspaceHelp').textContent = Object.keys(workspaceSessionOverrides).length > 0
    ? 'Einige Änderungen gelten nur für diese Sitzung, weil sie nicht dauerhaft gespeichert werden konnten.'
    : 'Deine Auswahl wird lokal auf diesem Gerät gemerkt.';
}

function renderWorkspaceVisibility(summaryOverride = null) {
  for (const panel of WORKSPACE_PANELS) {
    const target = workspacePanelElement(panel.id);
    const toggle = workspaceToggleElement(panel.id);
    const visible = workspaceVisibility[panel.id] !== false;
    if (!target || !toggle) throw new Error(`Arbeitsbereich fehlt: ${panel.id}`);
    target.hidden = !visible;
    toggle.checked = visible;
  }

  if (summaryOverride) {
    $('workspaceSummary').textContent = summaryOverride;
    return;
  }

  const visibleCount = visibleWorkspaceCount(workspaceVisibility);
  $('workspaceSummary').textContent = visibleCount === WORKSPACE_PANELS.length
    ? '🟢 Standardansicht'
    : `🔵 ${visibleCount} von ${WORKSPACE_PANELS.length} Bereichen sichtbar`;
}

async function loadWorkspaceVisibility() {
  try {
    const saved = await runtimeInvoke()('load_workspace_visibility');
    const persisted = workspaceVisibilityFromBackend(saved);
    workspaceVisibility = applyWorkspaceSessionOverrides(persisted);
    renderWorkspaceVisibility();
    updateWorkspacePersistenceHelp();
    return true;
  } catch {
    renderWorkspaceVisibility('🟡 Ansicht konnte nicht geladen werden');
    $('workspaceHelp').textContent = 'Die aktuelle Sitzungssicht bleibt erhalten. Deine gespeicherte Ansicht konnte nicht geladen werden.';
    live('Ansicht konnte nicht geladen werden. Die aktuelle Sitzungssicht bleibt erhalten.');
    return false;
  }
}

function setupWorkspaceControls() {
  for (const panel of WORKSPACE_PANELS) {
    const toggle = workspaceToggleElement(panel.id);
    if (!toggle) throw new Error(`Sichtbarkeitsschalter fehlt: ${panel.id}`);
    toggle.addEventListener('change', async () => {
      const visible = toggle.checked;
      const hadFocus = document.activeElement === toggle;
      if (!beginWorkspaceMutation()) return;
      workspaceVisibility = setWorkspacePanelVisibility(workspaceVisibility, panel.id, visible);
      renderWorkspaceVisibility();
      try {
        const saved = await runtimeInvoke()('set_workspace_visibility', { panel: panel.id, visible });
        const confirmed = workspaceVisibilityFromBackend(saved);
        clearWorkspaceSessionOverride(panel.id);
        workspaceVisibility = setWorkspacePanelVisibility(workspaceVisibility, panel.id, confirmed[panel.id]);
        renderWorkspaceVisibility();
        updateWorkspacePersistenceHelp();
        live(`${panel.label} ist jetzt ${visible ? 'sichtbar' : 'ausgeblendet'} und wurde lokal gemerkt.`);
      } catch {
        rememberWorkspaceSessionOverride(panel.id, visible);
        renderWorkspaceVisibility();
        $('workspaceHelp').textContent = 'Die Änderung gilt für diese Sitzung, konnte aber nicht dauerhaft gespeichert werden.';
        live(`${panel.label} ist jetzt ${visible ? 'sichtbar' : 'ausgeblendet'}. Die Änderung gilt nur für diese Sitzung.`);
      } finally {
        endWorkspaceMutation();
        restoreWorkspaceControlFocus(toggle, hadFocus);
      }
    });
  }

  $('workspaceResetBtn').addEventListener('click', async () => {
    const button = $('workspaceResetBtn');
    const hadFocus = document.activeElement === button;
    if (!beginWorkspaceMutation()) return;
    workspaceVisibility = resetWorkspaceVisibility();
    renderWorkspaceVisibility();
    try {
      const saved = await runtimeInvoke()('reset_workspace_visibility');
      workspaceSessionOverrides = {};
      workspaceVisibility = workspaceVisibilityFromBackend(saved);
      renderWorkspaceVisibility();
      updateWorkspacePersistenceHelp();
      live('Standardansicht wurde wiederhergestellt und lokal gemerkt.');
    } catch {
      workspaceSessionOverrides = resetWorkspaceVisibility();
      renderWorkspaceVisibility();
      $('workspaceHelp').textContent = 'Die Standardansicht gilt für diese Sitzung, konnte aber nicht dauerhaft gespeichert werden.';
      live('Standardansicht wurde nur für diese Sitzung wiederhergestellt.');
    } finally {
      endWorkspaceMutation();
      restoreWorkspaceControlFocus(button, hadFocus);
    }
  });

  renderWorkspaceVisibility();
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

function formatStorageSize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return 'Nicht verfügbar';

  const units = ['Byte', 'Kilobyte', 'Megabyte', 'Gigabyte', 'Terabyte', 'Petabyte'];
  let amount = value;
  let unit = 0;
  while (amount >= 1024 && unit < units.length - 1) {
    amount /= 1024;
    unit += 1;
  }

  const maximumFractionDigits = amount >= 100 ? 0 : amount >= 10 ? 1 : 2;
  return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits }).format(amount)} ${units[unit]}`;
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

function renderStorageVolumes(volumes) {
  const list = $('storageList');
  list.replaceChildren();

  if (volumes.length === 0) {
    const message = document.createElement('p');
    message.className = 'small';
    message.textContent = 'Keine passenden eingehängten lokalen Datenträger gefunden.';
    list.append(message);
    $('storageSummary').textContent = '🔵 Keine lokalen Datenträger erkannt';
    return;
  }

  for (const volume of volumes) {
    const presentation = storageStatePresentation(volume.state);
    const item = document.createElement('article');
    item.className = 'tool-item storage-item';
    item.dataset.mountPoint = volume.mount_point;
    item.dataset.totalBytes = String(volume.total_bytes);
    item.dataset.freeBytes = String(volume.free_bytes);
    item.dataset.storageState = volume.state ?? 'UNKNOWN';

    const title = document.createElement('strong');
    title.textContent = volume.name;

    const state = document.createElement('p');
    state.className = `storage-state ${presentation.className}`;
    state.textContent = `${presentation.icon} ${presentation.text}`;

    const mount = document.createElement('p');
    mount.className = 'small';
    mount.textContent = `Einhängeort: ${volume.mount_point}`;

    const sizes = document.createElement('p');
    sizes.textContent = `Gesamt: ${formatStorageSize(volume.total_bytes)} · Frei: ${formatStorageSize(volume.free_bytes)}`;

    item.append(title, state, mount, sizes);
    list.append(item);
  }

  $('storageSummary').textContent = `🔵 ${volumes.length} Datenträger angezeigt`;
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
  $('storageSummary').textContent = '🔴 Speicherübersicht nicht erreichbar';
  $('storageList').textContent = 'Es wurden keine Datenträger verändert.';
  $('toolsSummary').textContent = '🔴 Werkzeugliste nicht erreichbar';
  $('toolsList').textContent = 'Es wurden keine Werkzeuge gestartet oder verändert.';
  renderWorkspaceVisibility();
  $('workspaceHelp').textContent = 'Du kannst Bereiche in dieser Sitzung ausblenden. Dauerhaft speichern ist ohne Programmkern nicht möglich.';
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
    if (!workspaceVisibilityInitialized) {
      workspaceVisibilityInitialized = await loadWorkspaceVisibility();
    }

    let toolsReady = true;
    try {
      renderTools(await runtimeInvoke()('list_tools'));
    } catch {
      toolsReady = false;
      $('toolsSummary').textContent = '🟡 Werkzeugliste braucht Aufmerksamkeit';
      $('toolsList').textContent = 'Die Werkzeugliste konnte nicht gelesen werden. Es wurde nichts verändert.';
    }

    let storageReady = true;
    try {
      renderStorageVolumes(await runtimeInvoke()('list_storage_volumes'));
    } catch {
      storageReady = false;
      $('storageSummary').textContent = '🟡 Speicherangaben brauchen Aufmerksamkeit';
      $('storageList').textContent = 'Die Datenträger konnten nicht gelesen werden. Es wurde nichts verändert.';
    }

    let projectReady = true;
    try {
      await loadProjectState();
    } catch {
      projectReady = false;
      $('projectStateText').textContent = 'Aufmerksamkeit nötig · lokaler Projektspeicher nicht lesbar.';
      $('databaseText').textContent = '🟡 Aufmerksamkeit nötig · lokale Datenbank nicht bereit';
    }

    const ready = status.status === 'ready' && projectReady && toolsReady && storageReady;
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

setupWorkspaceControls();
setStorageActionsEnabled(false);
await refresh();