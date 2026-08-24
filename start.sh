#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

say(){ printf '%s\n' "$1"; }

say "🔵 START  PROVOWARE 2026-MultiTool"
say "🔵 PRECHECK  Prüfe Laufzeitumgebung …"

if ! command -v node >/dev/null 2>&1; then
  say "🔴 BLOCKIERT  Node.js fehlt."
  say "   Zweck: lokales Backend und sichere Startroutine."
  if command -v apt-get >/dev/null 2>&1; then
    say "   Auf Ubuntu/Kubuntu kann Node.js über die Paketverwaltung installiert werden."
    say "   Aus Sicherheitsgründen werden keine versteckten Root-Aktionen ausgeführt."
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

if [[ -f package-lock.json && ! -d node_modules ]]; then
  say "🔵 DEPENDENCIES  Installiere Entwicklungsabhängigkeiten reproduzierbar mit npm ci …"
  if command -v npm >/dev/null 2>&1; then
    npm ci --no-audit --no-fund
    say "🟢 DEPENDENCIES  Projektabhängigkeiten bereit"
  else
    say "🟡 HINWEIS  npm fehlt; Runtime benötigt es nicht. Entwicklungschecks sind dadurch nicht verfügbar."
  fi
else
  say "🟢 DEPENDENCIES  Runtime benötigt keine zusätzlichen Pakete"
fi

say "🔵 BACKEND  Starte lokalen Dienst mit Process Ownership …"
exec node scripts/launcher.mjs "$@"
