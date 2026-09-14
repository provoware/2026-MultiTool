# P0.4 – Speicherplatz-Ampel

## Status

**🔵 Fachlicher Vertrag festgelegt · noch keine Implementierung.**

P0.4 baut ausschließlich auf der bestätigten read-only Speicherübersicht aus P0.3 auf. In diesem Vertrag werden zuerst Bedeutung, Grenzwerte und Fehlertrennung festgelegt. Solange dieser Vertrag nicht durch SCHNELL geprüft ist, wird keine Ampelberechnung und keine UI-Funktion implementiert.

---

## 1. Ziel

Für jeden lesbar ermittelten lokalen Datenträger soll eine einfache Zustandsaussage entstehen:

- 🟢 **Normal** – ausreichend freier Speicher und ausreichend freie Inodes,
- 🟡 **Knapp** – Reserve wird klein, aber der Datenträger ist noch nicht kritisch,
- 🔴 **Kritisch** – sehr wenig freie Reserve; neue Dateien oder Systemoperationen können bald scheitern,
- 🔵 **Nur Lesen** – der Datenträger ist eingehängt, aber nicht beschreibbar; keine Speicherplatz-Warnung ableiten,
- ⚪ **Nicht bewertbar** – Messdaten fehlen oder sind technisch nicht zuverlässig verfügbar.

Die Ampel bleibt strikt **read-only**. Sie bewertet vorhandene Messwerte und führt keinerlei Änderung am Datenträger aus.

---

## 2. Harte Scope-Grenzen

P0.4 darf:

- vorhandene Mount- und Speicherinformationen lesen,
- freie und gesamte Bytes auswerten,
- sofern vom Dateisystem sinnvoll gemeldet: freie und gesamte Inodes auswerten,
- den read-only-Mountstatus lesen,
- daraus ausschließlich einen erklärbaren Anzeigezustand bilden.

P0.4 darf ausdrücklich **nicht**:

- Dateien löschen,
- Dateien verschieben,
- Papierkorb leeren,
- Caches bereinigen,
- Pakete entfernen,
- Datenträger aushängen,
- Dateisysteme reparieren,
- Mountoptionen ändern,
- Reservierungen verändern,
- automatisch Speicher freigeben,
- Hintergrund-Polling oder einen neuen Dienst einführen.

---

## 3. Zwei getrennte Zustandsdimensionen

Ein zentraler Schutz gegen irreführende Warnungen ist die Trennung von **Speicherzustand** und **Prüfzustand**.

### 3.1 Speicherzustand

Nur wenn gültige Messwerte vorliegen:

- `NORMAL`
- `LOW`
- `CRITICAL`
- `READ_ONLY`
- `UNKNOWN`

### 3.2 Prüfzustand

Unabhängig davon:

- `OK` – alle vorgesehenen Werte konnten gelesen werden,
- `PARTIAL` – mindestens ein Wert oder Datenträger konnte nicht vollständig geprüft werden,
- `FAILED` – die Speicherprüfung konnte insgesamt nicht zuverlässig durchgeführt werden.

### 3.3 Harte Trennregel

**Ein Messfehler darf niemals als „Speicher kritisch“ dargestellt werden.**

Beispiele:

- 2 GiB frei und gültig gemessen → eventuell 🔴 oder 🟡 Speicherzustand,
- `statvfs` fehlgeschlagen → ⚪ Nicht bewertbar / Prüfproblem,
- `/proc/self/mountinfo` nicht lesbar → Prüfzustand `FAILED`, aber **keine rote Speicherampel erfinden**.

---

## 4. Adaptive Byte-Grenzwerte

Starre Prozentwerte sind auf sehr großen Datenträgern zu früh warnend. Starre GiB-Werte sind auf kleinen Datenträgern zu grob. Deshalb wird eine geklemmte Kombination verwendet.

### 4.1 Gelb – „Knapp“

```text
warn_threshold = clamp(10 % der Gesamtgröße, 2 GiB, 100 GiB)
```

Der Datenträger ist hinsichtlich Bytes **knapp**, wenn:

```text
free_bytes <= warn_threshold
```

### 4.2 Rot – „Kritisch“

```text
critical_threshold = clamp(3 % der Gesamtgröße, 512 MiB, 20 GiB)
```

Der Datenträger ist hinsichtlich Bytes **kritisch**, wenn:

```text
free_bytes <= critical_threshold
```

### 4.3 Priorität

```text
CRITICAL vor LOW vor NORMAL
```

Wenn die kritische Grenze erreicht ist, wird nicht zusätzlich gelb bewertet.

### 4.4 Warum `clamp`

`clamp(x, minimum, maximum)` bedeutet:

- kleine Datenträger bekommen eine sinnvolle absolute Mindestreserve,
- mittlere Datenträger werden überwiegend prozentual bewertet,
- große Datenträger lösen nicht schon bei hunderten GiB freiem Platz eine Warnung aus.

Damit ist keine separate, schwer wartbare Fallunterscheidung „klein / mittel / groß“ nötig.

---

## 5. Referenzfälle für die Byte-Regel

| Gesamtgröße | Gelb ab ungefähr | Rot ab ungefähr | Zweck |
|---:|---:|---:|---|
| 8 GiB | 2 GiB | 512 MiB | kleine Medien nicht erst bei wenigen MiB warnen |
| 16 GiB | 2 GiB | 512 MiB | Mindestreserve dominiert |
| 32 GiB | 3,2 GiB | 0,96 GiB | Prozentregel dominiert |
| 64 GiB | 6,4 GiB | 1,92 GiB | typische kleine SSD/Partition |
| 256 GiB | 25,6 GiB | 7,68 GiB | Prozentregel |
| 512 GiB | 51,2 GiB | 15,36 GiB | Prozentregel |
| 1 TiB | 100 GiB | 20 GiB | Obergrenzen greifen |
| 8 TiB | 100 GiB | 20 GiB | große Datenträger bleiben sinnvoll bewertet |

Die Tabelle ist Testreferenz; maßgeblich ist immer die Formel.

---

## 6. Inode-Mangel

Freie Bytes allein reichen unter Linux nicht aus. Ein Dateisystem kann noch viele GiB frei haben und trotzdem keine neuen Dateien mehr anlegen, wenn die Inodes erschöpft sind.

### 6.1 Inode-Regel

Nur anwenden, wenn das Dateisystem echte, sinnvolle Inode-Werte liefert und `total_inodes > 0` gilt.

- 🟡 **Knapp:** `free_inodes / total_inodes <= 10 %`
- 🔴 **Kritisch:** `free_inodes / total_inodes <= 5 %`

### 6.2 Keine absoluten Inode-Grenzen

Bewusst **keine** Regel wie „unter 10.000 Inodes = gelb“.

Grund: Dateisysteme besitzen sehr unterschiedliche Inode-Modelle. Ein absoluter Wert würde auf kleinen oder dynamisch verwalteten Dateisystemen falsche Warnungen erzeugen.

### 6.3 Nicht unterstützte Inode-Werte

Wenn ein Dateisystem keine sinnvollen Inode-Angaben liefert:

- Byte-Bewertung bleibt gültig,
- Inode-Bewertung wird als `nicht verfügbar` markiert,
- daraus entsteht **kein Modulfehler** und **keine Warnfarbe**.

---

## 7. Zusammenführung von Bytes und Inodes

Bei gültigen, beschreibbaren Datenträgern gilt:

```text
wenn bytes == CRITICAL oder inodes == CRITICAL:
    Gesamt = CRITICAL
sonst wenn bytes == LOW oder inodes == LOW:
    Gesamt = LOW
sonst:
    Gesamt = NORMAL
```

Die UI muss den Grund nennen, zum Beispiel:

- „Wenig freier Speicher“
- „Sehr wenig freier Speicher“
- „Wenig freie Dateieinträge (Inodes)“
- „Speicher und Dateieinträge werden knapp“

Damit ist jede Farbe nachvollziehbar.

---

## 8. Schreibgeschützte / read-only Datenträger

Wenn der Mount technisch als read-only gemeldet wird:

```text
storage_state = READ_ONLY
```

Diese Regel überstimmt die normale Byte-/Inode-Ampel.

Begründung: Ein volles ISO, optisches Medium oder bewusst nur-lesend eingehängter Datenträger darf nicht wie ein gefährlich voller beschreibbarer Datenträger aussehen.

Anzeige:

- 🔵 **Nur Lesen**
- Gesamtgröße darf weiterhin angezeigt werden,
- freier Speicher darf als Information angezeigt werden,
- keine gelbe oder rote Speicherwarnung allein aus dem Füllstand.

P0.4 bewertet **nicht**, ob ein read-only-Systemdatenträger beabsichtigt oder unerwartet read-only geworden ist. Das wäre ein eigener Systemintegritäts-Slice und darf nicht mit Speicherknappheit vermischt werden.

---

## 9. Fehler- und Teilfehlerstrategie

### 9.1 Einzelner Datenträger nicht messbar

Andere Datenträger bleiben sichtbar und bewertbar.

Der betroffene Datenträger erhält:

- ⚪ **Nicht bewertbar**
- kurze Ursache in Laien-Sprache,
- optional technische Details nur im Hilfe-/Detailbereich.

Gesamt-Prüfzustand: `PARTIAL`.

### 9.2 Kein Datenträger messbar

Keine erfundene Ampel.

Gesamt-Prüfzustand: `FAILED`.

Laien-Text beispielsweise:

> „Die Speicherwerte konnten gerade nicht gelesen werden. Es wurde nichts am System geändert.“

### 9.3 Unplausible Messwerte

Folgende Werte gelten als ungültig:

- `total_bytes == 0`,
- `free_bytes > total_bytes`, bevor eine definierte Normalisierung erfolgt,
- negative/überlaufende Umrechnungen,
- widersprüchliche Inode-Werte.

Ungültige Messwerte führen zu `UNKNOWN` / Prüfproblem, nicht zu `CRITICAL`.

---

## 10. Determinismus und Rundung

Die Berechnung soll intern mit Integer-Werten erfolgen.

- Ausgangsdaten bleiben Bytes / Inode-Zähler,
- keine UI-Rundung darf die Entscheidung beeinflussen,
- Prozentgrenzen werden overflow-sicher berechnet,
- Anzeigen dürfen gerundet werden, die Ampelentscheidung jedoch nicht.

Grenzwerte gelten einschließlich:

```text
free == threshold  → Zustand ist bereits LOW bzw. CRITICAL
```

---

## 11. Keine Status-Historie in P0.4

P0.4 bleibt zustandslos.

- keine Hysterese,
- keine Trendanalyse,
- keine Vorhersage,
- keine Benachrichtigungen,
- keine automatische periodische Prüfung.

Die Ampel bildet ausschließlich den **aktuell gelesenen Zustand** ab. Dadurch bleiben Datenfluss, Tests und Fehleranalyse klein und deterministisch.

---

## 12. Accessibility- und Laienregeln

Farbe darf niemals die einzige Information sein.

Jeder Zustand braucht gleichzeitig:

- Symbol,
- ausgeschriebenen Text,
- kurzen Grund.

Beispiele:

```text
🟢 Normal · 84 GB frei
🟡 Knapp · nur noch 12 GB frei
🔴 Kritisch · nur noch 4 GB frei
🔵 Nur Lesen · auf diesem Datenträger kann nichts gespeichert werden
⚪ Nicht bewertbar · Speicherwerte konnten nicht gelesen werden
```

Zusätzlich:

- kein blinkender Zustand,
- keine springende Zeile beim Aktualisieren,
- 150–200-%-Zoom darf den Inhalt nicht abschneiden,
- Tastaturbedienung bleibt vollständig erhalten,
- Screenreader erhält den ausgeschriebenen Status und den Grund.

---

## 13. Pflicht-Testmatrix vor Freigabe

### Byte-Grenzen

- unterhalb / exakt auf / oberhalb der gelben Grenze,
- unterhalb / exakt auf / oberhalb der roten Grenze,
- 8-GiB-Fall,
- 16-GiB-Fall,
- 64-GiB-Fall,
- 1-TiB-Fall,
- Mehr-TiB-Fall,
- Extremwerte nahe `u64::MAX` ohne Überlauf.

### Inodes

- Inodes normal,
- exakt 10 % frei,
- knapp unter 10 %,
- exakt 5 % frei,
- knapp unter 5 %,
- `total_inodes == 0`,
- Inode-Werte nicht verfügbar.

### Read-only

- read-only mit 0 Byte frei → 🔵 Nur Lesen, **nicht rot**,
- read-only mit viel freiem Speicher → 🔵 Nur Lesen,
- beschreibbarer Datenträger mit identischen Kapazitätswerten → normale Ampel.

### Fehlertrennung

- einzelnes `statvfs` scheitert → `PARTIAL`,
- Mount-Tabelle scheitert → `FAILED`,
- ungültige Werte → `UNKNOWN`,
- kein technischer Fehler darf als `CRITICAL` erscheinen.

### Regression

- P0.1 Werkzeug-Zentrale,
- P0.2 Systemstatus,
- P0.3 Rohdatenanzeige,
- SQLite-Persistenz,
- Zwischenstand,
- Neustart,
- sicheres Beenden.

---

## 14. Abnahme-Gates

### Gate A – Vertrag

Vor Implementierung:

- Grenzwerte widerspruchsfrei,
- kleine und große Datenträger geprüft,
- Inode-Regel festgelegt,
- read-only-Regel festgelegt,
- Fehlerzustand klar von Speicherzustand getrennt,
- keine Schreibfunktion im Scope.

### Gate B – SCHNELL

Nach erster Implementierung:

- Governance,
- HTML/JavaScript,
- Rust-Formatierung,
- `cargo check --locked`,
- Clippy `-D warnings`,
- Unit-Tests der kompletten Grenzwertmatrix.

### Gate C – TIEF

Erst nach grünem SCHNELL:

- echter Tauri-Start,
- echte Linux-Speicherwerte,
- Byte- und Inode-Bewertung,
- read-only-Fall,
- Fehlertrennung,
- bestehende P0.1–P0.3-Regression.

### Gate D – Merge

Nur wenn SCHNELL und TIEF für denselben unveränderten Kandidaten grün sind.

---

## 15. Entscheidungsstatus

```text
P0.3 Speicher-Rohdaten         🟢 bestätigt und in main
P0.4 Scope                     🟢 festgelegt
Adaptive Byte-Grenzen          🟢 festgelegt
Kleine/große Datenträger       🟢 durch clamp-Regel abgedeckt
Inode-Mangel                   🟢 festgelegt
Read-only-Medien               🟢 festgelegt
Fehler ≠ Speicherknappheit     🟢 hart getrennt
P0.4 Implementierung           🔒 noch nicht begonnen
P0.4 UI-Änderung               🔒 noch nicht begonnen
Bereinigung/Optimierung        🔒 außerhalb P0.4
```

## Nächster Schritt

**Zuerst ausschließlich diesen Vertrag durch SCHNELL/Governance gegen den aktuellen `main`-Stand prüfen. Erst wenn der Vertrag widerspruchsfrei ist, darf die kleinste Implementierung beginnen: vorhandene P0.3-Rohdaten um read-only- und Inode-Messwerte ergänzen und die reine Bewertungsfunktion vollständig unit-testbar im Rust-Kern aufbauen – noch ohne Bereinigung oder andere Schreibfunktion.**
