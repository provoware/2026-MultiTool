import {
  ProjectStateError,
  createProjectState,
  validateProjectState,
  migrateProjectState,
  exportProjectState,
  importProjectState,
  projectStateContract,
} from '../../src/ui/project-state.mjs';

function assert(condition, message) { if (!condition) throw new Error(message); }
function expectCode(fn, code) {
  try { fn(); } catch (error) {
    assert(error instanceof ProjectStateError, `Erwarteter ProjectStateError für ${code}.`);
    assert(error.code === code, `Erwartet ${code}, erhalten ${error.code}.`);
    return;
  }
  throw new Error(`Erwarteter Fehler ${code} wurde nicht ausgelöst.`);
}

const now = '2026-08-24T14:30:00.000Z';
const state = createProjectState({ projectId: 'project-c4-test-0001', now });
assert(state.schema_version === 1, 'Schema-Version muss 1 sein.');
assert(state.revision === 1, 'Initiale Revision muss 1 sein.');
assert(state.mode === 'EINFACH' && state.current_area === 'HEUTE', 'Sichere Defaults fehlen.');
assert(projectStateContract.modes.length === 3, 'Drei Bedienmodi erwartet.');
assert(projectStateContract.areas.length === 8, 'Acht Hauptbereiche erwartet.');

const roundtrip = importProjectState(exportProjectState(state));
assert(JSON.stringify(roundtrip) === JSON.stringify(state), 'Export/Import-Roundtrip verändert Zustand.');
assert(JSON.stringify(migrateProjectState(state)) === JSON.stringify(state), 'Schema-v1-Migration verändert gültigen Zustand.');

expectCode(() => validateProjectState({ ...state, schema_version: 2 }), 'PS-SCHEMA-UNSUPPORTED');
expectCode(() => validateProjectState({ ...state, revision: 0 }), 'PS-REVISION-INVALID');
expectCode(() => validateProjectState({ ...state, mode: 'TECHNISCH' }), 'PS-MODE-INVALID');
expectCode(() => validateProjectState({ ...state, current_area: 'UNBEKANNT' }), 'PS-AREA-INVALID');
expectCode(() => validateProjectState({ ...state, extra: true }), 'PS-FIELDS-UNKNOWN');
expectCode(() => importProjectState('{ kaputt'), 'PS-IMPORT-JSON');
expectCode(() => importProjectState(''), 'PS-IMPORT-EMPTY');

console.log('🟢 Project State Contract: Schema v1, sichere Defaults, strikte Validierung und JSON-Roundtrip PASS');
