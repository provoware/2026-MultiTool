# P0.6 – Hilfe-Zentrale · Gate-A-Vertrag

## 🚦 Status

- 🟢 Ausgangsbasis ist der eingefrorene und vollständig geprüfte Stand `f2dbc6887813c1ff87bbc41bf9e8932e99d80641`.
- 🟦 Dieser Gate-A-Stand definiert ausschließlich den fachlichen Vertrag für P0.6.
- 🔒 Noch keine Funktionsimplementierung, keine neue Navigation, keine neue Runtime-Abhängigkeit und keine Änderung an bestehenden Modulen.

## Ziel

P0.6 ergänzt das MultiTool um eine **laienfreundliche, rein lesende Hilfe-Zentrale** für die bereits vorhandenen Hauptbereiche.

Ein Nutzer soll ohne technisches Vorwissen verstehen können:

1. **Was zeigt dieser Bereich?**
2. **Was kann ich hier sicher tun?**
3. **Was bedeutet eine Warnung oder ein Fehler?**
4. **Was ist der sinnvollste nächste Schritt?**
5. **Wo finde ich bei Bedarf technische Details?**

Die Hilfe erklärt vorhandene Funktionen. Sie führt in P0.6 noch keine neue produktive Aktion aus.

## Grundprinzip

> Erst verständlich erklären, dann optional vertiefen – niemals technische Details zur Pflicht machen.

Die Hilfe-Zentrale folgt der bereits verbindlichen Progressive-Disclosure-Struktur:

`Kurz erklärt → Schritt für Schritt → Technische Details`

Alle drei Ebenen beschreiben denselben fachlichen Zustand. Es entsteht keine zweite Wahrheit über System-, Speicher- oder Werkzeugzustände.

## Erlaubter Minimalumfang

P0.6 darf ausschließlich Hilfe für bereits vorhandene Bereiche enthalten:

- **Heute**
- **Werkzeug-Zentrale**
- **Systemstatus**
- **Speicherübersicht / Speicherampel**
- **Flexible Arbeitsfläche / Ansicht merken**

Für jeden Bereich darf die Hilfe enthalten:

- einen kurzen Zweck in Alltagssprache
- eine kompakte Erklärung der wichtigsten sichtbaren Informationen
- eine Schritt-für-Schritt-Hilfe für den normalen Bedienweg
- typische Warnungen oder Fehler in Klartext
- eine sichere Empfehlung für den nächsten Schritt
- optional aufklappbare technische Details
- Hinweise auf bestehende sichere Bediengrenzen

## Drei Hilfeebenen

### 1. Kurz erklärt

Für absolute Laien.

Muss beantworten:

- Wofür ist dieser Bereich da?
- Was sehe ich gerade?
- Muss ich etwas tun?

Regeln:

- kurze Sätze
- möglichst keine Fachbegriffe
- wenn Fachbegriff nötig: direkt in Klammern erklären
- maximal eine klare Hauptempfehlung
- keine Debugdaten

### 2. Schritt für Schritt

Für Nutzer, die eine konkrete vorhandene Funktion bedienen möchten.

Muss:

- den normalen sicheren Hauptweg beschreiben
- die sichtbaren Bedienelemente mit ihren echten Namen verwenden
- keine versteckten Gesten voraussetzen
- Tastaturbedienung mitdenken
- bei optionalen Entscheidungen sichere Standards nennen
- klar sagen, wenn keine Aktion nötig ist

### 3. Technische Details

Nur auf ausdrücklichen Wunsch bzw. nach Aufklappen sichtbar.

Darf enthalten:

- Modul-/Bereichsname
- lokale Datenquelle
- relevante Statusbegriffe
- vorhandene Fehler- oder Diagnoseinformationen
- bestehende Sicherheitsgrenzen
- Hinweis, ob ein Zustand nur angezeigt oder dauerhaft gespeichert wird

Darf **nicht** als Voraussetzung für die normale Bedienung dienen.

## Harte Ausschlüsse

P0.6 enthält ausdrücklich **nicht**:

- keinen Chatbot oder generative KI-Funktion
- keine Cloud-Abfrage
- keine Internetrecherche
- keine Telemetrie
- keine neue Datenbanktabelle
- keine neue Persistenz
- keine automatische Reparatur
- kein Self-Healing
- keine Shell-Befehle
- keine Paketinstallation
- keine neuen Systemrechte
- keine Änderung von Dateien oder Systemeinstellungen
- kein Hintergrunddienst
- kein Polling
- keine eigenständige Diagnose-Engine
- keine neue Suchmaschine
- kein Volltextindex
- keine frei editierbaren Hilfetexte durch Nutzer
- keine zweite Navigations- oder Layout-Architektur
- keine neue Drittanbieter-Abhängigkeit
- keine Änderung an P0.1–P0.5b-Fachlogik

## Daten- und Zustandsgrenze

Die Hilfe-Zentrale besitzt **keinen eigenen produktiven Systemzustand**.

Sie darf:

- statische Hilfetexte anzeigen
- bereits vorhandene, für die UI verfügbare Zustände erklären
- bestehende Statusbegriffe in Alltagssprache übersetzen

Sie darf nicht:

- Systemzustände neu ermitteln
- bestehende Werte verändern
- eigene persistente Kopien bestehender Zustände führen
- aus Hilfetexten neue Fachzustände ableiten

Prinzip:

`bestehender Zustand → Hilfe erklärt → keine Mutation`

## Fehlerverhalten

Ein Fehler der Hilfe-Zentrale darf **niemals** einen bestehenden Produktbereich als defekt markieren.

### Wenn ein Hilfetext fehlt

- der betroffene Produktbereich bleibt normal nutzbar
- die Hilfe zeigt einen neutralen Hinweis wie **„Für diesen Punkt ist noch keine Hilfe hinterlegt.“**
- keine falsche oder erfundene Erklärung anzeigen

### Wenn ein referenzierter UI-Zustand unbekannt ist

- keine Vermutung als Tatsache darstellen
- Hinweis **„Dieser Zustand kann derzeit nicht erklärt werden.“**
- technische Details dürfen den unbekannten Rohzustand nur anzeigen, wenn dieser bereits sicher in der bestehenden UI verfügbar ist

### Wenn die Hilfe-Zentrale selbst nicht geöffnet werden kann

- bestehende Module bleiben vollständig bedienbar
- keine bestehende Hauptaktion wird blockiert
- kein automatischer Reload- oder Recovery-Loop

## Accessibility-Vertrag

P0.6 muss mindestens WCAG-2.2-AA-orientiert umgesetzt und praktisch geprüft werden.

Pflicht:

- vollständig per Tastatur erreichbar und bedienbar
- sichtbarer Fokus
- logische Fokusreihenfolge
- semantische Überschriftenstruktur
- verständliche Beschriftung aller Auf-/Zuklapp-Elemente
- programmatisch erkennbarer Offen/Geschlossen-Zustand
- Screenreader-taugliche Beziehungen zwischen Hilfeauslöser und Hilfebereich
- Status niemals nur über Farbe vermitteln
- Kontrast mindestens auf bestehendem Projektziel
- 100 / 125 / 150 / 175 / 200 % Zoom
- große Systemschrift
- kleine Fensterbreite ohne horizontale Pflichtnavigation
- `prefers-reduced-motion` respektieren
- kein Fokusverlust beim Öffnen oder Schließen von Hilfeabschnitten
- kein Fokus-Fangen in der Hilfe
- Rückkehr zum auslösenden Bedienelement muss möglich bleiben

## UX-Vertrag

- Eine Hilfeansicht erklärt immer **einen** klaren Themenbereich.
- Die erste sichtbare Ebene bleibt kurz und ruhig.
- Lange Erklärungen sind standardmäßig eingeklappt.
- Die Hilfe verwendet dieselben Begriffe wie die produktive Oberfläche.
- Keine widersprüchlichen Synonyme für dieselbe Funktion.
- Keine Warnflut.
- Keine automatische Öffnung großer Hilfetexte ohne Nutzeraktion.
- Keine modale Pflichtunterbrechung für normale Hilfe.
- Die Hilfe darf die bestehende Hauptaktion nicht visuell verdrängen.

## Fachliche Konsistenzregeln

Jeder Hilfeeintrag muss vor Implementierung einer vorhandenen Funktion eindeutig zuordenbar sein.

Pflichtfelder je Hilfethema:

- `Thema`
- `Bereich`
- `Kurz erklärt`
- `Schritt für Schritt`
- `Technische Details`
- `Typische Hinweise/Fehler`
- `Sicherer nächster Schritt`

Nicht zulässig:

- Hilfetext zu noch nicht existierenden Funktionen als bereits verfügbar formulieren
- technische Möglichkeiten beschreiben, die der aktuelle Build nicht besitzt
- Hilfe als Ersatz für echte Fehlerbehandlung verwenden
- Warnungen verharmlosen oder produktive Risiken verschweigen

## Relevante Expertisen für P0.6

Pflichtprüfung mindestens durch:

- **E01 Softwarearchitektur** – keine zweite Zustands- oder Navigationsarchitektur
- **E02 Frontend Engineering** – semantische, robuste Darstellung
- **E03 UI/UX & Human Factors** – geringe kognitive Last, klare Hauptaussage
- **E04 Accessibility** – Tastatur, Fokus, Screenreader, Zoom
- **E09 Observability & Diagnose** – Fehlertexte korrekt erklären, nicht erfinden
- **E10 Test & Failure Engineering** – robuste Negativ- und Regressionstests
- **E13 Laien-Onboarding** – kein technisches Vorwissen nötig
- **E15 Documentation & Knowledge Transfer** – Hilfe und tatsächlicher Stand stimmen überein
- **E16 Consistency & Design-System Engineering** – gleiche Begriffe und Interaktionsmuster

## SCHNELL-Akzeptanzkriterien

Gate-A bzw. später die kleinste Implementierung darf SCHNELL nur passieren, wenn:

- bestehende Lint-/Format-/Vertragsprüfungen grün bleiben
- keine neue Runtime-Abhängigkeit hinzukommt
- keine Rust-/SQLite-/Systemmutation für die Hilfe nötig wird
- definierte Hilfethemen ausschließlich vorhandene Funktionen referenzieren
- alle Pflichtfelder je Hilfethema vorhanden sind
- keine doppelte kanonische Zustandsquelle entsteht
- alle Hilfeauslöser semantisch beschriftbar sind
- Offen/Geschlossen-Zustände deterministisch sind
- Hilfe ohne JavaScript-Fehler fail-soft bleibt
- bestehende Module ohne Hilfe weiterhin vollständig nutzbar bleiben

## TIEF-Akzeptanzkriterien

TIEF muss für die spätere Implementierung mindestens prüfen:

- Firefox und Chrome
- Hilfe öffnen → korrekter Themenbereich erscheint
- Hilfe schließen → Hauptoberfläche bleibt unverändert
- Tastaturweg vollständig
- Fokus bleibt sichtbar und logisch
- Öffnen/Schließen verliert den Fokus nicht
- Screenreader-Semantik für Auslöser und aufklappbare Bereiche
- 100 / 125 / 150 / 175 / 200 % Zoom
- kleine Fensterbreite
- große Schrift
- reduced motion
- kein horizontales Scrollen durch die Hilfe bei vorgesehenen Testgrößen
- fehlender Hilfetext → verständlicher neutraler Fallback
- unbekannter Zustand → keine erfundene Erklärung
- Hilfeausfall → bestehende Module bleiben bedienbar
- bestehende P0.1–P0.5b-Regressionen bleiben vollständig grün
- Native Tauri-E2E bestätigt, dass Start, bestehende Kernfunktionen und Shutdown unverändert funktionieren

## Failure-Injection-Pflichtfälle

Mindestens diese Fälle müssen für eine spätere Implementierung kontrolliert geprüft werden:

1. Hilfethema nicht vorhanden
2. unbekannter referenzierter Zustand
3. Hilfeelement wird während Fokusbedienung geöffnet und geschlossen
4. mehrfach schnelles Öffnen/Schließen desselben Hilfeabschnitts
5. mehrere Hilfebereiche nacheinander öffnen
6. Hilfe-JavaScript fällt aus → Kernoberfläche bleibt benutzbar

## Abbruchbedingungen

P0.6 wird gestoppt und der Scope neu bewertet, wenn für die Umsetzung eines dieser Dinge nötig erscheint:

- neue produktive Datenhaltung
- neuer Hintergrundprozess
- neue native Berechtigung
- neue Drittanbieter-Runtime-Abhängigkeit
- komplexe Router- oder Navigationsarchitektur
- eigenständige Diagnose-Engine
- automatische Reparatur
- generative KI oder Netzwerkzugriff
- große Umstrukturierung bestehender Module

Keiner dieser Punkte darf still in P0.6 hineingezogen werden.

## Gate-A-Widerspruchsprüfung

Gate-A gilt nur als fachlich widerspruchsfrei, wenn bestätigt ist:

- Hilfe bleibt rein lesend
- Hilfe besitzt keine zweite fachliche Wahrheit
- bestehende Module bleiben ohne Hilfe vollständig nutzbar
- bestehende Fehlerbehandlung wird erklärt, nicht ersetzt
- Progressive Disclosure ist mit dem Mastervertrag konsistent
- Accessibility ist ein hartes Gate, kein Nachtrag
- keine neue Dependency oder Berechtigung ist erforderlich
- P0.5b-Freeze bleibt vollständig unberührt

## Gate-Reihenfolge

`P0.6 Gate-A Vertrag → SCHNELL → TIEF → Gate-A einfrieren → kleinste Implementierung separat spezifizieren → erst danach Funktionscode`

Bis Gate-A vollständig geprüft und grün ist, darf **kein P0.6-Funktionscode** entstehen.

## Bekannte Grenzen dieses Gate-A-Stands

- Die konkrete visuelle Platzierung der Hilfeauslöser ist noch nicht festgelegt.
- Es ist noch nicht festgelegt, ob die erste Implementierung eine zentrale Hilfeseite, kontextuelle Hilfekarten oder eine Kombination aus beidem verwendet.
- Eine Suchfunktion ist ausdrücklich nicht Teil des ersten P0.6-Slices.
- Umfang und Wortlaut der einzelnen Hilfetexte werden erst nach Gate-A-Abnahme festgelegt.

Diese Punkte blockieren Gate-A nicht, solange keine Implementierungsentscheidung vorweggenommen wird.

## Nächster Schritt nach Gate-A

Erst nach vollständig grünem Gate-A:

**P0.6 Gate-B – den kleinsten konkreten UI-Slice festlegen, mit maximal einem zentralen Einstieg und einem klar begrenzten ersten Hilfethema.**

Noch keine breite Hilfeabdeckung und keine Zusatzfunktionen.
