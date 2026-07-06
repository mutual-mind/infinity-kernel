# Storage Strategy

## v0.1: Files

Use local file storage first.

```text
data/
  actors/
  events/
  bundles/
  projections/
```

Event logs should be JSONL.

## Bundle manifest

```json
{
  "schema": "infinity.bundle.v0",
  "bundleId": "bundle:<hash>",
  "createdAt": "...",
  "events": [
    {"path": "events/main.jsonl", "sha256": "...", "count": 123}
  ],
  "schemas": [],
  "actors": [],
  "projectionChecksum": null
}
```

## Integrity

The bundle verifier should detect:

- changed event content,
- missing event files,
- manifest mismatch,
- duplicate event IDs with different content,
- invalid schema names.

## SQLite projection

The SQLite database is disposable.

Recommended path:

```text
data/projections/infinity.sqlite
```

Never put canonical information only in SQLite.
