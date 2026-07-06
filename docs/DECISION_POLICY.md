# Decision Policy for Unattended Agentic Coding

When working unattended, do not stop for ordinary product or implementation uncertainty.

## Default choices

- Use TypeScript strict mode.
- Use pnpm workspaces.
- Use Zod or an equivalent explicit runtime validator.
- Use JSONL event logs.
- Use SQLite as projection.
- Keep the kernel pure.
- Make storage/projection/UI separate packages.
- Record important choices in ADRs.
- Record unresolved but non-blocking questions in `OPEN_QUESTIONS.md`.

## Stop only for

- credentials,
- irreversible deletion,
- changes outside the repository,
- large network/system changes not needed for the task,
- ambiguous instructions that could destroy the architecture.

## If a package choice is uncertain

Choose the simplest maintained package or implement a minimal local version. Record the decision.

## If a feature is tempting but non-goal

Do not implement it. Add it to `docs/LATER.md` or `OPEN_QUESTIONS.md`.
