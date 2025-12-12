#!/usr/bin/env bash
set -euo pipefail

# Start- und Gesundheitsroutine für 2026-MultiTool
# - Erstellt/aktiviert eine Python-Umgebung
# - Installiert Abhängigkeiten vollautomatisch
# - Führt Gesundheitschecks aus und startet bei Bedarf den Static-Server

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="${ROOT_DIR}/.venv"
PYTHON_BIN="${PYTHON_BIN:-python3}"
APP_PORT="${APP_PORT:-8000}"
LOG_LEVEL="${LOG_LEVEL:-info}"
SERVE="yes"

print_help() {
  cat <<USAGE
Nutzung: ./start.sh [Optionen]
  --health       Nur Umgebung prüfen und Abhängigkeiten heilen
  --no-serve     Startet keinen Server (nur Checks)
  --port <NUM>   Port für den Static-Server (Standard: ${APP_PORT})
  --debug        Ausführliche Logs aktivieren
  --help         Diese Hilfe anzeigen
USAGE
}

log() {
  local level="$1"; shift
  local msg="$*"
  local levels="error warn info debug"
  if [[ " ${levels} " != *" ${level} "* ]]; then
    echo "[error] Unbekanntes Log-Level: ${level}" >&2
    exit 1
  fi
  case "${LOG_LEVEL}" in
    debug) ;; # alles ausgeben
    info) [[ "${level}" == "debug" ]] && return ;;
    warn) [[ "${level}" == "debug" || "${level}" == "info" ]] && return ;;
  esac
  echo "[${level}] ${msg}"
}

require_command() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    log error "Benötigtes Kommando '${cmd}' fehlt. Bitte installieren."
    exit 2
  fi
}

create_venv() {
  if [[ -d "${VENV_DIR}" ]]; then
    log info "Virtuelle Umgebung vorhanden: ${VENV_DIR}"
  else
    log info "Erstelle virtuelle Umgebung …"
    "${PYTHON_BIN}" -m venv "${VENV_DIR}"
    log info "Virtuelle Umgebung erstellt."
  fi
}

activate_venv() {
  # shellcheck disable=SC1091
  source "${VENV_DIR}/bin/activate"
  log debug "Virtuelle Umgebung aktiviert."
}

install_requirements() {
  local req_file="${ROOT_DIR}/requirements.txt"
  if [[ -f "${req_file}" ]]; then
    log info "Installiere Abhängigkeiten aus ${req_file} …"
    pip install --upgrade pip >/dev/null
    pip install -r "${req_file}" >/dev/null
    log info "Abhängigkeiten erfolgreich installiert."
  else
    log warn "Keine requirements.txt gefunden – nichts zu installieren."
  fi
}

health_checks() {
  log info "Gesundheitschecks starten …"
  require_command "${PYTHON_BIN}"
  create_venv
  activate_venv
  install_requirements
  log info "Gesundheitschecks abgeschlossen."
}

start_server() {
  log info "Starte lokalen Static-Server auf Port ${APP_PORT} …"
  activate_venv
  (cd "${ROOT_DIR}" && python -m http.server "${APP_PORT}" --bind 0.0.0.0 &)
  SERVER_PID=$!
  sleep 1
  if ps -p ${SERVER_PID} >/dev/null 2>&1; then
    log info "Server läuft (PID ${SERVER_PID}). Browser: http://localhost:${APP_PORT}"
  else
    log error "Serverstart fehlgeschlagen."
    exit 3
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --health) SERVE="no" ;;
      --no-serve) SERVE="no" ;;
      --port) shift; APP_PORT="$1" ;;
      --debug) LOG_LEVEL="debug" ;;
      --help|-h) print_help; exit 0 ;;
      *) log error "Unbekannte Option: $1"; print_help; exit 1 ;;
    esac
    shift
  done
}

main() {
  parse_args "$@"
  health_checks
  if [[ "${SERVE}" == "yes" ]]; then
    start_server
    wait ${SERVER_PID}
  else
    log info "Checks abgeschlossen. Kein Serverstart (Option gesetzt)."
  fi
}

main "$@"
