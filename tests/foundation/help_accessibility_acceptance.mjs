import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const html = await readFile(resolve(ROOT, 'src/ui/index.html'), 'utf8');
const script = await readFile(resolve(ROOT, 'src/ui/help.mjs'), 'utf8');
const css = await readFile(resolve(ROOT, 'src/ui/styles.css'), 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

// Gate-D: semantischer Vertrag des einzigen Hilfe-Slices.
assert(/id="helpBtn"[^>]*aria-controls="panelHelp"[^>]*aria-expanded="false"/.test(html), 'Hilfe-Einstieg muss Ziel und geschlossenen Zustand semantisch ausweisen.');
assert(/id="panelHelp"[^>]*aria-labelledby="helpTitle"[^>]*hidden/.test(html), 'Hilfe-Panel muss initial verborgen und eindeutig beschriftet sein.');
assert(/id="helpTitle"[^>]*tabindex="-1"/.test(html), 'Hilfe-Titel muss programmatisch fokussierbar sein.');
assert(/<details>[\s\S]*?<summary>Schritt für Schritt<\/summary>[\s\S]*?<\/details>/.test(html), 'Schritt-für-Schritt-Hilfe muss native Disclosure-Semantik verwenden.');
assert(/<details>[\s\S]*?<summary>Technische Details<\/summary>[\s\S]*?<\/details>/.test(html), 'Technische Details müssen native Disclosure-Semantik verwenden.');

// Fokusvertrag: Öffnen -> Titel; Schließen -> derselbe globale Einstieg.
assert(/helpPanel\.hidden\s*=\s*!open/.test(script), 'Hilfe-Sichtbarkeit muss deterministisch gesetzt werden.');
assert(/helpButton\.setAttribute\('aria-expanded',\s*String\(open\)\)/.test(script), 'aria-expanded muss mit dem sichtbaren Zustand gekoppelt sein.');
assert(/if\s*\(open\)[\s\S]*helpTitle\.focus\(\{\s*preventScroll:\s*true\s*\}\)[\s\S]*else[\s\S]*helpButton\.focus\(\{\s*preventScroll:\s*true\s*\}\)/.test(script), 'Fokus muss beim Öffnen zum Titel und beim Schließen zum Hilfe-Einstieg zurückkehren.');

// Zoom-/Reflow-Vertrag: keine pixelstarre Hauptbreite und keine horizontale Zwangsbreite
// für Shell/Grid/Hilfe. Das ist ein statischer Guard; die Browsermatrix bleibt das visuelle Gate.
assert(!/(?:\.shell|\.grid|#panelHelp)[^{]*\{[^}]*\bwidth\s*:\s*\d+px\b/s.test(css), 'Hauptlayout darf keine feste Pixelbreite erzwingen.');
assert(!/(?:\.shell|\.grid|#panelHelp)[^{]*\{[^}]*\bmin-width\s*:\s*\d+px\b/s.test(css), 'Hauptlayout darf bei Zoom keine feste Mindestbreite erzwingen.');

console.log('PASS: P0.6 Gate-D Hilfe-Accessibility-Vertrag');
