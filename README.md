# PROVOWARE 2026-MultiTool

> **Foundation V0.1.0** – geführtes, offline-first arbeitendes HTML-Tool mit lokalem Backend, transparenter Startroutine, Recovery-Grundlagen und lernenden Qualitätsregeln.

## Aktueller Entwicklungsstand

Der Neuaufbau läuft auf `rebuild/v0.1.0-foundation`.

Der frühere Repository-Stand ist unverändert gesichert unter `archive/pre-rebuild-2026-08-24`. Der `main`-Branch bleibt unangetastet, bis die Foundation ausreichend grün validiert ist.

### C2 – Clean Foundation

Der alte Produktkern wurde auf dem Rebuild-Branch entfernt. Nicht mehr Teil der neuen Anwendung sind die alten Songtext-/Genre-/Template-HTMLs, alten UI-Assets, Inputpool-Dateien, parallelen Agentenregeln und die alte Server-/Theme-Konfiguration.

Der neue erste Nutzerweg ist:

`Start → Preflight → Backend starten → Readiness → grafische Ampelansicht → Checkpoint → Abbruch/Logout → Shutdown → Verify Closed`

## Schnellstart für Laien

Auf Linux/Kubuntu:

```bash
./start.sh
```

Die Startroutine zeigt jeden wichtigen Schritt zusätzlich zu Farben immer mit Symbol und Klartext:

- 🔵 **IN ARBEIT** – Prüfung läuft
- 🟢 **BESTANDEN** – Schritt erfolgreich
- 🟡 **HINWEIS** – sicher nutzbar, aber mit Hinweis
- 🔴 **BLOCKIERT** – sicherer Start derzeit nicht möglich

Nach erfolgreicher Readiness öffnet der Launcher die lokale Oberfläche im Browser. Das Backend bindet ausschließlich an `127.0.0.1` und ist damit nicht als Netzwerkdienst für andere Rechner gedacht.

### Voraussetzung

Runtime: **Node.js >= 18**.

Die eigentliche Foundation-Runtime verwendet nur Node-Standardbibliotheken. Entwicklungsabhängigkeiten sind über `package-lock.json` reproduzierbar fixiert und werden nur für Qualitätsprüfungen benötigt.

Fehlt eine Systemabhängigkeit, erklärt der Startweg Zweck und Problem. Systemänderungen mit Root-/Admin-Rechten werden niemals versteckt ausgeführt.

## Was der Launcher bereits macht

1. Node-Version prüfen.
2. Runtime-Verzeichnisse sicher anlegen.
3. einen freien lokalen Port wählen, ohne fremde Prozesse zu beenden.
4. Backend als eigenen Child-Prozess starten.
5. `/api/health` bis zur bestätigten Readiness prüfen.
6. Browser öffnen, sofern möglich.
7. bei `SIGINT`, `SIGTERM` oder `SIGHUP` einen Checkpoint anfordern.
8. das eigene Backend kontrolliert beenden.
9. bei Hängen nach Timeout kontrolliert eskalieren.
10. PID-Datei entfernen und Prozessende verifizieren.

Ein Browser-Tab ist **nicht** Process Owner. Der Launcher besitzt und verwaltet das Backend.

## Grafische Foundation-Oberfläche

Die erste neue Oberfläche liegt in `src/ui/index.html` und zeigt aktuell bewusst nur den Foundation-Status:

- Backend bereit / nicht erreichbar
- localhost-Schutz
- aktuelle Session
- Checkpoint-Prüfung
- verständliche Gesamtampel

Die Oberfläche ist responsiv, tastaturbedienbar, besitzt sichtbare Fokuszustände, eine ARIA-Live-Region für Statusfeedback und berücksichtigt `prefers-reduced-motion`.

## Backend-Vertrag

Das lokale Backend stellt für die Foundation bereit:

- `GET /api/health` – Readiness und Session
- `GET /api/status` – verständlicher Betriebsstatus
- `POST /api/checkpoint` – kontrollierter Foundation-Checkpoint

Statische Dateien werden ausschließlich aus `src/ui/` ausgeliefert. Pfad-Traversal wird abgewehrt.

## Tests

```bash
npm ci
npm run check
```

Der Foundation-Gate umfasst:

- Lifecycle-Failure-Matrix
- Knowledge-/Learning-Memory-Integrität
- Launcher-E2E: Start → Readiness → Checkpoint → SIGTERM → Verify Closed
- JavaScript-Lint
- HTML-Strukturprüfung

Zu den gezielten Lifecycle-Fällen gehören unter anderem belegter Port, Backend-Startfehler, `SIGINT`, `SIGTERM`, stale PID, fehlende Dependency, hängendes Backend/Timeout und Schutz fremder Port-Owner.

## Lerngedächtnis

Kanonische Wissensdatei:

`knowledge/LEARNING_MEMORY.jsonl`

Regressionen:

`knowledge/REGRESSION_REGISTRY.jsonl`

Lernkette:

`Beobachtung → Ursache → Lösung → Test → Evidenz → Regel → Regression → zukünftige Prävention`

Aktive Erkenntnisse besitzen Gültigkeitsbereich, Review-/Ablaufdaten und Widerspruchserkennung. Eine einzelne Beobachtung wird niemals ungeprüft zur globalen Regel.

## Verbindliche Projektverträge

- [docs/PROJECT_MASTERPROMPT.md](docs/PROJECT_MASTERPROMPT.md) – Masterauftrag
- [docs/DEPENDENCY_AUTOPILOT.md](docs/DEPENDENCY_AUTOPILOT.md) – Dependency Autopilot
- [docs/BACKEND_LIFECYCLE.md](docs/BACKEND_LIFECYCLE.md) – Process Ownership und Shutdown
- [docs/LEARNING_MEMORY.md](docs/LEARNING_MEMORY.md) – Wissens-/Regel-Governance
- [docs/EXPERTISE_MATRIX.md](docs/EXPERTISE_MATRIX.md) – multidisziplinäre Qualitätsprüfung
- [AGENTS.md](AGENTS.md) – verbindlicher Entwicklungsmodus

## Arbeitsmodus

**Continuous Dialog Development**

`Besprechen → stabile Entscheidung → klein implementieren → automatisch prüfen → Fehler gezielt fixen → Regression ergänzen → Lerngedächtnis aktualisieren → nächster unabhängiger Schritt`

Es wird sauber unterschieden zwischen **spezifiziert**, **implementiert**, **automatisch validiert**, **manuell geprüft** und **noch offen**.

## Sicherheit und Self-Healing

Self-Healing ist nur für verstandene, begrenzte, reversible und überprüfbare Fälle zulässig.

Pflichtkette:

`BACKUP → REPAIR → VERIFY → JOURNAL`

Eigene stale PID-Dateien oder rebuildbare Laufzeitdaten dürfen kontrolliert bereinigt werden. Fremde Prozesse, unbekannte Nutzerdaten und nicht verstandene Fehler werden nicht automatisch verändert.

## Projektstatus

Der maschinenlesbare kanonische Stand liegt in [PROJECT_STATUS.json](PROJECT_STATUS.json).

## Leitregel

> **klein → nachvollziehbar → reversibel → testbar → grün → nächster Schritt**
