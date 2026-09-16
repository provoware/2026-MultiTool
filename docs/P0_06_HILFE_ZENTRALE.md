# P0.6 – Hilfe-Zentrale · Gate-A + Gate-B-Vertrag

## 🚦 Status

- 🟢 Ausgangsbasis ist der eingefrorene Stand `f2dbc6887813c1ff87bbc41bf9e8932e99d80641`.
- 🟢 Gate-A definiert den fachlichen Rahmen für P0.6.
- 🟦 Gate-B legt ausschließlich den kleinsten konkreten UI-Slice fest.
- 🔒 Noch keine Funktionsimplementierung, keine neue Runtime-Abhängigkeit und keine Änderung an bestehenden P0.1–P0.5b-Fachfunktionen.

## Gate-A – verbindlicher Rahmen

P0.6 ergänzt eine laienfreundliche, rein lesende Hilfe für vorhandene Bereiche. Grundstruktur:

`Kurz erklärt → Schritt für Schritt → Technische Details`

Die Hilfe erklärt vorhandene Zustände und Funktionen, erzeugt aber keinen eigenen produktiven Systemzustand.

### Harte Ausschlüsse

Keine Cloud, KI, Telemetrie, neue Persistenz, Datenbanktabelle, Reparaturautomatik, Shell-Befehle, Paketinstallation, Systemrechte, Hintergrunddienste, Diagnose-Engine, Suchmaschine, Drittanbieter-Runtime-Abhängigkeit oder Änderung der P0.1–P0.5b-Fachlogik.

### Fehlergrenze

Ein Hilfefehler darf keinen Produktbereich als defekt markieren oder eine bestehende Hauptaktion blockieren. Fehlende Hilfe fällt neutral zurück; unbekannte Zustände werden nicht erfunden.

### Accessibility

Tastatur, sichtbarer Fokus, logische Fokusreihenfolge, semantische Beschriftung, Screenreader-Beziehungen, Status nicht nur über Farbe, große Schrift, 100–200 % Zoom, kleine Fensterbreite und `prefers-reduced-motion` sind harte Gates.

---

# Gate-B – kleinster konkreter UI-Slice

## B1 Ziel

Die erste P0.6-Implementierung darf genau **einen zentralen Hilfe-Einstieg** und genau **ein Hilfethema** bereitstellen.

Sie soll beweisen, dass das Hilfeprinzip technisch, semantisch und barrierefrei in die vorhandene Oberfläche passt, bevor weitere Themen hinzukommen.

## B2 Zentraler Einstieg

Es gibt genau einen neuen Hilfeauslöser mit der sichtbaren Bezeichnung:

**`Hilfe`**

Vertrag:

- nur einmal in der bestehenden Hauptnavigation bzw. deren bereits vorgesehenem globalen Bedienbereich
- kein zweiter kontextueller Hilfe-Button im ersten Slice
- kein Floating-Button
- kein neues Menüsystem
- keine neue Router-Architektur
- bestehende Navigation bleibt strukturell erhalten
- Auslöser ist als echtes fokussierbares Bedienelement semantisch erkennbar
- Aktivierung per Maus sowie `Enter` und `Leertaste`
- sichtbarer Fokus muss dem bestehenden Designsystem entsprechen

Die konkrete CSS-Position darf sich an der bestehenden Navigationsstruktur orientieren. Gate-B verlangt keine Layout-Neukonstruktion.

## B3 Erstes Hilfethema

Das einzige Hilfethema des ersten Slices ist:

**`Systemstatus verstehen`**

Begründung:

- rein lesender vorhandener Bereich
- hoher Erklärnutzen für Laien
- keine produktive Mutation nötig
- Zustände lassen sich erklären, ohne eine zweite Datenquelle einzuführen
- Fehler- und Warnsprache kann früh gegen den Gate-A-Vertrag geprüft werden

Andere Themen bleiben in diesem Slice ausdrücklich unimplementiert.

## B4 Inhalt des ersten Hilfethemas

### Kurz erklärt

Muss knapp beantworten:

- Wofür ist der Systemstatus da?
- Was bedeutet ein normaler Zustand?
- Was bedeutet eine Warnung grundsätzlich?
- Muss der Nutzer unmittelbar handeln?

Keine Rohdiagnose und keine erfundenen Ursachen.

### Schritt für Schritt

Maximal ein normaler Bedienweg:

1. Systemstatus öffnen bzw. betrachten.
2. sichtbaren Status lesen.
3. bei Warnung den bereits vorhandenen Hinweis beachten.
4. keine Änderung durchführen, die das Produkt selbst nicht bereits anbietet.

### Technische Details

Standardmäßig geschlossen. Darf nur bereits vorhandene, sicher verfügbare Statusbegriffe und Datenquellen erklären. Keine neue Systemabfrage.

## B5 Darstellungsvertrag

Der Hilfe-Einstieg öffnet eine **nicht-modale Hilfeansicht innerhalb der bestehenden App-Struktur**.

Pflicht:

- Hauptoberfläche bleibt erreichbar
- kein Dialogzwang
- kein Fokus-Fangen
- kein Overlay, das die Kernoberfläche unbenutzbar macht
- Hilfebereich besitzt eine sichtbare Überschrift `Hilfe`
- erstes Thema besitzt eine semantische Überschrift `Systemstatus verstehen`
- `Kurz erklärt` ist unmittelbar sichtbar
- `Schritt für Schritt` und `Technische Details` dürfen als aufklappbare Bereiche umgesetzt werden
- lange Inhalte standardmäßig geschlossen
- Schließen bzw. Verlassen der Hilfe darf bestehende Produktzustände nicht verändern

## B6 Fokusvertrag

### Öffnen

Nach Aktivierung von `Hilfe`:

- Fokus wechselt deterministisch auf die Überschrift bzw. den definierten Einstieg der Hilfeansicht oder bleibt auf dem Auslöser, wenn die bestehende Navigationssemantik dies verlangt
- die gewählte Variante muss in Browser- und Native-E2E identisch und testbar sein
- kein Fokus darf auf `body`, ein verborgenes Element oder außerhalb der App fallen

### Innerhalb der Hilfe

Tab-Reihenfolge:

`Hilfe-Einstieg → Hilfeinhalt → Schritt-für-Schritt-Auslöser → Technische-Details-Auslöser → regulär nächstes vorhandenes Bedienelement`

Nur tatsächlich interaktive Elemente kommen in die Tab-Reihenfolge.

### Verlassen

Beim Wechsel zurück in einen vorhandenen Hauptbereich:

- Fokus landet auf einem sichtbaren, semantisch sinnvollen Element
- kein Fokusverlust
- kein gespeicherter Produktzustand wird verändert

## B7 Semantikvertrag

Auf-/Zuklapp-Elemente müssen programmatisch besitzen:

- verständlichen zugänglichen Namen
- `aria-expanded` oder semantisch gleichwertigen nativen Zustand
- eindeutige Beziehung zum kontrollierten Inhalt
- deterministischen Offen/Geschlossen-Zustand

Überschriften dürfen keine Ebene überspringen, sofern die bestehende Seitenhierarchie dies vermeidet.

Keine Information darf ausschließlich durch Symbol, Farbe oder Position vermittelt werden.

## B8 Zoom- und Layoutvertrag

Pflichtprüfungen bei:

- 100 %
- 125 %
- 150 %
- 175 %
- 200 %

Dabei:

- kein Abschneiden des Hilfe-Hauptinhalts
- kein horizontales Pflichtscrollen bei den bereits vorgesehenen Testfenstern
- keine Überlagerung der Hauptnavigation
- keine springende Breite beim Auf-/Zuklappen
- lange technische Begriffe dürfen umbrechen
- große Systemschrift bleibt nutzbar

## B9 Fehlerfälle des ersten Slices

### Hilfethema fehlt

Neutraler Text:

**`Für diesen Punkt ist noch keine Hilfe hinterlegt.`**

Keine Exception bis in die Hauptoberfläche.

### Status unbekannt

Neutraler Text:

**`Dieser Zustand kann derzeit nicht erklärt werden.`**

Keine Ursachenvermutung.

### Hilfeansicht kann nicht aufgebaut werden

- vorhandene Navigation bleibt bedienbar
- Systemstatus bleibt bedienbar
- kein Reload-Loop
- kein automatischer Reparaturversuch

## B10 SCHNELL-Akzeptanzkriterien

Vor jeder Gate-B-Implementierungsfreigabe müssen automatisierbar sein:

- exakt ein globaler Hilfe-Einstieg
- exakt ein implementiertes Hilfethema
- keine neue Runtime-Abhängigkeit
- keine neue Persistenz oder Systemberechtigung
- keine Änderung an Systemstatus-Datenquelle oder Fachlogik
- semantischer Name des Hilfeauslösers vorhanden
- Auf-/Zuklappzustände deterministisch
- fehlendes Thema besitzt neutralen Fallback
- unbekannter Status besitzt neutralen Fallback
- bestehende Unit-/Vertrags-/Lint-/Formatprüfungen bleiben grün

## B11 TIEF-Akzeptanzkriterien

Mindestens Firefox, Chrome und Native Tauri-E2E prüfen:

1. App startet unverändert.
2. `Hilfe` ist einmal vorhanden und per Tastatur erreichbar.
3. Aktivierung öffnet die Hilfe ohne Produktmutation.
4. `Systemstatus verstehen` wird angezeigt.
5. `Kurz erklärt` ist direkt lesbar.
6. Schritt-für-Schritt-Bereich lässt sich per Maus und Tastatur öffnen/schließen.
7. Technische Details lassen sich per Maus und Tastatur öffnen/schließen.
8. Offen/Geschlossen-Semantik ist für Assistenztechnik erkennbar.
9. Fokus bleibt sichtbar und deterministisch.
10. Schnelles mehrfaches Öffnen/Schließen erzeugt keinen Fehler.
11. 100/125/150/175/200-%-Zoom bleibt stabil.
12. Große Schrift und kleine Fensterbreite bleiben bedienbar.
13. Unbekannter Status erzeugt keine erfundene Erklärung.
14. Fehlendes Thema fällt neutral zurück.
15. Wechsel aus der Hilfe verändert keinen vorhandenen Systemstatus.
16. bestehende P0.1–P0.5b-Regressionen bleiben grün.
17. Native Start-/Kernfunktions-/Shutdown-Strecke bleibt unverändert grün.

## B12 Failure-Injection

Pflichtfälle für die spätere Implementierung:

- Hilfethema absichtlich nicht vorhanden
- unbekannter Statuswert
- Hilfe fünfmal schnell öffnen/verlassen
- beide Disclosure-Bereiche mehrfach schnell umschalten
- Fokusbedienung bei geöffnetem Disclosure
- Hilfe-Rendering schlägt kontrolliert fehl; Kernoberfläche bleibt bedienbar

## B13 Scope-Abbruch

Implementierung sofort stoppen und Gate neu bewerten, wenn einer dieser Punkte nötig erscheint:

- zweiter Hilfe-Einstieg
- zweites Hilfethema
- Router-Umbau
- neue Datenquelle
- neue native Berechtigung
- neue Runtime-Abhängigkeit
- produktive Mutation
- Diagnose- oder Reparaturlogik
- Änderung der Systemstatus-Fachlogik
- Layout-Neubau außerhalb des notwendigen Hilfeplatzes

## B14 Gate-B-Freigaberegel

Gate-B ist erst bereit für Funktionscode, wenn:

- dieser Vertrag widerspruchsfrei zum bestehenden UI und Gate-A ist
- SCHNELL auf dem reinen Dokumentationsstand grün ist
- TIEF einschließlich Native Tauri-E2E auf demselben Dokumentations-Head grün ist
- der Diff weiterhin ausschließlich Dokumentation enthält

Bis dahin entsteht **kein P0.6-Funktionscode**.

## Nächster Schritt nach grünem Gate-B

**Gate-B-Dokumentationsstand einfrieren und danach in einem neuen, eng begrenzten Implementierungscommit ausschließlich den einen Hilfe-Einstieg plus `Systemstatus verstehen` umsetzen.**
