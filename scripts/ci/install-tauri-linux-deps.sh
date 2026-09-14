#!/usr/bin/env bash
set -euo pipefail

mode="${1:-core}"

case "$mode" in
  core|e2e) ;;
  *)
    echo "Unbekannter Modus: $mode" >&2
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
  wget
)

if [[ "$mode" == "e2e" ]]; then
  packages+=(
    webkit2gtk-driver
    xvfb
  )
fi

echo "Tauri-Linux-Voraussetzungen ($mode) werden auf dem frischen Prüfrechner bereitgestellt."
sudo apt-get update -qq
sudo apt-get install -y --no-install-recommends "${packages[@]}"
