# Entwickler-Guide (für 2026-MultiTool)

## Kurzübersicht
- Ziel: Barrierearme (leicht zugängliche) HTML-Tools mit klaren Farben, Tastaturnavigation und einfacher Sprache.
- Technik: Statisches Frontend, gesteuert über `start.sh` (Start- und Prüf-Automat) und Node-Tools (Linting, Accessibility).
- Philosophie: Module bleiben unabhängig, gemeinsame Ressourcen (Themes, Logs, Konfiguration) liegen zentral in `config/`, `logs/`, `data/`.

## Startroutine mit Autopilot
Die Routine erledigt alles automatisch und gibt Fortschrittsschritte aus:
1. **Abhängigkeiten prüfen/auflösen**: `./start.sh` installiert Node-Module (per `npm ci`), wenn sie fehlen.
2. **Qualitätsprüfungen**: Linting + Accessibility laufen automatisch (`npm run check`).
3. **Serverstart**: Statischer Server über `http-server`, erreichbar unter `http://localhost:5000`.
4. **Nur prüfen**: `./start.sh --check-only` (Alias: `--health`) beendet sich nach den Checks (kein Serverstart).
5. **Ohne Tests**: `./start.sh --no-tests` überspringt alle automatischen Prüfungen (z. B. für schnelle Demos).
6. **Logging/Debug**: `./start.sh --debug` schreibt detaillierte Schritte nach `logs/start.log`.

Eingaben werden geprüft (z. B. gültiger Port). Bei Fehlern erfolgt eine klare Fehlermeldung mit Hinweis zur Behebung.

## Qualitäts- und Sicherheitschecks
- **Linting**: `npm run lint` (JavaScript + HTML). Hilft, Tippfehler und Formatprobleme zu erkennen.
- **Accessibility-Test (Barrierefreiheit)**: `npm run check:accessibility` prüft die HTML-Seiten mit Pa11y (Screenreader/ARIA-Hinweise, Kontrast) nach WCAG 2.1 AA und stoppt, wenn mehr als 20 Befunde auftreten.
- **Komplettpaket**: `npm run check` fasst beide Prüfungen zusammen und bricht bei Fehlern ab.
- **Konfigurations-Ordner**: Der Start prüft automatisch, ob `config/` und `logs/` existieren, und legt sie bei Bedarf an (Schutz vor Datenverlust durch fehlende Ordner).

## Struktur und Ablage
- `start.sh`: Autopilot für Setup, Tests und Serverstart.
- `config/start.conf`: Host/Port/Debug-Einstellung, kann per Umgebungsvariablen überschrieben werden.
- `logs/`: Laufzeit- und Debug-Logs; Logfile kann in `start.conf` gesetzt werden.
- `data/`: Platz für nutzerbezogene Dateien (z. B. Exporte), getrennt vom Code.
- `scripts/`: Gemeinsame Prüf-Skripte, z. B. `scripts/accessibility-check.js`.
- `assets/`: Gemeinsame Styles/Icons. Farbschemata sollen langfristig in `config/themes.json` dokumentiert werden.

## Design- und Barrierefreiheits-Best-Practices
- **Fokus sichtbar halten**: Elemente mit klaren Fokus-Ringen gestalten (CSS-Variablen, hoher Kontrast).
- **Mehrere Themes**: Helles, dunkles und hoher-Kontrast-Theme anbieten; Werte dokumentieren und zentral speichern.
- **Einfache Sprache**: Fachbegriffe in Klammern erklären (z. B. "Linting (Code-Prüfung)").
- **Valide Eingaben**: Jede Eingabe prüfen (z. B. Pflichtfelder, Zahlenbereiche) und Erfolgsmeldungen klar formulieren.
- **Debug/Logging-Modus**: Fehlersuche immer in `logs/` protokollieren, damit Nutzende nachvollziehen können, was passiert ist.

## Vorgehen für neue Features
1. **Neue Idee sammeln**: In `Inputpool.txt` ergänzen (kurzer Titel + 1–2 Sätze). Keine Platzhalter eintragen.
2. **In Todo übernehmen**: Relevante Punkte in `todo.txt` mit Priorität/Status übertragen (Offen/Doing/Done).
3. **Umsetzung**: Neues Modul als eigene HTML-Datei anlegen; gemeinsame Styles/JS aus zentralen Ordnern nutzen.
4. **Tests**: Vor dem Commit `npm run check` ausführen. Bei Serverproblemen `./start.sh --debug` nutzen.
5. **Dokumentation**: README und dieses Dokument bei veränderten Abläufen kurz ergänzen (Was hat sich geändert? Welcher Befehl?).

## Häufige Befehle (mit Erklärung)
- `npm ci` – Installiert Abhängigkeiten reproduzierbar (CI = Continuous Integration).
- `npm run check` – Führt Linting (Format-/Syntax-Check) und Accessibility-Tests aus.
- `./start.sh --check-only` oder `./start.sh --health` – Prüft Umgebung, ohne den Server zu starten (Health-Check = Gesundheitsprüfung).
- `./start.sh --no-serve` – Startet nur Prüfungen, kein Webserver (z. B. für CI-Pipelines).
- `./start.sh --debug` – Aktiviert detaillierte Logs für die Fehlersuche.

## Wartbarkeit und Erweiterbarkeit
- **Trennung von System und Daten**: Code im Repo, variable Dateien in `data/`, Konfiguration in `config/`.
- **Tool-Logik entkoppeln**: Wiederkehrende Funktionen (Buttons, Panels, Fokus-Stile) in gemeinsame Assets auslagern.
- **Plugin-fähig denken**: Neue Module als eigenständige HTML-Dateien mit klaren Schnittstellen (z. B. gemeinsame Theme-Switcher-Funktion).
- **Export/Import vorsehen**: Für Nutzende klare Export-Buttons (Text + JSON) bereitstellen; Import validieren.

## Fehlerdiagnose
- Server startet nicht? `./start.sh --debug` ausführen und `logs/start.log` sowie `/tmp/multitool-server.log` prüfen.
- Port belegt? Alternativen Port mit `--port 5050` wählen. Der Start prüft Ports und bricht mit Hinweis ab.
- Linting schlägt fehl? Meldung lesen, betroffene Datei öffnen und nachbessern; dann `npm run check` erneut ausführen.

Diese Dokumentation soll neuen und erfahrenen Mitwirkenden helfen, schnell loszulegen und konsistente, barrierearme Erweiterungen zu bauen.
