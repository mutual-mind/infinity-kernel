#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== git status =="
git status --short || true

echo "== diff stat =="
git diff --stat || true

echo "== worklog =="
cat WORKLOG.md 2>/dev/null || true

echo "== open questions =="
cat OPEN_QUESTIONS.md 2>/dev/null || true

echo "== pnpm test =="
pnpm test || true

echo "== pnpm typecheck =="
pnpm typecheck || true
