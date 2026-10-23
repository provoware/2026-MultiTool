# Sicherheitsprüfung GitHub Actions – 23.10.2026

## Konkrete Ursache
Externe GitHub Actions wurden über bewegliche Versions-Tags geladen. Ein später verschobenes Tag könnte fremden Code ohne Änderung dieses Repositories ausführen. Issues #20 und #28 dokumentieren diese offene Pflicht.

## Direkt bei GitHub verifizierte offizielle Tag-Referenzen
| Action | Offizieller Tag | Commit-SHA |
| --- | --- | --- |
| actions/checkout | v7 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| actions/setup-node | v7 | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| actions/upload-artifact | v4 | `ea165f8d65b6e75b540449e92b4886f43607fa02` |

Die Tag-Refs wurden mit GitHub-API `GET /repos/actions/<action>/git/ref/tags/<version>` am 23.10.2026 gelesen; alle drei verwiesen direkt auf Commitobjekte. Vor einem zukünftigen Update sind neue SHAs erneut beim Herausgeber zu prüfen.

## Umsetzung
- `.github/workflows/ci.yml` und `.github/workflows/cargo-lock-autopilot.yml`: zusammen zehn Action-Verweise auf vollständige 40-stellige SHAs fixiert, Kommentare erhalten Version.
- `scripts/ci/check-action-pinning.mjs`: Scan ALLER YAML-Workflows, Fehler bei ungesichertem `uses:`-Verweis.
- `tests/ci/action_pin_contract.test.mjs`: Positiv- und Negativtests für Tags, Branches, verkürzte/manipulierte SHAs und gemischte Referenzen.
- `ci:governance` führt den Sicherheitschecker und seine Regressionen vor allen Produktprüfungen aus. Kein neues Paket.

## Grenzen und Nachweise
- **Vor-Commit-Evidenz:** Alle zehn beweglichen Referenzen in den beiden aktuellen GitHub-Workflows nachgewiesen; drei SHA-Ziele am offiziellen Tag direkt bestätigt.
- **Nach-Commit-Gates:** `npm run ci:schnell`, `npm run ci:tief`, alle GitHub-Actions-Jobs des PR; Status erst nach GitHub-Lauf als PASS melden.
- **Restrisiko:** 40-stellige Referenzen schützen vor nachträglichem Tag-Verschieben, nicht vor einem bereits kompromittierten ausgewählten Commit. Vertrauenswürdige Herausgeber, Reviews und künftige Updates bleiben erforderlich.
- **Scope:** Sicherheit der CI-Ladekette, keine Anwendungslaufzeit, Datenmigration, Installation oder Veröffentlichung.
- **Basis:** `32cb69fc4e23b2f20c89d817ed589d05c7aaaf0b`; **Branch:** `security/pin-actions-to-verified-sha-20261023`.
