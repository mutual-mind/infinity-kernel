import { describe, expect, it } from "vitest";
import {
  canonicalJson,
  createActorEvent,
  createEvent,
  createLocalDevelopmentSigner,
  createObjectEvent,
  projectionToJson,
  replayEvents,
  validateEvent,
  verifyEventSignature,
} from "../src/index.js";

describe("@infinity/kernel", () => {
  it("canonicalizes object keys deterministically", () => {
    expect(canonicalJson({ b: 2, a: { d: 4, c: 3 } })).toBe('{"a":{"c":3,"d":4},"b":2}');
  });

  it("creates stable content-derived event ids", () => {
    const actor = "actor:test";
    const left = createEvent({ actor, time: "2026-01-01T00:00:00.000Z", type: "object.status_changed", subject: "obj:x", payload: { status: "open" } });
    const right = createEvent({ actor, time: "2026-01-01T00:00:00.000Z", type: "object.status_changed", subject: "obj:x", payload: { status: "open" } });
    expect(left.id).toBe(right.id);
  });

  it("detects tampered event content", () => {
    const event = createEvent({ actor: "actor:test", time: "2026-01-01T00:00:00.000Z", type: "object.status_changed", subject: "obj:x", payload: { status: "open" } });
    expect(() => validateEvent({ ...event, payload: { status: "closed" } })).toThrow(/Event id mismatch/u);
  });

  it("signs and verifies with the local development signer", () => {
    const signer = createLocalDevelopmentSigner("tester", "secret");
    const actorEvent = createActorEvent({ name: "tester", time: "2026-01-01T00:00:00.000Z", signer });
    expect(verifyEventSignature(actorEvent, signer)).toBe(true);
    expect(verifyEventSignature({ ...actorEvent, signature: { ...actorEvent.signature!, signature: "bad" } }, signer)).toBe(false);
  });

  it("replays deterministically regardless of input order", () => {
    const actorEvent = createActorEvent({ name: "tester", time: "2026-01-01T00:00:00.000Z" });
    const objectEvent = createObjectEvent({ actor: actorEvent.actor, time: "2026-01-01T00:00:01.000Z", kind: "wish", title: "A durable protocol" });
    const first = replayEvents([objectEvent, actorEvent]);
    const second = replayEvents([actorEvent, objectEvent]);
    expect(canonicalJson(projectionToJson(first))).toBe(canonicalJson(projectionToJson(second)));
  });
});
