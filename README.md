# Infinity Kernel Seed

This is a seed repository for an agentic coding run that should build **Infinity Kernel v0.1**.

Infinity is a protocol-first, local-first semantic project system. Its kernel turns:

```text
Wish → Problem → Idea → Project → Task → Artifact → Evidence → Offer → Update
```

The intended first implementation is not the whole Infinity civilization system. It is a small, durable kernel whose event logs can be replayed, exported, signed, searched, and rendered without trusting a central server.

## Implemented v0.1 surface

This repository now contains a working local-first Infinity Kernel v0.1 slice:

- `packages/kernel`: versioned events and objects, deterministic canonical JSON, content-derived event IDs, validation, local development signing interfaces, and deterministic replay.
- `packages/storage-files`: append-only JSONL logs, portable folder bundles, import/export, integrity verification, and bundle replay.
- `packages/projection-sqlite`: disposable SQLite projection of events, objects, relations, typed object tables, and FTS5 search.
- `apps/cli`: local commands for initializing stores, creating semantic events, replaying, searching, showing objects, verifying logs, and importing/exporting bundles.
- `seeds/*/events.jsonl`: canonical seed logs for Infinity, Lifecar, XMaze, and Metaformat.

## Commands

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
pnpm --filter @infinity/cli dev -- --help
```

The SQLite projection uses the local `sqlite3` CLI.

## Original overnight target

Ask Codex to execute:

```bash
prompts/codex-goal-001-kernel.md
```

The task should build:

- `packages/kernel`: versioned event/object schemas, validation, deterministic replay, content IDs, local signer interface.
- `packages/storage-files`: JSONL event logs, export/import bundles, integrity verification.
- `packages/projection-sqlite`: rebuildable SQLite projection and search.
- `apps/cli`: local commands to create/replay/search/show Infinity objects.
- seed projects: Infinity, Lifecar, XMaze, Metaformat.

Non-goals for the first run:

- no accounting,
- no investment,
- no project stocks,
- no real-money transactions,
- no blockchain writes,
- no full marketplace,
- no real-time collaboration,
- no authentication beyond local development actors.

## Suggested local run

Initialize the repository locally before running Codex:

```bash
cd infinity-kernel-seed
git init
git add .
git commit -m "Seed Infinity Kernel Codex project"
```

Then run either:

```bash
./scripts/run-codex-001-safe.sh
```

or, on a disposable/sacrificial machine with no sensitive files or credentials:

```bash
./scripts/run-codex-001-overnight.sh
```

## Important review files

Codex is instructed to maintain:

- `WORKLOG.md` — what it did, what passed, what failed.
- `OPEN_QUESTIONS.md` — questions it chose not to block on.
- `docs/adr/` — architectural decisions.

## Product intuition

The system should feel less like “a Django site” and more like a local semantic event node:

```text
network/source events → local verifier → SQLite projection → project pages/search/CLI → new signed events
```

The server is convenience infrastructure. The database is a projection. The event log is the portable source of truth.
