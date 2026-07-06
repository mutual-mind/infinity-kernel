# Codex Goal 002 — Build Infinity Web v0.1

Do not start this until Goal 001 is working.

## Goal

Build a local web UI over the existing kernel and SQLite projection.

Use Next.js + TypeScript only as a view/application layer. Do not move canonical state into the web app.

## Pages

1. Home.
2. Project list.
3. Object page.
4. Create object.
5. Relate objects.
6. Add update.
7. Search.
8. Seed project pages for Infinity, Lifecar, XMaze, Metaformat.

## Object page layout

- title,
- kind,
- summary,
- body,
- status,
- parent/child relations,
- claims,
- evidence,
- tasks,
- artifacts,
- offers,
- updates,
- event history,
- export object bundle.

## Non-goals

- no auth beyond local actor selection,
- no accounting,
- no investment,
- no marketplace,
- no blockchain,
- no AI generation.

## Acceptance tests

- app builds,
- seed project pages render,
- object page can be reconstructed from event log,
- deleting SQLite projection and replaying produces the same visible content.
