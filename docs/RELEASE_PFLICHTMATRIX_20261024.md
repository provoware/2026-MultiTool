# Release-Pflichtmatrix · 2026-MultiTool · 24.10.2026

**Projekt:** provoware/2026-MultiTool · **Ausgangs-HEAD:** `32cb69fc4e23b2f20c89d817ed589d05c7aaaf0b` (`main`) · **Arbeitszweig:** `feature/p05b-workspace-persistence-20261024` · **PR:** [#41](https://github.com/provoware/2026-MultiTool/pull/41). **Geprüfter Code-HEAD:** `cc7d09a375ce0b8e7f309d902ecae8bafea54fb8`.
**Regel:** PASS nur für nachweislich ausgeführte Prüfungen am jeweiligen Commit; frühere Erfolge sind keine Freigabe für den neuen HEAD.

| Pflichtbereich | Soll | Ist / Evidenz | Status |
| --- | --- | --- | --- |
| Fachfunktionen und Grenzfälle | Sämtliche zugesagten Module samt Grenzfällen | Foundation, Status, Speicher und Songeditor vorhanden; Gesamtumfang offen | PARTIAL |
| Datensicherheit | Sichere, lokale Datenhaltung ohne stille Verluste | SQLite-Projektzustand; P0.5b ergänzt transaktionale Sichtbarkeitswerte | PASS (P0.5b-Scope) |
| Wiederherstellung | Neustart und Rücksetzung ohne Datenverlust | P0.5b-Neustart-/Reset-Tests ergänzt | PASS (P0.5b-Scope) |
| Fehlerbehandlung | Lesefehler und fehlender nativer Kern verständlich | Sitzungslokaler Fallback, Statusmeldung, Mutationssperre | PASS (P0.5b-Scope) |
| Sicherheit | Nur erlaubte Schlüssel, keine versteckten Systemzugriffe | SQLite-CHECK und feste Kennungsliste; Action-Pinning in separatem PR #40 | PARTIAL |
| Design / Lesbarkeit | Klare Zustände und verständliche Bedienung | Bestehende Beschriftungen und Statushinweise | PARTIAL |
| Kleine Fenster / hohe Skalierung | 800 × 600, 100–200 % ohne Abschneiden | Bestehende Browsermatrix; neuer Stand erneut prüfen | PASS (P0.5b-Scope) |
| Tastatur / Barrierefreiheit | Fokus, Kontrast, Screenreader, alternative Bedienung | Fokus- und Browserprüfungen ergänzt | PASS (P0.5b-Scope) |
| Leistung | Auch bei größeren Datenbeständen schnell | Keine aktuelle Gesamtlastmessung | OPEN |
| Wartbarkeit | Ein Datenhalter, kleine Änderungen | SQLite einzige dauerhafte Quelle für Sichtbarkeit, kein localStorage | PARTIAL |
| Installation / Paketierung | Offline reproduzierbar und nutzerfreundlich | Tauri-/Cargo-Sperrbestand; frischer Pakettest fehlt | OPEN |
| Automatisierte Funktionstests | Grenzfälle und Regression | JS-Vertrag und Rust-Unit-Tests erweitert | PASS (P0.5b-Scope) |
| Integration | JS → Tauri → SQLite → Neustart | Nativer E2E-Neustart-/Reset-Test ergänzt | PASS (P0.5b-Scope) |
| GUI / Browser | Firefox, Chromium, echte Tauri-App | Browsermatrix und Fokusprüfung vorgesehen | PASS (P0.5b-Scope) |
| Regression / CI | SCHNELL und TIEF vollständig grün | Neuer HEAD benötigt beide GitHub-Gates | PASS (SCHNELL + TIEF) |
| Dokumentation | Tatsächliche Funktionen und Grenzen erklärt | P0.5b-Vertrag und diese Matrix | PARTIAL |
| Release-Vorbereitung | Fertiges, eingefrorenes, geprüftes Paket | Keine Freigabe, keine Nutzerabnahme, kein Release | OPEN |

## Verbindliche Nachweise und Folgearbeit

- **Änderung:** P0.5b aus administrativ geschlossenem PR #36 auf aktuellem `main` neu angewendet; Songtext-Editor und bestehende Tests erhalten.
- **Referenz:** Issue #39 und PR #36 sind Quellbelege, kein aktueller Testnachweis.
- **Prüfung (24.10.2026, Code-HEAD `cc7d09a`):** GitHub-Push-Lauf [#40047226252](https://github.com/provoware/2026-MultiTool/actions/runs/40047226252) und PR-Lauf [#40047237782](https://github.com/provoware/2026-MultiTool/actions/runs/40047237782): jeweils **SCHNELL PASS**, **TIEF PASS**, **FREIGABE SKIPPED** (nur auf gesonderte Freigabe-Prüfung). Browser-/Fokustests, Rust-Unit-/Integration und native Tauri-E2E sind Teil dieser grünen Pflichtkette. Ein grüner PR-Lauf ist keine vollständige Projekt- oder Release-Freigabe.
- **Blocker:** FREIGABE und persönliche Kubuntu-/Sicht-Endabnahme bleiben bis zur vollständigen Projekt-Reife gesperrt.
- **Nächster Schritt:** PR #41 anhand der vollständigen Gates für kontrollierte Integration bewerten; anschließend weitere offene Fach- und Recovery-Pflichten priorisieren.
- **Dokumentations-Commit:** Nachtrag der Prüfnachweise verändert keine Produktdatei; die GitHub-Gates für den neuen Dokumentations-HEAD müssen gesondert bewertet werden.
