#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

say(){ printf '%s\n' "$1"; }
MODE="start"
PASS_ARGS=()
for arg in "$@"; do
  case "$arg" in
    --health|--test) MODE="check" ;;
    --no-open) PASS_ARGS+=("$arg") ;;
    --help)
      cat <<'EOF'
PROVOWARE 2026-MultiTool
  ./start.sh            Normalstart
  ./start.sh --no-open  Start ohne Browseröffnung
  ./start.sh --health   Abhängigkeiten + Foundation-Gate prüfen
  ./start.sh --test     Alias für --health
EOF
      exit 0 ;;
    *) say "🔴 BLOCKIERT  Unbekannte Option: $arg"; exit 2 ;;
  esac
done

say "🔵 START  PROVOWARE 2026-MultiTool"
say "🔵 PRECHECK  Prüfe Laufzeitumgebung …"
if ! command -v node >/dev/null 2>&1; then
  say "🔴 BLOCKIERT  Node.js fehlt."
  say "   Zweck: lokales Backend und sichere Startroutine."
  if command -v apt-get >/dev/null 2>&1; then
    say "   Ubuntu/Kubuntu erkannt: Node.js kann über die Paketverwaltung installiert werden."
    say "   Systemänderungen mit Root-Rechten werden niemals versteckt ausgeführt."
  fi
  exit 20
fi
NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if (( NODE_MAJOR < 18 )); then
  say "🔴 BLOCKIERT  Node.js >= 18 erforderlich, gefunden: $(node --version)"
  exit 21
fi
say "🟢 PRECHECK  Node.js $(node --version)"
mkdir -p runtime logs data

if [[ "$MODE" == "check" ]]; then
  if ! command -v npm >/dev/null 2>&1; then
    say "🔴 BLOCKIERT  npm fehlt; Qualitätsprüfungen benötigen die gelockte Entwicklungs-Toolchain."
    exit 22
  fi
  say "🔵 DEPENDENCIES  Stelle gelockte Entwicklungsabhängigkeiten reproduzierbar bereit …"
  npm ci --no-audit --no-fund
  say "🟢 DEPENDENCIES  npm ci erfolgreich"
  say "🔵 PRÜFUNG  Starte vollständiges Foundation-Gate …"
  npm run check
  say "🟢 PRÜFUNG  Foundation-Gate bestanden"
  exit 0
fi

say "🟢 DEPENDENCIES  Runtime benötigt außer Node.js keine zusätzlichen Pakete"
say "🔵 BACKEND  Starte lokalen Dienst mit Process Ownership …"
exec node scripts/launcher.mjs "${PASS_ARGS[@]}"
