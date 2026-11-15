import { describe, expect, it } from "vitest";
import {
  canonicalJson,
  createInfinityEventV0,
  infinityEventId,
  verifyInfinityEventId,
} from "../src/index.js";

describe("canonical JSON and event ids", () => {
  it("sorts object keys recursively while preserving array order", () => {
    expect(canonicalJson({ z: 1, a: { y: 2, x: [3, 1] } })).toBe(
      '{"a":{"x":[3,1],"y":2},"z":1}',
    );
  });

  it("rejects values that JSON would silently discard or coerce", () => {
    expect(() => canonicalJson({ a: undefined })).toThrow(/unsupported/);
    expect(() => canonicalJson({ a: Number.NaN })).toThrow(/finite/);
    expect(() => canonicalJson({ a: BigInt(1) })).toThrow(/unsupported/);
  });

  it("derives the same id regardless of source object key insertion order", () => {
    const a = createInfinityEventV0({
      schema: "infinity.event.v0",
      actor: "agent:saya",
      time: "2026-11-15T12:30:00Z",
      type: "object.created",
      payload: { b: 2, a: 1 },
      parents: [],
    });
    const b = createInfinityEventV0({
      parents: [],
      payload: { a: 1, b: 2 },
      type: "object.created",
      time: "2026-11-15T12:30:00Z",
      actor: "agent:saya",
      schema: "infinity.event.v0",
    });
    expect(a.id).toBe(b.id);
    expect(a.id).toMatch(/^event:[0-9a-f]{64}$/);
    expect(verifyInfinityEventId(a)).toBe(true);
  });

  it("excludes signature and id from the content hash", () => {
    const unsigned = createInfinityEventV0({
      schema: "infinity.event.v0",
      actor: "agent:saya",
      time: "2026-11-15T12:30:00Z",
      type: "object.created",
      payload: { a: 1 },
      parents: [],
    });
    const signed = {
      ...unsigned,
      signature: {
        algorithm: "test",
        publicKey: "pk",
        signature: "sig",
      },
    };
    expect(infinityEventId(signed)).toBe(unsigned.id);
  });
});
