# 2026-MultiTool

Eine kleine Qualitätssicherung für die statischen HTML-Tools mit einfacher Sprache und erklärten Fachbegriffen.

## Voraussetzungen
- Node.js (Laufzeit für JavaScript außerhalb des Browsers) ab Version 18
- npm (Paketmanager, verwaltet Abhängigkeiten) ist in Node.js enthalten
- Ein aktuelles Chrome/Chromium mit Headless-Unterstützung. In Docker/Ubuntu genügt z. B.: `apt-get install -y libasound2t64 libatk1.0-0t64 libgtk-3-0t64 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1` (stellt die wichtigsten Bibliotheken für den Browser bereit)

## Schnellstart mit Autopilot
- `./start.sh` startet die vollautomatische Routine: prüft npm, installiert Abhängigkeiten, führt Linting (Quellcode-Prüfung) und Accessibility-Checks (Barrierefreiheits-Prüfung) aus und startet danach einen lokalen Server auf http://localhost:5000.
- Die Ausgaben sind als Fortschrittsschritte protokolliert.

## Manuelle Qualitätsprüfungen
- `npm install` oder `npm ci` installiert alle Dev-Tools reproduzierbar.
- `npm run lint` überprüft HTML- und JS-Dateien auf saubere Syntax und Struktur.
- `npm run check:accessibility` startet einen lokalen Server und prüft die drei HTML-Seiten automatisch mit Pa11y (Threshold 20 Befunde, läuft headless mit `--no-sandbox`).
- `npm run check` bündelt alle Checks in einem Befehl.

## CI/CD
- `.github/workflows/ci.yml` führt auf jedem Push/PR `npm ci` und `npm run check` aus, damit dieselben Prüfungen auch im GitHub-Workflow laufen.

## Ablage wichtiger Dateien
- `package.json` und `package-lock.json`: definieren und fixieren die Node-Toolchain (eslint, htmlhint, pa11y usw.).
- `.gitignore`: schließt z. B. `node_modules` von Commits aus.
- `.htmlhintrc`, `eslint.config.cjs`, `pa11yci.json`, `scripts/accessibility-check.js`: Konfiguration der Checks.
- `requirements.txt`: Platzhalter für Python-Abhängigkeiten, aktuell leer.
- `todo.txt`: Offene Verbesserungen, u. a. neue Ideen aus `Inputpool.txt` und Farbthemen für bessere Kontraste.

## Hinweise für Barrierefreiheit
- Pa11y prüft nach WCAG 2.0 AA (Basis-Standard für Barrierefreiheit) und bricht ab, wenn mehr als 20 Befunde auftreten.
- Themes mit gutem Kontrast sind als nächster Schritt im `todo.txt` notiert.
