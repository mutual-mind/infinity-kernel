import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createActorEvent,
  createEvent,
  createObjectEvent,
  computeRelationId,
  type ActorId,
  type EventId,
  type EventType,
  type InfinityEventV0,
  type ObjectId,
  type ObjectKind,
  canonicalJson,
  verifyEvents,
} from "../packages/kernel/src/index.js";

interface SeedProject {
  slug: string;
  title: string;
  wish: string;
  problem: string;
  idea: string;
  project: string;
  tasks: string[];
  claims: string[];
  evidence: string;
  update: string;
}

const actor = createActorEvent({
  name: "Infinity Seed Maintainer",
  kind: "local",
  time: "2026-01-01T00:00:00.000Z",
});

const seeds: SeedProject[] = [
  {
    slug: "infinity",
    title: "Infinity Project",
    wish: "A public semantic system where goals become methods, methods become projects, projects become artifacts, artifacts become offers, and the resulting evidence updates society's wishes.",
    problem: "Human and AI societies lack a durable public protocol for goal formation, idea critique, project decomposition, artifact tracking, and value exchange.",
    idea: "Represent social cognition and production as signed semantic events, locally indexed into project pages and globally replicable as event bundles.",
    project: "Build Infinity Kernel v0.1: a local-first event-sourced semantic project engine.",
    tasks: [
      "Define event and object schemas.",
      "Implement deterministic replay.",
      "Implement local JSONL storage and bundle export.",
    ],
    claims: [
      "A database-as-projection architecture improves survivability compared with a single managed server database.",
      "AI agent councils are safer when their outputs are proposed events rather than canonical state.",
    ],
    evidence: "Seed replay and tamper-detection tests are the first technical evidence.",
    update: "Infinity Kernel v0.1 is bootstrapped from a seed repository and agentic coding prompts.",
  },
  {
    slug: "lifecar",
    title: "Lifecar Project",
    wish: "A comfortable, capable, protective shell for human and other life-form bodies, allowing safer interaction with diverse environments.",
    problem: "Human bodies are vulnerable to environmental hazards, pathogens, thermal discomfort, pollution, injury, and mobility limitations.",
    idea: "Design an advanced human-world interface: wearable or rideable environmental shell combining protection, comfort, sensing, mobility, hygiene, and expressive identity.",
    project: "Use Infinity to decompose Lifecar into design constraints, materials, ergonomics, thermal regulation, manufacturing, use-cases, and prototype tasks.",
    tasks: [
      "Create a constraint map for comfort, thermal regulation, hygiene, mobility, and social usability.",
      "Produce first concept diagrams and subsystem list.",
      "Compare clothing-like, exosuit-like, cabin-like, and vehicle-like shells.",
    ],
    claims: [
      "Lifecar is a body-environment interface, not merely a vehicle.",
      "Lifecar is a strong Infinity test case because it crosses medicine, clothing, robotics, vehicles, architecture, biosecurity, and manufacturing.",
    ],
    evidence: "Existing conceptual descriptions, videos, and prototypes can be imported later as artifacts.",
    update: "Lifecar is seeded as a flagship physical-world project for Infinity Kernel.",
  },
  {
    slug: "xmaze",
    title: "XMaze Project",
    wish: "A game-like learning and work-routing system that captures motivation and redirects it into progressive skill, problem-solving, and real contribution.",
    problem: "Games can capture sustained attention, but education and work systems often fail to route tasks to motivated solvers with comparable immediacy and feedback.",
    idea: "Represent tasks as maze rooms, quests, and challenges, then match them to skill paths and contribution opportunities.",
    project: "Use Infinity tasks as raw material for XMaze quests, beginning with tasks from Infinity and Lifecar.",
    tasks: [
      "Define how an Infinity task becomes an XMaze challenge.",
      "Define progression, skill traces, rewards, and anti-exploit constraints.",
      "Prototype one project-to-quest conversion for Lifecar.",
    ],
    claims: [
      "XMaze can become the motivation and quest layer of Infinity.",
      "The key design risk is exploitative gamification; the correction is progressive agency rather than mere addiction.",
    ],
    evidence: "Prototype task-to-quest conversions will be first evidence.",
    update: "XMaze is seeded as a future motivation and solver-routing layer.",
  },
  {
    slug: "metaformat",
    title: "Metaformat Project",
    wish: "A semantic web of self-evolving data where records can change form while remaining interpretable, linked, and migratable.",
    problem: "Ordinary platforms trap knowledge in brittle post, comment, like, and profile schemas that survive poorly when applications disappear.",
    idea: "Use versioned semantic records, typed relations, migrations, and content-addressed event histories so data can evolve without becoming opaque.",
    project: "Use Metaformat principles inside Infinity Kernel: versioned event envelopes, extensible object kinds, typed relations, migrations, and portable bundles.",
    tasks: [
      "Define minimal versioned event envelope.",
      "Define extensible object kind and relation vocabulary.",
      "Define migration strategy.",
    ],
    claims: [
      "Metaformat is the data-physics layer underneath Infinity.",
      "Metaformat should initially be hidden in the kernel rather than marketed as the main public product.",
    ],
    evidence: "Successful replay of old seed events after schema evolution will be future evidence.",
    update: "Metaformat is seeded as the substrate philosophy for Infinity Kernel.",
  },
];

for (const seed of seeds) {
  const events = buildSeed(seed);
  const dir = path.join("seeds", seed.slug);
  await mkdir(dir, { recursive: true });
  verifyEvents(events);
  await writeFile(path.join(dir, "events.jsonl"), `${events.map((event) => canonicalJson(event)).join("\n")}\n`);
}

function buildSeed(seed: SeedProject): InfinityEventV0[] {
  const events: InfinityEventV0[] = [actor];
  const base = new Date("2026-01-01T00:00:00.000Z").getTime();
  let tick = 1;
  const time = () => new Date(base + tick++ * 1000).toISOString();

  const wish = object(events, seed.wish, "wish", "Wish", seed.wish, time());
  const problem = object(events, `${seed.title} Problem`, "problem", seed.problem, seed.problem, time());
  const idea = object(events, `${seed.title} Idea`, "idea", seed.idea, seed.idea, time());
  const project = object(events, seed.title, "project", seed.project, seed.project, time(), ["seed", seed.slug]);
  relate(events, wish, "proposes", problem, time());
  relate(events, problem, "proposes", idea, time());
  relate(events, idea, "implements", project, time());

  for (const task of seed.tasks) {
    const taskId = object(events, task, "task", task, task, time(), ["seed", seed.slug], "task.added");
    relate(events, project, "contains", taskId, time());
  }
  for (const claim of seed.claims) {
    const claimId = object(events, claim, "claim", claim, claim, time(), ["seed", seed.slug], "claim.added");
    relate(events, claimId, "belongs_to", project, time());
  }
  const evidence = object(events, `${seed.title} Evidence Placeholder`, "evidence", seed.evidence, seed.evidence, time(), ["seed", seed.slug], "evidence.added");
  relate(events, evidence, "evidences", project, time());
  const artifact = object(events, `${seed.title} Seed Event Log`, "artifact", `Canonical JSONL seed events for ${seed.title}.`, "", time(), ["seed", seed.slug], "artifact.added");
  relate(events, artifact, "belongs_to", project, time());
  const offer = object(events, `${seed.title} Review Invitation`, "offer", `Review and extend the ${seed.title} seed project.`, "", time(), ["seed", seed.slug], "offer.added");
  relate(events, offer, "offers", project, time());
  const update = object(events, `${seed.title} Seeded`, "update", seed.update, seed.update, time(), ["seed", seed.slug], "update.added");
  relate(events, update, "updates", project, time());
  return events;
}

function object(
  events: InfinityEventV0[],
  title: string,
  kind: ObjectKind,
  summary: string,
  body: string,
  time: string,
  tags: string[] = [],
  type: EventType = "object.created",
): ObjectId {
  const created = createObjectEvent({ actor: actor.actor, kind, title, summary, body, time, tags });
  const event = type === "object.created" ? created : createEvent({
    actor: actor.actor,
    time: created.time,
    type,
    subject: created.subject,
    payload: created.payload,
    parents: created.parents,
  });
  events.push(event);
  return event.subject as ObjectId;
}

function relate(events: InfinityEventV0[], from: ObjectId, predicate: string, to: ObjectId, time: string): EventId {
  const relation = createEvent({
    actor: actor.actor as ActorId,
    time,
    type: "relation.created",
    payload: {
      id: computeRelationId(from, predicate, to, time),
      predicate,
      from,
      to,
      createdBy: actor.actor,
      createdAt: time,
      attributes: {},
      active: true,
    },
  });
  events.push(relation);
  return relation.id;
}
