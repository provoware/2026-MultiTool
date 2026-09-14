# Tauri-Migration 0.3.1 – native Foundation

## 🎯 Ziel

Diese Iteration ersetzt ausschließlich die frühere produktive Node-/localhost-/Launcher-Foundation durch einen nativen Tauri-2-Programmkern.

**🔒 Keine P0-Module in dieser Iteration.**

## 🚦 Leseschlüssel

- 🟢 **BESTANDEN / BESTÄTIGT** – automatisch geprüft oder strukturell abgeschlossen.
- 🟡 **IN ARBEIT / PRÜFUNG** – umgesetzt oder gestartet, aber noch nicht vollständig bestätigt.
- 🔴 **BLOCKIERT / FEHLER** – Freigabe ist gesperrt; Ursache muss behoben werden.
- 🔵 **INFO** – wichtige technische Information ohne Fehlerstatus.
- ⚪ **OFFEN** – noch nicht begonnen oder noch nicht an der Reihe.
- 🔒 **GESPERRT** – bewusst nicht freigegeben.

> **Regel:** Ein Punkt wird erst 🟢, wenn der passende automatische Nachweis wirklich erfolgreich gelaufen ist.

## 🧭 Aktiver Produktweg

```text
HTML/CSS/JavaScript
        ↓
      Tauri 2
        ↓
       Rust
        ↓
      SQLite
```

Es gibt in dieser Foundation genau:

- 🔵 einen produktiven Programmprozess: **Tauri**,
- 🔵 einen Systemkern: **Rust**,
- 🔵 einen fachlichen lokalen Speicher: **SQLite**,
- 🔵 eine sichtbare Oberfläche: **HTML/CSS/JavaScript**.

## 🟢 Bereits strukturell umgestellt

- 🟢 Programmstatus kommt aus Rust.
- 🟢 Projektzustand liegt in SQLite.
- 🟢 Zwischenstände werden in SQLite angehängt.
- 🟢 Sicheres Beenden sichert zuerst einen Zwischenstand.
- 🟢 Die frühere IndexedDB-Projektzustandsdatei ist aus dem produktiven Weg entfernt.
- 🟢 Der frühere localhost-Server und eigene Launcher sind aus dem produktiven Weg entfernt.
- 🟢 Alte Lifecycle-Nachweise bleiben als historische Dokumentation erhalten, aber nicht als aktive Architektur.
- 🟢 Linux-Systemabhängigkeiten für Tauri werden zentral über `scripts/ci/install-tauri-linux-deps.sh` verwaltet.

## 🧪 Prüftrennung

### SCHNELL

Prüft den kleinen, frühen Pflichtumfang:

- Governance-Vertrag,
- HTML und JavaScript,
- Wissens- und Regressionskonsistenz,
- vorhandenes `Cargo.lock`,
- Linux-Tauri-Voraussetzungen im Modus `core`,
- Rust-Formatierung,
- `cargo check --locked`,
- Clippy mit `-D warnings`.

**🔴 Regel:** Wenn SCHNELL rot ist, startet TIEF nicht.

### TIEF

Prüft zusätzlich:

- Firefox- und Chrome-Darstellung,
- 100–200-%-Skalierung,
- Kontrast und reduzierte Bewegung,
- sicheren Browserzustand ohne nativen Programmkern,
- Linux-Tauri-Voraussetzungen im Modus `e2e`,
- Rust-Tests,
- echten Tauri-Start über `tauri-driver`,
- SQLite-Persistenz über einen Neustart,
- Zwischenstand,
- sicheres Beenden.

**🔴 Regel:** TIEF darf erst nach vollständig grünem SCHNELL laufen.

### FREIGABE

Bleibt von Paketbau und Veröffentlichung getrennt.

**🔒 Regel:** Diese Foundation wird erst freigabefähig, wenn **SCHNELL und TIEF für denselben Kandidaten 🟢** sind.

## 📦 Abhängigkeiten

### Produktiv neu

- Tauri 2,
- Serde,
- rusqlite mit eingebettetem SQLite.

### Bewusst nicht eingeführt

- React,
- Vue,
- Svelte,
- zusätzliches JavaScript-Zustandsframework,
- zusätzlicher lokaler Webserver,
- zweite Datenbank,
- zusätzliches Ende-zu-Ende-Testframework.

## 🛡️ Schutzregeln

1. 🟢 Keine zweite aktive Backendarchitektur.
2. 🟢 Keine zweite kanonische Speicherung des Projektzustands.
3. 🟢 Datenbankzugriffe erhalten eine begrenzte Wartezeit.
4. 🟢 Beenden darf erst nach bestätigtem Zwischenstand erfolgen.
5. 🟢 Browserbetrieb ohne Tauri bleibt sicher gesperrt und verändert keine Projektdaten.
6. 🟢 Alte Regressionen werden nicht gelöscht, sondern bei entfernter Architektur als zurückgezogen gekennzeichnet.
7. 🔒 Keine P0-Funktion vor grüner nativer Foundation.

## 🔧 Linux-Abhängigkeiten – eine Quelle statt Doppelpflege

Die Pipeline pflegt keine getrennten Paketlisten mehr.

```text
scripts/ci/install-tauri-linux-deps.sh core
    └─ SCHNELL: Kompilier- und Lint-Voraussetzungen

scripts/ci/install-tauri-linux-deps.sh e2e
    └─ TIEF: core + WebKitWebDriver + Xvfb
```

Das Skript installiert nicht nur Pakete, sondern validiert anschließend auch die tatsächlich benötigten Werkzeuge und Bibliotheken.

## 📋 Nachweisstatus

Der **aktuelle Laufstatus** steht zusätzlich in `docs/STATUS_0.3.1.md`.

Dieser Migrationsvertrag beschreibt Architektur, Schutzregeln und Prüfkette. Ein technischer Punkt darf in Statusdateien erst dann als **🟢 automatisch bestätigt** markiert werden, wenn der zugehörige GitHub-Actions-Lauf erfolgreich beendet wurde.
