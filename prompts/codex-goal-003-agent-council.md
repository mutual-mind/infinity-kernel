# Codex Goal 003 — Agent Council v0.1

Do not start this until Goals 001 and 002 are working.

## Goal

Add an Agent Council proposal layer.

AI or synthetic perspective outputs must be proposed events, not canonical events.

## Build

Create `packages/agent-council` with structured perspective templates:

- Halfbakery lateral critic,
- manufacturing engineer,
- economist,
- alignment theorist,
- political realist,
- ecologist,
- user advocate,
- implementation minimalist.

Each perspective run should produce structured proposals:

- claims,
- objections,
- tasks,
- questions,
- risks,
- alternative mechanisms.

## Important invariant

Proposals do not affect canonical projection until accepted by a local/real actor.

## Acceptance tests

- perspective run produces structured proposal objects,
- proposed objects do not affect canonical projection until accepted,
- accepted proposal becomes normal event,
- rejected proposal is preserved as deliberation history.
