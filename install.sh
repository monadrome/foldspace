#!/usr/bin/env bash
set -euo pipefail
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
FOLDSPACE_INSTALL_PREFIX=${FOLDSPACE_NPM_PREFIX:-"$HOME/.local"}
command -v npm >/dev/null 2>&1 || { printf 'npm is required\n' >&2; exit 1; }
npm install --global --prefix "$FOLDSPACE_INSTALL_PREFIX" "$ROOT" --ignore-scripts
printf 'Foldspace installed: %s\n' "$ROOT"
printf 'Add to PATH: %s/bin\n' "$FOLDSPACE_INSTALL_PREFIX"
printf 'Try: %s/bin/foldspace doctor --json\n' "$FOLDSPACE_INSTALL_PREFIX"
printf 'Claude: claude --plugin-dir %s\n' "$ROOT"
