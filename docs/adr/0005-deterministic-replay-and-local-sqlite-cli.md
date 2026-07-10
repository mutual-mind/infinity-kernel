# ADR 0005: Deterministic replay sorting and local SQLite projection

## Status

Accepted.

## Decision

Infinity Kernel v0.1 validates event content IDs, then replays events in deterministic `(time, id)` order by default. Callers may opt out only when they need to inspect a supplied order directly.

The SQLite projection package is isolated outside the kernel and uses the local `sqlite3` command-line tool for v0.1. The projection is always rebuildable from JSONL event logs.

## Consequences

- Replaying the same unordered event set produces stable in-memory and SQLite projections.
- Event IDs remain content-derived from canonical event content, excluding `id` and `signature`.
- The kernel keeps no database, filesystem, UI, or storage dependency.
- v0.1 avoids native npm SQLite dependencies, but local CLI search/rebuild requires `sqlite3` to be installed.
