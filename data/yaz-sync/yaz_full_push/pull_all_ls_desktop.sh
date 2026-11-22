#!/usr/bin/env bash
set -euo pipefail

DEST_DIR="${1:-$HOME/YAZ_FROM_CHROMEBOOK}"
BRANCH="${YAZ_BRANCH:-main}"
REMOTE_URL="${YAZ_REMOTE_URL:-https://github.com/JesusIsGod33/YAZ.git}"

if [ -d "$DEST_DIR/.git" ]; then
  cd "$DEST_DIR"
  git remote set-url origin "$REMOTE_URL"
  git fetch origin "$BRANCH"
  git checkout -B "$BRANCH" "origin/$BRANCH"
else
  git clone --branch "$BRANCH" "$REMOTE_URL" "$DEST_DIR"
fi

echo "DESKTOP READY: All pushed LS files pulled into $DEST_DIR"
ls -la "$DEST_DIR"
