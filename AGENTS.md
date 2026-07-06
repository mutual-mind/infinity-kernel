# AGENTS.md

## Project identity

This repository implements **Infinity Kernel**, a protocol-first semantic project system.

Infinity turns:

```text
Wish → Problem → Idea → Project → Task → Artifact → Evidence → Offer → Update
```

The app is not the source of truth. The database is not the source of truth. The source of truth is an append-only, signed, portable event log. Databases are rebuildable projections.

## Architectural laws

1. `packages/kernel` must not depend on web frameworks, databases, UI libraries, filesystem storage, network storage, or provider SDKs.
2. Event replay must be deterministic.
3. Event schemas must be versioned.
4. Event IDs must be content-derived from canonicalized event content.
5. Databases are rebuildable projections.
6. AI-generated content is proposal data unless accepted by a local/real actor.
7. Economics, accounting, project stocks, and marketplaces are plugins, not kernel features.
8. All important decisions require an ADR in `docs/adr`.
9. Every implemented feature needs tests, executable examples, or CLI verification.
10. Prefer explicit data structures over clever abstractions.
11. Preserve exportability: data must remain understandable without the web app.
12. Do not silently change the product philosophy in `docs/PROJECT_BRIEF.md`.
13. When blocked, choose the simplest reversible path, record the assumption in `WORKLOG.md` and/or an ADR, and continue.
14. Do not ask the human unless the question is irreversible, destructive, involves credentials, or blocks all reasonable progress.

## First-run priority order

1. Kernel data model and event replay.
2. File storage and portable bundles.
3. SQLite projection and local search.
4. CLI.
5. Seed project data.
6. Documentation and acceptance checks.

Do not build the web UI until the kernel, storage, projection, CLI, and seeds work.

## Commands

Assume these commands are the target interface; create or adjust them as needed:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
pnpm --filter @infinity/cli dev -- --help
```

If exact commands change, update this file, `README.md`, and `WORKLOG.md`.

## Definition of done

A change is done only when:

- tests pass or failures are clearly documented,
- typecheck passes or failures are clearly documented,
- relevant docs are updated,
- event replay remains deterministic,
- deleting the SQLite projection and replaying event logs reconstructs the same state,
- kernel remains independent of UI/database/storage code,
- non-goals remain excluded.

## Style

- TypeScript, strict mode.
- Small packages with clear boundaries.
- Prefer pure functions in the kernel.
- Use Zod or another explicit schema validator.
- Use SQLite only in projection packages.
- Use JSONL for event logs in v0.1.
- Favor boring, inspectable code.
