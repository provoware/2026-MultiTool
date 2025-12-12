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
## Startanleitung
1. Startroutine ausführbar machen (falls nötig): `chmod +x start.sh`
2. Start mit automatischer Prüfung: `./start.sh`
   * `--check-only`: Nur Prüfungen (z. B. virtuelle Umgebung, Abhängigkeiten, Port) ohne Serverstart.
   * `--debug`: Ausführliches Logging in `logs/start.log` aktivieren.

Die Routine legt eine virtuelle Umgebung an (`.venv`), liest `config/start.conf` als Konfiguration, installiert Abhängigkeiten aus `requirements.txt`, prüft den gewünschten Port und startet anschließend das Frontend (`python -m http.server`). Nach dem Start erfolgt ein kurzer Verfügbarkeits-Check.
Ein übersichtliches Werkzeug-Paket mit statischen HTML-Tools. Ziel ist maximale Barrierefreiheit, klare Bedienung und ein vollautomatischer Start.

## Schnellstart
1. **Voraussetzungen (Dependencies)**: Linux/Mac/WSL mit `python3`.
2. **Startskript**: `./start.sh` erzeugt automatisch eine virtuelle Umgebung (virtuelle Python-Box), installiert Abhängigkeiten und startet einen lokalen Webserver.
3. **Nur prüfen (Health-Check)**: `./start.sh --health` validiert Umgebung und endet ohne Serverstart.
4. **Port ändern (Port = Netzwerk-Adresse)**: `APP_PORT=8080 ./start.sh --no-serve` prüft auf Port 8080.

## Bedienung
- Öffne nach dem Start `http://localhost:8000` im Browser und wähle die gewünschte HTML-Datei aus.
- Buttons sind farblich hervorgehoben, Eingabefelder besitzen Beispiele (Placeholders) für schnellen Einstieg.
- Dark/Light-Theme (Helles/Dunkles Farbschema) schaltest du direkt in den Tools um, soweit angeboten.

## Features und Standards
- **Barrierefreiheit**: Klare Kontraste, skalierbares Layout und einfache Sprache. Fachbegriffe stehen in Klammern mit kurzer Erklärung.
- **Logging & Debug**: `LOG_LEVEL=debug ./start.sh --health` zeigt jeden Schritt; regulär nur wichtige Meldungen.
- **Validierung**: Das Startskript prüft Eingaben (z. B. gültiger Port) und bestätigt Erfolge mit gut lesbaren Meldungen.
- **Modularität**: Statische HTML-Tools bleiben unabhängig; gemeinsame Abhängigkeiten liegen in `requirements.txt` und der virtuellen Umgebung `.venv`.

## Tests und Qualität
- **Gesundheitscheck**: `./start.sh --health` kontrolliert, ob Python vorhanden ist und Abhängigkeiten installierbar sind.
- **Format und Style**: HTML/CSS folgen responsiven Layouts und klaren Kontrastfarben; weitere Linting-Tools können in `requirements.txt` ergänzt werden.

## Struktur
- `start.sh` – Automatischer Setup- und Startprozess.
- `requirements.txt` – Zentrale Paketliste (aktuell minimal).
- `*.html` – Die UI-Tools, direkt im Browser nutzbar.
- `Inputpool.txt` / `todo.txt` – Aufgaben, Ideen und Umsetzungsstatus.

## Support und Erweiterung
- Wünsche und Ideen zuerst in `Inputpool.txt` notieren; umsetzbare Aufgaben werden in `todo.txt` gepflegt.
- Erweiterungen sollten modular bleiben (eigenständige Dateien/Ordner) und Kontrast-/Theme-Vorgaben respektieren.
