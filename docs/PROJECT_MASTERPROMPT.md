# PROVOWARE 2026-MultiTool – Masterauftrag

> Verbindlicher Entwicklungs- und Qualitätsvertrag für den kontrollierten Neuaufbau des Repositories.

## Ziel

`2026-MultiTool` wird als modernes, offline-first arbeitendes HTML-Tool vollständig neu aufgebaut. Ziel sind maximale Robustheit, Konsistenz, Effizienz, Laienfreundlichkeit, Barrierefreiheit, Transparenz, Fehlertoleranz, Recovery-Fähigkeit und langfristige Lernfähigkeit.

Das Tool soll sich für Laien wie ein verständlicher Assistent anfühlen, nicht wie ein Entwicklerprogramm.

## Arbeitsmodus: Continuous Dialog Development

Besprechen → stabile Entscheidung sofort übernehmen → klein implementieren → automatisch prüfen → Fehler gezielt beheben → Regression ergänzen → Lernerkenntnis speichern → nächste unabhängige Entscheidung weiterentwickeln.

Regeln:
- Nicht auf eine komplett fertige Gesamtspezifikation warten.
- Klare Entscheidungen sofort in Code und Spezifikation übernehmen.
- Offene Punkte sichtbar offen, konfigurierbar oder als Annahme markieren.
- Keine Doppelarchitektur und keine vorsorgliche Komplexität.
- Neue produktive Schichten nur auf ausreichend grünem Fundament aufbauen.
- Testergebnisse dürfen frühere Annahmen korrigieren.

Reifezustände je Funktion:

`IDEE → SPEZIFIZIERT → IMPLEMENTIERT → GETESTET → INTEGRIERT → RELEASEFÄHIG`

## Produktprinzip

Der Nutzer sieht immer nur die Information und Entscheidung, die für den aktuellen Arbeitsschritt nötig ist.

Hauptweg:

`Was möchte ich erreichen? → Empfehlung → Erklärung → Entscheidung → Prüfung → nächster Schritt`

### Bedienmodi

- **Einfach:** Hauptaufgabe, sichere Empfehlung, kurze Erklärung, Hauptaktion.
- **Geführt:** zusätzlich Gründe, Alternativen, Beispiele, Auswirkungen und typische Fehler.
- **Profi:** zusätzlich Requirement-ID, Modul, technische Regel, Abhängigkeiten, Akzeptanzkriterium, Test, Evidence und Recovery-Details.

Alle Modi verwenden denselben Projektzustand.

## Hauptbereiche

1. Heute – sinnvollster nächster Schritt
2. Projekt – Ziele, Anforderungen, Workflow, Entscheidungen
3. Bauen – aktuelle Umsetzung
4. Prüfen – Tests, Accessibility, Validierung
5. Absichern – Save, Backup, Undo, Recovery, Self-Healing
6. Lernen – Lerngedächtnis, bekannte Fehler, Ausschlüsse, bewährte Regeln
7. Release – Freigabe, Dokumentation, Manifest, Nachweise
8. Röntgen – Gesamtgesundheit, Risiken, Blocker, Zusammenhänge

## Smart Wizard

Nach Ziel, Verhalten und Risiko fragen, nicht nach Technologie.

Beispiele:
- Nicht: „IndexedDB oder localStorage?“
- Sondern: „Müssen viele Projektdaten dauerhaft gespeichert werden?“

- Nicht: „Optimistic concurrency control?“
- Sondern: „Kann dieselbe Datei gleichzeitig von mehreren Stellen verändert werden?“

Antworten sollen mindestens `Ja`, `Nein`, `Weiß ich nicht`, `Egal`, `Später einstellbar` unterstützen.

`Weiß ich nicht` ist eine vollwertige Antwort. Das System darf daraus einen sicheren Standard empfehlen und verständlich begründen.

## Eine Hauptaufgabe pro Ansicht

Jede wichtige Entscheidung folgt demselben Muster:

1. Titel
2. Warum ist das jetzt relevant?
3. Empfehlung
4. Übernehmen
5. Andere Möglichkeiten
6. Warum?
7. Beispiel
8. Technische Details

## Kanonischer Projektzustand

Genau eine Wahrheit für fachlichen Zustand. Keine parallele Pflege zwischen UI, localStorage, IndexedDB, Dateien, Cache und Reports.

Empfohlene Trennung:
- kleine UI-Präferenzen → localStorage
- fachlicher Projektzustand → IndexedDB
- Import/Export → versioniertes JSON
- abgeleitete Dokumentation → Markdown/TXT/JSON

Jedes Schema wird versioniert und kontrolliert migriert.

## Wissens- und Entscheidungsdateien

- `knowledge/DECISIONS.jsonl` – bestätigte Entscheidungen
- `knowledge/OPEN_QUESTIONS.jsonl` – offene, nicht blockierende Fragen
- `knowledge/EXCLUSIONS.jsonl` – bewusste Ausschlüsse und Anti-Patterns
- `knowledge/LEARNING_MEMORY.jsonl` – bestätigtes Erfahrungswissen

Lernkreislauf:

`Beobachtung → Ursache → Lösung → Prüfung → Nachweis → Regel → Regression → Prävention`

Statusmodell:

`BEOBACHTET → KANDIDAT → BESTÄTIGT → AKTIV → VERALTET`

Eine einzelne Beobachtung darf warnen, aber nicht automatisch zur globalen Wahrheit werden.

## Rule Engine

Regeln können `INFO`, `WARNUNG` oder `BLOCKER` auslösen. Jeder Blocker erklärt Ursache, Evidenz und sicheren Alternativweg.

Beispiel:

Wenn Originaldateien verändert werden, werden Backup, Undo, Dry Run, Preview, Recovery, atomare Speicherung, Schreibrechte und Failure Tests relevant.

## Next-Step Engine

Bewertet offene MUSS-Punkte, Risiken, Abhängigkeiten, Reifegrad, Hauptworkflow, Lernerfahrungen und Aufwand.

Standardmäßig zeigt die Oberfläche:
1. eine Hauptempfehlung
2. maximal zwei Alternativen

Jede Empfehlung erklärt: Warum jetzt? Risiko ohne den Schritt? Auswirkung? Voraussetzungen?

## Transparente Automatik

Jede automatische Empfehlung besitzt `Warum sehe ich das?`.

Automatische Standards müssen offenlegen:
- was übernommen wird
- warum
- ob es reversibel bzw. später änderbar ist

## Fehlerhandling

Jeder Fehlerzustand beantwortet:
1. Was ist passiert?
2. Was bedeutet das?
3. Was wurde geprüft?
4. Sind Nutzerdaten sicher?
5. Was ist jetzt empfohlen?
6. Technische Details optional

Stabile Fehlercodes verwenden.

## Self-Healing

Nur deterministische, nachvollziehbare, lokal begrenzte, reversible und validierbare Reparaturen.

Pflichtkette:

`BACKUP → REPAIR → VERIFY → JOURNAL`

Scheitert die Verifikation: Rollback.

Keine automatische Reparatur unbekannter Nutzerdaten, nicht verstandener Datenbankfehler, Quellcodeänderungen zur Laufzeit oder privilegierter Aktionen ohne explizite Freigabe.

## Dependency Autopilot

Jede Abhängigkeit wird erkannt, klassifiziert, transparent dokumentiert und – soweit sicher möglich – automatisch aufgelöst. Details: `docs/DEPENDENCY_AUTOPILOT.md`.

Grundsatz:
- keine stille Installation
- keine versteckten Systemänderungen
- keine unbemerkten Root-/Admin-Aktionen
- reproduzierbare Lockfiles
- exakte Versions- und Herkunftsnachweise
- Start-Routine prüft nur notwendige Runtime-Abhängigkeiten
- Entwicklungsabhängigkeiten werden separat verwaltet

## Backend Lifecycle

Backend und lokale Dienste werden zusammen mit der Anwendung kontrolliert gestartet und beendet. Details: `docs/BACKEND_LIFECYCLE.md`.

Pflicht:
- eindeutiger Process Owner
- PID-/Session-Tracking
- Signalbehandlung für `EXIT`, `INT`, `TERM`, `HUP`
- graceful shutdown
- Kindprozesse kontrolliert beenden
- stale PID/Port erkennen
- bei Abbruch oder Logout sauber aufräumen
- Recovery-Checkpoint vor riskantem Shutdown, sofern nötig

## Barrierefreiheit

Mindestens WCAG 2.2 AA anstreben und praktisch prüfen:
- Tastaturbedienung
- sichtbarer Fokus
- logische Fokusreihenfolge
- Screenreader-Semantik
- Kontrast
- lange Texte
- große Systemschrift
- 100/125/150/175/200 % Zoom
- kleine und große Fenster
- reduzierte Bewegung
- Alternative zu Drag & Drop

Farbe ist nie die einzige Statusinformation.

## Responsive Design

Bevorzugt CSS Grid, Flexbox, Container Queries, `min()`, `max()`, `clamp()` und zentrale CSS Custom Properties. Keine unnötigen festen Höhen. Kein Clipping oder verdeckte Hauptaktion bei Zoom.

## Visuelles System

Ruhig, modern, hochwertig und verständlich. Farbe hat Funktion:
- Blau – Hauptaktion
- Grün – Erfolg
- Türkis – Information
- Orange – Warnung
- Rot – Fehler/Blocker
- Violett – Wissen/Lernen

Einheitliches Spacing: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`.

## Entwicklungs-Expertisen

Das Projekt wird aus mehreren Fachperspektiven geprüft. Die verbindliche Matrix steht in `docs/EXPERTISE_MATRIX.md`.

Mindestens:
- Softwarearchitektur
- Frontend/UI/UX
- Accessibility
- Runtime-/Prozess-Lifecycle
- Dependency-/Reproducibility-Engineering
- Datenintegrität/Recovery
- Security
- Observability/Diagnose
- Test-/Failure-Engineering
- Release-/Provenienz-Engineering
- Performance
- Laien-Onboarding/Human Factors
- Knowledge-/Learning-Systeme

Keine Expertise darf unnötige Komplexität erzwingen; Ziel bleibt die kleinste robuste Lösung.

## Test- und Repair-Loop

`Fehler erfassen → Ursache bestimmen → kleinster Fix → relevanten Test erneut ausführen → Regression ergänzen → Gesamteinfluss prüfen`

Keine endlosen spekulativen Fix-Ketten. Wenn dieselbe Ursache nach mehreren kontrollierten Versuchen nicht verstanden ist, stoppen und als offen markieren.

## GitHub-Gates

Entwicklung über kleine nachvollziehbare Branches/PRs. `main` bleibt stabil. Mindestens Format, Lint, Unit, Integration, E2E und Accessibility soweit für den jeweiligen Slice relevant.

Fehlerreports sollen verwertbare Evidence liefern, z. B. Testreport, Screenshots, Trace und relevante Logs.

## V0.1.0 Foundation

Erster vertikaler Schnitt:
1. neue Repository-Grundstruktur
2. neue README
3. neue AGENTS.md
4. PROJECT_STATUS.json
5. HTML-App-Shell
6. Design Tokens
7. laienfreundlicher Startweg
8. Project-State-Grundmodell
9. Decision Store
10. Learning Memory
11. minimale Rule Engine
12. erste `Heute`-Ansicht
13. automatisierte Testbasis
14. CI Quality Gate

Erst wenn dieser Stand eigenständig startbar und ausreichend grün ist, folgt der nächste fachliche Slice.

## Definition of Done

Keine Fake-Fertigstellung. Immer sauber unterscheiden zwischen:
- implementiert
- automatisch validiert
- manuell geprüft
- nicht geprüft

V0.1.0 ist nur fertig, wenn Startweg, Grundoberfläche, State, Decision Store, Learning Memory, Rule Engine, verständliche Fehler, Tastatur/Fokus, Zoomprüfung, Tests, CI und README tatsächlich zum selben Stand passen.

## Iterationsbericht

Jede Iteration endet mit:
- Status
- Umfang
- Warum
- Änderungen
- Validierung
- Robustheit
- Lerngedächtnis
- Fortschritt getrennt nach Spezifikation/Implementierung/Validierung/Releasefähigkeit
- Fertig
- Offen
- bekannte Grenzen
- genau ein nächster Schritt
- zwei zusätzliche Empfehlungen
- Fazit

## Leitregel

> klein → nachvollziehbar → reversibel → testbar → grün → nächster Schritt

Ziel ist nicht maximale Featuremenge, sondern ein Fundament, auf dem jede weitere Funktion leichter, sicherer und konsistenter gebaut werden kann.
