# Causal Spine v0

## Purpose

The Causal Spine is the canonical semantic substrate from which navigable causal geography can be derived.

It is **not** an Atlas layout and contains no canonical XYZ coordinates. Causal Atlas is a projection of the Spine, not its source of truth.

## Layering

```text
Infinity event log (canonical)
  → Causal Spine snapshot H (replayable graph)
  → Causal manifold E (derived persistent geography)
  → Atlas projection P (observer-relative view)
  → Projection Plane (presentation policy / display membrane)
```

Only the append-only Infinity event log is authoritative. The Causal Spine snapshot is deterministically replayable. Manifold coordinates and rendered views are projections.

## Minimal causal node kinds

- `observation` — a sensed, measured, reported, or otherwise registered occurrence.
- `state` — a proposition that a condition holds over some temporal extent.
- `interpretation` — meaning assigned to observations or state.
- `intention` — an actor's desired transition or commitment toward a future state.
- `action` — an intervention or attempted intervention.
- `outcome` — a consequence observed after an action or other cause.
- `evidence` — an inspectable item that changes confidence in another node.
- `capability` — a persistent ability or affordance that can enable actions.
- `event` — a generic temporally bounded occurrence when no narrower kind fits.

`reinterpretation` is represented as a new `interpretation` node linked by `revises` or `supersedes`, preserving history rather than mutating meaning in place.

## Relation direction

Relations point from semantic antecedent/source to consequent/target.

Examples:

```text
observation --interpreted_as--> interpretation
interpretation --motivates--> intention
intention --realized_by--> action
action --produces--> outcome
evidence --supports--> interpretation
evidence --contradicts--> interpretation
capability --enables--> action
new interpretation --revises--> old interpretation
cause --causes--> effect
```

Predicates in v0:

`causes`, `influences`, `enables`, `inhibits`, `interpreted_as`, `motivates`,
`realized_by`, `produces`, `supports`, `contradicts`, `evidences`, `revises`,
`supersedes`, `depends_on`, `part_of`, `counterfactual_to`.

## Canonical node

```ts
interface CausalSpineNodeV0 {
  schema: "infinity.causal-node.v0";
  id: string;
  kind:
    | "observation"
    | "state"
    | "interpretation"
    | "intention"
    | "action"
    | "outcome"
    | "evidence"
    | "capability"
    | "event";
  title?: string;
  summary?: string;
  actorRefs: string[];
  time?: {
    start?: string;
    end?: string;
    observedAt?: string;
  };
  confidence?: number;
  attributes: Record<string, unknown>;
}
```

## Canonical relation

```ts
interface CausalSpineRelationV0 {
  schema: "infinity.causal-relation.v0";
  id: string;
  source: string;
  target: string;
  predicate: CausalRelationPredicate;
  confidence?: number;
  attributes: Record<string, unknown>;
}
```

## Event representation

Causal nodes and relations travel through the existing `infinity.event.v0` envelope.

Initial mapping:

- `object.created` `{ object: CausalSpineNodeV0 }`
- `object.updated` `{ object: CausalSpineNodeV0 }`
- `relation.created` `{ relation: CausalSpineRelationV0 }`
- `relation.removed` `{ relationId }`

This keeps causal semantics extensible without changing the event envelope.

## Geography boundary

Coordinates, region assignment, semantic neighborhood, visual salience, camera pose, trails, and observer loci are **not canonical Spine fields**.

The manifold layer may compute and persist them as a projection keyed by:

- source Spine revision / event frontier,
- layout algorithm and version,
- layout parameters,
- previous manifold revision.

This allows geography to preserve learned spatial memory through a displacement penalty while remaining rebuildable from canonical semantics.

## First acceptance gate

A Causal Spine v0 is sufficient for Atlas integration when:

1. the minimal causal chain can be represented without custom per-example fields;
2. replay of the same ordered event set is deterministic;
3. relations cannot reference nonexistent nodes;
4. reinterpretation preserves earlier interpretations rather than overwriting them;
5. no canonical node or relation requires display coordinates;
6. Atlas can consume a replayed snapshot through a separate Spine→Manifold adapter.

## v0 freeze

`infinity.causal-node.v0`, `infinity.causal-relation.v0`, and the causal mutation mapping are now frozen as the first interoperability boundary.

For v0:

- node kinds are the nine values listed above;
- relation predicates are the sixteen values listed above;
- canonical geometry is forbidden;
- event mutations are `object.created`, `object.updated`, `relation.created`, and `relation.removed`;
- event identity follows `docs/CANONICAL_JSON.md`.

New causal kinds or predicates require a new causal schema version, not a silent reinterpretation of v0.
