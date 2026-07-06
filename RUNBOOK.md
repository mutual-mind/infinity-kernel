# Runbook

## Prepare Debian machine

Recommended packages:

```bash
sudo apt update
sudo apt install -y git curl build-essential sqlite3 libsqlite3-dev nodejs npm tmux
sudo npm install -g pnpm
```

Then verify:

```bash
node --version
npm --version
pnpm --version
codex doctor
```

## Initialize local Git repository

```bash
git init
git add .
git commit -m "Seed Infinity Kernel Codex project"
```

A public remote is not required for local Codex CLI work.

## Run in tmux

```bash
tmux new -s infinity-codex
./scripts/run-codex-001-overnight.sh
```

Detach with `Ctrl+b`, then `d`.

Reattach:

```bash
tmux attach -t infinity-codex
```

## Review after waking

```bash
git status
git diff --stat
cat WORKLOG.md || true
cat OPEN_QUESTIONS.md || true
pnpm test
pnpm typecheck
```

Then ask Codex for a review:

```bash
codex exec --cd . --sandbox workspace-write --ask-for-approval on-request - < prompts/review-after-run.md
```
