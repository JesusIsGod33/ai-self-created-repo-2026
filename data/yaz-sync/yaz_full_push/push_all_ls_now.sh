#!/usr/bin/env bash
set -euo pipefail

SRC_ROOT="${1:-$HOME}"
STAGE_ROOT="/tmp/yaz_desktop_sync_stage"
BRANCH="${YAZ_BRANCH:-main}"
REMOTE_URL="${YAZ_REMOTE_URL:-https://github.com/JesusIsGod33/YAZ.git}"

if [ -n "${GH_TOKEN:-}" ] && [[ "$REMOTE_URL" == https://github.com/* ]] && [[ "$REMOTE_URL" != *"@"* ]]; then
  REMOTE_URL="${REMOTE_URL/https:\/\//https:\/\/JesusIsGod33:${GH_TOKEN}@}"
fi

rm -rf "$STAGE_ROOT"
mkdir -p "$STAGE_ROOT/local_ls_snapshot"

ls -la "$SRC_ROOT" > "$STAGE_ROOT/local_ls_snapshot/ls_la_home.txt"
ls -la "$SRC_ROOT/yaz_core" > "$STAGE_ROOT/local_ls_snapshot/ls_la_yaz_core.txt" 2>/dev/null || true
ls -la "$SRC_ROOT/yaz_data" > "$STAGE_ROOT/local_ls_snapshot/ls_la_yaz_data.txt" 2>/dev/null || true
find "$SRC_ROOT" -maxdepth 3 \
  -not -path '*/.*' \
  -not -path '*/yaz_env*' \
  -not -path '*/myenv*' \
  -not -path '*/aws-cli-venv*' \
  -not -path '*/self_healing_system_venv*' \
  -not -path '*/sovereign_env*' \
  -not -path '*/node_modules*' \
  -not -path '*/__pycache__*' \
  > "$STAGE_ROOT/local_ls_snapshot/tree_depth3.txt"

rsync -a --delete \
  --exclude '.git' \
  --exclude '.cache' \
  --exclude '__pycache__' \
  --exclude 'node_modules' \
  --exclude 'yaz_env' \
  --exclude 'myenv' \
  --exclude 'aws-cli-venv' \
  --exclude 'self_healing_system_venv' \
  --exclude 'sovereign_env' \
  --exclude 'ollama_models' \
  --exclude 'yaz_desktop_sync_stage' \
  --exclude '*.tar.gz' \
  --exclude '*.deb' \
  --exclude '*.img' \
  --exclude '*.db' \
  --exclude '*.log' \
  --exclude 'sensitive_info_storage.json' \
  --exclude 'connect.json' \
  "$SRC_ROOT/" "$STAGE_ROOT/"

cd "$STAGE_ROOT"

git init -b "$BRANCH"
git remote add origin "$REMOTE_URL"
git config user.name "${GIT_AUTHOR_NAME:-JesusIsGod33}"
git config user.email "${GIT_AUTHOR_EMAIL:-infuselink@gmail.com}"

git add -A
if git diff --cached --quiet; then
  echo "No new changes to push."
else
  git commit -m "Full local LS push for desktop sync ($(date -u +'%Y-%m-%dT%H:%M:%SZ'))"
  git push -f -u origin "$BRANCH"
fi

rm -rf "$STAGE_ROOT"
echo "DONE: Pushed local LS snapshot and files to $REMOTE_URL ($BRANCH) without filling Chromebook disk."
