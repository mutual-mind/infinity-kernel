# ADR 0001: Event log as source of truth

## Status

Accepted.

## Decision

Infinity canonical state is an append-only semantic event log. Databases, UI views, and search indexes are projections.

## Consequences

- State can be replayed.
- Data can be exported and replicated.
- Multiple apps can read the same event substrate.
- Projection bugs can be fixed by rebuilding.
- More design discipline is required around event schemas and migrations.
