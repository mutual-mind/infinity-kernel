#!/usr/bin/env bash
set -euo pipefail
sudo apt update
sudo apt install -y git curl build-essential sqlite3 libsqlite3-dev nodejs npm tmux
sudo npm install -g pnpm
node --version
npm --version
pnpm --version
codex doctor
