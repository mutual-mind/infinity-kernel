# Codex Goal 004 — Replication/Export v0.1

Do not start this until Goal 001 is working.

## Goal

Improve portable replication.

Implement export/import adapters for:

1. local folder bundles,
2. Git-friendly JSONL bundles,
3. IPFS-ready content-addressed bundles.

Do not require an IPFS node for tests. Generate deterministic bundle files and manifests that can later be pinned to IPFS.

## Bundle contents

Each bundle should include:

- manifest,
- schemas,
- actor public keys,
- event logs,
- content hashes,
- projection checksum if available,
- README for humans.

## Acceptance tests

- export seed projects into bundles,
- import bundles into clean repository,
- replay imported events,
- verify checksums,
- detect tampering.
