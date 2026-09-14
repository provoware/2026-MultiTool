# P0.1 – Werkzeug-Zentrale

## 🎯 Ziel

Die Werkzeug-Zentrale zeigt nur Werkzeuge an, die wirklich im Programm vorhanden sind.

Dieser erste Schritt ist bewusst klein:

- Werkzeuge anzeigen,
- Zustand verständlich anzeigen,
- kurze Beschreibung anzeigen,
- klar sagen, dass noch nichts verändert wird.

**🔒 Noch keine Schalter. Noch kein Ausblenden. Noch kein Verschieben. Noch keine neuen Berechtigungen.**

## 🎨 Statussprache

- 🟢 **Bestanden / bereit** – automatisch geprüft oder wirklich verfügbar.
- 🟡 **In Prüfung** – umgesetzt, aber noch nicht vollständig bestätigt.
- 🔴 **Fehler / blockiert** – nächste Stufe bleibt gesperrt.
- 🔵 **Info** – wichtiger Hinweis ohne Fehler.
- ⚪ **Offen** – noch nicht begonnen.
- 🔒 **Gesperrt** – bewusst noch nicht freigegeben.

> Grün wird nur nach einem echten automatischen Nachweis vergeben.

## 🧭 Aktiver Weg

```text
Werkzeugliste in Rust
        ↓
Tauri-Befehl list_tools
        ↓
HTML-Oberfläche
        ↓
lesende Werkzeugkarten
```

## 🛡️ Risiko

**Gesamtrisiko: 🟢 NIEDRIG**

Begründung:

- keine Dateiveränderung,
- keine Datenbankänderung,
- keine neue Berechtigung,
- keine Netzwerkfunktion,
- keine zusätzliche Laufzeitbibliothek,
- keine neue Speicherung.

### Schutzregeln

1. 🔒 P0.1 bleibt nur lesend.
2. 🔒 Die Werkzeugliste darf keine Funktion als vorhanden ausgeben, die nicht eingebaut ist.
3. 🔒 Die Oberfläche darf aus Werkzeugdaten keinen ausführbaren Inhalt erzeugen.
4. 🔒 Bei fehlendem Programmkern bleibt die Werkzeugliste gesperrt und verändert nichts.
5. 🔒 Weitere P0-Module werden in diesem Slice nicht begonnen.

## 🤖 Agentenvertrag

Für diesen Slice sind vorgesehen:

- 🔵 **Auftrags-Lotse** – ordnet die Änderung als Oberfläche + Rust-Kern + Test ein.
- 🔵 **Architektur-Prüfer** – verhindert zweite Modulverwaltung oder zweite Speicherung.
- 🔵 **Umsetzungs-Planer** – hält den Slice auf Anzeige + Zustand begrenzt.
- 🔵 **Systemkern-Umsetzer** – liefert die Werkzeugliste aus Rust.
- 🔵 **Oberflächen-Umsetzer** – zeigt sie ohne Geschäftslogik an.
- 🔵 **Test-Agent** – prüft Rust und Oberfläche unabhängig.
- 🔵 **Laien-Sprachprüfer** – prüft sichtbare Texte auf einfache Sprache.
- 🔵 **Hilfe-Agent** – prüft, ob die kurze Erklärung ausreichend ist.
- 🔵 **Barrierefreiheits-Prüfer** – prüft Skalierung, Struktur und verständliche Zustände.
- 🔵 **Release-Prüfer** – bleibt für diesen Funktions-Slice gesperrt; zuerst SCHNELL und TIEF.

## 🧪 Pflichtprüfungen

### SCHNELL

- ⚪ Rust formatiert,
- ⚪ Rust kompiliert,
- ⚪ Clippy ohne Warnungen,
- ⚪ Werkzeugkennungen eindeutig,
- ⚪ P0.1 bleibt nur lesend,
- ⚪ HTML/JavaScript fehlerfrei.

### TIEF

- ⚪ echte Tauri-Anwendung startet,
- ⚪ Werkzeug-Zentrale erscheint,
- ⚪ mindestens Grundlage und Werkzeug-Zentrale werden angezeigt,
- ⚪ Gesamtzustand ist verständlich,
- ⚪ Neustart beschädigt den Projektzustand nicht,
- ⚪ Zwischenstand und sicheres Beenden funktionieren weiterhin.

## 📦 Neue Abhängigkeiten

**🟢 Keine.**

Verwendet werden nur bereits vorhandene Bausteine:

- Tauri 2,
- Rust,
- Serde,
- HTML,
- CSS,
- JavaScript.

## ✂️ Codesparsamkeit

Es gibt genau eine Werkzeugliste im Rust-Kern.

Nicht erlaubt sind parallel:

- zweite Liste im HTML,
- zweite Liste in einer JSON-Datei,
- zweite Liste in SQLite,
- fest eingebaute doppelte Statusregeln im JavaScript.

## ✅ Fertig-Bedingung

P0.1 gilt erst als **🟢 bestätigt**, wenn SCHNELL und TIEF für denselben Kandidaten grün sind.

Danach darf entschieden werden, ob im nächsten kleinen Slice Sichtbarkeit gespeichert werden soll. Das ist ausdrücklich **nicht** Teil dieses Schrittes.
