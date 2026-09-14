# Tauri-Migration 0.3.1 – native Foundation

## Ziel

Diese Iteration ersetzt ausschließlich die frühere produktive Node-/localhost-/Launcher-Foundation durch einen nativen Tauri-2-Programmkern.

Es werden **keine P0-Module** ergänzt.

## Aktiver Produktweg

`HTML/CSS/JavaScript → Tauri-Aufruf → Rust → SQLite`

Es gibt in dieser Foundation genau:

- einen produktiven Programmprozess: Tauri,
- einen Systemkern: Rust,
- einen fachlichen lokalen Speicher: SQLite,
- eine sichtbare HTML-Oberfläche.

## Bereits umgestellt

- Programmstatus kommt aus Rust.
- Projektzustand liegt in SQLite.
- Zwischenstände werden in SQLite angehängt.
- Sicheres Beenden sichert zuerst einen Zwischenstand.
- Die frühere IndexedDB-Projektzustandsdatei ist aus dem produktiven Weg entfernt.
- Der frühere localhost-Server und eigene Launcher sind aus dem produktiven Weg entfernt.
- Alte Lifecycle-Nachweise bleiben nur als historische Dokumentation erhalten.

## Prüftrennung

### SCHNELL

Prüft:

- Governance-Vertrag,
- HTML und JavaScript,
- Wissens- und Regressionskonsistenz,
- Rust-Formatierung,
- `cargo check --locked`,
- Clippy ohne zugelassene Warnungen.

### TIEF

Prüft zusätzlich:

- Firefox- und Chrome-Darstellung,
- 100–200-%-Skalierung,
- Kontrast und reduzierte Bewegung,
- sicheren Browserzustand ohne nativen Programmkern,
- Rust-Tests,
- echten Tauri-Start über `tauri-driver`,
- SQLite-Persistenz über einen Neustart,
- Zwischenstand,
- sicheres Beenden.

### FREIGABE

Bleibt von Paketbau und Veröffentlichung getrennt. Diese Iteration wird erst als Fundament übernommen, wenn SCHNELL und TIEF für denselben Kandidaten grün sind.

## Abhängigkeiten

Produktiv neu:

- Tauri 2,
- Serde,
- rusqlite mit eingebettetem SQLite.

Bewusst nicht eingeführt:

- React,
- Vue,
- Svelte,
- zusätzliches JavaScript-Zustandsframework,
- zusätzlicher lokaler Webserver,
- zweite Datenbank,
- zusätzliches Ende-zu-Ende-Testframework.

## Schutzregeln

1. Keine zweite aktive Backendarchitektur.
2. Keine zweite kanonische Speicherung des Projektzustands.
3. Datenbankzugriffe erhalten eine begrenzte Wartezeit.
4. Beenden darf erst nach bestätigtem Zwischenstand erfolgen.
5. Browserbetrieb ohne Tauri bleibt sicher gesperrt und verändert keine Projektdaten.
6. Alte Regressionen werden nicht gelöscht, aber als zurückgezogen gekennzeichnet, wenn ihre Architektur entfernt wurde.
7. Keine P0-Funktion vor grüner nativer Foundation.

## Aktueller Nachweisstatus

Der Text beschreibt den Soll- und Implementierungsstand. Als **automatisch geprüft** gilt ein Punkt erst nach einem tatsächlich grünen GitHub-Actions-Lauf der dazugehörigen Stufe.
