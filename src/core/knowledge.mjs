const CONFLICTING_EFFECTS = new Set([
  'REQUIRE|FORBID',
  'FORBID|REQUIRE',
  'PREFER|AVOID',
  'AVOID|PREFER',
]);

export function parseIsoDate(value, fieldName = 'date') {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError(`${fieldName} muss YYYY-MM-DD oder null sein.`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new TypeError(`${fieldName} enthält kein gültiges Datum: ${value}`);
  }
  return date;
}

export function isLessonExpired(lesson, now = new Date()) {
  const expires = parseIsoDate(lesson.validity?.expires_at, 'expires_at');
  if (!expires) return false;
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return expires < day;
}

export function isLessonReviewDue(lesson, now = new Date()) {
  const review = parseIsoDate(lesson.validity?.review_at, 'review_at');
  if (!review) return false;
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return review <= day;
}

function listOverlaps(left = ['*'], right = ['*']) {
  if (left.includes('*') || right.includes('*')) return true;
  const rightSet = new Set(right);
  return left.some((value) => rightSet.has(value));
}

export function validityOverlaps(left, right) {
  const a = left?.validity ?? {};
  const b = right?.validity ?? {};

  if (!listOverlaps(a.project_types, b.project_types)) return false;
  if (!listOverlaps(a.platforms, b.platforms)) return false;
  if (!listOverlaps(a.environments, b.environments)) return false;

  const aFrom = parseIsoDate(a.valid_from, 'valid_from') ?? new Date('1970-01-01T00:00:00Z');
  const bFrom = parseIsoDate(b.valid_from, 'valid_from') ?? new Date('1970-01-01T00:00:00Z');
  const aUntil = parseIsoDate(a.valid_until, 'valid_until') ?? new Date('9999-12-31T00:00:00Z');
  const bUntil = parseIsoDate(b.valid_until, 'valid_until') ?? new Date('9999-12-31T00:00:00Z');

  return aFrom <= bUntil && bFrom <= aUntil;
}

function explicitlySupersedes(left, right) {
  return (left.supersedes ?? []).includes(right.id) || (right.supersedes ?? []).includes(left.id);
}

export function detectKnowledgeContradictions(lessons) {
  const candidates = lessons.filter((lesson) =>
    ['BESTAETIGT', 'AKTIV'].includes(lesson.status) && !isLessonExpired(lesson),
  );
  const conflicts = [];

  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const left = candidates[i];
      const right = candidates[j];
      if (!left.rule_key || left.rule_key !== right.rule_key) continue;
      if (!CONFLICTING_EFFECTS.has(`${left.decision_effect}|${right.decision_effect}`)) continue;
      if (!validityOverlaps(left, right)) continue;
      if (explicitlySupersedes(left, right)) continue;

      conflicts.push({
        rule_key: left.rule_key,
        left_id: left.id,
        right_id: right.id,
        left_effect: left.decision_effect,
        right_effect: right.decision_effect,
      });
    }
  }

  return conflicts;
}
