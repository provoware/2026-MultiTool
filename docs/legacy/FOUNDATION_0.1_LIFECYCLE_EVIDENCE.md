# Historischer Prüfnachweis – Foundation 0.1

Dieser Nachweis dokumentiert die inzwischen ersetzte Node-/localhost-/Launcher-Architektur.

Die damaligen Prüfungen umfassten unter anderem:
- belegte und fremde Ports,
- Backend-Startfehler,
- SIGINT und SIGTERM,
- stale PID-Dateien,
- fehlende Laufzeitabhängigkeiten,
- hängende Child-Prozesse mit begrenztem Shutdown,
- Exit-vor-Listener-Races,
- Launcher-Ende-zu-Ende-Pfade.

Mit der Tauri-Migration 0.3.1 wurden eigener localhost-Server, eigener Launcher, PID-/Port-Ownership und die zugehörigen produktiven Tests entfernt. Die damaligen Regressionen bleiben in `knowledge/REGRESSION_REGISTRY.jsonl` mit Status `RETIRED` erhalten. Sie dürfen nicht mehr als aktive Tauri-Nachweise gezählt werden.

Die weiterhin gültigen allgemeinen Lehren – begrenzte Wartezeiten, klare Ownership, reproduzierbare Abhängigkeiten und Beweis-vor-Behauptung – werden in den aktuellen Tauri-/CI-Verträgen weitergeführt.
