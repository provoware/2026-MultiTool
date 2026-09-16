# P0.6 – Gate-D · Accessibility- und Bedienvertrag

## Status

- Ausgangspunkt ist die vollständig geprüfte Gate-C-Basis `a09d566afc5b131ecd59ba59197fd51f8f0fe5e0`.
- Gate-D erweitert **keine Funktion** und fügt **kein weiteres Hilfethema** hinzu.
- Geprüft wird ausschließlich der vorhandene Slice `Hilfe → Systemstatus verstehen`.

## Ziel

Gate-D weist nach, dass der vorhandene Hilfe-Slice bei Tastaturbedienung, Fokuswechsel, großer Darstellung und schnellem wiederholtem Bedienen ruhig und deterministisch bleibt.

## Harte Ausschlüsse

Keine neue Fachfunktion, kein zweites Hilfethema, keine neue Persistenz, keine Backendänderung, keine neue Runtime-Abhängigkeit, kein Router-Umbau, keine Systemberechtigung und keine Änderung der Systemstatus-Datenquelle.

## D1 Tastaturvertrag

Pflichtfälle:

1. `Hilfe` ist ohne Maus erreichbar.
2. `Enter` und `Leertaste` aktivieren den nativen Button erwartungsgemäß.
3. Beim Öffnen landet der Fokus sichtbar und deterministisch auf `#helpTitle`.
4. Die beiden nativen `summary`-Elemente sind in logischer Reihenfolge erreichbar.
5. Beide Disclosure-Bereiche lassen sich ohne Maus öffnen und schließen.
6. Kein verborgenes Element erhält Fokus.
7. Es entsteht keine Tastaturfalle.

## D2 Fokus-Rückgabe

Beim Schließen der Hilfe muss der Fokus deterministisch auf `#helpBtn` zurückkehren. Der Button bleibt sichtbar und besitzt danach weiterhin den korrekten zugänglichen Namen `Hilfe`.

Schnelles wiederholtes Öffnen/Schließen darf weder Fokusverlust noch Fokus auf `body` erzeugen.

## D3 Semantik

Pflicht:

- `#helpBtn` kontrolliert `#panelHelp` über `aria-controls`.
- `aria-expanded` entspricht stets dem tatsächlichen Sichtzustand.
- `#panelHelp` besitzt `aria-labelledby="helpTitle"`.
- Überschriftenhierarchie bleibt `h2 → h3 → h4`.
- `details/summary` bleiben native Disclosure-Elemente; keine parallele ARIA-Nachbildung.
- Keine Information wird ausschließlich über Farbe vermittelt.

## D4 Zoom und große Darstellung

Pflichtmatrix: 100 %, 125 %, 150 %, 175 % und 200 %.

Bei jeder Stufe müssen Hilfe-Button, Überschrift, Kurztext und beide Disclosure-Auslöser vollständig erreichbar bleiben. Es darf keine Überlagerung der Hauptnavigation, kein abgeschnittener Pflichtinhalt und kein horizontales Pflichtscrollen durch den Hilfe-Slice entstehen.

Zusätzlich wird eine große Systemschrift bzw. äquivalente Browser-Schriftvergrößerung geprüft. Lange technische Begriffe müssen umbrechen können.

## D5 Kleine Fensterbreite

Bei der bereits in den Regressionstests verwendeten kleinsten unterstützten Fensterbreite bleibt der Hilfe-Slice bedienbar. Header-Aktionen dürfen umbrechen, aber weder Hilfe-Button noch Statusanzeige dürfen sich gegenseitig unbedienbar machen.

## D6 Bewegungsruhe

Der Hilfe-Slice darf keine für seine Bedienung notwendige Animation voraussetzen. Bei `prefers-reduced-motion: reduce` bleibt die komplette Bedienlogik identisch nutzbar.

## D7 Robustheit

Pflichtfälle:

- Hilfe fünfmal schnell öffnen/schließen.
- Beide Disclosure-Bereiche mehrfach schnell umschalten.
- Hilfe öffnen, Disclosure öffnen, Hilfe schließen, erneut öffnen.
- Fokus bleibt dabei immer auf einem sichtbaren Element.
- Kein Produktzustand, Systemstatus oder Workspace-Zustand wird durch diese Bedienung verändert.

## D8 SCHNELL-Gate

SCHNELL muss mindestens nachweisen:

- exakt ein `#helpBtn` und ein `#panelHelp`;
- `aria-controls="panelHelp"` und deterministisches `aria-expanded`;
- Fokusziel `#helpTitle` beim Öffnen und `#helpBtn` beim Schließen;
- keine neue Runtime-Abhängigkeit;
- keine Backend-/Persistenzänderung;
- bestehende Format-, Lint-, Unit- und Vertragsprüfungen grün.

## D9 TIEF-Gate

TIEF muss mindestens Firefox/Chrome sowie Native Tauri-E2E abdecken und nachweisen:

1. reine Tastaturbedienung;
2. sichtbaren Fokus beim Öffnen und nach Rückgabe;
3. Disclosure-Bedienung ohne Maus;
4. wiederholtes schnelles Öffnen/Schließen;
5. Zoommatrix 100/125/150/175/200 %;
6. große Schrift und kleine Fensterbreite;
7. unveränderte P0.1–P0.5b-Regressionen;
8. unveränderte Native-Start-/Kern-/Shutdown-Strecke.

## D10 Fehlerregel

Ein Befund wird nur innerhalb des vorhandenen Hilfe-Slices korrigiert. Erfordert die Korrektur eine neue Architektur, ein weiteres Hilfethema, Backendlogik oder einen Layout-Neubau außerhalb des Hilfeplatzes, wird Gate-D gestoppt und der Scope neu bewertet.

## Gate-D-Freigabe

Gate-D ist erst grün, wenn der reine Vertragsstand SCHNELL und TIEF einschließlich Native Tauri-E2E besteht. Erst danach dürfen gezielte fehlende Regressionstests für den bestehenden Slice ergänzt werden. Produktfunktionen werden dabei weiterhin nicht erweitert.
