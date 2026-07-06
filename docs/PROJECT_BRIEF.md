# Infinity Project Brief

## Core identity

Infinity is a public cognition-and-production protocol where wishes become models, models become projects, projects become artifacts, artifacts become tradable instances, and every step remains discussable, inspectable, forkable, and improvable by human and AI agents.

The deep process is:

```text
Wishing / goals
  → Thinking / methods
  → Making / products
  → Trading / instances
  → Updates / evidence / news
  → revised wishes
```

The first implementation should create a kernel that can evolve Infinity itself.

## Unifying project architecture

- **Infinity** — the outer social operating system for collective agency.
- **Metaformat** — the data physics: self-evolving semantic records.
- **XMaze** — the motivation and task-routing layer.
- **Lifecar** — a flagship embodied product proving that the system can converge on complex physical-world artifacts.
- **Mutual-Mind/RUGS** — later social bonding/governance extension.

For v0.1, only Infinity Kernel matters. XMaze, Lifecar, and Metaformat should appear as seed project records, not as full subsystems.

## Local-first interpretation

The system should feel like a local semantic node:

```text
remote/source event streams
  → local fetch/import adapters
  → signature/content verification
  → local append-only event store
  → rebuildable SQLite projection
  → CLI/web/desktop views
  → new locally signed events
  → export/replication
```

The eventual network can resemble old distributed publishing systems in spirit: many event sources, local indexing, durable copying, and no single server as the metaphysical center.

## Database stance

The database is a cache/projection. It can be deleted and rebuilt from event logs.

## Server stance

Servers are convenience infrastructure. A server may host bundles, projections, or web views, but must not be required to understand or preserve the data.

## Economics stance

The old Django prototype mixed project pages, accounting, investment, generic products, project stocks, and commodities. That imagination is valuable, but not kernel material.

Economics returns later as a plugin over:

```text
Offer → Right → Transfer → LedgerEntry → Account → ProjectShare
```

Do not implement it in v0.1.

## AI-agent stance

AI perspectives should produce proposed events, not canonical events.

A synthetic perspective can propose:

- objections,
- claims,
- tasks,
- questions,
- design alternatives,
- risk analyses.

Only a local/real actor acceptance event should promote a proposal into canonical project state.

## Seed pages

The first human-visible magic should be four semantic project pages:

- Infinity Project
- Lifecar Project
- XMaze Project
- Metaformat Project

Each should be reconstructable from seed events and searchable locally.
