# P0.5b – Ansicht merken · Gate-A-Vertrag

## Ziel

P0.5b erweitert die bereits bestätigte sitzungslokale Bereichssichtbarkeit um eine **lokale, dauerhafte Speicherung**. Es werden ausschließlich die Sichtbarkeitszustände der bereits vorhandenen vier Bereiche gespeichert:

- `today`
- `system-status`
- `storage`
- `tools`

Beim nächsten Programmstart soll die zuletzt gespeicherte Sichtbarkeit wiederhergestellt werden. **Ansicht zurücksetzen** stellt alle vier Bereiche wieder sichtbar und speichert genau diesen Standardzustand.

## Harte Grenzen

P0.5b enthält ausdrücklich **nicht**:

- kein Drag-and-drop
- keine freie Größenänderung
- keine frei positionierbaren Fenster oder Karten
- keine neue Layout-Engine
- keine Cloud-Synchronisierung
- keine Netzwerkkommunikation
- kein `localStorage`, IndexedDB oder zweite produktive Frontend-Datenhaltung
- keine Änderung an Speicher-, Systemstatus- oder Werkzeuglogik
- keine neue Laufzeitabhängigkeit

## Datenhoheit

Die dauerhafte Sichtbarkeit wird ausschließlich vom Rust-Kern über die vorhandene lokale SQLite-Datenbank verwaltet.

Prinzip:

`HTML/JS → Tauri-Befehl → Rust → SQLite`

Das Frontend darf nur darstellen und Benutzeraktionen weiterreichen. Es besitzt keine zweite dauerhafte Wahrheit.

## Datenmodell

Die Speicherung muss klein, explizit und auf bekannte Bereichskennungen begrenzt sein.

Empfohlene Form:

`workspace_visibility(section_id TEXT PRIMARY KEY, visible INTEGER NOT NULL)`

Erlaubte `section_id`-Werte sind ausschließlich die vier oben definierten Kennungen. `visible` darf nur `0` oder `1` enthalten.

Fehlt für einen bekannten Bereich ein Datensatz, gilt sicher der Standard **sichtbar**.

## Befehlsvertrag

P0.5b darf höchstens diese fachlichen Operationen einführen:

1. Sichtbarkeit aller bekannten Bereiche lesen.
2. Sichtbarkeit genau eines bekannten Bereichs speichern.
3. Alle bekannten Bereiche auf sichtbar zurücksetzen.

Unbekannte Bereichskennungen müssen abgelehnt werden und dürfen keinen Datensatz erzeugen.

## Fehlerverhalten

Kann die Sichtbarkeit nicht gelesen werden, bleibt die Oberfläche benutzbar und zeigt alle Bereiche sichtbar. Zusätzlich wird ein verständlicher Hinweis **„Ansicht konnte nicht geladen werden“** angezeigt.

Kann eine Änderung nicht gespeichert werden, bleibt der sichtbare Zustand der laufenden Sitzung erhalten, aber die Oberfläche meldet **„Ansicht wurde nicht gespeichert“**. Es darf kein falscher Erfolgszustand gezeigt werden.

Ein Fehler der Ansichtspräferenzen darf weder den Programmkern noch die Speicherübersicht, Werkzeug-Zentrale oder den Systemstatus als defekt markieren.

## Transaktions- und Sicherheitsregeln

- nur bekannte Bereichskennungen akzeptieren
- SQLite-Schreibzugriffe transaktional ausführen
- keine Dateioperationen außerhalb der vorhandenen App-Datenbank
- keine Shell-Befehle
- kein Hintergrunddienst
- kein Polling
- keine Migration bestehender Nutzdaten außerhalb der eigenen kleinen Tabelle
- Standardansicht muss jederzeit reproduzierbar sein

## Accessibility

- vorhandene Checkboxen und Tastaturbedienung bleiben erhalten
- Zustandsänderungen werden weiter über die vorhandene `aria-live`-Region gemeldet
- Speichermeldungen dürfen keine Fokusverschiebung erzwingen
- 100–200-%-Zoom und kleine Fenstergrößen bleiben TIEF-Gate

## Pflichtprüfungen

### Rust / SQLite

- neuer Datenbestand startet mit allen vier Bereichen sichtbar
- `false` wird gespeichert und nach erneutem Öffnen wieder gelesen
- `true` wird gespeichert und nach erneutem Öffnen wieder gelesen
- unbekannte Bereichskennung wird abgelehnt
- Reset setzt exakt alle vier Bereiche auf sichtbar
- wiederholtes Setzen desselben Zustands bleibt idempotent
- bestehender Projektzustand und Checkpoints bleiben unverändert

### Frontend

- gespeicherte Sichtbarkeit wird beim Start übernommen
- Checkboxzustand und sichtbarer Bereich stimmen immer überein
- Änderung wird erst als dauerhaft gespeichert bestätigt, wenn der Tauri-Befehl erfolgreich war
- bei Speicherfehler bleibt die Sitzung bedienbar und erhält eine klare Warnung
- Reset stellt alle Bereiche sichtbar und speichert den Standard

### Regression

- P0.1 Werkzeug-Zentrale bleibt funktionsfähig
- P0.2 Systemstatus bleibt funktionsfähig
- P0.3 Speicherübersicht bleibt funktionsfähig
- P0.4 Speicherampel bleibt funktionsfähig
- P0.5a Sitzungs-Sichtbarkeit bleibt ohne Persistenzfehler bedienbar
- sicherer Browserzustand ohne nativen Tauri-Kern bleibt unverändert fail-closed

## Gate-Reihenfolge

`Gate-A Vertrag → SCHNELL → TIEF → Gate-B einfrieren → kleinste Implementierung → SCHNELL → TIEF → PR → Merge`

Bis Gate-A vollständig grün ist, darf kein P0.5b-Funktionscode entstehen.
