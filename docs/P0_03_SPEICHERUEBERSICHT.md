# P0.3 – Speicherübersicht

## 🎯 Ziel

Die Speicherübersicht zeigt **nur echte, aktuell eingehängte lokale Datenträger** mit wenigen verständlichen Angaben:

- Name,
- Einhängeort,
- Gesamtgröße,
- freier Speicher.

Dieser Slice ist strikt **nur lesend**. Es wird nichts bereinigt, verschoben, gelöscht oder optimiert.

## 🎨 Statussprache

- 🟢 **Bestanden / bereit** – automatisch geprüft oder wirklich verfügbar.
- 🟡 **In Prüfung / Aufmerksamkeit nötig** – umgesetzt, aber noch nicht vollständig bestätigt oder einzelne Daten konnten nicht gelesen werden.
- 🔴 **Fehler / blockiert** – die nächste Prüfstufe bleibt gesperrt.
- 🔵 **Info** – wichtiger Hinweis ohne Fehlerstatus.
- ⚪ **Offen** – noch nicht begonnen.
- 🔒 **Gesperrt** – bewusst noch nicht freigegeben.

> Grün gibt es nur nach einem echten automatischen Nachweis.

## 🧭 Aktiver Weg

```text
Linux-Mounttabelle /proc/self/mountinfo
        ↓
Rust liest nur relevante lokale Datenträger
        ↓
Linux statvfs liest Gesamt + frei
        ↓
Tauri-Befehl list_storage_volumes
        ↓
HTML zeigt ruhige Datenträgerkarten
```

## 🛡️ Risiko

**Gesamtrisiko: 🟢 NIEDRIG**

Begründung:

- nur lesende Linux-Abfragen,
- keine Dateiveränderung,
- keine Datenbankänderung,
- keine Prozesssteuerung,
- kein Shell-Aufruf,
- kein Netzwerk,
- keine neue Tauri-Berechtigung,
- keine neue Speicherung.

### Schutzregeln

1. 🔒 Nur lokale Datenträger bzw. der tatsächlich verwendete Systemdatenträger werden angezeigt.
2. 🔒 Pseudo-Dateisysteme wie `/proc`, `/sys`, `/dev`, temporäre Laufzeit-Dateisysteme und AppImage-/Container-Sondermounts werden nicht als normale Nutzerdatenträger dargestellt.
3. 🔒 Ein nicht lesbarer Mount wird übersprungen oder verständlich gemeldet; er darf den Programmstart nicht blockieren.
4. 🔒 Keine Ampel nach freiem Speicher in diesem Slice.
5. 🔒 Keine Bereinigung, kein Verschieben, kein Löschen, kein Aushängen und keine Speicheroptimierung.
6. 🔒 Keine zweite Datenträgerliste in HTML, JSON oder SQLite.
7. 🔒 P0.4 bzw. die Speicherplatz-Ampel wird erst nach SCHNELL + TIEF für P0.3 begonnen.

## ✂️ Codesparsame Architektur

P0.3 erhält genau ein kleines Rust-Modul `storage_overview.rs`.

Es verwendet:

- Rust-Standardbibliothek zum Lesen von `/proc/self/mountinfo`,
- `libc::statvfs` für Gesamt- und freien Speicher.

`libc` befindet sich bereits indirekt im vorhandenen Cargo-Abhängigkeitsbaum. Es wird lediglich als direkte Abhängigkeit deklariert, damit die Systemabfrage sauber und ohne Shell-Befehl erfolgt.

Nicht verwendet werden:

- `df`,
- `lsblk`,
- Shell-Skripte,
- `sysinfo`,
- zweite Hintergrunddienste,
- periodisches Dauerabfragen.

Die Datenträger werden nur beim normalen Statusladen bzw. bei „Status neu prüfen“ erneut gelesen.

## 👤 Einfache Nutzersprache

Die Oberfläche verwendet:

- **Datenträger** statt „Filesystem“,
- **Einhängeort** statt „Mount Point“,
- **Gesamt** statt „Capacity“,
- **Frei** statt „Available Bytes“.

Technische Gerätenamen dürfen nur ergänzend intern verwendet werden. Für die sichtbare Bezeichnung wird bevorzugt der verständliche Name des Einhängeorts verwendet. `/` wird als **Systemdatenträger** bezeichnet.

## 🤖 Agentenvertrag

Für diesen Slice sind vorgesehen:

- 🔵 **Auftrags-Lotse** – klassifiziert Rust + Linux-Dateisystem + Oberfläche + Test.
- 🔵 **Architektur-Prüfer** – verhindert zweiten Speicherpfad und unnötige Bibliotheken.
- 🔵 **Umsetzungs-Planer** – hält P0.3 strikt auf Rohdaten begrenzt.
- 🔵 **Systemkern-Umsetzer** – implementiert ausschließlich lesende Datenträgererkennung.
- 🔵 **Oberflächen-Umsetzer** – zeigt Name, Einhängeort, Gesamt und Frei.
- 🔵 **Test-Agent** – prüft Parser, Größenwerte und Oberfläche unabhängig.
- 🔵 **Testdaten-Bauer** – nutzt synthetische Mounttabellen für Parser-Grenzfälle; keine riesigen Dateien nötig.
- 🔵 **Fehlerfall-Prüfer** – prüft ungültige Zeilen, Sonderzeichen und nicht lesbare Mounts.
- 🔵 **Laien-Sprachprüfer** – verhindert englische oder unnötig technische sichtbare Begriffe.
- 🔵 **Barrierefreiheits-Prüfer** – prüft ruhige Liste, Tastatur und 100–200 % Skalierung über die bestehende Oberfläche.
- 🔵 **Komplexitäts-Prüfer** – blockiert Shell- oder Mehrfachlösungen.

## 🧪 Pflichtprüfungen

### SCHNELL

- ⚪ Governance und Wissensverträge,
- ⚪ HTML/JavaScript,
- ⚪ npm-Audit,
- ⚪ Cargo.lock konsistent,
- ⚪ rustfmt,
- ⚪ cargo check --locked,
- ⚪ Clippy mit `-D warnings`,
- ⚪ Rust-Tests für Mount-Parser,
- ⚪ Rust-Tests für Filterung von Pseudo-Dateisystemen,
- ⚪ Rust-Tests für verständliche Namen,
- ⚪ keine Schreibfunktion im Datenträger-Modul.

### TIEF

- ⚪ vollständige bisherige Browser-/Vertragsregression,
- ⚪ Rust-Integrationstests,
- ⚪ echte Tauri-Anwendung startet,
- ⚪ Speicherübersicht ist sichtbar,
- ⚪ mindestens der aktive Systemdatenträger wird auf normalem Linux erkannt,
- ⚪ Name und Einhängeort sind befüllt,
- ⚪ Gesamtgröße > 0,
- ⚪ freier Speicher <= Gesamtgröße,
- ⚪ Werkzeug-Zentrale und Systemstatus bleiben korrekt,
- ⚪ SQLite-Persistenz, Zwischenstand und sicheres Beenden bleiben intakt.

## 📦 Abhängigkeiten

Neu **direkt** deklariert:

- `libc = "0.2"` – nur für die vorhandene Linux-Systemfunktion `statvfs`.

Wichtig: `libc` ist bereits als indirekte Abhängigkeit im bestehenden Sperrbestand vorhanden. Es wird kein großes Systeminformations-Framework eingeführt.

## ✅ Fertig-Bedingung

P0.3 gilt erst als **🟢 bestätigt**, wenn SCHNELL und TIEF für denselben unveränderten Kandidaten grün sind.

Erst danach darf eine getrennte Speicherplatz-Ampel entwickelt werden.
