import { describe, expect, it } from "vitest";
import {
  assertCausalSpineRelationV0,
  assertCausalSpineNodeV0,
  createInfinityEventV0,
  replayCausalSpine,
  type CausalSpineNodeV0,
  type CausalSpineRelationV0,
  type InfinityEventV0,
} from "../src/index.js";

const node = (
  id: string,
  kind: CausalSpineNodeV0["kind"],
): CausalSpineNodeV0 => ({
  schema: "infinity.causal-node.v0",
  id,
  kind,
  actorRefs: ["agent:saya"],
  attributes: {},
});

const relation = (
  id: string,
  source: string,
  target: string,
  predicate: CausalSpineRelationV0["predicate"],
): CausalSpineRelationV0 => ({
  schema: "infinity.causal-relation.v0",
  id,
  source,
  target,
  predicate,
  attributes: {},
});

const event = (
  type: string,
  payload: unknown,
  parents: string[] = [],
): InfinityEventV0 =>
  createInfinityEventV0({
    schema: "infinity.event.v0",
    actor: "agent:saya",
    time: "2026-11-15T12:30:00Z",
    type,
    payload,
    parents,
  });

describe("Causal Spine v0", () => {
  it("accepts observation → interpretation → intention → action → outcome", () => {
    const events: InfinityEventV0[] = [];
    const append = (type: string, payload: unknown) => {
      const next = event(
        type,
        payload,
        events.length ? [events.at(-1)!.id] : [],
      );
      events.push(next);
      return next;
    };

    append("object.created", { object: node("obs:1", "observation") });
    append("object.created", { object: node("interp:1", "interpretation") });
    append("relation.created", {
      relation: relation("r1", "obs:1", "interp:1", "interpreted_as"),
    });
    append("object.created", { object: node("intent:1", "intention") });
    append("relation.created", {
      relation: relation("r2", "interp:1", "intent:1", "motivates"),
    });
    append("object.created", { object: node("action:1", "action") });
    append("relation.created", {
      relation: relation("r3", "intent:1", "action:1", "realized_by"),
    });
    append("object.created", { object: node("outcome:1", "outcome") });
    append("relation.created", {
      relation: relation("r4", "action:1", "outcome:1", "produces"),
    });

    const snapshot = replayCausalSpine(events);
    expect(Object.keys(snapshot.nodes)).toHaveLength(5);
    expect(Object.keys(snapshot.relations)).toHaveLength(4);
    expect(snapshot.relations.r4?.predicate).toBe("produces");
  });

  it("rejects canonical geometry fields", () => {
    expect(() =>
      assertCausalSpineNodeV0({
        ...node("obs:1", "observation"),
        position: [1, 2, 3],
      }),
    ).toThrow(/unsupported causal node field: position/);
  });

  it("rejects invalid confidence", () => {
    expect(() =>
      assertCausalSpineNodeV0({
        ...node("obs:1", "observation"),
        confidence: 1.1,
      }),
    ).toThrow();
  });

  it("rejects self-referential relations", () => {
    expect(() =>
      assertCausalSpineRelationV0(relation("r1", "obs:1", "obs:1", "causes")),
    ).toThrow();
  });

  it("requires parents to have already been replayed", () => {
    const missingParent = event("object.created", {
      object: node("unreplayed:1", "event"),
    });
    const child = event(
      "object.created",
      { object: node("obs:1", "observation") },
      [missingParent.id],
    );
    expect(() => replayCausalSpine([child])).toThrow(/parent not yet replayed/);
  });

  it("requires relation endpoints to exist", () => {
    const created = event("object.created", {
      object: node("obs:1", "observation"),
    });
    const linked = event(
      "relation.created",
      { relation: relation("r1", "obs:1", "missing", "causes") },
      [created.id],
    );
    expect(() => replayCausalSpine([created, linked])).toThrow(/unknown node/);
  });

  it("rejects events whose content no longer matches their id", () => {
    const created = event("object.created", {
      object: node("obs:1", "observation"),
    });
    const tampered = { ...created, actor: "agent:other" };
    expect(() => replayCausalSpine([tampered])).toThrow(/content id mismatch/);
  });
});
