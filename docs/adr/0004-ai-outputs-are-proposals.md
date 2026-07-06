# ADR 0004: AI outputs are proposals

## Status

Accepted.

## Decision

AI-generated council outputs are not canonical state by default. They are proposal objects or proposal events until accepted by a local/real actor.

## Consequences

- The canonical graph is less likely to become hallucination sediment.
- Human/local actor agency remains explicit.
- The proposal layer can still be archived and debated.
