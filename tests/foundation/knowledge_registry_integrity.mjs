import { access, readFile } from 'node:fs/promises';

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
        throw new Error(`${label}: ungültiges JSON in Zeile ${index + 1}: ${error.message}`);
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

for (const lesson of learning) {
  requireFields(
    lesson,
    ['id', 'schema_version', 'category', 'scope', 'status', 'severity', 'confidence', 'symptom', 'root_cause', 'safe_pattern', 'rule'],
    'Lesson',
  );
  if (!allowedLearningStatus.has(lesson.status)) throw new Error(`Lesson ${lesson.id}: unbekannter Status '${lesson.status}'.`);
  if (typeof lesson.confidence !== 'number' || lesson.confidence < 0 || lesson.confidence > 100) {
    throw new Error(`Lesson ${lesson.id}: confidence muss zwischen 0 und 100 liegen.`);
  }
  for (const evidencePath of lesson.evidence ?? []) await requireLocalPath(evidencePath, `Lesson ${lesson.id}`);
}

for (const regression of regressions) {
  requireFields(
    regression,
    ['id', 'schema_version', 'area', 'title', 'severity', 'status', 'test_file', 'scenario', 'protects', 'expected'],
    'Regression',
  );
  if (!allowedRegressionStatus.has(regression.status)) {
    throw new Error(`Regression ${regression.id}: unbekannter Status '${regression.status}'.`);
  }
  await requireLocalPath(regression.test_file, `Regression ${regression.id}`);
}

const lessonIds = new Set(learning.map((item) => item.id));
const regressionIds = new Set(regressions.map((item) => item.id));

for (const regression of regressions) {
  for (const lessonId of regression.learning_ids ?? []) {
    if (!lessonIds.has(lessonId)) {
      throw new Error(`Regression ${regression.id}: unbekannte Learning-ID '${lessonId}'.`);
    }
  }
}

for (const lesson of learning) {
  if (lesson.regression_test && !regressionIds.has(lesson.regression_test)) {
    throw new Error(`Lesson ${lesson.id}: Regression '${lesson.regression_test}' existiert nicht.`);
  }
}

console.log(`🟢 Learning Memory: ${learning.length} Datensätze gültig und eindeutig.`);
console.log(`🟢 Regression Registry: ${regressions.length} Datensätze gültig und eindeutig.`);
console.log('🟢 Cross-References und lokale Evidence-/Testpfade sind konsistent.');
