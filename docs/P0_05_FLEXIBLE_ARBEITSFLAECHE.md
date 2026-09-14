# P0.5 – Flexible Arbeitsfläche · Gate-A

## 🚦 Status

- 🟢 P0.4 ist vollständig geprüft, freigegeben und nach `main` übernommen.
- 🟦 Dieser Stand definiert ausschließlich den fachlichen Vertrag für P0.5.
- 🔒 Noch keine neue Funktionslogik, keine Layout-Engine und keine neue Abhängigkeit.

## Ziel

Die Arbeitsfläche soll für Laien ruhiger und anpassbarer werden, ohne eine komplexe Desktop- oder Docking-Architektur einzuführen.

Der Nutzer soll vorhandene Bereiche gezielt **anzeigen oder ausblenden** können. Die Standardansicht bleibt vollständig nutzbar, auch wenn keine Anpassung vorgenommen wird.

## Grundprinzip

> Weniger sichtbare Komplexität, ohne neue technische Komplexität im Unterbau.

P0.5 baut ausschließlich auf bereits vorhandenen Karten/Bereichen auf. Es entsteht **keine zweite Navigations- oder Layout-Architektur**.

## P0.5a – kleinster erster Slice

### Erlaubt

- vorhandene Hauptbereiche einzeln sichtbar oder verborgen schalten
- klarer Schalter pro Bereich: **Anzeigen / Ausblenden**
- sofortige visuelle Rückmeldung
- Schaltfläche **„Ansicht zurücksetzen“**
- Standardansicht: alle für den aktuellen Stand vorgesehenen Bereiche sichtbar
- Tastaturbedienung vollständig möglich
- 100–200-%-Zoom ohne springende oder überlagerte Bereiche
- Screenreader-taugliche Beschriftungen

### Noch nicht erlaubt

- 🔒 Drag-and-drop
- 🔒 freie Pixelpositionierung
- 🔒 Größenänderung einzelner Karten
- 🔒 Docking-System
- 🔒 mehrere frei konfigurierbare Spaltenmodelle
- 🔒 automatische KI-Anordnung
- 🔒 System- oder Dateizugriffe
- 🔒 neue Hintergrunddienste
- 🔒 neue Drittanbieter-Abhängigkeiten
- 🔒 Persistenz der Ansicht

Die erste Stufe bleibt damit **rein UI-lokal innerhalb der laufenden Sitzung**. Nach einem Neustart erscheint wieder die sichere Standardansicht.

## Warum zunächst ohne Persistenz

Persistenz würde sofort einen zweiten Verantwortungsbereich öffnen: Datenschema, Migration, Wiederherstellung und Fehlerverhalten bei beschädigten Einstellungen.

P0.5a soll zuerst ausschließlich beweisen, dass die flexible Sichtbarkeit:

1. verständlich,
2. barrierefrei,
3. layoutstabil und
4. regressionsfrei

funktioniert.

Persistenz wird erst in einem eigenen Folgeslice P0.5b zugelassen.

## Bedienvertrag

Für jeden umschaltbaren Bereich gilt:

- sichtbarer Name des Bereichs
- eindeutiger Zustand **„sichtbar“** oder **„ausgeblendet“**
- ein einziger verständlicher Schalter
- keine versteckten Gesten
- kein Rechtsklick als Pflichtweg
- keine reine Farbcodierung ohne Text

Wenn ein Bereich ausgeblendet wird, muss er über die Einstellfläche jederzeit direkt wieder aktivierbar sein.

## Schutzregeln

### 🟢 Muss immer gelten

- Die Werkzeug-Zentrale bleibt erreichbar.
- Systemstatus und Speicherinformationen werden nicht gelöscht oder verändert, sondern nur optisch verborgen.
- Ausblenden löst keinerlei Rust-, SQLite- oder Systemaktion aus.
- Ein JavaScript-Fehler darf nicht dauerhaft Bereiche entfernen.
- „Ansicht zurücksetzen“ stellt die definierte Standardansicht vollständig wieder her.

### 🔴 Darf nicht passieren

- kein Verlust von Daten
- kein Schreiben in Systemdateien
- kein neues Berechtigungsmodell
- kein Layoutzustand außerhalb der aktuellen Sitzung
- keine unerreichbaren Bereiche
- kein horizontales Scrollen bei vorgesehenen Testgrößen
- kein springendes Layout bei 150–200 % Zoom

## Zustandsmodell P0.5a

Nur zwei Zustände sind zulässig:

- `VISIBLE`
- `HIDDEN`

Keine weiteren Zwischenzustände werden in P0.5a eingeführt.

## Architekturgrenze

Die vorhandene HTML/CSS/JS-Oberfläche bleibt verantwortlich für die rein visuelle Sichtbarkeit.

P0.5a benötigt daher:

- keinen neuen Tauri-Befehl
- keinen neuen Rust-Dienst
- keine SQLite-Tabelle
- keine Datenmigration

Wenn später Persistenz eingeführt wird, muss diese über den bestehenden Tauri/Rust-Kern erfolgen. Direkte Speicherung aus dem Frontend in eine zweite produktive Datenhaltung bleibt verboten.

## Accessibility-Gates

P0.5a gilt nur als bestanden, wenn mindestens geprüft wurde:

- Tastatur: alle Sichtbarkeitsschalter erreichbar
- Fokus bleibt sichtbar
- Schalterzustand ist programmatisch erkennbar
- Screenreader erhält Bereichsname und Zustand
- 100 %, 125 %, 150 %, 175 % und 200 % Zoom ohne Überlagerung
- kleine Fensterbreite ohne horizontale Pflichtnavigation
- `prefers-reduced-motion` wird respektiert

## Testvertrag

### SCHNELL

- HTML-/JavaScript-Lint bleibt grün
- neuer Darstellungs-/Zustandsvertrag für `VISIBLE / HIDDEN`
- Reset-Funktion als deterministische Unit-/Vertragprüfung
- keine neue Abhängigkeit
- keine Änderung an Rust/SQLite notwendig

### TIEF

- bestehende Browsermatrix bleibt vollständig grün
- Bereich ausblenden → verschwindet sichtbar
- Bereich wieder anzeigen → erscheint an definierter Stelle
- mehrere Bereiche ausblenden → Bedienoberfläche bleibt stabil
- „Ansicht zurücksetzen“ → vollständige Standardansicht
- 200-%-Zoom nach Umschaltungen
- native Tauri-E2E bestätigt, dass die bestehende App weiterhin startet und alle bisherigen P0-Funktionen funktionieren

## Abbruchbedingungen

P0.5a wird gestoppt, wenn für die Umsetzung eine dieser Maßnahmen nötig erscheint:

- eigene Layout-Engine
- komplexe Zustandsmaschine
- zusätzliche Datenbankstruktur
- Drittanbieter-Dockingbibliothek
- neue native Berechtigung

In diesem Fall muss der Scope neu bewertet werden, statt die Komplexität still zu erhöhen.

## Gate-A-Abnahme

Gate-A ist fachlich akzeptiert, wenn dieser Vertrag ohne Funktionscode durch SCHNELL und TIEF regressionsfrei bleibt.

Erst danach darf P0.5a implementiert werden.

## Geplanter Folgeschritt

Nach grünem Gate-A:

**P0.5a – Sichtbarkeit vorhandener Bereiche innerhalb der aktuellen Sitzung implementieren.**

Persistenz bleibt bis zu einem separaten P0.5b-Vertrag gesperrt.
