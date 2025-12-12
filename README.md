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
- **Start-Routine**: `start.sh` als geplanter automatischer Starthelfer (virtuelle Umgebung, Abhängigkeitsprüfung, Start der Oberfläche).
- **Themes & Accessibility**: Fokus-Styles, hohe Kontraste und mehrere Themes werden vorgesehen; bitte vorhandene Module bei Erweiterungen um Theme-Switcher ergänzen.
- **Debug/Logging-Modus**: Geplanter Modus mit erweiterten Protokollen (Log-Dateien) und Fehlersuche.

## Modulare Struktur
- **Statische Module**: Einzelne HTML-Dateien (`GenresTool.html`, `SONGTEXTTOOL.html`) bleiben voneinander getrennt und können separat angepasst werden.
- **System-/Konfigurationsdateien**: Skripte wie `start.sh` sollten künftig in einem `scripts/`-Ordner liegen; Konfigurationen (z. B. Themes, Logging) gehören in `config/` und variable Daten in `data/`.
- **Erweiterbarkeit**: Neue Module können als eigenständige HTML-Dateien mit gemeinsamen Komponenten (Header, Footer, Kontrast-Styles) hinzugefügt werden.

## Voraussetzungen
- Bash-kompatible Shell (für `start.sh`).
- Aktuelle Browser-Version für die HTML-Tools.
- Optional: Python 3 (für virtuelle Umgebungen) und Node.js (falls Build-Schritte ergänzt werden).

## Installation
1. Repository klonen: `git clone <repo-url> && cd 2026-MultiTool`.
2. Ausführbarkeit sicherstellen (Rechte): `chmod +x start.sh`.
3. (Optional) Virtuelle Umgebung vorbereiten: `python -m venv .venv && source .venv/bin/activate`.
4. Abhängigkeiten (Dependencies) prüfen/auflösen: `./start.sh --check` (geplanter Schritt; siehe TODO), alternativ manuell Pakete installieren, sobald definiert.

## Nutzung
1. Start-Routine ausführen: `./start.sh --start` (geplant: prüft Abhängigkeiten automatisch, löst fehlende Pakete und startet die Oberfläche mit Fortschrittsmeldungen).
2. Alternativ die HTML-Module direkt im Browser öffnen (Doppelklick auf `GenresTool.html` oder `SONGTEXTTOOL.html`).
3. Theme wechseln (geplant): Schalter im Kopfbereich jeder Seite; wähle z. B. „Hoher Kontrast“ oder „Dunkel“.
4. Barrierefreiheit (Accessibility): Nutze Tab-Taste zur Navigation, achte auf sichtbare Fokus-Ränder, und aktiviere Screenreader-Hinweise (ARIA-Labels), sobald ergänzt.

## Barrierefreiheit & Themes
- Hoher Kontrast und Farbwahl: Verwende Theme-Varianten mit AA/AAA-Kontrast; dokumentiere Farbwerte in `config/themes.json` (geplant).
- Tastaturbedienung: Alle interaktiven Elemente sollen mit Tab erreichbar sein und Fokus-Ringe (Focus Outlines) zeigen.
- Klare Sprache: Fachbegriffe werden in Klammern erklärt, Labels sind kurz und eindeutig.
- Tooltips (Kurz-Hilfetexte) und Beispieldaten ergänzen die Eingabefelder.

## Debugging & Logging
- Geplanter Startparameter: `./start.sh --debug` aktiviert erweitertes Logging (Protokollierung) nach `logs/app.log`.
- Eingaben werden validiert (geprüft) und Ausgaben auf Erfolg kontrolliert; bitte Validation pro Funktion einplanen.
- Logging-Level (Protokollstufe) soll in `config/logging.conf` zentral gepflegt werden.

## Automatische Prüfungen & Tests
- Geplante Routine: `./start.sh --test` führt Format- und Qualitätsprüfungen aus (z. B. `npm test` oder `pytest`), löst fehlende Abhängigkeiten automatisch und liefert laienfreundliches Feedback.
- Bis zur Implementierung: Stelle sicher, dass HTML-Dateien per W3C-Validator geprüft werden und künftiger Code mit Linting versehen wird.

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

