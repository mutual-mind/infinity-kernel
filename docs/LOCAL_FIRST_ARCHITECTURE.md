# Local-First Architecture

## Node model

An Infinity node is any runtime that can:

1. read Infinity event bundles,
2. verify hashes/signatures,
3. store events locally,
4. replay events into projections,
5. display/search objects,
6. create new local events,
7. export event bundles.

## Pipeline

```text
Source adapters
  local folder / Git / IPFS-ready bundle / email payload / other later transports
      ↓
Event verifier
      ↓
Append-only local event store
      ↓
Kernel replay
      ↓
SQLite projection
      ↓
CLI / web app / desktop shell
      ↓
New signed events
      ↓
Bundle export
```

## Why not central database first?

A single cloud database is operationally convenient but existentially fragile. Infinity should be able to outlive any particular server, cloud account, company, or maintainer.

## v0.1 transport priority

1. Local JSONL logs.
2. Folder bundles.
3. Git-friendly bundles.
4. IPFS-ready content-addressed bundles without requiring a live IPFS node.
5. Later: AT Protocol, Solid pods, email, Telegram/Matrix-like transports, blockchain anchoring.

## UI priority

CLI first, then local web UI, then optional desktop shell.

Do not let Electron/Tauri/Next.js become the architecture. They are views over the kernel and projection.
