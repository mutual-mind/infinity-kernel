# Codex Goal 001 — Build Infinity Kernel v0.1

## Goal

Build **Infinity Kernel v0.1**, a protocol-first semantic project system.

Infinity is not a normal project-management app. It is a system for turning wishes into ideas, ideas into projects, projects into artifacts, artifacts into offers, and offers into updates/evidence.

The database is not the source of truth. The source of truth is an append-only, signed, portable event log. Databases are rebuildable projections.

## Read first

Read these files before coding:

1. `AGENTS.md`
2. `SPEC.md`
3. `docs/PROJECT_BRIEF.md`
4. `docs/INFINITY_ONTOLOGY.md`
5. `docs/LOCAL_FIRST_ARCHITECTURE.md`
6. `docs/EVENT_FORMAT.md`
7. `docs/STORAGE_STRATEGY.md`
8. `docs/DECISION_POLICY.md`
9. `docs/ACCEPTANCE_CRITERIA.md`

## Build packages

### 1. `packages/kernel`

Implement:

- versioned schemas for actors, events, objects, relations, claims, evidence, tasks, artifacts, offers, updates, proposals;
- object kinds:
  - agent,
  - perspective,
  - wish,
  - problem,
  - idea,
  - project,
  - task,
  - artifact,
  - claim,
  - evidence,
  - offer,
  - update,
  - relation;
- event types:
  - actor.created,
  - object.created,
  - object.updated,
  - object.status_changed,
  - relation.created,
  - relation.removed,
  - claim.added,
  - evidence.added,
  - task.added,
  - artifact.added,
  - offer.added,
  - update.added,
  - proposal.created,
  - proposal.accepted,
  - proposal.rejected;
- deterministic canonical JSON serialization;
- deterministic event IDs using content hashes;
- event validation;
- deterministic object projection by replaying events;
- placeholder signing and verification interfaces, with a simple local development signer;
- migration/versioning structure;
- tests for canonicalization, ID stability, tamper detection, and deterministic replay.

### 2. `packages/storage-files`

Implement:

- append-only JSONL event logs;
- load/save event logs;
- export/import portable bundles;
- verify bundle integrity;
- replay bundles into kernel projections;
- tests for round-trip import/export and tamper detection.

### 3. `packages/projection-sqlite`

Implement:

- SQLite projection of events, objects, relations, and searchable text;
- projector that can delete/rebuild projection from event logs;
- basic full-text search if practical;
- tests proving rebuildability.

### 4. `apps/cli`

Implement commands:

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

The CLI should be useful locally even without a web app.

### 5. `seeds`

Create seed event logs for:

- Infinity Project
- Lifecar Project
- XMaze Project
- Metaformat Project

Each seed project should include:

- a wish,
- a problem,
- an idea,
- a project,
- at least 3 tasks,
- at least 2 claims,
- at least 1 evidence placeholder,
- at least 1 update.

Use the existing seed markdown files as conceptual input, but create canonical seed events that can be replayed.

## Non-goals

Do **not** implement:

- accounting,
- investment,
- project stocks,
- securities-like language,
- real-money transactions,
- blockchain writes,
- authentication beyond local development actors,
- complex permissions,
- real-time collaboration,
- marketplace UI,
- web UI,
- AI generation.

## Autonomy policy

Work autonomously. If you hit ordinary uncertainty, choose the simplest reversible solution, record the decision in `WORKLOG.md` and an ADR if architectural, and continue.

Do not stop to ask the human unless:

- credentials are required,
- destructive actions outside the repo would be required,
- an irreversible architecture choice is required,
- the task cannot proceed at all.

## Definition of done

- `pnpm install` succeeds.
- `pnpm test` passes.
- `pnpm typecheck` passes.
- Seed logs replay deterministically.
- Replaying the same events twice gives the same projection.
- Tampering with an event changes its content hash or fails verification.
- SQLite projection can be deleted and rebuilt from event logs.
- CLI can create a wish, idea, project, task, artifact, offer, and update.
- Search can find seed projects.
- Adding a new object kind does not require changing the event log envelope.
- All important architecture decisions are documented in `docs/adr`.
- `WORKLOG.md` summarizes implemented features, commands run, tests, known limitations, and next steps.
