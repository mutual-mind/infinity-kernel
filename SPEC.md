# Infinity Kernel v0.1 Specification

## Purpose

Infinity Kernel v0.1 is a local-first semantic event system for public project evolution.

It represents the transformation chain:

```text
Wish → Problem → Idea → Project → Task → Artifact → Evidence → Offer → Update
```

as an append-only log of signed, versioned semantic events.

## Source of truth

The source of truth is not a database. It is an append-only sequence of content-addressed events.

```ts
interface InfinityEvent {
  schema: "infinity.event.v0";
  id: EventId;                 // content-derived ID
  actor: ActorId;              // local actor or public key based ID
  time: string;                 // ISO 8601 UTC
  type: EventType;
  subject?: ObjectId;
  payload: unknown;
  parents: EventId[];
  signature?: SignatureEnvelope;
}
```

The `id` must be computed from canonicalized event content excluding fields that cannot be known before hashing, such as `id` and optionally `signature`.

## Kernel object kinds

Minimum object kinds:

```text
agent
perspective
wish
problem
idea
project
task
artifact
claim
evidence
offer
update
relation
```

## Generic object envelope

```ts
interface InfinityObject {
  id: ObjectId;
  kind: ObjectKind;
  title?: string;
  summary?: string;
  body?: string;
  status?: string;
  tags: string[];
  createdBy: ActorId;
  createdAt: string;
  updatedAt: string;
  attributes: Record<string, unknown>;
}
```

## Relations

Relations are semantic edges:

```text
proposes
criticizes
depends_on
implements
evidences
requests
offers
forks
supersedes
belongs_to
contains
blocks
enables
updates
```

The relation vocabulary must be extensible without changing the event envelope.

## Event types

Minimum event types:

```text
actor.created
object.created
object.updated
object.status_changed
relation.created
relation.removed
claim.added
evidence.added
task.added
artifact.added
offer.added
update.added
proposal.created
proposal.accepted
proposal.rejected
```

## Replay

Replay must be deterministic:

```text
events → reducer → in-memory projection
```

Given the same ordered event list, replay must produce the same projection.

If events are unordered, an explicit deterministic sort must be used. v0.1 may sort by `(time, id)` after parent validation, but this decision must be recorded in an ADR.

## Storage v0.1

Storage is a JSONL event log:

```text
data/events/*.jsonl
```

Each line is one event. Bundles are folders or archives containing:

```text
manifest.json
schemas/
events/*.jsonl
actors/
checksums.json
README.md
```

## Projection v0.1

SQLite projection contains at least:

```text
events
objects
relations
claims
evidence
tasks
artifacts
offers
updates
search_index
```

The projection is disposable. It can always be rebuilt from event logs.

## CLI v0.1

Commands:

```text
init
create-actor
create-object
relate
add-claim
add-task
add-artifact
add-evidence
add-offer
add-update
replay
export-bundle
import-bundle
search
show-object
verify
```

## Seed projects

Create seed event logs for:

- Infinity Project
- Lifecar Project
- XMaze Project
- Metaformat Project

Each seed project should include:

```text
wish
problem
idea
project
at least 3 tasks
at least 2 claims
at least 1 evidence placeholder
at least 1 update
```

## Non-goals

v0.1 must not implement:

- accounting,
- investment,
- project stocks,
- securities-like claims,
- real-money payments,
- blockchain writes,
- complex authentication,
- multi-user permissions,
- real-time collaboration,
- a full marketplace,
- AI content generation as canonical state.

## Acceptance tests

- A clean checkout can install dependencies.
- Tests pass.
- Typecheck passes.
- Seed logs replay deterministically.
- Replaying the same event logs twice gives the same projection.
- Tampering with an event changes its content hash or fails verification.
- SQLite projection can be deleted and rebuilt from event logs.
- CLI can create a wish, idea, project, task, artifact, offer, and update.
- Search can find seed projects.
- Adding a new object kind does not require changing the event log envelope.
- All important architecture decisions are documented in `docs/adr`.
