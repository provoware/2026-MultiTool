# Tauri-Migration 0.3.1 – native Foundation

## 🎯 Ziel

Diese Iteration ersetzt ausschließlich die frühere produktive Node-/localhost-/Launcher-Foundation durch einen nativen Tauri-2-Programmkern.

**🔒 Keine P0-Module in dieser Iteration.**

## 🚦 Nachweisstand

```text
Architektur / Migration      🟢 ██████████ umgesetzt
SCHNELL                      🟢 ██████████ automatisch bestanden
TIEF                         🟢 ██████████ automatisch bestanden
FREIGABE-VORPRÜFUNG          🔒 noch eigener nächster Schritt
P0-Module                    🔒 nicht Bestandteil von 0.3.1
```

**🟢 Die native Foundation hat SCHNELL und TIEF für denselben Implementierungskandidaten erfolgreich bestanden.** Grün ist dabei eine notwendige Qualitätsbedingung, aber **keine automatische Freigabe für P0**. Erst Freigabe-Vorprüfung, Abschluss/Frieren und Übernahme dieser Foundation trennen 0.3.1 sauber vom nächsten Funktions-Slice.

## 🎨 Leseschlüssel

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
- 🟢 Linux-Systemabhängigkeiten für Tauri werden zentral über `scripts/ci/install-tauri-linux-deps.sh` verwaltet und nach Installation validiert.

## 🧪 Prüftrennung

### SCHNELL 🟢

Automatisch bestätigt:

- 🟢 Governance-Vertrag,
- 🟢 HTML und JavaScript,
- 🟢 Wissens- und Regressionskonsistenz,
- 🟢 vorhandenes `Cargo.lock`,
- 🟢 Linux-Tauri-Voraussetzungen im Modus `core`,
- 🟢 Rust-Formatierung,
- 🟢 `cargo check --locked`,
- 🟢 Clippy mit `-D warnings`.

**🔴 Schutzregel bleibt aktiv:** Wenn SCHNELL rot ist, startet TIEF nicht.

### TIEF 🟢

Automatisch bestätigt:

- 🟢 vollständige Web- und Vertragsprüfung,
- 🟢 Browser-/Darstellungsprüfungen,
- 🟢 100–200-%-Skalierung,
- 🟢 sicheren Browserzustand ohne nativen Programmkern,
- 🟢 Linux-Tauri-Voraussetzungen im Modus `e2e`,
- 🟢 Rust-Integrationstests,
- 🟢 echten Tauri-Start über `tauri-driver`,
- 🟢 SQLite-Persistenz über einen Neustart,
- 🟢 Zwischenstand,
- 🟢 sicheres Beenden.

### FREIGABE 🔒

Bleibt von SCHNELL/TIEF sowie Paketbau und Veröffentlichung getrennt.

SCHNELL und TIEF sind jetzt die **erfüllten Eingangsvoraussetzungen**. Die Freigabe-Vorprüfung wird als eigener nächster Gate-Schritt ausgeführt, bevor die Foundation eingefroren oder nach `main` übernommen wird.

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
7. 🔒 Keine P0-Funktion innerhalb dieses 0.3.1-Slices.
8. 🔒 P0 bleibt bis Freigabe-Vorprüfung, Abschluss/Frieren und sauberer Trennung in einen neuen Slice gesperrt.
9. 🔴 Kein Test darf abgeschwächt werden, nur um einen grünen Status zu erzeugen.

## 🔧 Linux-Abhängigkeiten – eine Quelle statt Doppelpflege

Die Pipeline pflegt keine getrennten Paketlisten mehr.

```text
scripts/ci/install-tauri-linux-deps.sh core
    └─ SCHNELL: Kompilier- und Lint-Voraussetzungen

scripts/ci/install-tauri-linux-deps.sh e2e
    └─ TIEF: core + WebKitWebDriver + Xvfb
```

Das Skript installiert nicht nur Pakete, sondern validiert anschließend auch die tatsächlich benötigten Werkzeuge und Bibliotheken.

## 📋 Statusdatei

Der kompakte, laienlesbare Ampelstand steht in `docs/STATUS_0.3.1.md`.

Die Dokumentation verwendet bewusst dieselbe Statussprache wie die Pipeline: **🟢 bestätigt · 🟡 in Prüfung · 🔴 blockiert · 🔵 Info · ⚪ offen · 🔒 gesperrt**. So bedeuten Farben im Chat, in der CI und in den Info-Dateien dasselbe.
