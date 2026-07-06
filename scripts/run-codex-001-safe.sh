#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .codex-runs
ts="$(date +%Y%m%d-%H%M%S)"

codex exec \
  --cd "$(pwd)" \
  --model "${CODEX_MODEL:-gpt-5.5}" \
  --sandbox "${CODEX_SANDBOX:-workspace-write}" \
  --ask-for-approval "${CODEX_APPROVAL:-on-request}" \
  --output-last-message ".codex-runs/last-message-${ts}.md" \
  - < prompts/codex-goal-001-kernel.md \
  2>&1 | tee ".codex-runs/run-${ts}.log"
