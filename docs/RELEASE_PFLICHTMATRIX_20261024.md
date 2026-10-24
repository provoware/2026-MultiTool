# Release-Pflichtmatrix · 2026-MultiTool · 24.10.2026

**Projekt:** provoware/2026-MultiTool · **Ausgangs-HEAD:** `32cb69fc4e23b2f20c89d817ed589d05c7aaaf0b` (`main`) · **Arbeitszweig:** `feature/p05b-workspace-persistence-20261024` · **PR:** nach Erstellung.
**Regel:** PASS nur für nachweislich ausgeführte Prüfungen am jeweiligen Commit; frühere Erfolge sind keine Freigabe für den neuen HEAD.

| Pflichtbereich | Soll | Ist / Evidenz | Status |
| --- | --- | --- | --- |
| Fachfunktionen und Grenzfälle | Sämtliche zugesagten Module samt Grenzfällen | Foundation, Status, Speicher und Songeditor vorhanden; Gesamtumfang offen | PARTIAL |
| Datensicherheit | Sichere, lokale Datenhaltung ohne stille Verluste | SQLite-Projektzustand; P0.5b ergänzt transaktionale Sichtbarkeitswerte | TEST AUSSTEHEND |
| Wiederherstellung | Neustart und Rücksetzung ohne Datenverlust | P0.5b-Neustart-/Reset-Tests ergänzt | TEST AUSSTEHEND |
| Fehlerbehandlung | Lesefehler und fehlender nativer Kern verständlich | Sitzungslokaler Fallback, Statusmeldung, Mutationssperre | TEST AUSSTEHEND |
| Sicherheit | Nur erlaubte Schlüssel, keine versteckten Systemzugriffe | SQLite-CHECK und feste Kennungsliste; Action-Pinning in separatem PR #40 | PARTIAL |
| Design / Lesbarkeit | Klare Zustände und verständliche Bedienung | Bestehende Beschriftungen und Statushinweise | PARTIAL |
| Kleine Fenster / hohe Skalierung | 800 × 600, 100–200 % ohne Abschneiden | Bestehende Browsermatrix; neuer Stand erneut prüfen | TEST AUSSTEHEND |
| Tastatur / Barrierefreiheit | Fokus, Kontrast, Screenreader, alternative Bedienung | Fokus- und Browserprüfungen ergänzt | TEST AUSSTEHEND |
| Leistung | Auch bei größeren Datenbeständen schnell | Keine aktuelle Gesamtlastmessung | OPEN |
| Wartbarkeit | Ein Datenhalter, kleine Änderungen | SQLite einzige dauerhafte Quelle für Sichtbarkeit, kein localStorage | TEST AUSSTEHEND |
| Installation / Paketierung | Offline reproduzierbar und nutzerfreundlich | Tauri-/Cargo-Sperrbestand; frischer Pakettest fehlt | OPEN |
| Automatisierte Funktionstests | Grenzfälle und Regression | JS-Vertrag und Rust-Unit-Tests erweitert | TEST AUSSTEHEND |
| Integration | JS → Tauri → SQLite → Neustart | Nativer E2E-Neustart-/Reset-Test ergänzt | TEST AUSSTEHEND |
| GUI / Browser | Firefox, Chromium, echte Tauri-App | Browsermatrix und Fokusprüfung vorgesehen | TEST AUSSTEHEND |
| Regression / CI | SCHNELL und TIEF vollständig grün | Neuer HEAD benötigt beide GitHub-Gates | BLOCKED BIS PASS |
| Dokumentation | Tatsächliche Funktionen und Grenzen erklärt | P0.5b-Vertrag und diese Matrix | PARTIAL |
| Release-Vorbereitung | Fertiges, eingefrorenes, geprüftes Paket | Keine Freigabe, keine Nutzerabnahme, kein Release | OPEN |

## Verbindliche Nachweise und Folgearbeit

- **Änderung:** P0.5b aus administrativ geschlossenem PR #36 auf aktuellem `main` neu angewendet; Songtext-Editor und bestehende Tests erhalten.
- **Referenz:** Issue #39 und PR #36 sind Quellbelege, kein aktueller Testnachweis.
- **Prüfung:** GitHub-SCHNELL/TIEF am neuen Commit auswerten; fehlgeschlagene Gates reparieren.
- **Blocker:** FREIGABE und persönliche Kubuntu-/Sicht-Endabnahme bleiben bis zur vollständigen Projekt-Reife gesperrt.
- **Nächster Schritt:** P0.5b-Gates abschließen, dann weitere offene Fach- und Recovery-Pflichten priorisieren.
