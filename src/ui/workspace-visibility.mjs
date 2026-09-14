export const WORKSPACE_PANELS = Object.freeze([
  Object.freeze({ id: 'today', label: 'Heute' }),
  Object.freeze({ id: 'system-status', label: 'Systemstatus' }),
  Object.freeze({ id: 'storage', label: 'Speicherübersicht' }),
  Object.freeze({ id: 'tools', label: 'Werkzeug-Zentrale' }),
]);

const WORKSPACE_PANEL_IDS = new Set(WORKSPACE_PANELS.map((panel) => panel.id));

export function defaultWorkspaceVisibility() {
  return Object.fromEntries(WORKSPACE_PANELS.map((panel) => [panel.id, true]));
}

export function workspaceVisibilityFromBackend(value) {
  const visibility = defaultWorkspaceVisibility();
  for (const panel of WORKSPACE_PANELS) {
    if (typeof value?.[panel.id] === 'boolean') visibility[panel.id] = value[panel.id];
  }
  return visibility;
}

export function setWorkspacePanelVisibility(current, panelId, visible) {
  if (!WORKSPACE_PANEL_IDS.has(panelId)) {
    throw new RangeError(`Unbekannter Arbeitsbereich: ${panelId}`);
  }
  return { ...current, [panelId]: Boolean(visible) };
}

export function resetWorkspaceVisibility() {
  return defaultWorkspaceVisibility();
}

export function visibleWorkspaceCount(state) {
  return WORKSPACE_PANELS.filter((panel) => state[panel.id] !== false).length;
}
