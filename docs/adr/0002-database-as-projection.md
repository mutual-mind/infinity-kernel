# ADR 0002: Database as projection

## Status

Accepted.

## Decision

SQLite is used as a rebuildable local projection for querying and search, not as canonical storage.

## Consequences

- SQLite can be deleted and reconstructed from event logs.
- Projection schema can evolve independently from event schemas.
- Kernel must remain independent of SQLite.
