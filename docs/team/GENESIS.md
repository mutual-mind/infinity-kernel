# Infinity Team Genesis Plan

Status: bootstrap proposal. This document creates a reversible starting point; it does not authorize production changes by itself.

## 0. What already exists

The repository already seeds Infinity Kernel v0.1 as a local-first, protocol-first system with a replayable event log, rebuildable SQLite projection, content IDs, signing, and CLI tooling.

Infinity Team is not a replacement for that direction. It is the long-lived development and operations organ that can carry the kernel and other software through their complete lifecycles.

## 1. Formation target

Create one persistent core cohort with four seats:

- Steward
- Architect
- Builder
- Verifier/SRE

Each seat gets:

- a stable seat ID;
- a short durable journal;
- current obligations;
- last handoff;
- confidence/unknowns relevant to its obligations;
- known relationships to the other seats.

The seats should accumulate shared history over repeated runs. Model/process replacement should be treated as a handoff into an existing role, not creation of a new team.

## 2. Minimum internal state

Do not build a large coordination platform first.

Start with a repository-backed state tree such as:

```text
team/
  roster.yaml
  situation.md
  decisions/
  journals/
    steward.md
    architect.md
    builder.md
    verifier-sre.md
  capabilities/
  incidents/
  experiments/
```

This is intentionally boring, diffable, inspectable, exportable, and recoverable.

After the cohort has used it enough to expose real coordination pressure, it may design a richer local operational store. Grist, SQLite, or an Infinity-native event node are candidates; none is mandatory at genesis.

## 3. External boundary

The existing shared Grist `Agent_Notes` table is the initial intake/outbox boundary.

A proposal targeted to `Infinity Team` should be read as durable-capability admission, not ordinary task execution.

The team should write back only boundary-relevant outcomes:

- ACCEPT / REJECT / NEEDS-EVIDENCE;
- accepted capability identity;
- major lifecycle transition;
- material incident;
- important architectural decision;
- new human authority boundary.

Routine internal chatter should remain inside the team's own world.

## 4. Intake protocol v0

For each new Infinity-Team proposal:

1. Steward states the durable need and expected value.
2. Architect identifies existing capabilities that could absorb it and the likely lifecycle liability.
3. Verifier/SRE states the minimum test/recovery/observability evidence required before ownership.
4. Builder estimates implementation and maintenance surface.
5. Steward returns one of:
   - REJECT;
   - EPHEMERAL — do once, do not instantiate;
   - INCUBATE — bounded experiment;
   - ACCEPT — create lifecycle contract and ownership loop.

Silence is not acceptance.

## 5. Work protocol

For accepted/incubating work, maintain a small continuous loop:

```text
observe → select next bounded change → implement → independently verify
        → release if evidence passes → observe again
```

A seat must not mark its own consequential change verified without independent evidence from the Verifier/SRE function.

The team should prefer small reversible changes and explicit ADRs over large hidden rewrites.

## 6. Compute governance

The currently available compute budget should be treated as seed capital.

At genesis:

- reserve most compute for future loops rather than an initial code-generation burst;
- require a budget ceiling for experiments;
- measure useful displacement: capability gained, human attention removed, reliability increased, or future compute avoided;
- stop work that produces activity without persistent leverage.

A later team decision may allocate explicit envelopes per owned capability.

## 7. First apprenticeship capability

Candidate: **autonomous continuity of Saya Shared State / Grist**.

Why it is suitable:

- it has a real long-term user;
- failure is objectively observable;
- lifecycle ownership matters more than initial coding;
- backup/restore, release, monitoring, failover, security, and reconstruction all matter;
- it directly tests the principle that human availability should not be an operational dependency.

Important ordering constraint:

The current ATTN-002 production backup/restore exercise remains the prerequisite evidence boundary. Infinity Team must not broaden or interfere with that exercise. After the recovery path is proven, the team may evaluate a successor capability covering off-host replication, discovery, fencing, automated reconstruction, and ongoing recovery drills.

## 8. Infinity Kernel relationship

Do not ask the new team to build all of Infinity immediately.

Once the team demonstrates that it can keep one capability alive across repeated cycles, give it ownership of Infinity Kernel v0.1 and allow it to evolve the kernel through normal lifecycle governance.

A later Infinity-native coordination substrate should earn adoption by outperforming the simple bootstrap state under real team pressure.

## 9. Genesis acceptance test

Infinity Team should not be considered instantiated merely because these documents exist.

Genesis is complete when all of the following have occurred:

1. the four seats have persistent identities/state;
2. at least one proposal has been rejected or downgraded on lifecycle grounds;
3. at least one proposal has been accepted;
4. the accepted capability has passed implementation, independent verification, release, and subsequent observation;
5. the team has returned after a later invocation and continued from its prior shared state without reconstruction by Mindey;
6. a model/process change in at least one seat has been handled as a handoff while preserving obligations and shared history.

Only then do we have evidence of a long-lived group rather than a prompt that describes one.
