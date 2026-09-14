const STORAGE_STATE_PRESENTATION = Object.freeze({
  NORMAL: Object.freeze({ icon: '🟢', text: 'Normal', className: 'storage-state-normal' }),
  LOW: Object.freeze({ icon: '🟡', text: 'Speicher wird knapp', className: 'storage-state-low' }),
  CRITICAL: Object.freeze({ icon: '🔴', text: 'Sehr wenig Speicher frei', className: 'storage-state-critical' }),
  READ_ONLY: Object.freeze({ icon: '🔵', text: 'Nur Lesen', className: 'storage-state-read-only' }),
  UNKNOWN: Object.freeze({ icon: '⚪', text: 'Nicht prüfbar', className: 'storage-state-unknown' }),
});

export function storageStatePresentation(state) {
  return STORAGE_STATE_PRESENTATION[state] ?? STORAGE_STATE_PRESENTATION.UNKNOWN;
}
