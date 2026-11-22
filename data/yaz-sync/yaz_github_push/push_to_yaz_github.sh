#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${1:-$HOME}"
STAGE_DIR="$HOME/yaz_github_stage"
BRANCH="${YAZ_GIT_BRANCH:-main}"
REMOTE_URL="${YAZ_GITHUB_REMOTE:-}"

if [ -z "$REMOTE_URL" ] && command -v gh >/dev/null 2>&1; then
  OWNER="$(gh api user --jq '.login' 2>/dev/null || true)"
  if [ -n "$OWNER" ]; then
    REMOTE_URL="https://github.com/${OWNER}/YAZ.git"
  fi
fi

if [ -z "$REMOTE_URL" ]; then
  echo "Set YAZ_GITHUB_REMOTE='https://github.com/<user>/YAZ.git' or authenticate gh first." >&2
  exit 1
fi

mkdir -p "$STAGE_DIR"

rsync -a --delete \
  --exclude '.git' \
  --exclude '__pycache__' \
  --exclude 'node_modules' \
  --exclude 'myenv' \
  --exclude 'aws-cli-venv' \
  --exclude 'self_healing_system_venv' \
  --exclude 'ollama_models' \
  --exclude 'yaz_github_stage' \
  --exclude '*.tar.gz' \
  --exclude '*.deb' \
  --exclude '*.db' \
  --exclude '*.log' \
  --exclude 'sensitive_info_storage.json' \
  "$SOURCE_DIR/" "$STAGE_DIR/"

cd "$STAGE_DIR"

if [ ! -d .git ]; then
  git init -b "$BRANCH"
  git remote add origin "$REMOTE_URL"
else
  git remote set-url origin "$REMOTE_URL"
  git checkout -B "$BRANCH"
fi

git add -A
if git diff --cached --quiet; then
  echo "No file changes to commit for YAZ."
else
  git commit -m "Sync local YAZ files ($(date -u +'%Y-%m-%dT%H:%M:%SZ'))"
  git push -u origin "$BRANCH"
fi
