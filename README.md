# 2026-MultiTool

## Startanleitung
1. Startroutine ausführbar machen (falls nötig): `chmod +x start.sh`
2. Start mit automatischer Prüfung: `./start.sh`
   * `--check-only`: Nur Prüfungen (z. B. virtuelle Umgebung, Abhängigkeiten, Port) ohne Serverstart.
   * `--debug`: Ausführliches Logging in `logs/start.log` aktivieren.

Die Routine legt eine virtuelle Umgebung an (`.venv`), liest `config/start.conf` als Konfiguration, installiert Abhängigkeiten aus `requirements.txt`, prüft den gewünschten Port und startet anschließend das Frontend (`python -m http.server`). Nach dem Start erfolgt ein kurzer Verfügbarkeits-Check.
Ein übersichtliches Werkzeug-Paket mit statischen HTML-Tools. Ziel ist maximale Barrierefreiheit, klare Bedienung und ein vollautomatischer Start.

## Schnellstart
1. **Voraussetzungen (Dependencies)**: Linux/Mac/WSL mit `python3`.
2. **Startskript**: `./start.sh` erzeugt automatisch eine virtuelle Umgebung (virtuelle Python-Box), installiert Abhängigkeiten und startet einen lokalen Webserver.
3. **Nur prüfen (Health-Check)**: `./start.sh --health` validiert Umgebung und endet ohne Serverstart.
4. **Port ändern (Port = Netzwerk-Adresse)**: `APP_PORT=8080 ./start.sh --no-serve` prüft auf Port 8080.

## Bedienung
- Öffne nach dem Start `http://localhost:8000` im Browser und wähle die gewünschte HTML-Datei aus.
- Buttons sind farblich hervorgehoben, Eingabefelder besitzen Beispiele (Placeholders) für schnellen Einstieg.
- Dark/Light-Theme (Helles/Dunkles Farbschema) schaltest du direkt in den Tools um, soweit angeboten.

## Features und Standards
- **Barrierefreiheit**: Klare Kontraste, skalierbares Layout und einfache Sprache. Fachbegriffe stehen in Klammern mit kurzer Erklärung.
- **Logging & Debug**: `LOG_LEVEL=debug ./start.sh --health` zeigt jeden Schritt; regulär nur wichtige Meldungen.
- **Validierung**: Das Startskript prüft Eingaben (z. B. gültiger Port) und bestätigt Erfolge mit gut lesbaren Meldungen.
- **Modularität**: Statische HTML-Tools bleiben unabhängig; gemeinsame Abhängigkeiten liegen in `requirements.txt` und der virtuellen Umgebung `.venv`.

## Tests und Qualität
- **Gesundheitscheck**: `./start.sh --health` kontrolliert, ob Python vorhanden ist und Abhängigkeiten installierbar sind.
- **Format und Style**: HTML/CSS folgen responsiven Layouts und klaren Kontrastfarben; weitere Linting-Tools können in `requirements.txt` ergänzt werden.

## Struktur
- `start.sh` – Automatischer Setup- und Startprozess.
- `requirements.txt` – Zentrale Paketliste (aktuell minimal).
- `*.html` – Die UI-Tools, direkt im Browser nutzbar.
- `Inputpool.txt` / `todo.txt` – Aufgaben, Ideen und Umsetzungsstatus.

## Support und Erweiterung
- Wünsche und Ideen zuerst in `Inputpool.txt` notieren; umsetzbare Aufgaben werden in `todo.txt` gepflegt.
- Erweiterungen sollten modular bleiben (eigenständige Dateien/Ordner) und Kontrast-/Theme-Vorgaben respektieren.
