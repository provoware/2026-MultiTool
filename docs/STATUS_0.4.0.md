# PROVOWARE MultiTool – Status 0.4.0

## 🚦 Gesamtstand

**🟢 P0.3 Speicherübersicht ist umgesetzt und durch SCHNELL + TIEF einschließlich nativer Tauri-Prüfung bestätigt.**

```text
Stabile Tauri-Foundation      🟢 ██████████ 100 % übernommen
P0.1 Werkzeug-Zentrale        🟢 ██████████ bestätigt und übernommen
P0.2 Systemstatus             🟢 ██████████ bestätigt und übernommen
P0.3 Speicherübersicht        🟢 ██████████ umgesetzt und geprüft
SCHNELL für P0.3              🟢 bestanden
TIEF für P0.3                 🟢 bestanden
Native Tauri-Prüfung          🟢 bestanden
Speicherplatz-Ampel           🔒 eigener späterer Slice
```

## 🎨 Bedeutung

- 🟢 **Bestanden / bestätigt** – automatischer Nachweis liegt vor.
- 🟡 **In Prüfung** – umgesetzt, aber noch nicht vollständig bestätigt.
- 🔴 **Fehler / blockiert** – nächste Stufe darf nicht weiterlaufen.
- 🔵 **Info** – wichtiger Hinweis ohne Fehlerstatus.
- ⚪ **Offen** – noch nicht begonnen oder noch nicht bestätigt.
- 🔒 **Gesperrt** – bewusst erst nach dem vorgesehenen Gate freigeben.

> **Ampelregel:** Grün gibt es nur nach einem wirklich erfolgreichen automatischen Lauf.

## 🟢 Was P0.3 enthält

- 🟢 lesende Erkennung eingehängter lokaler Datenträger unter Linux,
- 🟢 verständlicher Name pro Datenträger,
- 🟢 Einhängeort,
- 🟢 Gesamtgröße,
- 🟢 freier Speicher,
- 🟢 Filter gegen Pseudo-, Netzwerk- und typische AppImage-Sondermounts,
- 🟢 direkte Linux-Abfrage über `statvfs` statt Shell-Befehl,
- 🟢 Speicherübersicht als Nur-Lesen-Eintrag in der Werkzeug-Zentrale,
- 🟢 nativer Tauri-Nachweis für echte Speicherwerte,
- 🟢 Regressionstests für P0.1, P0.2, SQLite-Persistenz, Zwischenstand und sicheres Beenden.

## 🧪 Bestätigter Prüfweg

### SCHNELL 🟢

- Governance und Wissen,
- HTML und JavaScript,
- Abhängigkeitsprüfung,
- Cargo-Sperrdatei,
- Rust-Formatierung,
- Rust-Kompilierung mit gesperrten Abhängigkeiten,
- Clippy ohne Warnungen,
- Rust-Tests für Einhängeorte, Filterung, Namen und Doppelmounts.

### TIEF 🟢

- vollständige Browser- und Vertragsregression,
- Rust-Integrationstests,
- echter Tauri-Start,
- mindestens ein aktiver Datenträger,
- Einhängeort befüllt,
- Gesamtgröße größer als null,
- freier Speicher nicht größer als Gesamtgröße,
- P0.1 und P0.2 weiterhin korrekt,
- SQLite-Persistenz,
- Zwischenstand,
- sicheres Beenden.

## 🧯 Während der Prüfung behoben

Der erste SCHNELL-Lauf blockierte ausschließlich wegen einer von `rustfmt` geforderten Formatierung. Die Funktion und die Prüfregeln wurden nicht verändert oder abgeschwächt. Danach bestanden SCHNELL und TIEF vollständig.

## 🛡️ Bewusste Grenzen

- 🔒 keine Speicherplatz-Ampel,
- 🔒 keine Bewertung „normal / knapp / kritisch“,
- 🔒 keine Bereinigung,
- 🔒 kein Verschieben,
- 🔒 kein Löschen,
- 🔒 kein Aushängen,
- 🔒 keine Speicheroptimierung,
- 🔒 kein Shell-Aufruf wie `df` oder `lsblk`,
- 🔒 kein Hintergrunddienst und kein Dauer-Abfragen,
- 🔒 keine neue Datenbanktabelle,
- 🔒 keine neue Tauri-Berechtigung.

## 📦 Abhängigkeiten

P0.3 deklariert `libc = "0.2"` direkt, um die Linux-Systemfunktion `statvfs` sauber aus Rust aufzurufen.

`libc` war bereits indirekt im bestehenden Cargo-Sperrbestand vorhanden. Es wurde **kein großes Systeminformations-Paket** ergänzt.

## 🔵 Versionshinweis

Die sichtbare Programmversion bleibt die echte Rust-Paketversion `0.1.0`. P0.3 verändert die Produktversion nicht.

## ➡️ Nächster Schritt

**Nach der Übernahme dieses bestätigten P0.3-Stands nach `main` die Speicherplatz-Ampel als eigenen, weiterhin strikt nur lesenden Slice planen. Grenzwerte, kleine und große Datenträger, read-only Medien, Inode-Mangel und die Trennung zwischen „Speicher knapp“ und „Werkzeugfehler“ müssen vor der Umsetzung als eigener Vertrag festgelegt werden.**
