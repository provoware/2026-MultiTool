#!/usr/bin/env bash
set -euo pipefail

mode="${1:-core}"

case "$mode" in
  core|e2e) ;;
  *)
    echo "🔴 Unbekannter Modus: $mode" >&2
    echo "ℹ️ Erlaubt sind: core oder e2e" >&2
    exit 2
    ;;
esac

packages=(
  build-essential
  curl
  file
  libayatana-appindicator3-dev
  librsvg2-dev
  libssl-dev
  libwebkit2gtk-4.1-dev
  libxdo-dev
  patchelf
  pkg-config
  wget
)

if [[ "$mode" == "e2e" ]]; then
  packages+=(
    webkit2gtk-driver
    xvfb
  )
fi

echo "🟡 Tauri-Linux-Voraussetzungen ($mode): Installation startet."
sudo apt-get update -qq
sudo apt-get install -y --no-install-recommends "${packages[@]}"

echo "🔎 Tauri-Linux-Voraussetzungen ($mode): Installation wird geprüft."
pkg-config --exists 'glib-2.0 >= 2.70'
pkg-config --exists webkit2gtk-4.1
command -v patchelf >/dev/null

if [[ "$mode" == "e2e" ]]; then
  command -v WebKitWebDriver >/dev/null
  command -v xvfb-run >/dev/null
fi

echo "🟢 Tauri-Linux-Voraussetzungen ($mode): vollständig und verwendbar."
