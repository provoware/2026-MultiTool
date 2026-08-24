# AGENTS.md – PROVOWARE 2026-MultiTool

Diese Regeln gelten für jede Entwicklungsarbeit in diesem Repository.

## 1. Verbindliche Referenzen
Goldene Hauptregel: Maximal codesparsam direkt im code patchen
                    Maximal wartbar und getrennte strukturen
                    Maximal effizient und begründet arbeiten exakt nach plan, 
                    eventualitäten in nächste iteration zusätzlich mit aufnehmen
                    Optimiere dich ständig selbständig und lernend mit einer Hilfsdatei für Dich wo du deine vollständig eigene systematik und struktur aufbauen kannst um immer perfekter und effizienter zu werden
Vor relevanten Änderungen lesen und beachten:

- `README.md & TODO.md`
- `docs/PROJECT_MASTERPROMPT.md`
- `docs/DEPENDENCY_AUTOPILOT.md`
- `docs/BACKEND_LIFECYCLE.md`
- `docs/EXPERTISE_MATRIX.md`
- `PROJECT_STATUS.json`

## 2. Continuous Dialog Development

Arbeitskette:

`Besprechen → stabile Entscheidung → klein implementieren, und zuerst die man beenden könnte,  → automatisch prüfen → Fehler kontrolliert fixen → Regression ergänzen → Lerngedächtnis aktualisieren → nächster unabhängiger Schritt mit Patchgröße - Doku und notwendige infodateien erweitern und aktualisieren in laien optimaler sprache - Dich selbst vergleichend immer weiter selbst bewerten und benennen wo du dich wie verbessern wirst und was dir dabei helfen wird , auch dokumentieren - Versionierung und Repoaktualisierung prüfen und bestätigen`

Klare Entscheidungen nicht unnötig aufschieben. Offene Punkte explizit als offen, konfigurierbar oder Annahme markieren.

## 3. Kleinste robuste Änderung mit detaildaten

- Keine Doppelarchitektur.
- Keine vorsorgliche Komplexität.
- Keine neue Abhängigkeit ohne belegbaren Nutzen.
- Keine unnötige Runtime-Abhängigkeit.
- Keine Platzhalter als angeblich fertige Funktion.
- Keine große Refaktorierung, wenn ein kleiner klarer Patch genügt.

## 4. Ziel vor Technik

Bei Nutzerführung und Architektur zuerst Ziel, Verhalten und Risiko bestimmen. Technologie daraus ableiten.

Ein Laie soll keine technische Entscheidung treffen müssen, die das Tool sicher selbst ableiten kann.

## 5. Kanonische Wahrheit

Jeder fachliche Zustand besitzt genau eine kanonische Quelle. Abgeleitete Ansichten und Dokumente dürfen keine zweite Wahrheit erzeugen.

## 6. Dependency-Regel

Neue Abhängigkeiten müssen dokumentieren:
- Zweck,
- Runtime/Development/Optional/System,
- Version,
- Herkunft,
- Installationsweg,
- Fallback/Removal-Plan,
- Tests.

Projektlokale sichere Dependencies dürfen automatisiert aufgelöst werden. Privilegierte Systemänderungen niemals versteckt ausführen.

## 7. Backend Lifecycle

Lokale Backends/Hilfsprozesse brauchen eindeutigen Owner, PID/Session-Tracking, Health/Readiness und kontrollierten Shutdown.

Start/Abbruch/Logout dürfen keine verwaisten eigenen Prozesse oder Locks hinterlassen.

Keine fremden Prozesse automatisch beenden.

## 8. Datenintegrität

Riskante Mutationen nur mit geeignetem Schutz.

Bevorzugtes Muster:

`VALIDATE → PLAN/PREVIEW → BACKUP → WRITE/EXECUTE → VERIFY → JOURNAL`

Kanonische Daten nie unnötig direkt überschreiben.

## 9. Self-Healing

Nur deterministisch, begrenzt, reversibel und validierbar.

Pflicht:

`BACKUP → REPAIR → VERIFY → JOURNAL`

Bei fehlgeschlagenem Verify: Rollback bzw. sicherer Stop.

## 10. Bug-Regel

Jeder relevante reproduzierbare Bug wird nach Möglichkeit:
1. reproduziert,
2. minimal behoben,
3. durch Regressionstest abgesichert,
4. als Lernerkenntnis bewertet.

## 11. Learning Memory

Rohlogs sind kein Lerngedächtnis.

Bestätigtes Wissen folgt:

`BEOBACHTET → KANDIDAT → BESTÄTIGT → AKTIV → VERALTET`

Eine einzelne Beobachtung darf nicht ungeprüft zur globalen Regel werden.

## 12. UI/UX

- Eine klare Hauptaufgabe pro Arbeitsansicht.
- Progressive Disclosure: Einfach → Geführt → Profi.
- Status niemals nur durch Farbe.
- Sichere Defaults.
- `Weiß ich nicht` als gültige Antwort, wo technische Unsicherheit realistisch ist.
- Automatik erklärt `Warum sehe ich das?`.

## 13. Accessibility

Mindestens WCAG-2.2-AA-Ziel und praktische Prüfung für relevante Slices:
- Tastatur,
- Fokus,
- Semantik,
- Kontrast,
- Zoom 100/125/150/175/200 %,
- kleine Fenster,
- große Schrift,
- reduced motion,
- alternative Bedienung zu Drag & Drop.

## 14. Tests

Tests passend zum Risiko wählen:
- Unit für reine Fachlogik,
- Integration für Modulgrenzen,
- E2E für Hauptworkflow,
- Accessibility für UI,
- Failure Injection für robuste Fehlerpfade,
- Regression für frühere Bugs.

Keine Behauptung `geprüft`, wenn die Prüfung nicht tatsächlich lief.

## 15. Expertisen

Für jeden Slice die relevanten Prüfperspektiven aus `docs/EXPERTISE_MATRIX.md` auswählen.

Minimal immer:
- Softwarearchitektur,
- UI/UX bzw. betroffene Nutzerwirkung,
- Tests,
- mindestens eine passende Fachexpertise.

Sicherheit und Datenintegrität haben Vorrang vor Komfort und Featuremenge.

## 16. Dokumentation

Dokumentation synchron zum tatsächlichen Stand halten. Keine mehrfach gepflegten Statuswahrheiten.

Flüchtige Logs, Debugreports, Caches und normale Testartefakte nicht committen, außer sie sind für Regression, Recovery oder Release-Evidence erforderlich.

## 17. Git/Gates

`main` bleibt stabil. Entwicklung bevorzugt in kleinen Branches/PRs.

Keine Promotion über rote relevante Gates hinweg.

## 18. Abschluss jeder Iteration

Berichten:
- Status
- Umfang
- Warum
- Änderungen
- Validierung
- Robustheit
- Lerngedächtnis
- Fortschritt
- Fertig
- Offen
- bekannte Grenzen
- genau ein nächster Schritt
- zwei zusätzliche Empfehlungen
- Fazit

## Leitregel

> klein → nachvollziehbar → reversibel → testbar → grün → nächster Schritt
