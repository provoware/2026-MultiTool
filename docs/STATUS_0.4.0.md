# PROVOWARE MultiTool – Status 0.4.0

## 🚦 Gesamtstand

**🟡 P0.3 Speicherübersicht ist umgesetzt und wartet auf die Cloud-Prüfung.**

```text
Stabile Tauri-Foundation      🟢 ██████████ 100 % übernommen
P0.1 Werkzeug-Zentrale        🟢 ██████████ bestätigt und übernommen
P0.2 Systemstatus             🟢 ██████████ bestätigt und übernommen
P0.3 Speicherübersicht        🟡 ████████░░ umgesetzt, Prüfung offen
SCHNELL für P0.3              ⚪ noch nicht bestätigt
TIEF für P0.3                 🔒 bis SCHNELL grün
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

## 🟡 Was P0.3 bereits enthält

- 🟡 lesende Erkennung eingehängter lokaler Datenträger unter Linux,
- 🟡 verständlicher Name pro Datenträger,
- 🟡 Einhängeort,
- 🟡 Gesamtgröße,
- 🟡 freier Speicher,
- 🟡 Filter gegen Pseudo-, Netzwerk- und typische AppImage-Sondermounts,
- 🟡 direkte Linux-Abfrage über `statvfs` statt Shell-Befehl,
- 🟡 Speicherübersicht als read-only Eintrag in der Werkzeug-Zentrale,
- 🟡 nativer Tauri-E2E-Nachweis für echte Speicherwerte,
- 🟡 Regressionstests für P0.1, P0.2, SQLite-Persistenz, Zwischenstand und sicheres Beenden.

## 🛡️ Bewusste Grenzen

- 🔒 keine Speicherplatz-Ampel,
- 🔒 keine Bewertung „normal / knapp / kritisch“,
- 🔒 keine Bereinigung,
- 🔒 kein Verschieben,
- 🔒 kein Löschen,
- 🔒 kein Aushängen,
- 🔒 keine Speicheroptimierung,
- 🔒 kein Shell-Aufruf wie `df` oder `lsblk`,
- 🔒 kein Hintergrunddienst und kein Dauer-Polling,
- 🔒 keine neue Datenbanktabelle,
- 🔒 keine neue Tauri-Berechtigung.

## 📦 Abhängigkeiten

P0.3 deklariert `libc = "0.2"` direkt, um die vorhandene Linux-Systemfunktion `statvfs` sauber aus Rust aufzurufen.

`libc` war bereits indirekt im bestehenden Cargo-Sperrbestand vorhanden. Es wird **kein großes Systeminformations-Framework** ergänzt.

## 🔵 Versionshinweis

Die sichtbare Programmversion bleibt die echte Rust-Paketversion `0.1.0`. P0.3 verändert die Produktversion nicht.

## ➡️ Nächster Schritt

**Cargo-Sperrdatei reproduzierbar auf den neuen direkten `libc`-Verweis bringen → Scope prüfen → Draft-PR öffnen → SCHNELL → bei Grün TIEF → erst bei zwei grünen Stufen unverändert nach `main`.**
