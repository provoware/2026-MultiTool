# PROVOWARE 2026-MultiTool

> Neuaufbau 2026 – geführtes, offline-first arbeitendes HTML-Tool mit Fokus auf Robustheit, Laienfreundlichkeit, Barrierefreiheit, Transparenz, Recovery und lernende Qualitätsregeln.

## Aktueller Stand

Der Neuaufbau läuft auf:

`rebuild/v0.1.0-foundation`

Der bisherige Stand von `main` wurde vor dem Rebuild unverändert gesichert unter:

`archive/pre-rebuild-2026-08-24`

Der aktive `main`-Branch wird erst ersetzt bzw. integriert, wenn die neue Foundation ausreichend grün validiert ist.

## Was entsteht hier?

Kein klassisches Sammel-Dashboard und kein digitales Handbuch, sondern ein verständlicher Entwicklungs- und Arbeitsassistent:

`Ziel → Empfehlung → Erklärung → Entscheidung → Prüfung → nächster Schritt`

Die Oberfläche soll für Laien einfach bleiben und technische Details nur dann zeigen, wenn sie gebraucht werden.

## Verbindlicher Masterauftrag

Die vollständigen Entwicklungs-, Qualitäts- und Architekturregeln stehen in:

- **[docs/PROJECT_MASTERPROMPT.md](docs/PROJECT_MASTERPROMPT.md)** – verbindlicher Masterauftrag für den Neuaufbau
- **[docs/DEPENDENCY_AUTOPILOT.md](docs/DEPENDENCY_AUTOPILOT.md)** – automatische und transparente Abhängigkeitsauflösung
- **[docs/BACKEND_LIFECYCLE.md](docs/BACKEND_LIFECYCLE.md)** – automatischer Backend-Start, kontrollierter Shutdown, Logout-/Abbruchbehandlung
- **[docs/LEARNING_MEMORY.md](docs/LEARNING_MEMORY.md)** – Gültigkeit, Review, Ablauf und Widerspruchsschutz des Lerngedächtnisses
- **[docs/EXPERTISE_MATRIX.md](docs/EXPERTISE_MATRIX.md)** – multidisziplinäre Prüf- und Entwicklungs-Expertisen

Diese Dokumente sind Teil des Projektvertrags und müssen bei relevanten Änderungen synchron gehalten werden.

## Arbeitsmodus

**Continuous Dialog Development**

`Besprechen → stabile Entscheidung → klein implementieren → automatisch prüfen → Fehler gezielt fixen → Regression ergänzen → Lerngedächtnis aktualisieren → nächster unabhängiger Schritt`

Ungeklärte Punkte blockieren nicht unnötig. Sie bleiben offen, konfigurierbar oder ausdrücklich als Annahme markiert.

## Laienprinzip

Der Nutzer soll nicht gefragt werden, welche Technologie er möchte, wenn das Tool die technische Entscheidung aus seinem Ziel ableiten kann.

Beispiel:

Nicht:

> IndexedDB oder localStorage?

Sondern:

> Müssen viele Projektdaten dauerhaft gespeichert werden?

`Weiß ich nicht` ist eine gültige Antwort. Das System soll dann einen sicheren Standard empfehlen und erklären.

## Geplante Hauptbereiche

1. **Heute** – sinnvollster nächster Schritt
2. **Projekt** – Ziele, Workflow und Entscheidungen
3. **Bauen** – aktuelle Umsetzung
4. **Prüfen** – Tests, Accessibility und Qualität
5. **Absichern** – Save, Backup, Undo, Recovery, Self-Healing
6. **Lernen** – Lerngedächtnis, Ausschlüsse, Fehlerwissen und Regeln
7. **Release** – Freigabe, Dokumentation und Nachweise
8. **Röntgen** – Gesamtgesundheit, Risiken und Blocker

## Bedienmodi

- **Einfach** – nur Notwendiges und sichere Empfehlungen
- **Geführt** – zusätzlich Gründe, Beispiele und Alternativen
- **Profi** – technische Regeln, Tests, Evidence und Architekturdetails

Alle Modi verwenden denselben Projektzustand.

## Dependency Autopilot

Abhängigkeiten sollen vollständig erkannt und soweit sicher möglich automatisch aufgelöst werden.

Dabei gilt:

- keine stille Installation,
- keine versteckten Root-/Admin-Aktionen,
- projektlokale Dependencies automatisch und reproduzierbar,
- Systemänderungen nur mit sichtbarer Freigabe,
- jede Dependency mit Zweck, Version, Herkunft und Ergebnis dokumentieren,
- normaler Start prüft nur notwendige Runtime-Abhängigkeiten,
- tiefe Entwicklungsprüfungen laufen getrennt.

Details: [docs/DEPENDENCY_AUTOPILOT.md](docs/DEPENDENCY_AUTOPILOT.md)

## Backend automatisch starten und beenden

Die spätere Laien-Startroutine soll Backend und benötigte lokale Dienste automatisch verwalten:

1. Umgebung prüfen
2. Abhängigkeiten auflösen
3. Backend starten
4. Readiness prüfen
5. Oberfläche öffnen
6. bei normalem Ende, Logout oder Abbruch kontrolliert Autosave/Checkpoint durchführen
7. Backend und eigene Kindprozesse sauber schließen
8. Port/PID/Locks verifizieren und aufräumen

Ein Browser-Tab allein darf nicht Process Owner sein. Der Launcher verwaltet den Lifecycle zuverlässig.

Details: [docs/BACKEND_LIFECYCLE.md](docs/BACKEND_LIFECYCLE.md)

## Grafische Transparenz

Start, Diagnose und Recovery verwenden verständliche Checkpoints:

- 🔵 **IN ARBEIT** – Prüfung läuft
- 🟢 **BESTANDEN** – alles in Ordnung
- 🟡 **HINWEIS** – startfähig, aber nicht optimal
- 🔴 **BLOCKIERT** – sicherer Start derzeit nicht möglich

Farbe ist nie die einzige Information; Symbol und Klartext sind immer zusätzlich vorhanden.

## Self-Healing

Automatische Reparatur nur für verstandene, reversible und überprüfbare Fälle.

Pflichtkette:

`BACKUP → REPAIR → VERIFY → JOURNAL`

Scheitert `VERIFY`, folgt Rollback statt stiller Fortsetzung.

## Lerngedächtnis

Bestätigte Erfahrungen sollen langfristig Fehler reduzieren.

Geplant bzw. im Foundation-Aufbau angelegt:

- `knowledge/DECISIONS.jsonl`
- `knowledge/OPEN_QUESTIONS.jsonl`
- `knowledge/EXCLUSIONS.jsonl`
- `knowledge/LEARNING_MEMORY.jsonl`
- `knowledge/REGRESSION_REGISTRY.jsonl`

Lernkette:

`Beobachtung → Ursache → Lösung → Test → Evidenz → Regel → Regression → zukünftige Prävention`

Eine einzelne Beobachtung wird niemals ungeprüft zur globalen Regel. Bestätigte Regeln besitzen zusätzlich einen Gültigkeitsbereich, Review-Termin und optionales Ablaufdatum. Widersprechende aktive Regeln mit überlappendem Gültigkeitsbereich blockieren die Knowledge-Integrity-Prüfung, solange keine explizite Ablösung dokumentiert ist.

Details: [docs/LEARNING_MEMORY.md](docs/LEARNING_MEMORY.md)

## Qualität und Expertisen

Wichtige Änderungen werden je nach Bereich aus mehreren Perspektiven geprüft, unter anderem:

- Softwarearchitektur
- Frontend Engineering
- UI/UX & Human Factors
- Accessibility
- Runtime-/Process-Lifecycle
- Dependency-/Reproducibility-Engineering
- Datenintegrität & Recovery
- Security
- Observability & Diagnose
- Test-/Failure-Engineering
- Release-/Provenienz-Engineering
- Performance
- Laien-Onboarding
- Knowledge-/Learning-Systeme
- Wartbarkeit

Details: [docs/EXPERTISE_MATRIX.md](docs/EXPERTISE_MATRIX.md)

## Foundation V0.1.0

Der erste echte Entwicklungsstand wird bewusst klein gehalten:

- saubere Repository-Struktur
- neue Projektverträge und Dokumentation
- HTML-App-Shell
- Design Tokens
- laienfreundlicher Startweg
- Project State
- Decision Store
- Learning Memory
- minimale Rule Engine
- erste `Heute`-Ansicht
- Testbasis
- CI Quality Gate

Erst wenn dieser vertikale Schnitt eigenständig startbar, verständlich und ausreichend grün ist, wird fachlich erweitert.

## Statusregel

Dieses Repository behauptet niemals `fertig`, `robust`, `barrierefrei`, `self-healing` oder `releasefähig`, wenn die entsprechenden Prüfungen fehlen.

Es wird sauber unterschieden zwischen:

- spezifiziert
- implementiert
- automatisch validiert
- manuell geprüft
- noch nicht geprüft

## Leitregel

> **klein → nachvollziehbar → reversibel → testbar → grün → nächster Schritt**
