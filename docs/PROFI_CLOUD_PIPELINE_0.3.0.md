# PROVOWARE – PROFI-Governance-Basis 0.3.0

## 1. Verbesserter Arbeitsauftrag

> Friere den aktuellen Repository-Stand als PROFI-Governance-Basis 0.3.0 mit unveraenderlicher Baseline und maschinenlesbarem Vertrag ein. Implementiere ausschliesslich die Cloud-Pipeline **SCHNELL → TIEF → FREIGABE**. SCHNELL muss kleine Aenderungen schnell und deterministisch pruefen. TIEF muss Integration, Browser/GUI, Daten- und Fehlerpfade und – sobald vorhanden – Rust/Tauri pruefen. FREIGABE darf nur den exakt zuvor geprueften Kandidaten akzeptieren und muss bei fehlendem Tauri-Build ehrlich blockieren. Keine P0-Module implementieren. Keine lokale Nutzerpruefung voraussetzen. Keine zweite Architektur, keine unnoetigen Abhaengigkeiten und keine scheinbar gruenen Platzhalter. Jeder Checkpoint liefert eine maschinenlesbare Evidence und eine laienverstaendliche Ausgabe.

## 2. Warum diese Fassung besser ist

Die alte Formulierung nannte das Ziel, liess aber mehrere kritische Fragen offen: Was bedeutet „eingefroren“? Wann darf die naechste Stufe laufen? Was passiert, solange Tauri noch nicht im Repository liegt? Welche Beweise muessen vorliegen? Darf ein Release nach dem Test neu gebaut werden?

Die neue Fassung beantwortet diese Punkte verbindlich. Sie trennt ausserdem **Governance-Version** und **Produktversion**. Governance 0.3.0 bedeutet nicht, dass die Anwendung bereits Produktversion 0.3.0 oder releasebereit ist.

## 3. Aktuelle Baseline

- Repository: `provoware/2026-MultiTool`
- Eingefrorener Ausgangscommit: `6a57590c533a5e1094d78550041ece5eb79c8570`
- Produktreife: Foundation
- Governance-Basis: 0.3.0
- Tauri im aktuellen GitHub-Stand: noch nicht vorhanden
- P0-Module: bis zur gruenen Pipeline gesperrt

Die maschinenlesbare Baseline liegt in `governance/BASELINE_0.3.0.json`.
Der Freigabevertrag liegt in `governance/RELEASE_CONTRACT.json`.

## 4. Drei Pruefstufen

### SCHNELL

Zweck: Fehler innerhalb weniger Minuten finden, ohne jedes Mal die teuerste Pruefung zu starten.

Prueft derzeit:

1. gesperrte Node-Abhaengigkeiten,
2. bekannte Paketrisiken,
3. Governance-Vertrag,
4. JavaScript,
5. HTML,
6. Wissens-/Regressionsstruktur,
7. Projektzustandsvertrag.

Sobald `src-tauri/Cargo.toml` vorhanden ist, kommen automatisch hinzu:

- Rust-Formatpruefung,
- `cargo check --locked`,
- Clippy mit Warnungen als Fehler.

### TIEF

Zweck: den kompletten derzeitigen Foundation-Nutzerweg pruefen.

Die Stufe darf erst nach SCHNELL laufen und fuehrt aus:

1. die komplette Foundation-Testkette,
2. Lifecycle-/Fehlerfalltests,
3. Browser-Akzeptanz,
4. Projektzustandspruefung.

Sobald Tauri im Repository vorhanden ist, werden zusaetzlich zwingend:

- Linux-Tauri-Systemabhaengigkeiten,
- `cargo test --locked --all-targets`,
- echte native Tauri-E2E-Tests unter `tests/tauri-e2e/`.

Ist Tauri vorhanden, aber der native E2E-Bereich fehlt, wird **TIEF rot**. Damit kann die Migration nicht unbemerkt nur mit Browsertests weiterlaufen.

### FREIGABE

Zweck: Nur einen wirklich paketierbaren Tauri-Kandidaten weiterlassen.

FREIGABE wird absichtlich nur manuell gestartet. Sie setzt TIEF voraus.

Solange Tauri noch nicht im Repository liegt, endet sie klar mit:

`FREIGABE BLOCKIERT – Tauri-Quellstand fehlt.`

Das ist ein Schutzmechanismus und kein Fehler der Pipeline.

Nach Einfuehrung des Tauri-Quellstands wird diese Stufe in der naechsten Pipeline-Iteration um folgende reale Release-Schritte erweitert:

1. Kandidaten-SHA einfrieren,
2. genau einmal bauen,
3. `.deb` und AppImage erzeugen,
4. Pakete an einen frischen Runner uebergeben,
5. exakt diese Pakete installieren/starten,
6. Smoke-/E2E-Pruefung,
7. SHA-256 und Release-Manifest,
8. Abhaengigkeitsinventar/SBOM,
9. bekannte Grenzen,
10. Promotion exakt derselben getesteten Dateien.

## 5. Daten- und Artefaktregeln

Nicht dauerhaft uebertragen werden:

- `node_modules/`,
- Rust-`target/`,
- Browserprofile,
- WebView-Caches,
- grosse erzeugte Testdaten,
- lokale SQLite-Dateien,
- normale gruen verlaufene Testlogs,
- normale Screenshots,
- temporaere Buildverzeichnisse.

Bei Fehlern duerfen kleine Diagnosepakete fuer wenige Tage gespeichert werden.
Bei einem Release werden nur die fuer Nachweis und Nutzung notwendigen Releaseartefakte dauerhaft aufbewahrt.

## 6. Fail-Closed-Regel

Unklarheit fuehrt nicht zu einer stillen Freigabe.

- unbekannter Zustand → blockieren,
- fehlender notwendiger Test → blockieren,
- Tauri vorhanden, aber kein natives E2E → blockieren,
- Tauri fehlt → Release blockieren,
- rotes Pflichtgate → keine Freigabe.

## 7. Codesparsamkeit

Die Pipeline fuehrt keine neue Laufzeitbibliothek in die Anwendung ein. Die Governance-Pruefer verwenden Node-Standardmittel. Vorhandene Foundation-Tests werden weiterverwendet statt dupliziert.

Die Logik lautet:

`vorhandenen Test nutzen → kleinen Vertrag ergaenzen → nur fehlende Pruefung neu bauen`

Nicht:

`fuer jede Stufe ein zweites Testsystem erfinden`.

## 8. P0-Sperre

Bis SCHNELL und TIEF stabil gruen sind und die FREIGABE-Struktur nachweisbar korrekt blockiert bzw. spaeter paketiert, werden nicht implementiert:

1. Werkzeug-Zentrale,
2. Systemstatus,
3. Speicheruebersicht,
4. flexible Arbeitsflaeche,
5. Hilfe-Zentrale.

Danach wird jedes Modul einzeln aufgenommen:

`Modulvertrag → Risiko → kleinster Slice → SCHNELL → TIEF → Regression → naechstes Modul`.

## 9. Checkpoints

### CP-0 Baseline

BESTANDEN, wenn Baseline-Commit, Governance-Version und Sperrregeln maschinenlesbar sind.

### CP-1 SCHNELL

BESTANDEN, wenn der aktuelle Kandidat ohne relevante Lint-, Vertrags- oder Kernfehler ist.

### CP-2 TIEF

BESTANDEN, wenn Integration und Bedienweg erfolgreich sind. Bei vorhandenem Tauri sind native Tauri-Tests Pflicht.

### CP-3 FREIGABE-VORPRUEFUNG

Der aktuelle Foundation-Stand muss hier **bewusst blockieren**, weil der Tauri-Quellstand noch fehlt. Erst nach der realen Tauri-Migration darf dieses Gate gruen werden.

### CP-4 RELEASE

Noch nicht Teil dieser Foundation-Iteration. Er wird erst umgesetzt, wenn ein realer Tauri-Kandidat existiert, damit kein toter oder vorgetaeuschter Releasecode entsteht.

## 10. Naechster Schritt nach erfolgreicher Pipeline-Basis

Nicht sofort P0 bauen. Zuerst den Tauri-Quellstand als kleinen, eigenstaendigen Migrationsslice in das Repository uebernehmen und damit SCHNELL/TIEF von „bedingt“ auf „vollstaendig verpflichtend“ umschalten. Danach den echten Paket-/Frischpaket-Teil von FREIGABE implementieren.
