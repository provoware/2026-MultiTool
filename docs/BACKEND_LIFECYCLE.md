# Backend Lifecycle Contract

## Ziel

Lokale Backend-Dienste und Hilfsprozesse sollen für Laien automatisch, sichtbar und sicher mit der Anwendung gestartet und wieder beendet werden.

Der Nutzer soll weder Prozesse suchen noch Ports freigeben noch hängen gebliebene Server manuell beenden müssen.

## Grundmodell

`START → PREFLIGHT → BACKEND START → READY CHECK → BROWSER/UI → RUN → SHUTDOWN REQUEST → AUTOSAVE/CHECKPOINT → GRACEFUL STOP → VERIFY CLOSED`

## Process Ownership

Jede gestartete Backend-Instanz braucht:
- eindeutige Session-ID,
- Owner-/Parent-PID,
- Backend-PID,
- Startzeit,
- Port,
- Projektpfad,
- Lifecycle-Status.

Keine anonymen Hintergrundprozesse.

## Start

1. prüfen, ob bereits eine gültige Instanz zur aktuellen Session läuft,
2. stale PID-/Lockdateien erkennen,
3. Portzustand prüfen,
4. nötige Runtime-Abhängigkeiten über Dependency Autopilot prüfen,
5. Backend als kontrollierten Kindprozess starten,
6. Readiness/Health prüfen,
7. erst danach UI/Browser öffnen,
8. sichtbaren Status `BEREIT` melden.

## Automatisches Beenden

Backend muss kontrolliert beendet werden bei:
- normalem Beenden der Startroutine,
- Benutzerabbruch,
- `SIGINT`,
- `SIGTERM`,
- `SIGHUP`/Logout soweit vom Hostprozess empfangen,
- kontrolliertem Anwendungs-Logout,
- erkanntem verwaistem Parent-Prozess.

Shell-/Launcher-Ebene soll geeignete `trap`-Handler für `EXIT`, `INT`, `TERM`, `HUP` verwenden.

## Shutdown-Reihenfolge

1. neue Mutationen stoppen,
2. laufende sichere Arbeit abschließen oder kontrolliert abbrechen,
3. nötigen Autosave/Checkpoint durchführen,
4. Datenintegrität prüfen,
5. graceful shutdown anfordern,
6. Timeout abwarten,
7. nur falls nötig kontrolliert eskalieren,
8. Kindprozesse beenden,
9. PID-/Lock-/Sessiondateien bereinigen,
10. Portfreigabe verifizieren,
11. Abschlussstatus anzeigen.

## Abbruch

Ein Abbruch darf nicht einfach `kill -9` bedeuten.

Standard:
- `TERM`/Graceful Shutdown,
- definierter Timeout,
- zweite kontrollierte Eskalationsstufe,
- harte Beendigung nur als letzte Stufe.

Jede Eskalation wird protokolliert.

## Logout

Wenn die Anwendung einen eigenen Logout kennt:
- ungespeicherte Änderungen erkennen,
- Autosave/Checkpoint ausführen,
- aktive Jobs kontrolliert stoppen,
- Backend herunterfahren,
- Erfolg bestätigen.

Bei Desktop-/Session-Logout übernimmt der Launcher die verfügbaren Hostsignale. Da Browser-/Desktop-Umgebungen Signale unterschiedlich liefern können, muss zusätzlich ein Orphan-/Heartbeat-Mechanismus verhindern, dass ein lokales Backend dauerhaft verwaist weiterläuft.

## Browser schließen

Das bloße Schließen eines Browser-Tabs ist kein verlässlicher Prozess-Lifecycle-Trigger. Deshalb darf das Backend nicht ausschließlich von `beforeunload` oder ähnlichen Browserereignissen abhängen.

Stattdessen:
- Launcher bleibt Process Owner,
- Backend beobachtet Session/Heartbeat,
- optionaler expliziter `Beenden`-Befehl in der UI,
- Orphan-Timeout nur mit sicherer Datenlogik.

## Portkonflikte

Bei belegtem Port:
1. prüfen, ob es die eigene gültige Instanz ist,
2. stale Instanz sicher bereinigen, falls beweisbar,
3. sonst transparent einen freien Port wählen,
4. gewählten Port sichtbar melden,
5. keine fremden Prozesse beenden.

## Self-Healing

Automatisch erlaubt:
- stale eigene PID-/Lockdatei bereinigen,
- eigenen verwaisten Backendprozess kontrolliert schließen,
- freien Fallback-Port wählen,
- fehlenden Runtime-Ordner anlegen.

Nicht automatisch erlaubt:
- fremde Prozesse beenden,
- unbekannte Dateien löschen,
- Root-/Admin-Aktionen ohne Freigabe,
- beschädigte Nutzerdaten ohne Backup und Verify überschreiben.

## Grafisches Feedback

Jeder Lifecycle-Schritt besitzt Klartext + Status:
- 🔵 IN ARBEIT
- 🟢 BESTANDEN
- 🟡 HINWEIS
- 🔴 BLOCKIERT

Beispiele:
- `🟢 Backend gestartet – Port 5000`
- `🟡 Port 5000 belegt – sicher auf 5001 gewechselt`
- `🔴 Backend nicht bereit – keine Nutzerdaten verändert`

## Tests

Mindestens Regressionen für:
- Normalstart und normales Ende,
- Ctrl+C,
- TERM,
- simuliertes HUP soweit testbar,
- belegten Port,
- stale PID,
- Backend startet nicht,
- Backend hängt beim Shutdown,
- Autosave vor Shutdown,
- Orphan-Erkennung,
- wiederholten Start ohne Doppelprozess.
