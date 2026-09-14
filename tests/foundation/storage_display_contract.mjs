import assert from 'node:assert/strict';
import { storageStatePresentation } from '../../src/ui/storage-display.mjs';

const cases = {
  NORMAL: { icon: '🟢', text: 'Normal', className: 'storage-state-normal' },
  LOW: { icon: '🟡', text: 'Speicher wird knapp', className: 'storage-state-low' },
  CRITICAL: { icon: '🔴', text: 'Sehr wenig Speicher frei', className: 'storage-state-critical' },
  READ_ONLY: { icon: '🔵', text: 'Nur Lesen', className: 'storage-state-read-only' },
  UNKNOWN: { icon: '⚪', text: 'Nicht prüfbar', className: 'storage-state-unknown' },
};

for (const [state, expected] of Object.entries(cases)) {
  assert.deepEqual(storageStatePresentation(state), expected, `${state} wird falsch dargestellt.`);
}

assert.deepEqual(
  storageStatePresentation('NICHT_BEKANNTER_ZUSTAND'),
  cases.UNKNOWN,
  'Unbekannte Backend-Zustände müssen sicher als nicht prüfbar dargestellt werden.',
);

console.log('🟢 Speicheranzeige: alle fünf Backend-Zustände werden exakt und ohne eigene Grenzwertlogik dargestellt.');
