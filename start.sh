#!/usr/bin/env bash
# Startsetup Routine mit: prüfen und oder erstellen einer virtuellen umgebung, öffnen dieser Umgebung
# Vollautomatische Prüfung und Auflösung aller Abhängigkeiten und Installationen mit perfektem detailliertem Nutzerfeedback über Fortschritt, Status und sonstige hilfreiche Infos
# abschließend vollautomatischer Toolstart in der virtuellen Umgebung und GUI Start

set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${PROJECT_ROOT}/config"
LOG_DIR="${PROJECT_ROOT}/logs"
DEFAULT_CONFIG_FILE="${CONFIG_DIR}/start.conf"

mkdir -p "${CONFIG_DIR}" "${LOG_DIR}"

# Defaultwerte, die optional über config/start.conf oder Umgebungsvariablen überschrieben werden können.
PYTHON_BIN=${PYTHON_BIN:-python3}
VENV_DIR=${VENV_DIR:-"${PROJECT_ROOT}/.venv"}
REQUIREMENTS_FILE=${REQUIREMENTS_FILE:-"${PROJECT_ROOT}/requirements.txt"}
HOST=${HOST:-0.0.0.0}
PORT=${PORT:-8000}
SERVER_COMMAND=${SERVER_COMMAND:-"python -m http.server"}
LOG_FILE=${LOG_FILE:-"${LOG_DIR}/start.log"}
DEBUG=${DEBUG:-0}

# Laden der Konfiguration, falls vorhanden
if [[ -f "${DEFAULT_CONFIG_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${DEFAULT_CONFIG_FILE}"
fi

usage() {
  cat <<'USAGE'
Startet die Anwendung mit automatischer Prüf- und Installationsroutine.

Optionen:
  --debug            Aktiviert detailiertes Logging
  --check-only       Führt nur Vorprüfungen aus (keine Server- oder Installationsschritte)
  --help             Zeigt diese Hilfe an
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
  local level="$1" message="$2"
  local timestamp
  timestamp="$(date -Iseconds)"
  echo "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_FILE}"
}

debug() {
  if [[ "${DEBUG}" -eq 1 ]]; then
    log "DEBUG" "$1"
  fi
}

fail() {
  local code="$1" message="$2"
  log "ERROR" "${message}"
  exit "${code}"
}

validate_command() {
  local cmd="$1"
  command -v "${cmd}" >/dev/null 2>&1 || fail 10 "Benötigtes Kommando '${cmd}' fehlt. Bitte installieren und erneut ausführen."
  debug "Kommando ${cmd} ist verfügbar."
}

activate_venv() {
  debug "Aktiviere virtuelle Umgebung aus ${VENV_DIR}."
  # shellcheck disable=SC1090
  source "${VENV_DIR}/bin/activate" || fail 20 "Aktivierung der virtuellen Umgebung in ${VENV_DIR} fehlgeschlagen."
  log "INFO" "Virtuelle Umgebung aktiviert."
}

create_venv_if_missing() {
  if [[ ! -d "${VENV_DIR}" ]]; then
    log "INFO" "Virtuelle Umgebung wird erstellt (Pfad: ${VENV_DIR})."
    "${PYTHON_BIN}" -m venv "${VENV_DIR}" || fail 21 "Erstellung der virtuellen Umgebung fehlgeschlagen."
  else
    debug "Virtuelle Umgebung existiert bereits."
  fi
}

install_requirements() {
  if [[ -f "${REQUIREMENTS_FILE}" ]] && [[ -s "${REQUIREMENTS_FILE}" ]]; then
    log "INFO" "Pakete aus ${REQUIREMENTS_FILE} werden geprüft und installiert."
    pip install --upgrade pip >/dev/null 2>&1 || debug "Pip konnte nicht aktualisiert werden, fahre fort."
    pip install --upgrade -r "${REQUIREMENTS_FILE}" || fail 30 "Installation der Abhängigkeiten aus ${REQUIREMENTS_FILE} fehlgeschlagen."
    log "INFO" "Abhängigkeiten erfolgreich installiert."
  else
    log "INFO" "Keine requirements-Datei gefunden oder Datei leer (Pfad: ${REQUIREMENTS_FILE}). Überspringe Installation."
  fi
}

check_network_and_port() {
  debug "Prüfe Portverfügbarkeit für ${HOST}:${PORT}."
  "${PYTHON_BIN}" - <<PY
import socket, sys
host = "${HOST}"
port = int("${PORT}")
sock = socket.socket()
try:
    sock.bind((host, port))
    sock.close()
except OSError as exc:
    sys.stderr.write(f"Port-Check fehlgeschlagen: {exc}\n")
    sys.exit(1)
PY
  if [[ $? -ne 0 ]]; then
    fail 40 "Port ${PORT} auf ${HOST} ist blockiert. Bitte Port freigeben oder anpassen."
  fi
  log "INFO" "Port ${PORT} ist verfügbar."
}

run_code_quality_checks() {
  log "INFO" "Führe Basis-Selbsttest für Codequalität durch (Python Syntaxprüfung)."
  find "${PROJECT_ROOT}" -maxdepth 1 -name '*.py' -print0 | while IFS= read -r -d '' file; do
    debug "Prüfe ${file}"
    "${PYTHON_BIN}" -m py_compile "${file}" || fail 50 "Syntaxfehler in ${file} erkannt."
  done
  log "INFO" "Codequalitätstest abgeschlossen."
}

start_server() {
  log "INFO" "Starte Frontend mit Befehl: ${SERVER_COMMAND} --bind ${HOST} --directory ${PROJECT_ROOT} ${PORT}."
  (cd "${PROJECT_ROOT}" && eval "${SERVER_COMMAND} --bind ${HOST} --directory ${PROJECT_ROOT} ${PORT}" >"${LOG_FILE}" 2>&1 &)
  SERVER_PID=$!
  sleep 1
  log "INFO" "Server gestartet (PID: ${SERVER_PID})."
}

validate_server() {
  log "INFO" "Prüfe Serververfügbarkeit auf http://${HOST}:${PORT}."
  "${PYTHON_BIN}" - <<PY
import sys
import urllib.request
url = "http://${HOST}:${PORT}"
try:
    with urllib.request.urlopen(url, timeout=5) as response:
        status = response.status
    if status != 200:
        sys.stderr.write(f"Unerwarteter HTTP-Status: {status}\n")
        sys.exit(1)
except Exception as exc:  # noqa: BLE001
    sys.stderr.write(f"Verbindung fehlgeschlagen: {exc}\n")
    sys.exit(1)
PY
  if [[ $? -ne 0 ]]; then
    [[ -n "${SERVER_PID:-}" ]] && kill "${SERVER_PID}" >/dev/null 2>&1 || true
    fail 60 "Server konnte nicht erfolgreich validiert werden."
  fi
  log "INFO" "Serverantwort erfolgreich validiert."
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
      --debug)
        DEBUG=1
        ;;
      --check-only)
        CHECK_ONLY=1
        ;;
      --help)
        usage
        exit 0
        ;;
      *)
        usage
        fail 2 "Unbekannte Option: $1"
        ;;
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

CHECK_ONLY=0
parse_args "$@"

log "INFO" "Startroutine wird initialisiert."
validate_command "${PYTHON_BIN}"

create_venv_if_missing
activate_venv
install_requirements
check_network_and_port
run_code_quality_checks

if [[ "${CHECK_ONLY}" -eq 1 ]]; then
  log "INFO" "Check-Only-Modus aktiviert. Serverstart wird übersprungen."
  exit 0
fi

start_server
validate_server

log "INFO" "Bereit: Frontend läuft unter http://${HOST}:${PORT}."
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
