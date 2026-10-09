#!/usr/bin/env bash
set -euo pipefail
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
CLAUDE_HOME=${CLAUDE_HOME:-"$HOME/.claude"}
mkdir -p "$CLAUDE_HOME/plugins/marketplaces"
ln -sfn "$ROOT" "$CLAUDE_HOME/plugins/marketplaces/foldspace"
if command -v npm >/dev/null 2>&1; then npm install --global --prefix "${FOLDSPACE_NPM_PREFIX:-$HOME/.local}" "$ROOT" --ignore-scripts >/dev/null; fi
printf 'Foldspace installed: %s\n' "$ROOT"
printf 'Claude plugin path: %s\n' "$CLAUDE_HOME/plugins/marketplaces/foldspace"
printf 'Try: foldspace doctor --json\n'
