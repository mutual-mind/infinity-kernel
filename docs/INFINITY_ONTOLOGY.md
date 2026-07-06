# Infinity Ontology

## Primitive chain

```text
Wish → Problem → Idea → Project → Task → Artifact → Evidence → Offer → Update
```

## Semantic meaning

| Kind | Meaning |
|---|---|
| Wish | A desired future state. |
| Problem | A lack, conflict, bottleneck, or unmet constraint. |
| Idea | A possible mechanism for changing the situation. |
| Project | An organized attempt to realize an idea. |
| Task | A bounded action that advances a project. |
| Artifact | Something inspectable: code, design, document, prototype, bundle, dataset. |
| Claim | A proposition about the world or project. |
| Evidence | An observation, reference, experiment, or artifact that changes confidence in a claim. |
| Offer | A proposed exchange, request, test invitation, funding opportunity, license, or service. |
| Update | News about changed state. |
| Perspective | A reusable interpretive lens, especially for AI council runs. |
| Agent | A person, organization, bot, local process, or key-bearing identity. |

## Relations

Relations should be typed but extensible.

Core predicates:

```text
belongs_to
contains
proposes
criticizes
depends_on
implements
evidences
requests
offers
forks
supersedes
blocks
enables
updates
```

## Promotion gates

Discussion becomes state only through events.

Examples:

```text
Wish becomes Problem when a constraint or lack is stated.
Problem becomes Idea when a mechanism is proposed.
Idea becomes Project when there is a commitment, plan, owner, or test.
Project becomes Artifact when something inspectable exists.
Artifact becomes Offer when someone can test, request, fund, copy, buy, license, or join it.
Offer/Use becomes Evidence when real use changes expectations.
Evidence becomes Update when the public state is revised.
```

## Kernel extension rule

The event envelope should not need changing when new object kinds or relation predicates are added. Add new typed payload schemas and migrate projections instead.
