#!/usr/bin/env bash
set -euo pipefail

# 2026-MultiTool Start- und Prüf-Routine
# - Installiert fehlende Abhängigkeiten (npm)
# - Führt Qualitätsprüfungen aus (Linting + Accessibility)
# - Startet bei Bedarf einen lokalen Webserver

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${PROJECT_ROOT}/config"
LOG_DIR="${PROJECT_ROOT}/logs"
DEFAULT_CONFIG_FILE="${CONFIG_DIR}/start.conf"
APP_LOG="${LOG_DIR}/app.log"

mkdir -p "${CONFIG_DIR}" "${LOG_DIR}" "${PROJECT_ROOT}/data"

# Standardwerte (werden durch config/start.conf oder Argumente überschrieben)
HOST="0.0.0.0"
PORT=5000
LOG_FILE="${LOG_DIR}/start.log"
DEBUG=0
SERVE=1
CHECK_ONLY=0
RUN_TESTS=1
TEST_MODE=0

if [[ -f "${DEFAULT_CONFIG_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${DEFAULT_CONFIG_FILE}"
fi

usage() {
  cat <<'USAGE'
Nutzung: ./start.sh [Optionen]
  --check-only | --health   Nur Prüfungen ausführen, kein Serverstart
  --test                    Alias für --check-only mit laienfreundlicher Test-Ausgabe
  --no-serve                Überspringt den Serverstart
  --no-tests                Überspringt automatisierte Checks
  --host <HOST>             Hostname/IP (Standard: 0.0.0.0)
  --port <PORT>             Port für den Webserver (Standard: 5000)
  --debug                   Detail-Logs aktivieren
  --help                    Zeigt diese Hilfe
USAGE
}

log() {
  local level="$1" message="$2"
  local timestamp
  timestamp="$(date -Iseconds)"
  echo "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_FILE}" | tee -a "${APP_LOG}" >/dev/null
}

debug() {
  if [[ "${DEBUG}" -eq 1 ]]; then
    log "DEBUG" "$1"
  fi
}

require_command() {
  local cmd="$1"
  command -v "${cmd}" >/dev/null 2>&1 || { log "ERROR" "Benötigtes Kommando '${cmd}' fehlt."; exit 1; }
}

validate_port() {
  local port_value="$1"
  if ! [[ "${port_value}" =~ ^[0-9]+$ ]] || (( port_value < 1 || port_value > 65535 )); then
    log "ERROR" "Port '${port_value}' ist ungültig. Bitte 1-65535 wählen."
    exit 1
  fi
}

validate_host() {
  local host_value="$1"
  if [[ -z "${host_value// }" ]]; then
    echo "Ungültiger Host: Wert darf nicht leer sein." >&2
    exit 1
  fi
  if [[ ! "${host_value}" =~ ^[A-Za-z0-9.-]+$ ]]; then
    echo "Ungültiger Host '${host_value}': nur Buchstaben, Zahlen, Punkt und Bindestrich erlaubt." >&2
    exit 1
  fi
}

ensure_log_destination() {
  local target_file="$1"
  local target_dir

  if [[ -z "${target_file:-}" ]]; then
    echo "LOG_FILE darf nicht leer sein." >&2
    exit 1
  fi

  target_dir="$(dirname "${target_file}")"
  mkdir -p "${target_dir}"
  if [[ ! -w "${target_dir}" ]]; then
    echo "Log-Verzeichnis '${target_dir}' ist nicht schreibbar." >&2
    exit 1
  fi
}

ensure_theme_config() {
  local theme_file="${CONFIG_DIR}/themes.json"
  if [[ -f "${theme_file}" ]]; then
    debug "Theme-Konfiguration vorhanden (${theme_file})."
    return
  fi

  log "INFO" "Erstelle fehlende Theme-Konfiguration unter ${theme_file}."
  cat >"${theme_file}" <<'JSON'
{
  "version": "1.0.0",
  "wcag": "AA",
  "description": "Zentrale Farbpaletten mit AA-Kontrastwerten für alle HTML-Tools.",
  "themes": [
    { "id": "light", "label": "Hell", "contrast": "AA", "primaryText": "#0f172a", "background": "#f5f7fb" },
    { "id": "dark", "label": "Dunkel", "contrast": "AA", "primaryText": "#e5e7eb", "background": "#0b1020" },
    { "id": "contrast", "label": "Kontrast", "contrast": "AA", "primaryText": "#ffffff", "background": "#000000" },
    { "id": "solar", "label": "Solar", "contrast": "AA", "primaryText": "#e3f2f9", "background": "#0b2b36" }
  ]
}
JSON
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --check-only|--health) CHECK_ONLY=1; SERVE=0 ;;
      --test) CHECK_ONLY=1; SERVE=0; TEST_MODE=1 ;;
      --no-serve) SERVE=0 ;;
      --no-tests) RUN_TESTS=0 ;;
      --host) shift; HOST="$1" ;;
      --port) shift; PORT="$1" ;;
      --debug) DEBUG=1 ;;
      --help) usage; exit 0 ;;
      *) usage; log "ERROR" "Unbekannte Option: $1"; exit 1 ;;
    esac
    shift
  done
}

install_node_dependencies() {
  require_command npm
  if [[ -d "${PROJECT_ROOT}/node_modules" ]]; then
    log "INFO" "node_modules vorhanden – überspringe Installation."
    return
  fi
  if [[ -f "${PROJECT_ROOT}/package-lock.json" ]]; then
    log "INFO" "Installiere Abhängigkeiten reproduzierbar (npm ci)."
    npm ci --no-fund --no-audit
  else
    log "INFO" "Installiere Abhängigkeiten (npm install)."
    npm install --no-fund --no-audit
  fi
}

run_checks() {
  if [[ "${RUN_TESTS}" -eq 0 ]]; then
    log "INFO" "Automatisierte Checks wurden übersprungen (--no-tests)."
    return
  fi
  if [[ "${TEST_MODE}" -eq 1 ]]; then
    log "INFO" "Testmodus (--test): Starte laienfreundliche Prüfungen (Linting, Themes, Accessibility)."
    log "INFO" "Erläuterung: Der Code wird auf Syntaxfehler geprüft, HTML wird validiert und Farbkontraste werden abgeglichen."
  else
    log "INFO" "Starte Qualitätsprüfungen (Linting + Accessibility)."
  fi

  if npm run check; then
    log "INFO" "Checks erfolgreich abgeschlossen."
    if [[ "${TEST_MODE}" -eq 1 ]]; then
      log "INFO" "Alle Prüfungen bestanden. Das Tool ist startklar." 
    fi
  else
    log "ERROR" "Qualitätsprüfungen fehlgeschlagen. Bitte Ausgabe oben prüfen."
    exit 1
  fi
}

start_server() {
  require_command npx
  log "INFO" "Starte lokalen Server auf http://${HOST}:${PORT} (http-server)."
  npx http-server "${PROJECT_ROOT}" -a "${HOST}" -p "${PORT}" -c-1 --cors >>"${APP_LOG}" 2>&1 &
  SERVER_PID=$!
  debug "Server PID: ${SERVER_PID}"
}

wait_for_server() {
  require_command curl
  for attempt in {1..10}; do
    if curl -s "http://${HOST}:${PORT}" >/dev/null; then
      log "INFO" "Serverantwort geprüft (Versuch ${attempt})."
      return
    fi
    sleep 1
  done
  log "ERROR" "Server nicht erreichbar. Details in /tmp/multitool-server.log"
  kill "${SERVER_PID}" >/dev/null 2>&1 || true
  exit 1
}

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

parse_args "$@"
validate_port "${PORT}"
validate_host "${HOST}"
ensure_log_destination "${LOG_FILE}"
ensure_log_destination "${APP_LOG}"

touch "${LOG_FILE}"
touch "${APP_LOG}"
log "INFO" "Startroutine 2026-MultiTool wird ausgeführt."
debug "Root: ${PROJECT_ROOT}, Config: ${DEFAULT_CONFIG_FILE}"

if [[ "${DEBUG}" -eq 1 ]]; then
  log "DEBUG" "Detail-Protokoll aktiv (Schreibziel: ${APP_LOG})."
fi

install_node_dependencies
ensure_theme_config
run_checks

if [[ "${CHECK_ONLY}" -eq 1 ]]; then
  if [[ "${TEST_MODE}" -eq 1 ]]; then
    log "INFO" "--test beendet: Prüfungen abgeschlossen, keine weiteren Aktionen."
  else
    log "INFO" "Check-only-Modus: keine weiteren Schritte."
  fi
  exit 0
fi

if [[ "${SERVE}" -eq 1 ]]; then
  start_server
  wait_for_server
  log "INFO" "Bereit: Öffne http://${HOST}:${PORT} im Browser (Server läuft, Logs in /tmp/multitool-server.log)."
else
  log "INFO" "Serverstart übersprungen (--no-serve)."
fi
