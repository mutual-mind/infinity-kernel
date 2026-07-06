# ADR 0003: Economics is plugin, not kernel

## Status

Accepted.

## Decision

Accounting, investment, project shares/stocks, commodities, marketplaces, and real-money flows are excluded from Infinity Kernel v0.1.

They may return later as optional packages over semantic primitives such as Offer, Right, Transfer, Claim, and Evidence.

## Consequences

- Kernel remains small.
- Early data model is not distorted by financial abstractions.
- Old Django economic ideas are preserved as future plugin candidates.
