# Event Format

## Design goals

- append-only,
- portable,
- content-addressed,
- signed or signable,
- versioned,
- deterministic replay,
- human-inspectable,
- storage-adapter neutral.

## Event envelope draft

```ts
export interface InfinityEventV0 {
  schema: "infinity.event.v0";
  id: string;
  actor: string;
  time: string;
  type: string;
  subject?: string;
  payload: unknown;
  parents: string[];
  signature?: {
    algorithm: string;
    publicKey: string;
    signature: string;
  };
}
```

## Content ID rule

Compute event ID from a canonical serialization of the event excluding `id` and `signature`.

Recommended textual form:

```text
event:<sha256-base32-or-hex>
```

Object IDs may be derived from creation event IDs:

```text
obj:<sha256-base32-or-hex>
```

## Canonicalization

Implement a stable JSON canonicalizer:

- recursively sort object keys,
- preserve array order,
- reject `undefined`, functions, and non-JSON values,
- use UTF-8 encoding,
- hash bytes with SHA-256.

## Signatures

v0.1 may use a development signer. The interface must allow replacement by Ed25519 or other public-key schemes later.

## Parent events

`parents` supports provenance and DAG-like linking. v0.1 may accept a linear JSONL log, but must preserve parents in the event.
