# 2026-MultiTool

## Startanleitung
1. Startroutine ausführbar machen (falls nötig): `chmod +x start.sh`
2. Start mit automatischer Prüfung: `./start.sh`
   * `--check-only`: Nur Prüfungen (z. B. virtuelle Umgebung, Abhängigkeiten, Port) ohne Serverstart.
   * `--debug`: Ausführliches Logging in `logs/start.log` aktivieren.

Die Routine legt eine virtuelle Umgebung an (`.venv`), liest `config/start.conf` als Konfiguration, installiert Abhängigkeiten aus `requirements.txt`, prüft den gewünschten Port und startet anschließend das Frontend (`python -m http.server`). Nach dem Start erfolgt ein kurzer Verfügbarkeits-Check.
