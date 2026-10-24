// Ausschließlich technische Testkontexte ausgeben; niemals HTTP-Inhalte oder Session-IDs.
const token = (value, max = 40) => String(value ?? 'unbekannt').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, max);

export function formatWebDriverDiagnostic({ browser, version, phase, viewport, request, error }) {
  const kind = ['TimeoutError', 'AbortError'].includes(error?.name) ? 'TIMEOUT'
    : error?.name === 'TypeError' ? 'TRANSPORT' : 'ERROR';
  const path = String(request?.path ?? '-').split('?')[0]
    .replace(/\/session\/[^/]+/g, '/session/:id')
    .replace(/[^a-zA-Z0-9/._:-]/g, '_').slice(0, 120);
  const width = Number.isInteger(viewport?.width) ? viewport.width : 0;
  const height = Number.isInteger(viewport?.height) ? viewport.height : 0;
  const zoom = Number.isInteger(viewport?.zoom) ? viewport.zoom : 0;
  const timeout = Number.isInteger(request?.timeoutMs) ? request.timeoutMs : 0;
  return '[WebDriver ' + kind + '] browser=' + token(browser)
    + ' version=' + token(version) + ' phase=' + token(phase)
    + ' viewport=' + width + 'x' + height + '@' + zoom + '%'
    + ' request=' + token(request?.method, 8) + ' ' + path
    + ' timeout_ms=' + timeout;
}
