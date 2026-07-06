#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .codex-runs
ts="$(date +%Y%m%d-%H%M%S)"

cat <<'EOF'
Running Codex in high-autonomy mode.
Use only on a clean/sacrificial machine or VM with no sensitive files, no SSH keys, no payment credentials, and no important tokens.
EOF

codex exec \
  --cd "$(pwd)" \
  --model "${CODEX_MODEL:-gpt-5.5}" \
  --sandbox "${CODEX_SANDBOX:-danger-full-access}" \
  --ask-for-approval never \
  --output-last-message ".codex-runs/last-message-${ts}.md" \
  - < prompts/codex-goal-001-kernel.md \
  2>&1 | tee ".codex-runs/run-${ts}.log"
