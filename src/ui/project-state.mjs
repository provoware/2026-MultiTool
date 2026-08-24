const SCHEMA_VERSION = 1;
const DATABASE_NAME = 'provoware-2026-multitool';
const DATABASE_VERSION = 1;
const STORE_NAME = 'project_state';
const ACTIVE_KEY = 'active';

const MODES = new Set(['EINFACH', 'GEFUEHRT', 'PROFI']);
const AREAS = new Set(['HEUTE', 'PROJEKT', 'BAUEN', 'PRUEFEN', 'ABSICHERN', 'LERNEN', 'RELEASE', 'ROENTGEN']);

export class ProjectStateError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = 'ProjectStateError';
    this.code = code;
  }
}

function assert(condition, code, message) {
  if (!condition) throw new ProjectStateError(code, message);
}

function validIsoDate(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function clone(value) {
  return structuredClone(value);
}

export function createProjectState({
  projectId = globalThis.crypto?.randomUUID?.(),
  now = new Date().toISOString(),
  mode = 'EINFACH',
  currentArea = 'HEUTE',
} = {}) {
  assert(typeof projectId === 'string' && projectId.length >= 8, 'PS-ID-INVALID', 'Projekt-ID konnte nicht sicher erzeugt werden.');
  return validateProjectState({
    schema_version: SCHEMA_VERSION,
    project_id: projectId,
    created_at: now,
    updated_at: now,
    revision: 1,
    mode,
    current_area: currentArea,
  });
}

export function validateProjectState(input) {
  assert(input && typeof input === 'object' && !Array.isArray(input), 'PS-DATA-INVALID', 'Projektzustand muss ein Objekt sein.');
  assert(input.schema_version === SCHEMA_VERSION, 'PS-SCHEMA-UNSUPPORTED', `Nicht unterstützte Projektzustands-Version: ${input.schema_version ?? 'fehlt'}.`);
  assert(typeof input.project_id === 'string' && input.project_id.length >= 8 && input.project_id.length <= 128, 'PS-ID-INVALID', 'Projekt-ID ist ungültig.');
  assert(validIsoDate(input.created_at), 'PS-CREATED-INVALID', 'Erstellzeitpunkt ist ungültig.');
  assert(validIsoDate(input.updated_at), 'PS-UPDATED-INVALID', 'Änderungszeitpunkt ist ungültig.');
  assert(Date.parse(input.updated_at) >= Date.parse(input.created_at), 'PS-TIME-ORDER', 'Änderungszeitpunkt liegt vor dem Erstellzeitpunkt.');
  assert(Number.isInteger(input.revision) && input.revision >= 1, 'PS-REVISION-INVALID', 'Revision muss eine positive Ganzzahl sein.');
  assert(MODES.has(input.mode), 'PS-MODE-INVALID', `Unbekannter Bedienmodus: ${input.mode}.`);
  assert(AREAS.has(input.current_area), 'PS-AREA-INVALID', `Unbekannter Arbeitsbereich: ${input.current_area}.`);

  const allowed = new Set(['schema_version', 'project_id', 'created_at', 'updated_at', 'revision', 'mode', 'current_area']);
  const unknown = Object.keys(input).filter((key) => !allowed.has(key));
  assert(unknown.length === 0, 'PS-FIELDS-UNKNOWN', `Unbekannte Projektzustands-Felder: ${unknown.join(', ')}.`);

  return clone({
    schema_version: input.schema_version,
    project_id: input.project_id,
    created_at: input.created_at,
    updated_at: input.updated_at,
    revision: input.revision,
    mode: input.mode,
    current_area: input.current_area,
  });
}

export function migrateProjectState(input) {
  assert(input && typeof input === 'object', 'PS-DATA-INVALID', 'Importierter Projektzustand ist ungültig.');
  if (input.schema_version === SCHEMA_VERSION) return validateProjectState(input);
  throw new ProjectStateError('PS-SCHEMA-UNSUPPORTED', `Projektzustands-Version ${input.schema_version ?? 'fehlt'} wird nicht unterstützt.`);
}

export function exportProjectState(state) {
  return `${JSON.stringify(validateProjectState(state), null, 2)}\n`;
}

export function importProjectState(text) {
  assert(typeof text === 'string' && text.trim(), 'PS-IMPORT-EMPTY', 'Importdatei ist leer.');
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new ProjectStateError('PS-IMPORT-JSON', 'Importdatei enthält kein gültiges JSON.', { cause: error });
  }
  return migrateProjectState(parsed);
}

function indexedDb() {
  const api = globalThis.indexedDB;
  if (!api) throw new ProjectStateError('PS-IDB-UNAVAILABLE', 'Lokaler Projektspeicher ist in diesem Browser nicht verfügbar.');
  return api;
}

function requestResult(request, code, message) {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result), { once: true });
    request.addEventListener('error', () => reject(new ProjectStateError(code, message, { cause: request.error })), { once: true });
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', resolve, { once: true });
    transaction.addEventListener('abort', () => reject(new ProjectStateError('PS-IDB-ABORT', 'Lokales Speichern wurde abgebrochen.', { cause: transaction.error })), { once: true });
    transaction.addEventListener('error', () => reject(new ProjectStateError('PS-IDB-WRITE', 'Lokales Speichern ist fehlgeschlagen.', { cause: transaction.error })), { once: true });
  });
}

export async function openProjectStateDatabase() {
  const request = indexedDb().open(DATABASE_NAME, DATABASE_VERSION);
  request.addEventListener('upgradeneeded', () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
  });
  return await requestResult(request, 'PS-IDB-OPEN', 'Lokaler Projektspeicher konnte nicht geöffnet werden.');
}

export async function loadProjectState() {
  const database = await openProjectStateDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const raw = await requestResult(transaction.objectStore(STORE_NAME).get(ACTIVE_KEY), 'PS-IDB-READ', 'Projektzustand konnte nicht gelesen werden.');
    return raw === undefined ? null : migrateProjectState(raw);
  } finally {
    database.close();
  }
}

export async function saveProjectState(state) {
  const validated = validateProjectState(state);
  const database = await openProjectStateDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(validated, ACTIVE_KEY);
    await transactionDone(transaction);
    return clone(validated);
  } finally {
    database.close();
  }
}

export async function loadOrCreateProjectState(options = {}) {
  const existing = await loadProjectState();
  if (existing) return existing;
  return await saveProjectState(createProjectState(options));
}

export async function updateProjectState(mutator, { now = new Date().toISOString() } = {}) {
  assert(typeof mutator === 'function', 'PS-MUTATOR-INVALID', 'Projektzustands-Änderung muss eine Funktion sein.');
  const current = await loadOrCreateProjectState();
  const draft = clone(current);
  const result = mutator(draft) ?? draft;
  assert(result && typeof result === 'object', 'PS-MUTATOR-RESULT', 'Projektzustands-Änderung lieferte kein Objekt.');
  return await saveProjectState({
    ...result,
    schema_version: SCHEMA_VERSION,
    project_id: current.project_id,
    created_at: current.created_at,
    updated_at: now,
    revision: current.revision + 1,
  });
}

export const projectStateContract = Object.freeze({
  schemaVersion: SCHEMA_VERSION,
  databaseName: DATABASE_NAME,
  databaseVersion: DATABASE_VERSION,
  storeName: STORE_NAME,
  activeKey: ACTIVE_KEY,
  modes: Object.freeze([...MODES]),
  areas: Object.freeze([...AREAS]),
});
