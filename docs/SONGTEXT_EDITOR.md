# Songtext-Editor – Import, Veröffentlichungstitel und Datensicherung

## Bedienung

In der Werkzeug-Zentrale **Songtext-Editor öffnen**.

- **Dateiname**: Name der technischen TXT-Datei, unabhängig vom Veröffentlichungstitel.
- **Songtitel**: normaler interner Titel.
- **Anderen Veröffentlichungstitel verwenden**: optional. Die Eingabe bleibt beim Abschalten erhalten.
- **TXT exportieren**: speichert einen Song als TXT-Datei mit dem ursprünglichen Dateinamen.
- **Dateien importieren**: unterstützt UTF-8-TXT, Markdown (.md) sowie PROVOWARE-JSON-Sicherungen.
- **Alle Songtexte sichern**: speichert den gespeicherten Bestand als versionierte JSON-Datei; diese Datei lässt sich über **Dateien importieren** wiederherstellen.

## Was beim Import passiert?

1. Dateien ausdrücklich auswählen, etwa mehrere TXT-Dateien oder eine JSON-Sicherung.
2. Die Anwendung liest die Dateien im Speicher und prüft Inhalt, Format, Anzahl und Dateinamen.
3. Eine TXT-Zeile `Titel: ...` oder eine Markdown-Überschrift `# ...` wird als Songtitel übernommen. Andernfalls wird der Titel aus dem Dateinamen abgeleitet.
4. Der ursprüngliche Dateiname wird nicht geändert. Bereits vorhandene oder mehrfach ausgewählte Dateinamen werden vorab ausgesondert.
5. **Erst nach Bestätigung** schreibt der native Programmkern alle neuen Datensätze gemeinsam in SQLite. Bei einem Konflikt oder Schreibfehler wird dieser Schreibvorgang vollständig rückgängig gemacht.
6. Die importierten Originaldateien werden nicht gelöscht, verschoben oder verändert.

Eine erneute Importdatei mit gleichem Dateinamen aktualisiert bestehende Songtexte **nicht** automatisch. Das verhindert Datenverlust.

## Sicherungsformat und Grenzen

Formatkennung: `provoware.songtexts`, Schema-Version: `1`. Gespeichert werden Dateiname, Songtitel, optionaler Veröffentlichungstitel, Aktivierung und Songtext. Die geräteinternen Datenbankkennungen werden **nicht** exportiert.

Die Wiederherstellung auf einem leeren System erstellt neue lokale Kennungen und stellt die Text- und Titelangaben wieder her. Auf einem bereits befüllten System werden gleichnamige Titel übergangen.

- Höchstens 50 ausgewählte Dateien pro Import.
- Höchstens 1000 Songtexte pro JSON-Sicherung/Import.
- Einzelne TXT-/Markdown-Datei höchstens 2 MB.
- Gesamte Auswahl/Sicherung höchstens 32 MB.
- Nur UTF-8; ungültige Kodierung wird mit Fehlermeldung abgewiesen.
- ZIP-Pakete und fremde JSON-Schemata werden bewusst nicht stillschweigend verarbeitet.
- Keine automatische Umbenennung und kein Überschreiben von Originalen.

**Achtung:** Das Erstellen einer JSON-Sicherung ist nur dann eine externe Datensicherung, wenn die Datei tatsächlich außerhalb des Anwendungsverzeichnisses aufbewahrt wurde. Rückmeldung im Programm bestätigt zunächst nur den angestoßenen Download. Das tatsächliche Vorhandensein einer heruntergeladenen Datei muss in der Zielumgebung geprüft werden.

## Oberfläche und Wartbarkeit

- Der Editor besitzt getrennte Bereiche für Dateiübernahme, Titel und Text.
- Die modulbezogenen Gestaltungsregeln liegen jetzt in `src/ui/song-editor.css` statt im globalen Design.
- Reine Import- und Sicherungsregeln liegen in `src/ui/song-import.mjs` und werden ohne Programmoberfläche geprüft.
- Datenspeicherung und Importtransaktion bleiben im Rust-Programmkern.
- Bedienprüfung berücksichtigt Fenster ab 800×600 und skalierungsäquivalente 175–200 %, ohne horizontales Abschneiden.

## Freigabe

Automatisierte Verträge und Fehlerfalltests müssen bestanden sein. Der native Tauri-/Kubuntu-Paketbau, Installations- und Deinstallationsprobe, Wiederherstellung aus einer **tatsächlich heruntergeladenen** Sicherungsdatei sowie persönliche Kubuntu-Endabnahme sind getrennte Prüfungen und dürfen nicht aus einer grünen Codeprüfung abgeleitet werden.

Die persönliche Kubuntu-Endabnahme bleibt bis zum Ende der Entwicklung zurückgestellt. Solange `bundle.active` deaktiviert ist, wird kein fertiges Installationspaket versprochen.
