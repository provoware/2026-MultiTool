# Lerngedächtnis – Gültigkeit, Review und Widerspruchsschutz

## Zweck

`knowledge/LEARNING_MEMORY.jsonl` speichert bestätigte Erfahrungen aus Entwicklung und Nutzung. Es ist kein Laufzeitlog und darf keine unbewiesenen Einzelbeobachtungen automatisch zu globalen Regeln machen.

Der Grundkreislauf lautet:

`Beobachtung → Ursache → getestete Lösung → Evidenz → Regression → bestätigte Regel → regelmäßige Review`

## Schema-Version 2

Bestätigte oder aktive Lernerkenntnisse besitzen zusätzlich:

- `rule_key` – stabile fachliche Identität der Regel,
- `decision_effect` – `REQUIRE`, `FORBID`, `PREFER`, `AVOID` oder `INFO`,
- `validity.scope_level` – Gültigkeitsebene,
- `validity.project_types` – betroffene Projekttypen,
- `validity.platforms` – betroffene Plattformen,
- `validity.environments` – Entwicklung, CI, Runtime usw.,
- `validity.valid_from` – frühester Gültigkeitstag,
- `validity.valid_until` – optionales Ende des fachlichen Gültigkeitsfensters,
- `validity.review_at` – verbindlicher nächster Review-Termin,
- `validity.expires_at` – optionales hartes Ablaufdatum,
- `supersedes` – explizit abgelöste ältere Erkenntnisse.

Datumsfelder verwenden `YYYY-MM-DD`.

## Review-Regel

Ein Review-Termin löscht eine Regel nicht automatisch. Er markiert sie als prüfbedürftig. Spätere UI und Next-Step-Engine sollen fällige Reviews sichtbar priorisieren.

Ein überschrittenes `expires_at` ist strenger: Eine bestätigte/aktive Regel darf danach nicht still weiterwirken. Sie muss geprüft, verlängert oder auf `VERALTET` gesetzt werden.

## Widerspruchserkennung

`src/core/knowledge.mjs` erkennt derzeit direkte Konflikte für denselben `rule_key`, wenn:

1. beide Regeln `BESTAETIGT` oder `AKTIV` sind,
2. ihre Projekt-/Plattform-/Umgebungsbereiche überlappen,
3. ihre zeitliche Gültigkeit überlappt,
4. die Wirkungen `REQUIRE ↔ FORBID` oder `PREFER ↔ AVOID` widersprechen,
5. keine Regel die andere ausdrücklich über `supersedes` ablöst.

Ein solcher Konflikt blockiert die Knowledge-Integrity-Prüfung.

## Warum `supersedes` explizit sein muss

Neue Erkenntnisse dürfen alte Regeln nicht still überschreiben. Eine Ablösung muss nachvollziehbar dokumentieren, welche frühere Erkenntnis ersetzt wird. Dadurch bleibt die Entwicklungsgeschichte prüfbar.

## Sicherheitsregeln

- Eine einzelne Beobachtung darf warnen, aber nicht automatisch globale Regeln erzwingen.
- Aktive Regeln brauchen einen Scope und Review-Termin.
- Tote Evidence-/Testpfade sind nicht zulässig.
- Widersprüchliche aktive Regeln sind nicht zulässig.
- Abgelaufenes bestätigtes Wissen ist nicht zulässig.
- Wissen darf archiviert oder auf `VERALTET` gesetzt werden, statt gelöscht zu werden.
- Projektwissen und globale Regeln müssen später getrennt vererbbar bleiben.

## Automatische Prüfung

`tests/foundation/knowledge_registry_integrity.mjs` prüft mindestens:

- JSONL-Syntax,
- eindeutige IDs,
- Pflichtfelder,
- erlaubte Status-/Wirkungswerte,
- Confidence-Bereich,
- gültige Datumswerte,
- sinnvolle Zeitfenster,
- Ablauf aktiver Regeln,
- lokale Evidence-/Testpfade,
- Learning↔Regression-Verweise,
- `supersedes`-Verweise,
- reale Widerspruchsfreiheit,
- synthetische Konflikterkennung,
- korrekte Konfliktauflösung durch explizites `supersedes`.

## Laienansicht – späteres UI

Die spätere Oberfläche soll technische Felder nicht ungefiltert zeigen. Ein Nutzer soll beispielsweise lesen:

> Diese Regel gilt für Linux-Dateitools und soll am 24.11.2026 erneut geprüft werden.

oder:

> Zwei gespeicherte Erfahrungen widersprechen sich. Bis zur Prüfung wird keine davon automatisch als sichere Regel angewendet.

Technische Details bleiben in der Profi-Ansicht verfügbar.
