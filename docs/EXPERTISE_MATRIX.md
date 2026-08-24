# Expertise Matrix

## Zweck

Das Projekt wird nicht nur aus einer einzelnen Entwicklerperspektive beurteilt. Für wichtige Änderungen werden mehrere Fachperspektiven kombiniert, damit Robustheit, Verständlichkeit und Wartbarkeit gleichzeitig steigen.

Die Expertisen sind Prüfbrillen, keine Ausrede für unnötige Architektur.

Leitregel:

> Die kleinste robuste Lösung gewinnt.

## E01 – Softwarearchitektur

Prüft:
- klare Verantwortungsgrenzen,
- kanonischen State,
- Abhängigkeitsrichtung,
- modulare Verträge,
- Vermeidung von Doppelarchitektur,
- Erweiterbarkeit ohne vorsorgliche Komplexität.

Kernfrage:
> Ist die Struktur einfacher zu verstehen als das Problem, das sie löst?

## E02 – Frontend Engineering

Prüft:
- semantisches HTML,
- modernes CSS,
- robuste Komponenten,
- Browserkompatibilität,
- State/UI-Trennung,
- progressive Enhancement.

Kernfrage:
> Bleibt die Oberfläche stabil, wenn Inhalte, Fenstergröße oder Browser variieren?

## E03 – UI/UX & Human Factors

Prüft:
- eine klare Hauptaktion,
- geringe kognitive Last,
- verständliche Labels,
- Progressive Disclosure,
- Empty/Error/Loading States,
- konsistente Interaktionsmuster.

Kernfrage:
> Weiß ein Erstnutzer ohne Erklärung, was er als Nächstes tun soll?

## E04 – Accessibility

Prüft:
- WCAG-2.2-AA-Ziele,
- Tastatur,
- Fokus,
- Screenreader-Semantik,
- Kontrast,
- Zoom 100–200 %, 
- große Schrift,
- reduzierte Bewegung,
- alternative Bedienwege zu Drag & Drop.

Kernfrage:
> Ist der Hauptworkflow auch ohne Maus und ohne perfekte Sehfähigkeit vollständig nutzbar?

## E05 – Runtime & Process Lifecycle

Prüft:
- Process Ownership,
- Backend-Start/Stop,
- Signale,
- Orphan-Prozesse,
- Ports,
- Timeouts,
- graceful shutdown,
- Cleanup.

Kernfrage:
> Hinterlässt Start, Abbruch oder Logout jemals einen unbekannten oder verwaisten Zustand?

## E06 – Dependency & Reproducibility Engineering

Prüft:
- minimale Runtime-Abhängigkeiten,
- Lockfiles,
- Versionsnachweis,
- automatische Auflösung,
- sichere Privilegiengrenzen,
- CI-Parität,
- Entfernung unnötiger Dependencies.

Kernfrage:
> Kann ein frisches System denselben Stand reproduzierbar aufbauen, ohne versteckte Handarbeit?

## E07 – Data Integrity & Recovery

Prüft:
- atomare Writes,
- Backup,
- Restore,
- Schema-Versionen,
- Migrationen,
- Undo,
- Crash-Sicherheit,
- Recovery-Nachweise.

Kernfrage:
> Was passiert exakt, wenn mitten in einer Mutation Strom, Prozess oder Datenträger ausfällt?

## E08 – Security Engineering

Prüft:
- Inputvalidierung,
- Pfadsicherheit,
- Rechte,
- externe Prozesse,
- Shell-Injection,
- Secrets,
- sichere Defaults,
- Least Privilege.

Kernfrage:
> Welche Eingabe oder Berechtigung könnte das Tool dazu bringen, mehr zu tun als beabsichtigt?

## E09 – Observability & Diagnose

Prüft:
- stabile Fehlercodes,
- laienverständliche Fehlertexte,
- technische Details auf Wunsch,
- Session-/Job-IDs,
- Logrotation,
- Diagnoseexport,
- Ursachenhinweise statt bloßer Symptome.

Kernfrage:
> Kann ein Fehler nachträglich verstanden werden, ohne den Nutzer mit Debugtext zu überfordern?

## E10 – Test & Failure Engineering

Prüft:
- Unit,
- Integration,
- E2E,
- Regression,
- Failure Injection,
- realistische Extremfälle,
- deterministische Tests,
- sinnvolle Quality Gates.

Kernfrage:
> Welche reale Störung wurde noch nicht absichtlich provoziert?

## E11 – Release & Provenance Engineering

Prüft:
- Version,
- Candidate-SHA,
- Manifest,
- Prüfsummen,
- reproduzierbaren Build,
- unveränderliche Artefakte,
- Changelog,
- Restore-Nachweis.

Kernfrage:
> Ist beweisbar, dass exakt das getestete Artefakt veröffentlicht wird?

## E12 – Performance & Resource Engineering

Prüft:
- Startzeit,
- Interaktionslatenz,
- CPU/RAM/Disk,
- große Datenmengen,
- Streaming/Virtualisierung,
- Backpressure,
- Abbruch/Pause langer Jobs.

Kernfrage:
> Was passiert im realistischen Worst Case statt nur im Demo-Datensatz?

## E13 – Laien-Onboarding

Prüft:
- Klick-und-Start,
- verständliche Voraussetzungen,
- sichere Defaults,
- Beispielprojekt/Testmodus,
- Hilfen im Kontext,
- Erfolgserlebnis früh im Workflow.

Kernfrage:
> Welche Stelle zwingt den Nutzer noch zu technischem Wissen, das das Tool selbst ableiten könnte?

## E14 – Knowledge & Learning Systems

Prüft:
- Learning Memory,
- Evidenz,
- Gültigkeitsbereich,
- Confidence,
- Dublettenerkennung,
- Regelverfall,
- Konflikte zwischen alten/neuen Erkenntnissen,
- Bug→Regression→Regel.

Kernfrage:
> Wird aus einem bestätigten Fehler dauerhaft bessere Prävention statt nur ein Logeintrag?

## E15 – Documentation & Knowledge Transfer

Prüft:
- README,
- Architektur,
- Startweg,
- Ordnerstruktur,
- Recovery,
- Fehlercodes,
- Entscheidungen,
- bekannte Grenzen.

Kernfrage:
> Kann eine neue Person ohne mündliche Erklärung den aktuellen Stand verstehen und sicher weiterarbeiten?

## E16 – Consistency & Design-System Engineering

Prüft:
- Design Tokens,
- Abstände,
- Typografie,
- Statusfarben,
- Buttonhierarchie,
- wiederkehrende Komponenten,
- gleiche Begriffe für gleiche Dinge.

Kernfrage:
> Muss der Nutzer dieselbe Interaktion an verschiedenen Stellen neu lernen?

## E17 – State-Machine & Workflow Engineering

Prüft:
- definierte Zustände,
- erlaubte Übergänge,
- Abbruchpunkte,
- Resume,
- idempotente Aktionen,
- verbotene Zwischenzustände.

Kernfrage:
> Kann das System in einem Zustand landen, für den kein sicherer nächster Übergang definiert ist?

## E18 – Maintainability & Technical-Debt Review

Prüft:
- Dateigrößen,
- Komplexität,
- Duplikate,
- TODOs mit Begründung,
- veraltete Abhängigkeiten,
- öffentliche Verträge,
- bewusst akzeptierte Schulden.

Kernfrage:
> Welche heutige Abkürzung erzeugt wahrscheinlich den teuersten zukünftigen Umbau?

## Review-Modell

Nicht jede Änderung braucht alle 18 Expertisen gleich tief.

### Minimaler Slice
Mindestens:
- E01 Architektur
- E03 UX
- E10 Tests
- passende Fachexpertise des betroffenen Bereichs

### Daten-/Mutation-Slice
Zusätzlich zwingend:
- E07 Data Integrity
- E08 Security
- E09 Diagnose

### Start-/Backend-Slice
Zusätzlich zwingend:
- E05 Lifecycle
- E06 Dependencies
- E13 Onboarding

### UI-Slice
Zusätzlich zwingend:
- E02 Frontend
- E04 Accessibility
- E16 Design-System

### Release-Slice
Zusätzlich zwingend:
- E11 Release/Provenance
- E15 Dokumentation

## Konfliktregel

Wenn Expertisen widersprechen, gilt die Priorität:

1. Schutz vor Datenverlust und Sicherheitsfehlern
2. reproduzierbare Korrektheit
3. Verständlichkeit/Barrierefreiheit
4. Wartbarkeit
5. Performance
6. Komfort
7. zusätzliche Features

Abweichungen müssen begründet und als Entscheidung dokumentiert werden.
