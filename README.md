# 2026-MultiTool

## Projektbeschreibung
2026-MultiTool ist eine modulare Sammlung kleiner Web-Tools (Werkzeuge), die in statischen HTML-Dateien bereitstehen und sich leicht erweitern lassen. Ziel ist eine zentrale, barrierearme (zugängliche) Oberfläche zum Verfassen von Texten und Songideen sowie zum Experimentieren mit Genres.

## Zielgruppe
- Kreative Einsteiger und Fortgeschrittene, die Text- und Songideen schnell festhalten möchten.
- Menschen mit Assistenzbedarf: klare Sprache, hohe Kontraste, wählbare Farb-Themes (Farbschemata) und Tastaturnavigation.
- Teams, die eine wartbare, modulare Struktur bevorzugen.

## Hauptfunktionen
- **GenresTool**: HTML-Tool zur Genre-Auswahl und Ideenfindung.
- **SongtextTool**: HTML-Tool zum Strukturieren von Songtexten.
- **Index-/Template-Komponenten**: `index_templates_tool.html` als Startpunkt für neue Module.
- **Start-Routine**: `start.sh` als automatischer Starthelfer (Abhängigkeitsprüfung, Qualitätschecks, Start der Oberfläche).
- **Themes & Accessibility**: Fokus-Styles, hohe Kontraste und mehrere Themes werden vorgesehen; bitte vorhandene Module bei Erweiterungen um Theme-Switcher ergänzen.
- **Debug/Logging-Modus**: Aktivierbarer Modus mit erweiterten Protokollen (Log-Dateien) und Fehlersuche.

## Modulare Struktur
- **Statische Module**: Einzelne HTML-Dateien (`GenresTool.html`, `SONGTEXTTOOL.html`) bleiben voneinander getrennt und können separat angepasst werden.
- **System-/Konfigurationsdateien**: Skripte wie `start.sh` sollten künftig in einem `scripts/`-Ordner liegen; Konfigurationen (z. B. Themes, Logging) gehören in `config/` und variable Daten in `data/`.
- **Erweiterbarkeit**: Neue Module können als eigenständige HTML-Dateien mit gemeinsamen Komponenten (Header, Footer, Kontrast-Styles) hinzugefügt werden.

## Voraussetzungen
- Bash-kompatible Shell (für `start.sh`).
- Node.js ab Version 18 mit npm (für automatische Prüfungen und Startskript).
- Aktuelle Browser-Version für die HTML-Tools.
- Optional: Python 3 (für virtuelle Umgebungen) und – für Headless-Checks – die üblichen Systembibliotheken (z. B. `libatk1.0-0t64`, `libgtk-3-0t64`, `libnss3`, `libgbm1`).

## Installation
1. Repository klonen: `git clone <repo-url> && cd 2026-MultiTool`.
2. Ausführbarkeit sicherstellen (Rechte): `chmod +x start.sh`.
3. (Optional) Virtuelle Umgebung vorbereiten: `python -m venv .venv && source .venv/bin/activate`.
4. Abhängigkeiten (Dependencies) prüfen/auflösen: `./start.sh --check-only` (Alias: `--health`) führt die automatischen Prüfungen aus (Linting + Accessibility) und beendet sich danach.

## Nutzung
1. Start-Routine ausführen: `./start.sh` prüft Abhängigkeiten automatisch, löst fehlende Pakete, führt Checks aus und startet die Oberfläche mit Fortschrittsmeldungen.
2. Alternativ die HTML-Module direkt im Browser öffnen (Doppelklick auf `GenresTool.html` oder `SONGTEXTTOOL.html`).
3. Theme wechseln (geplant): Schalter im Kopfbereich jeder Seite; wähle z. B. „Hoher Kontrast“ oder „Dunkel“.
4. Barrierefreiheit (Accessibility): Nutze Tab-Taste zur Navigation, achte auf sichtbare Fokus-Ränder, und aktiviere Screenreader-Hinweise (ARIA-Labels), sobald ergänzt.

## Barrierefreiheit & Themes
- Hoher Kontrast und Farbwahl: Verwende Theme-Varianten mit AA/AAA-Kontrast; dokumentiere Farbwerte in `config/themes.json` (geplant).
- Tastaturbedienung: Alle interaktiven Elemente sollen mit Tab erreichbar sein und Fokus-Ringe (Focus Outlines) zeigen.
- Klare Sprache: Fachbegriffe werden in Klammern erklärt, Labels sind kurz und eindeutig.
- Tooltips (Kurz-Hilfetexte) und Beispieldaten ergänzen die Eingabefelder.

## Debugging & Logging
- Startparameter: `./start.sh --debug` aktiviert erweitertes Logging (Protokollierung) nach `logs/start.log`.
- Eingaben werden validiert (geprüft) und Ausgaben auf Erfolg kontrolliert; bitte Validation pro Funktion einplanen.
- Logging-Level (Protokollstufe) wird in `config/start.conf` gesetzt.

## Automatische Prüfungen & Tests
- Automatische Routine: `./start.sh` löst fehlende Abhängigkeiten auf und führt `npm run check` (Linting + Accessibility) aus. Für reine Prüfungen kann `./start.sh --check-only` bzw. `--health` genutzt werden.
- Manuelle Ergänzung: Bei Bedarf zusätzlich HTML mit externen Validatoren prüfen, um neue Module abzusichern.

## Tests (manuell)
- Öffne die HTML-Dateien im Browser und prüfe Layout, Kontrast und Tastaturnavigation.
- Kontrolliere, dass Themes lesbar bleiben und keine Inhalte verdeckt werden.

## Support
- Issues im Repository anlegen; beschreibe Browser, Schritte und gewünschtes Theme.
- Für schnelle Hilfe: Kurzbeschreibung (Problem), Erwartung (Soll-Verhalten) und Screenshot beilegen.

## Weiterführende Tipps für Einsteiger
- Beginne mit einem Theme, das für dich gut lesbar ist (z. B. hoher Kontrast). 
- Nutze klare Überschriften und kurze Absätze in deinen Texten, um Ideen zu strukturieren.
- Speichere regelmäßig Zwischenstände, z. B. durch Kopieren der Texte in eine Datei.
- Wenn etwas nicht funktioniert, aktiviere den Debug-Modus (`--debug`), um verständliche Hinweise zu erhalten.
- Prüfe neue Module zuerst isoliert im Browser, bevor du sie in die Hauptnavigation aufnimmst.

## Glossar (Kurz erklärt)
- **Dependency (Abhängigkeit)**: Ein zusätzliches Paket oder Programm, das ein Tool benötigt.
- **Theme (Farbschema)**: Vordefinierte Farb- und Schriftkombination für bessere Lesbarkeit.
- **Logging (Protokollierung)**: Mitschreiben von Statusmeldungen zur Fehlersuche.
- **ARIA**: Attribute, die Screenreadern Hinweise geben und die Zugänglichkeit verbessern.

Eine kleine Qualitätssicherung für die statischen HTML-Tools mit einfacher Sprache und erklärten Fachbegriffen.

## Schnellstart mit Autopilot
- `./start.sh` startet die vollautomatische Routine: prüft npm, installiert Abhängigkeiten, führt Linting (Quellcode-Prüfung) und Accessibility-Checks (Barrierefreiheits-Prüfung) aus und startet danach einen lokalen Server auf http://localhost:5000.
- Die Ausgaben sind als Fortschrittsschritte protokolliert.

## Manuelle Qualitätsprüfungen
- `npm install` oder `npm ci` installiert alle Dev-Tools reproduzierbar.
- `npm run lint` überprüft HTML- und JS-Dateien auf saubere Syntax und Struktur.
- `npm run check:accessibility` startet einen lokalen Server und prüft die drei HTML-Seiten automatisch mit Pa11y (Threshold 20 Befunde, läuft headless mit `--no-sandbox`, Standard: WCAG 2.1 AA).
- `npm run check` bündelt alle Checks in einem Befehl.

## CI/CD
- `.github/workflows/ci.yml` führt auf jedem Push/PR `npm ci` und `npm run check` aus, damit dieselben Prüfungen auch im GitHub-Workflow laufen.

## Ablage wichtiger Dateien
- `package.json` und `package-lock.json`: definieren und fixieren die Node-Toolchain (eslint, htmlhint, pa11y usw.).
- `.gitignore`: schließt z. B. `node_modules` von Commits aus.
- `.htmlhintrc`, `eslint.config.cjs`, `pa11yci.json`, `scripts/accessibility-check.js`: Konfiguration der Checks.
- `requirements.txt`: Referenzdatei für optionale Python-Abhängigkeiten (derzeit leer; Standard-Setup nutzt nur Node-Tools).
- `todo.txt`: Offene Verbesserungen, u. a. neue Ideen aus `Inputpool.txt` und Farbthemen für bessere Kontraste.

## Hinweise für Barrierefreiheit
- Pa11y prüft nach WCAG 2.1 AA (Standard `WCAG2AA`) und bricht ab, wenn mehr als 20 Befunde auftreten.
- Themes mit gutem Kontrast sind als nächster Schritt im `todo.txt` notiert.
Dieses Repository bündelt mehrere Tools (z. B. Songtext-, Genre- und Index-Generatoren) und stellt eine zentrale Anlaufstelle für neue Funktionen bereit. Die Pflege der Aufgaben erfolgt über `Inputpool.txt` (Eingang) und `todo.txt` (strukturierte Planung).

## Pflegehinweise
- Neue Ideen landen zuerst im Inputpool, werden dort nach Themen sortiert und anschließend mit Titel, Beschreibung, Priorität und Status in die Todo-Liste übernommen.
- Halte Einträge barrierearm (einfache Sprache, klare Beispiele) und vermeide Platzhalter oder doppelte Punkte.
- Automatisiere Prüfungen und Tests, wo möglich, und dokumentiere Änderungen kurz in der Todo-Liste.
## Startanleitung
1. Startroutine ausführbar machen (falls nötig): `chmod +x start.sh`
2. Start mit automatischer Prüfung: `./start.sh`
    * `--check-only` / `--health`: Nur Prüfungen (Linting + Accessibility, Port-Check) ohne Serverstart.
   * `--no-tests`: Überspringt die Checks (nur sinnvoll für schnelle Demos).
   * `--debug`: Ausführliches Logging in `logs/start.log` aktivieren.

Die Routine liest `config/start.conf`, legt fehlende Ordner (`config/`, `logs/`, `data/`) automatisch an, installiert Node-Abhängigkeiten, führt `npm run check` aus und startet danach einen lokalen `http-server` auf Port 5000. Anschließend erfolgt ein kurzer Verfügbarkeits-Check per `curl`.
Ein übersichtliches Werkzeug-Paket mit statischen HTML-Tools. Ziel ist maximale Barrierefreiheit, klare Bedienung und ein vollautomatischer Start.

## Schnellstart
1. **Voraussetzungen (Dependencies)**: Linux/Mac/WSL mit `node` (>=18) und `npm`.
2. **Startskript**: `./start.sh` installiert Abhängigkeiten (falls nötig), führt Checks aus und startet einen lokalen Webserver.
3. **Nur prüfen (Health-Check)**: `./start.sh --check-only` (Alias: `--health`) validiert Umgebung und endet ohne Serverstart.
4. **Port ändern (Port = Netzwerk-Adresse)**: `PORT=8080 ./start.sh --no-serve` prüft nur.

## Bedienung
- Öffne nach dem Start `http://localhost:5000` im Browser und wähle die gewünschte HTML-Datei aus.
- Buttons sind farblich hervorgehoben, Eingabefelder besitzen Beispiele (Placeholders) für schnellen Einstieg.
- Dark/Light-Theme (Helles/Dunkles Farbschema) schaltest du direkt in den Tools um, soweit angeboten.

## Features und Standards
- **Barrierefreiheit**: Klare Kontraste, skalierbares Layout und einfache Sprache. Fachbegriffe stehen in Klammern mit kurzer Erklärung.
- **Logging & Debug**: `DEBUG=1 ./start.sh --health` zeigt jeden Schritt; regulär nur wichtige Meldungen.
- **Validierung**: Das Startskript prüft Eingaben (z. B. gültiger Port) und bestätigt Erfolge mit gut lesbaren Meldungen.
- **Modularität**: Statische HTML-Tools bleiben unabhängig; gemeinsame Abhängigkeiten liegen in den Node-Dev-Tools (`node_modules`), optionale Python-Pakete würden in `requirements.txt` landen.

## Tests und Qualität
- **Gesundheitscheck**: `./start.sh --check-only` (Alias: `--health`) kontrolliert, ob Abhängigkeiten installierbar sind und Linting/Accessibility laufen.
- **Format und Style**: HTML/CSS folgen responsiven Layouts und klaren Kontrastfarben; weitere Linting-Tools können in `requirements.txt` ergänzt werden.

## Struktur
- `start.sh` – Automatischer Setup- und Startprozess.
- `requirements.txt` – Zentrale Paketliste (aktuell minimal).
- `*.html` – Die UI-Tools, direkt im Browser nutzbar.
- `Inputpool.txt` / `todo.txt` – Aufgaben, Ideen und Umsetzungsstatus.

## Support und Erweiterung
- Wünsche und Ideen zuerst in `Inputpool.txt` notieren; umsetzbare Aufgaben werden in `todo.txt` gepflegt.
- Erweiterungen sollten modular bleiben (eigenständige Dateien/Ordner) und Kontrast-/Theme-Vorgaben respektieren.
