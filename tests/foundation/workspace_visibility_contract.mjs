import assert from 'node:assert/strict';
import {
  WORKSPACE_PANELS,
  defaultWorkspaceVisibility,
  resetWorkspaceVisibility,
  setWorkspacePanelVisibility,
  visibleWorkspaceCount,
} from '../../src/ui/workspace-visibility.mjs';

assert.deepEqual(
  WORKSPACE_PANELS.map((panel) => panel.id),
  ['today', 'system-status', 'storage', 'tools'],
  'P0.5a darf nur die vier festgelegten Bereiche steuern.',
);

const defaults = defaultWorkspaceVisibility();
assert.deepEqual(defaults, {
  today: true,
  'system-status': true,
  storage: true,
  tools: true,
});
assert.equal(visibleWorkspaceCount(defaults), 4, 'Standardansicht muss alle Bereiche zeigen.');

const hiddenStorage = setWorkspacePanelVisibility(defaults, 'storage', false);
assert.equal(hiddenStorage.storage, false, 'Speicherübersicht muss ausblendbar sein.');
assert.equal(defaults.storage, true, 'Zustandsänderung darf das Ausgangsobjekt nicht mutieren.');
assert.equal(visibleWorkspaceCount(hiddenStorage), 3, 'Sichtbare Bereiche werden falsch gezählt.');

const shownAgain = setWorkspacePanelVisibility(hiddenStorage, 'storage', true);
assert.equal(shownAgain.storage, true, 'Bereich muss wieder sichtbar schaltbar sein.');
assert.deepEqual(resetWorkspaceVisibility(), defaults, 'Zurücksetzen muss exakt die Standardansicht liefern.');
assert.throws(
  () => setWorkspacePanelVisibility(defaults, 'nicht-bekannt', false),
  RangeError,
  'Unbekannte Bereiche dürfen nicht still akzeptiert werden.',
);

console.log('🟢 Flexible Arbeitsfläche: VISIBLE/HIDDEN und Reset sind deterministisch und rein sitzungslokal definiert.');
