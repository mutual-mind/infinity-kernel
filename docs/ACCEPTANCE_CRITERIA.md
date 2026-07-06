# Acceptance Criteria

The first Codex run is successful when:

1. `pnpm install` completes.
2. `pnpm test` passes or documented known failures remain small and local.
3. `pnpm typecheck` passes.
4. A CLI can initialize a local Infinity store.
5. A CLI can create an actor.
6. A CLI can create objects of at least these kinds: wish, idea, project, task, artifact, evidence, offer, update.
7. A CLI can relate objects.
8. Events are written to JSONL.
9. Events have deterministic content IDs.
10. Replay is deterministic.
11. SQLite projection can be deleted and rebuilt.
12. Seed projects replay into visible/searchable objects.
13. Tampering with an event is detected by verification.
14. Kernel package has no database/UI/storage dependency.
15. Non-goals are not implemented.
