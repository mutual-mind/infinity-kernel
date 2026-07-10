# Worklog

Seed repository created. Codex should append implementation notes here.

## Codex Goal 001 - Infinity Kernel v0.1

Implemented:

- `packages/kernel`
  - Versioned `infinity.event.v0`, `infinity.object.v0`, and `infinity.actor.v0` structures.
  - Explicit object kinds and event types required by `SPEC.md`.
  - Deterministic canonical JSON serialization and SHA-256 content IDs.
  - Event validation, duplicate/tamper detection, local development signer interface, deterministic replay, and JSON projection export.
- `packages/storage-files`
  - Append/save/load JSONL event logs.
  - Portable folder bundle export/import with `manifest.json`, `checksums.json`, event files, and integrity verification.
  - Bundle replay through the kernel.
- `packages/projection-sqlite`
  - Disposable SQLite projection for events, objects, relations, claims, evidence, tasks, artifacts, offers, updates, and FTS5 search.
  - Rebuild-from-events projector.
- `apps/cli`
  - Commands: `init`, `create-actor`, `create-object`, `relate`, `add-claim`, `add-task`, `add-artifact`, `add-evidence`, `add-offer`, `add-update`, `replay`, `export-bundle`, `import-bundle`, `search`, `show-object`, `verify`.
- `seeds`
  - Generated canonical `events.jsonl` logs for Infinity, Lifecar, XMaze, and Metaformat.
  - Each includes wish, problem, idea, project, at least 3 tasks, 2 claims, evidence placeholder, artifact placeholder, offer, update, and relations.
- Documentation
  - Added ADR 0005 for deterministic replay sorting and the local SQLite CLI projection choice.
  - Updated README with implemented v0.1 surface and commands.

Commands run:

```bash
pnpm install
pnpm exec tsx scripts/generate-seeds.ts
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @infinity/cli dev -- --help
```

Additional CLI verification:

- Replayed all seed logs in a temporary store: 101 events, 52 objects, 48 relations.
- `search --query Lifecar` found Lifecar seed project records.
- CLI smoke test created a local actor, wish, idea, project, task, artifact, offer, and update, then replayed 8 events into SQLite.

Known limitations:

- v0.1 local signing uses a development HMAC signer, not production public-key cryptography.
- SQLite projection uses the local `sqlite3` CLI rather than a native Node SQLite package.
- CLI argument parsing is intentionally minimal.
- Proposal acceptance records proposal state but does not automatically materialize proposed events.

Next steps:

- Add richer CLI tests around import/export and relation creation.
- Add migration fixtures once `infinity.event.v1` exists.
- Replace the local development signer with an Ed25519 signer package when key management requirements are clear.
