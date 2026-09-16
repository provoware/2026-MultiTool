# P0.6 – Abschluss-/Freeze-Gate

Status: Spezifikation, keine Freigabe und kein Merge.

## Ziel

P0.6 darf erst als abgeschlossen eingefroren werden, wenn der tatsächlich implementierte Hilfe-Slice vollständig gegen Gate-A, Gate-B, Gate-C und Gate-D nachgewiesen ist. Dieses Gate erweitert weder Funktion noch Oberfläche.

## Erlaubter Umfang

- vorhandenen P0.6-Stand ausschließlich prüfen und dokumentieren
- Scope-Diff gegen die geprüften P0.6-Verträge auswerten
- vorhandene SCHNELL-/TIEF-/Regression-Nachweise auswerten
- unbeabsichtigte Änderungen an Produkt, Abhängigkeiten, Persistenz und Berechtigungen ausschließen
- bei vollständig grünem Nachweis einen unveränderlichen P0.6-Freeze-Kandidaten benennen

## Harte Ausschlüsse

- keine weiteren Hilfethemen
- keine neue UI-Funktion
- keine Änderung der Systemstatus-Fachlogik
- keine neue Persistenz oder Datenbank
- keine neue Runtime- oder Build-Abhängigkeit
- keine neuen Systemrechte oder Berechtigungen
- kein Refactoring außerhalb eines konkret nachgewiesenen P0.6-Fehlers
- kein Merge, Release oder Eingriff in PR #36 beziehungsweise die eingefrorene P0.5b-Basis

## Scope-Nachweis

Der Freeze-Kandidat muss nachvollziehbar zeigen:

1. Gate-A: Hilfe bleibt lokal, rein lesend, fail-soft und ohne zweite Zustandsquelle.
2. Gate-B: genau ein globaler Hilfe-Einstieg und genau das Thema „Systemstatus verstehen“.
3. Gate-C: nur der vereinbarte minimale Hilfe-Slice ist Produktfunktion geworden.
4. Gate-D: Tastatur, Fokus-Rückgabe, Disclosure-Semantik und Zoom/Reflow sind regressionsgeschützt.
5. Keine Änderung außerhalb dieses Vertrags ist für den Abschluss erforderlich.

## Änderungsintegrität

Vor Freeze müssen Diff und Historie bestätigen:

- keine unbeabsichtigten Änderungen an Rust-/Backend-Fachlogik
- keine neuen Dependencies oder Lockfile-Abweichungen durch P0.6
- keine neue Persistenz, Konfiguration oder Migration
- keine Erweiterung von Tauri-/Systemberechtigungen
- keine Änderung an P0.5b oder PR #36
- keine versteckte Kopplung der Hilfe an Netzwerk, Cloud oder externe Dienste

Ein ungeklärter Befund stoppt das Freeze-Gate. Er darf nicht durch Scope-Erweiterung oder einen pauschalen Cleanup verdeckt werden.

## Accessibility-Abschluss

Der bestehende Hilfe-Slice muss weiterhin:

- vollständig per Tastatur erreichbar und bedienbar sein
- beim Öffnen einen deterministischen Fokus erhalten
- beim Schließen den Fokus zum auslösenden Hilfe-Einstieg zurückgeben
- native beziehungsweise äquivalente zugängliche Disclosure-Semantik besitzen
- bei 150 % und 200 % Zoom ohne erzwungene horizontale Hauptbreite funktionieren
- ohne Hilfe weiterhin die vorhandenen Produktfunktionen vollständig bedienbar lassen

## SCHNELL-Akzeptanz

SCHNELL ist grün, wenn auf exakt demselben Freeze-Kandidaten:

- Vertrags-/Foundation-Tests bestehen
- der P0.6-Accessibility-Guard besteht
- Dependency-Risikoprüfung besteht
- Rust fmt/check/clippy bestehen
- Kern-Unit-Tests bestehen
- keine P0.6-fremde Änderung für einen grünen Lauf nötig ist

## TIEF-Akzeptanz

TIEF ist grün, wenn auf exakt demselben Freeze-Kandidaten:

- vollständige Web-/Vertragsprüfung besteht
- relevante Browser-/Accessibility-Regressionen bestehen
- Rust-Integration besteht
- Native Tauri-E2E besteht
- Fehlernachweise keine ungeklärte P0.6-Regression enthalten

Ein Retry ist nur zur Unterscheidung eines flüchtigen Infrastruktur-/E2E-Ausreißers zulässig. Der Kandidat darf dabei nicht verändert werden. Ein reproduzierbarer Fehler stoppt den Freeze.

## Freeze-Entscheidung

P0.6 darf nur eingefroren werden, wenn alle obigen Punkte auf einem identischen SHA grün sind. Danach sind weitere Änderungen eine neue, ausdrücklich spezifizierte Linie und nicht Teil dieses Freeze-Kandidaten.

Bis dahin gilt: kein Merge und keine Erweiterung der Hilfe-Zentrale.
