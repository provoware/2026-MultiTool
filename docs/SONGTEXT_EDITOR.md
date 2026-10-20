# Songtext-Editor: Dateiname und Veröffentlichungstitel

Der neue Songtext-Editor speichert Songs ausschließlich lokal in der bereits vorhandenen
SQLite-Datenbank (zusätzliche Tabelle songtexts); die historische HTML-Anwendung bleibt
im Archiv unverändert.

- Dateiname: Pflichtfeld. Steuert den Namen beim TXT-Export, nicht die öffentliche Darstellung.
- Songtitel: Pflichtfeld. Standardtitel für Veröffentlichung und Export.
- Anderen Veröffentlichungstitel verwenden: optionaler Schalter (standardmäßig aus).
  Eingeschaltet ist der andere Titel für TXT-Inhalt und Zwischenablage maßgeblich.
  Ausgeschaltet gilt wieder der normale Songtitel; der andere Text bleibt gespeichert.
- Pfadangaben und doppelte Dateinamen werden abgewiesen.
- Ungespeicherte Änderungen werden vor Schließen oder Songwechsel abgefragt.

Prüfstatus: JavaScript-Vertragstest und Rust-Datenbanktests ergänzt; die tatsächliche
Kubuntu-/Tauri-Ansicht, Browserdownloads und 800×600/200 %-Bedienung benötigen
noch praktische Abnahme. Keine allgemeine Releasefreigabe.
