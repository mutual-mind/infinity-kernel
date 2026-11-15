import { createHash } from "node:crypto";
import type { InfinityEventV0 } from "./causal-spine.js";

type JsonPrimitive = null | boolean | number | string;
export type CanonicalJsonValue =
  JsonPrimitive | CanonicalJsonValue[] | { [key: string]: CanonicalJsonValue };

function assertPlainObject(value: object): void {
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    throw new TypeError("canonical JSON objects must be plain objects");
  }
}

function canonicalizeValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("canonical JSON numbers must be finite");
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalizeValue).join(",")}]`;
  }
  if (typeof value === "object") {
    assertPlainObject(value);
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    const entries = keys.map((key) => {
      const next = record[key];
      if (
        next === undefined ||
        typeof next === "function" ||
        typeof next === "symbol" ||
        typeof next === "bigint"
      ) {
        throw new TypeError(`unsupported canonical JSON value at key: ${key}`);
      }
      return `${JSON.stringify(key)}:${canonicalizeValue(next)}`;
    });
    return `{${entries.join(",")}}`;
  }
  throw new TypeError(`unsupported canonical JSON value: ${typeof value}`);
}

export function canonicalJson(value: unknown): string {
  return canonicalizeValue(value);
}

export function sha256HexCanonical(value: unknown): string {
  return createHash("sha256")
    .update(canonicalJson(value), "utf8")
    .digest("hex");
}

export type UnsignedInfinityEventV0 = Omit<
  InfinityEventV0,
  "id" | "signature"
> & {
  signature?: never;
};

export function infinityEventContent(
  event: InfinityEventV0 | UnsignedInfinityEventV0,
): Record<string, unknown> {
  const {
    id: _id,
    signature: _signature,
    ...content
  } = event as InfinityEventV0;
  return content;
}

export function infinityEventId(
  event: InfinityEventV0 | UnsignedInfinityEventV0,
): string {
  return `event:${sha256HexCanonical(infinityEventContent(event))}`;
}

export function createInfinityEventV0(
  event: UnsignedInfinityEventV0,
): InfinityEventV0 {
  return {
    ...event,
    id: infinityEventId(event),
  };
}

export function verifyInfinityEventId(event: InfinityEventV0): boolean {
  return event.id === infinityEventId(event);
}
