# P0.2 – Systemstatus

## 🎯 Ziel

Der Systemstatus zeigt nur sichere Basisinformationen an, die für einen Laien direkt verständlich sind.

Dieser Slice zeigt genau:

- Betriebssystem,
- Programmversion,
- aktuelle Sitzung,
- Zustand des Programmkerns,
- Zustand der lokalen SQLite-Datenbank,
- Gesamtzustand „Alles bereit“ oder „Aufmerksamkeit nötig“.

**🔒 Keine Prozesssteuerung. Keine Systemänderung. Keine Hardwarediagnose. Keine Netzwerkerkennung.**

## 🧭 Eine Statusquelle

```text
vorhandener Rust-Statuspfad
        ↓
vorhandene SQLite-Health-Prüfung
        ↓
Tauri-Befehl get_status
        ↓
Systemstatus in der bestehenden Oberfläche
```

Es wird ausdrücklich **kein zweiter Statusdienst** und keine zweite Statusdatenhaltung angelegt.

## 📌 Datenquellen

| Anzeige | Quelle | Wirkung |
|---|---|---|
| Betriebssystem | Rust `std::env::consts::OS` | nur lesen |
| Programmversion | Rust `CARGO_PKG_VERSION` | nur lesen |
| Sitzung | bereits vorhandener `RuntimeState` | nur lesen |
| Programmkern | erfolgreicher Tauri-Aufruf | nur lesen |
| lokale Datenbank | vorhandenes `storage::health` | nur lesen |
| Gesamtzustand | Ableitung aus Kern + Datenbank | nur lesen |

Es werden keine fremden Programme gestartet und keine Systemdateien durchsucht.

## 🎨 Statussprache

- 🟢 **Alles bereit** – Programmkern antwortet und die lokale Datenbank besteht ihre Health-Prüfung.
- 🟡 **Aufmerksamkeit nötig** – der Programmkern antwortet, aber der lokale Speicher ist nicht verwendbar.
- 🔴 **Programmkern nicht erreichbar** – die Oberfläche kann den nativen Kern nicht aufrufen.
- 🔵 **Info** – erklärender Hinweis ohne Fehler.

Farbe ist nie die einzige Information. Symbol und Klartext bleiben gemeinsam sichtbar.

## 🛡️ Risiko

**Gesamtrisiko: 🟢 NIEDRIG**

Begründung:

- keine Systemänderung,
- keine Prozesssteuerung,
- keine neue Datenbanktabelle,
- keine neue Berechtigung,
- keine Netzwerkfunktion,
- keine neue Laufzeitbibliothek,
- keine umfangreiche System- oder Hardwareabfrage.

### Schutzregeln

1. 🔒 P0.2 bleibt vollständig read-only.
2. 🔒 Der Status darf keine Shell-Befehle oder externe Programme ausführen.
3. 🔒 Es werden keine Prozesslisten, Gerätekennungen, Seriennummern oder detaillierten Hardwaredaten gelesen.
4. 🔒 Ein Datenbankfehler darf nicht fälschlich als „Programmkern nicht erreichbar“ dargestellt werden.
5. 🔒 „Alles bereit“ darf nur erscheinen, wenn die lokale Datenbank wirklich ihre Health-Prüfung besteht.
6. 🔒 P0.1 Werkzeug-Zentrale, Zwischenstand und sicheres Beenden dürfen nicht regressieren.
7. 🔒 P0.3 und weitere Module bleiben außerhalb dieses Slices.

## 🤖 Agentenvertrag

- 🔵 **Auftrags-Lotse** – begrenzt P0.2 auf sichere Basisinformationen.
- 🔵 **Architektur-Prüfer** – verhindert zweiten Statusdienst oder zweite Statusdatenhaltung.
- 🔵 **Datenschutz-Prüfer** – verhindert unnötige Geräte-, Prozess- oder Identifikationsdaten.
- 🔵 **Systemkern-Umsetzer** – erweitert nur den bestehenden Rust-Statuspfad.
- 🔵 **Oberflächen-Umsetzer** – nutzt die vorhandene Statusfläche und hält Texte kurz.
- 🔵 **Test-Agent** – prüft Kern, Datenbankstatus und sichtbare Werte unabhängig.
- 🔵 **Laien-Sprachprüfer** – prüft sichtbare Texte auf einfache Sprache.
- 🔵 **Barrierefreiheits-Prüfer** – prüft Klartext, Struktur und skalierbare Darstellung.
- 🔵 **Release-Prüfer** – bleibt bis SCHNELL und TIEF gesperrt.

## 🧪 Pflichtprüfungen

### SCHNELL

- ⚪ Governance/Wissensregeln unverändert konsistent,
- ⚪ HTML/JavaScript fehlerfrei,
- ⚪ Rust formatiert,
- ⚪ Rust kompiliert,
- ⚪ Clippy ohne Warnungen,
- ⚪ keine neue Abhängigkeit,
- ⚪ Werkzeugregister weiterhin nur lesend,
- ⚪ Betriebssystem und Programmversion kommen aus dem Rust-Kern.

### TIEF

- ⚪ echte Tauri-Anwendung startet,
- ⚪ Systemstatus ist sichtbar,
- ⚪ Betriebssystem ist nicht leer,
- ⚪ Programmversion ist nicht leer,
- ⚪ Sitzung wird als aktiv angezeigt,
- ⚪ Programmkern wird als bereit angezeigt,
- ⚪ lokale Datenbank wird als bereit angezeigt,
- ⚪ Gesamtzustand lautet bei gesundem Speicher „Alles bereit“,
- ⚪ Werkzeug-Zentrale funktioniert weiterhin,
- ⚪ SQLite-Projektzustand bleibt über Neustart erhalten,
- ⚪ Zwischenstand funktioniert weiterhin,
- ⚪ sicheres Beenden funktioniert weiterhin.

## 📦 Neue Abhängigkeiten

**🟢 Keine.**

P0.2 verwendet ausschließlich bereits vorhandene Rust-, Tauri-, SQLite-, HTML-, CSS- und JavaScript-Bausteine.

## ✂️ Codesparsamkeit

Nicht erlaubt sind parallel:

- zweiter Status-Endpunkt mit denselben Daten,
- Statuskopie in SQLite,
- statische Betriebssystem- oder Versionskopie im HTML,
- Shell-Aufruf nur zum Ermitteln des Betriebssystems,
- neue Bibliothek für Informationen, die Rust bereits liefert.

## ✅ Fertig-Bedingung

P0.2 gilt erst als **🟢 bestätigt**, wenn **SCHNELL und TIEF für exakt denselben Commit** erfolgreich sind.

Erst danach darf der unveränderte Kandidat nach `main` übernommen werden.
