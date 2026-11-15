# Infinity canonical JSON v0

**Status: FROZEN for `infinity.event.v0`.**

Infinity event IDs are SHA-256 digests of a deterministic UTF-8 serialization of the event content.

## Canonical value domain

Canonical values are JSON values only:

- `null`, booleans, finite numbers, and strings;
- arrays, preserving element order;
- plain objects with string keys.

`undefined`, functions, symbols, bigint values, non-finite numbers, and non-plain objects are rejected rather than silently discarded or coerced.

## Serialization

For every object:

1. sort property names recursively using ECMAScript's default lexicographic string order;
2. serialize keys and primitives using JSON string/number serialization;
3. preserve array order;
4. emit no insignificant whitespace;
5. encode the resulting text as UTF-8.

This is the Infinity v0 canonicalization contract. A future canonicalization change requires a new event schema version.

## Event content ID

The hash input is the event with `id` and `signature` excluded.

```text
canonical = canonicalJson(event without id/signature)
digest    = SHA-256(UTF-8(canonical))
id        = "event:" + lowercase_hex(digest)
```

A signature may therefore be attached or replaced without changing the event's content identity.

Replay rejects an event when its supplied `id` does not equal the recomputed content ID.

## Parent links

Every `parents[]` value is another valid `event:<sha256>` ID. Duplicate parents are invalid.

A replay stream is accepted only when each parent has already appeared. More general DAG/topological replay can be added later without changing event identity.
