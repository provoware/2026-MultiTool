import { access, readFile } from 'node:fs/promises';
import { detectKnowledgeContradictions, isLessonExpired, isLessonReviewDue, parseIsoDate } from '../../src/core/knowledge.mjs';

const ROOT = new URL('../../', import.meta.url);
const learningPath = new URL('knowledge/LEARNING_MEMORY.jsonl', ROOT);
const regressionPath = new URL('knowledge/REGRESSION_REGISTRY.jsonl', ROOT);

function parseJsonl(text, label) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${label}: ungültiges JSON in Zeile ${index + 1}: ${error.message}`, { cause: error });
      }
    });
  if (!rows.length) throw new Error(`${label}: Datei enthält keine Datensätze.`);
  return rows;
}

function requireFields(row, fields, label) {
  for (const field of fields) {
    if (row[field] === undefined || row[field] === null || row[field] === '') {
      throw new Error(`${label} ${row.id ?? '<ohne ID>'}: Pflichtfeld '${field}' fehlt.`);
    }
  }
}

function requireUniqueIds(rows, label) {
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.id)) throw new Error(`${label}: doppelte ID '${row.id}'.`);
    seen.add(row.id);
  }
}

function requireStringArray(value, field, id) {
  if (!Array.isArray(value) || value.length === 0 || value.some((entry) => typeof entry !== 'string' || !entry.trim())) {
    throw new Error(`Lesson ${id}: '${field}' muss eine nicht-leere String-Liste sein.`);
  }
}

async function requireLocalPath(path, owner) {
  if (typeof path !== 'string' || !path.includes('/')) return;
  if (/^[a-z]+:\/\//i.test(path)) return;
  if (path.startsWith('/') || path.includes('..')) throw new Error(`${owner}: unsicherer lokaler Pfad '${path}'.`);
  try {
    await access(new URL(path, ROOT));
  } catch {
    throw new Error(`${owner}: lokaler Verweis existiert nicht: '${path}'.`);
  }
}

const learning = parseJsonl(await readFile(learningPath, 'utf8'), 'LEARNING_MEMORY');
const regressions = parseJsonl(await readFile(regressionPath, 'utf8'), 'REGRESSION_REGISTRY');

requireUniqueIds(learning, 'LEARNING_MEMORY');
requireUniqueIds(regressions, 'REGRESSION_REGISTRY');

const allowedLearningStatus = new Set(['BEOBACHTET', 'KANDIDAT', 'BESTAETIGT', 'AKTIV', 'VERALTET']);
const allowedRegressionStatus = new Set(['ACTIVE', 'QUARANTINED', 'RETIRED']);
const allowedEffects = new Set(['REQUIRE', 'FORBID', 'PREFER', 'AVOID', 'INFO']);
const activeKnowledgeStates = new Set(['BESTAETIGT', 'AKTIV']);

for (const lesson of learning) {
  requireFields(
    lesson,
    ['id', 'schema_version', 'category', 'scope', 'rule_key', 'decision_effect', 'status', 'severity', 'confidence', 'symptom', 'root_cause', 'safe_pattern', 'rule', 'validity'],
    'Lesson',
  );
  if (lesson.schema_version < 2) throw new Error(`Lesson ${lesson.id}: schema_version 2 oder höher erforderlich.`);
  if (!allowedLearningStatus.has(lesson.status)) throw new Error(`Lesson ${lesson.id}: unbekannter Status '${lesson.status}'.`);
  if (!allowedEffects.has(lesson.decision_effect)) throw new Error(`Lesson ${lesson.id}: unbekannter decision_effect '${lesson.decision_effect}'.`);
  if (typeof lesson.confidence !== 'number' || lesson.confidence < 0 || lesson.confidence > 100) {
    throw new Error(`Lesson ${lesson.id}: confidence muss zwischen 0 und 100 liegen.`);
  }

  const validity = lesson.validity;
  requireFields(validity, ['scope_level', 'project_types', 'platforms', 'environments', 'valid_from', 'review_at'], `Validity ${lesson.id}`);
  requireStringArray(validity.project_types, 'validity.project_types', lesson.id);
  requireStringArray(validity.platforms, 'validity.platforms', lesson.id);
  requireStringArray(validity.environments, 'validity.environments', lesson.id);

  const from = parseIsoDate(validity.valid_from, `${lesson.id}.valid_from`);
  const until = parseIsoDate(validity.valid_until, `${lesson.id}.valid_until`);
  parseIsoDate(validity.review_at, `${lesson.id}.review_at`);
  const expires = parseIsoDate(validity.expires_at, `${lesson.id}.expires_at`);
  if (until && from > until) throw new Error(`Lesson ${lesson.id}: valid_from liegt nach valid_until.`);
  if (expires && from > expires) throw new Error(`Lesson ${lesson.id}: valid_from liegt nach expires_at.`);
  if (activeKnowledgeStates.has(lesson.status) && isLessonExpired(lesson)) {
    throw new Error(`Lesson ${lesson.id}: bestätigte/aktive Regel ist abgelaufen und muss reviewed oder VERALTET werden.`);
  }
  if (lesson.supersedes !== undefined && !Array.isArray(lesson.supersedes)) {
    throw new Error(`Lesson ${lesson.id}: supersedes muss eine Liste sein.`);
  }

  for (const evidencePath of lesson.evidence ?? []) await requireLocalPath(evidencePath, `Lesson ${lesson.id}`);
}

for (const regression of regressions) {
  requireFields(regression, ['id', 'schema_version', 'area', 'title', 'severity', 'status', 'test_file', 'scenario', 'protects', 'expected'], 'Regression');
  if (!allowedRegressionStatus.has(regression.status)) throw new Error(`Regression ${regression.id}: unbekannter Status '${regression.status}'.`);
  await requireLocalPath(regression.test_file, `Regression ${regression.id}`);
}

const lessonIds = new Set(learning.map((item) => item.id));
const regressionIds = new Set(regressions.map((item) => item.id));
for (const regression of regressions) {
  for (const lessonId of regression.learning_ids ?? []) {
    if (!lessonIds.has(lessonId)) throw new Error(`Regression ${regression.id}: unbekannte Learning-ID '${lessonId}'.`);
  }
}
for (const lesson of learning) {
  if (lesson.regression_test && !regressionIds.has(lesson.regression_test)) {
    throw new Error(`Lesson ${lesson.id}: Regression '${lesson.regression_test}' existiert nicht.`);
  }
  for (const supersededId of lesson.supersedes ?? []) {
    if (!lessonIds.has(supersededId)) throw new Error(`Lesson ${lesson.id}: supersedes verweist auf unbekannte ID '${supersededId}'.`);
    if (supersededId === lesson.id) throw new Error(`Lesson ${lesson.id}: darf sich nicht selbst superseden.`);
  }
}

const realConflicts = detectKnowledgeContradictions(learning);
if (realConflicts.length) throw new Error(`Aktives Lerngedächtnis enthält Widersprüche: ${JSON.stringify(realConflicts)}`);

const syntheticBase = {
  schema_version: 2,
  category: 'TEST',
  scope: 'PROJECT',
  rule_key: 'synthetic.same.rule',
  status: 'AKTIV',
  severity: 'HIGH',
  confidence: 100,
  validity: {
    scope_level: 'PROJECT',
    project_types: ['desktop'],
    platforms: ['linux'],
    environments: ['runtime'],
    valid_from: '2026-01-01',
    valid_until: null,
    review_at: '2026-12-01',
    expires_at: null,
  },
  supersedes: [],
};
const syntheticConflict = detectKnowledgeContradictions([
  { ...syntheticBase, id: 'SYN-A', decision_effect: 'REQUIRE' },
  { ...syntheticBase, id: 'SYN-B', decision_effect: 'FORBID' },
]);
if (syntheticConflict.length !== 1) throw new Error('Synthetischer REQUIRE/FORBID-Widerspruch wurde nicht zuverlässig erkannt.');

const syntheticResolved = detectKnowledgeContradictions([
  { ...syntheticBase, id: 'SYN-A', decision_effect: 'REQUIRE' },
  { ...syntheticBase, id: 'SYN-B', decision_effect: 'FORBID', supersedes: ['SYN-A'] },
]);
if (syntheticResolved.length !== 0) throw new Error('Explizite supersedes-Beziehung löst synthetischen Konflikt nicht auf.');

const reviewsDue = learning.filter((lesson) => activeKnowledgeStates.has(lesson.status) && isLessonReviewDue(lesson));
console.log(`🟢 Learning Memory: ${learning.length} Datensätze gültig, eindeutig und zeitlich klassifiziert.`);
console.log(`🟢 Regression Registry: ${regressions.length} Datensätze gültig und eindeutig.`);
console.log('🟢 Cross-References und lokale Evidence-/Testpfade sind konsistent.');
console.log('🟢 Reale aktive Wissensregeln sind widerspruchsfrei.');
console.log('🟢 Synthetischer Konflikt wird erkannt und explizites supersedes korrekt respektiert.');
console.log(`🔵 Review-fällige aktive Regeln: ${reviewsDue.length}.`);
