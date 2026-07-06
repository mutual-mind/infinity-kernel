# Codex Goal — Legacy Django Archaeology

Use this only when the legacy Django repository is available locally.

## Goal

Extract the latent product grammar from the old Django prototype. Do not rewrite it. Do not copy its monkey-patched architecture.

## Output

Create `docs/legacy-django-archaeology-report.md` with:

1. Django apps/models/views/templates.
2. Feature inventory.
3. Data model diagram, textual if needed.
4. User stories implied by existing views.
5. Business/economic concepts currently mixed into the code.
6. Features to preserve.
7. Features to demote into plugins.
8. Features to discard.
9. Seed data candidates.
10. Migration-independent Infinity kernel spec implications.

## Rule

The new architecture remains event-log-first and protocol-first.
