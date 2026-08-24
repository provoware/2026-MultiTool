# Dependency Autopilot

## Ziel

Alle benötigten Abhängigkeiten werden automatisch erkannt, klassifiziert, transparent erklärt und – soweit sicher möglich – automatisch aufgelöst. Die Startroutine soll für Laien funktionieren, ohne versteckte Systemänderungen vorzunehmen.

## Klassen

### 1. Runtime-Abhängigkeiten
Nur das, was zum tatsächlichen Start und Betrieb benötigt wird.

### 2. Development-Abhängigkeiten
Linting, Tests, Accessibility, Build- und Analysewerkzeuge. Diese dürfen den normalen Nutzerstart nicht unnötig verlangsamen.

### 3. Optionale Komfort-Helfer
Beispiel: `kdialog` für grafische Startmeldungen unter KDE. Fehlt ein Helfer, muss ein sauberer Fallback existieren.

### 4. System-Abhängigkeiten
Pakete, die außerhalb des Projektordners installiert werden müssen. Sie dürfen niemals still oder ohne sichtbare Freigabe mit Root-/Admin-Rechten installiert werden.

## Ablauf

`DISCOVER → CLASSIFY → EXPLAIN → RESOLVE → VERIFY → RECORD`

1. **Discover** – benötigte Programme, Versionen und Dateien erkennen.
2. **Classify** – Runtime, Development, Optional oder System.
3. **Explain** – dem Nutzer in Klartext zeigen, was fehlt und wofür es benötigt wird.
4. **Resolve** – sichere projektlokale Abhängigkeiten automatisch installieren; privilegierte Systemänderungen nur nach expliziter Freigabe.
5. **Verify** – Version, Startfähigkeit und ggf. Hash/Lockfile prüfen.
6. **Record** – Ergebnis für Diagnose und Entwicklung dokumentieren.

## Reproduzierbarkeit

- Lockfiles sind verbindlich.
- Keine unfixierten kritischen Produktionsabhängigkeiten.
- Installationsweg ist deterministisch und dokumentiert.
- Entwicklung und CI verwenden möglichst denselben Dependency-Vertrag.

## Transparenz

Jede automatische Aktion zeigt mindestens:
- Name der Abhängigkeit
- benötigte Version/Spanne
- Grund
- Herkunft
- Installationsart
- Ergebnis
- ob ein Neustart erforderlich ist

## Sicherheitsregel

`sudo`, `pkexec` oder vergleichbare Rechteerhöhung niemals versteckt ausführen.

Wenn eine Systemabhängigkeit fehlt:
1. sichere automatische Lösung vorbereiten,
2. grafisch oder in Klartext erklären,
3. einmalige explizite Freigabe anfordern,
4. Installation ausführen,
5. Ergebnis prüfen,
6. protokollieren.

## Startgeschwindigkeit

Normalstart prüft nur zwingende Runtime-Abhängigkeiten und bekannte schnelle Health-Signale.

Tiefe Entwicklungsprüfungen laufen über getrennte Modi:
- `--health`
- `--repair`
- `--test`
- `--debug`

## Dokumentation während der Entwicklung

Neue Abhängigkeiten dürfen nur eingeführt werden, wenn dokumentiert ist:
- welches Problem sie lösen,
- warum Standardmittel nicht ausreichen,
- Runtime oder Development,
- Lizenz/Herkunft soweit relevant,
- Versionsstrategie,
- Fallback/Removal-Plan,
- Tests.

Die kanonische maschinenlesbare Abhängigkeitsliste soll später aus `package.json`/Lockfile und einem kleinen Projektmanifest ableitbar sein; keine Doppelpflege ohne Grund.
