#!/usr/bin/env bash
set -euo pipefail

log_step() {
  printf "[INFO] %s\n" "$1"
}

if ! command -v npm >/dev/null 2>&1; then
  echo "[ERROR] npm wurde nicht gefunden. Bitte Node.js >= 18 installieren." >&2
  exit 1
fi

log_step "Starte Setup- und Prüf-Routine für 2026-MultiTool"

if [ ! -d node_modules ]; then
  if [ -f package-lock.json ]; then
    log_step "Abhängigkeiten werden mit npm ci installiert (reproduzierbar)."
    npm ci --no-fund --no-audit
  else
    log_step "package-lock.json fehlt – npm install wird ausgeführt."
    npm install --no-fund --no-audit
  fi
else
  log_step "Abhängigkeiten bereits installiert."
fi

log_step "Starte Linting und Accessibility-Checks."
npm run check

log_step "Entwicklungsserver unter http://localhost:5000 wird gestartet (Strg+C zum Beenden)."
npm run serve
