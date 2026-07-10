#!/usr/bin/env node
import path from "node:path";
import {
  canonicalJson,
  createActorEvent,
  createEvent,
  createLocalDevelopmentSigner,
  createObjectEvent,
  computeRelationId,
  replayEvents,
  type ActorId,
  type EventId,
  type EventType,
  type JsonValue,
  type ObjectId,
  type ObjectKind,
} from "@infinity/kernel";
import { getObject, rebuildProjection, searchObjects } from "@infinity/projection-sqlite";
import {
  appendEvent,
  ensureStore,
  exportBundle,
  importBundle,
  loadEventLogs,
  verifyBundle,
} from "@infinity/storage-files";

interface CliContext {
  root: string;
  dataDir: string;
  eventsDir: string;
  logPath: string;
  dbPath: string;
}

const help = `Infinity CLI

Usage:
  infinity init [--root .]
  infinity create-actor --name NAME [--kind local]
  infinity create-object --kind KIND --title TITLE [--summary TEXT] [--body TEXT] [--status STATUS] [--tags a,b]
  infinity relate --from OBJ --to OBJ --predicate PREDICATE
  infinity add-claim --text TEXT [--project OBJ]
  infinity add-task --title TITLE [--project OBJ] [--status STATUS]
  infinity add-artifact --title TITLE [--project OBJ] [--uri URI]
  infinity add-evidence --title TITLE [--claim OBJ] [--uri URI]
  infinity add-offer --text TEXT [--project OBJ]
  infinity add-update --text TEXT [--project OBJ]
  infinity replay
  infinity export-bundle --out DIR
  infinity import-bundle --in DIR
  infinity search --query TEXT
  infinity show-object --id OBJ
  infinity verify [--bundle DIR]

Options:
  --root DIR      Store root, default current directory.
  --actor ID      Actor id for event creation. Defaults to local dev actor.
`;

const commands = new Set([
  "init",
  "create-actor",
  "create-object",
  "relate",
  "add-claim",
  "add-task",
  "add-artifact",
  "add-evidence",
  "add-offer",
  "add-update",
  "replay",
  "export-bundle",
  "import-bundle",
  "search",
  "show-object",
  "verify",
  "help",
]);

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);
  if (rawArgs[0] === "--") rawArgs.shift();
  const commandIndex = rawArgs.findIndex((arg) => commands.has(arg));
  const command = commandIndex >= 0 ? rawArgs[commandIndex] : rawArgs[0];
  const rest = commandIndex >= 0 ? rawArgs.filter((_, index) => index !== commandIndex) : rawArgs.slice(1);
  const args = parseArgs(rest);
  const root = path.resolve(readOption(args, "root") ?? process.cwd());
  const ctx: CliContext = {
    root,
    dataDir: path.join(root, "data"),
    eventsDir: path.join(root, "data", "events"),
    logPath: path.join(root, "data", "events", "main.jsonl"),
    dbPath: path.join(root, "data", "projections", "infinity.sqlite"),
  };

  if (!command || command === "--help" || command === "-h" || command === "help") {
    console.log(help);
    return;
  }

  switch (command) {
    case "init":
      await ensureStore(ctx.dataDir);
      console.log(`Initialized Infinity store at ${ctx.dataDir}`);
      break;
    case "create-actor":
      await createActor(ctx, args);
      break;
    case "create-object":
      await createObject(ctx, args);
      break;
    case "relate":
      await relate(ctx, args);
      break;
    case "add-claim":
      await createTypedObject(ctx, args, "claim.added", "claim", readRequired(args, "text"), "Claim");
      break;
    case "add-task":
      await createTypedObject(ctx, args, "task.added", "task", readRequired(args, "title"), "Task");
      break;
    case "add-artifact":
      await createTypedObject(ctx, args, "artifact.added", "artifact", readRequired(args, "title"), "Artifact");
      break;
    case "add-evidence":
      await createTypedObject(ctx, args, "evidence.added", "evidence", readRequired(args, "title"), "Evidence");
      break;
    case "add-offer":
      await createTypedObject(ctx, args, "offer.added", "offer", readRequired(args, "text"), "Offer");
      break;
    case "add-update":
      await createTypedObject(ctx, args, "update.added", "update", readRequired(args, "text"), "Update");
      break;
    case "replay":
      await replay(ctx);
      break;
    case "export-bundle":
      await exportBundleCommand(ctx, args);
      break;
    case "import-bundle":
      await importBundleCommand(ctx, args);
      break;
    case "search":
      await search(ctx, args);
      break;
    case "show-object":
      await showObject(ctx, args);
      break;
    case "verify":
      await verify(ctx, args);
      break;
    default:
      throw new Error(`Unknown command: ${command}\n\n${help}`);
  }
}

async function createActor(ctx: CliContext, args: Map<string, string | boolean>): Promise<void> {
  await ensureStore(ctx.dataDir);
  const name = readRequired(args, "name");
  const signer = createLocalDevelopmentSigner(name);
  const event = createActorEvent({ name, kind: readOption(args, "kind") ?? "local", signer });
  await appendEvent(ctx.logPath, event);
  console.log(canonicalJson({ actor: event.actor, event: event.id }));
}

async function createObject(ctx: CliContext, args: Map<string, string | boolean>): Promise<void> {
  await ensureStore(ctx.dataDir);
  const actor = await actorId(ctx, args);
  const event = createObjectEvent({
    actor,
    kind: readRequired(args, "kind") as ObjectKind,
    title: readOption(args, "title"),
    summary: readOption(args, "summary"),
    body: readOption(args, "body"),
    status: readOption(args, "status"),
    tags: readTags(args),
  });
  await appendEvent(ctx.logPath, event);
  console.log(canonicalJson({ object: event.subject, event: event.id }));
}

async function relate(ctx: CliContext, args: Map<string, string | boolean>): Promise<void> {
  await ensureStore(ctx.dataDir);
  const actor = await actorId(ctx, args);
  const from = readRequired(args, "from") as ObjectId;
  const to = readRequired(args, "to") as ObjectId;
  const predicate = readRequired(args, "predicate");
  const createdAt = new Date().toISOString();
  const event = createEvent({
    actor,
    time: createdAt,
    type: "relation.created",
    payload: {
      id: computeRelationId(from, predicate, to, createdAt),
      predicate,
      from,
      to,
      createdBy: actor,
      createdAt,
      attributes: {},
      active: true,
    },
  });
  await appendEvent(ctx.logPath, event);
  console.log(canonicalJson({ relation: event.payload, event: event.id }));
}

async function createTypedObject(
  ctx: CliContext,
  args: Map<string, string | boolean>,
  type: EventType,
  kind: ObjectKind,
  title: string,
  defaultSummary: string,
): Promise<void> {
  await ensureStore(ctx.dataDir);
  const actor = await actorId(ctx, args);
  const attributes: Record<string, JsonValue> = {};
  for (const key of ["project", "claim", "uri"]) {
    const value = readOption(args, key);
    if (value) attributes[key] = value;
  }
  const objectEvent = createObjectEvent({
    actor,
    kind,
    title,
    summary: readOption(args, "summary") ?? defaultSummary,
    body: readOption(args, "body") ?? readOption(args, "text"),
    status: readOption(args, "status"),
    tags: readTags(args),
    attributes,
  });
  const event = type === "object.created" ? objectEvent : createEvent({
    actor,
    time: objectEvent.time,
    type,
    subject: objectEvent.subject,
    payload: objectEvent.payload,
    parents: objectEvent.parents,
  });
  await appendEvent(ctx.logPath, event);
  console.log(canonicalJson({ object: event.subject, event: event.id }));
}

async function replay(ctx: CliContext): Promise<void> {
  const events = await loadEventLogs(ctx.eventsDir);
  const projection = replayEvents(events);
  await rebuildProjection(ctx.dbPath, events);
  console.log(canonicalJson({ events: projection.events.size, objects: projection.objects.size, relations: projection.relations.size, sqlite: ctx.dbPath }));
}

async function exportBundleCommand(ctx: CliContext, args: Map<string, string | boolean>): Promise<void> {
  const out = path.resolve(ctx.root, readRequired(args, "out"));
  const manifest = await exportBundle({ sourceEventsDir: ctx.eventsDir, bundleDir: out });
  console.log(canonicalJson(manifest));
}

async function importBundleCommand(ctx: CliContext, args: Map<string, string | boolean>): Promise<void> {
  await ensureStore(ctx.dataDir);
  const bundleDir = path.resolve(ctx.root, readRequired(args, "in"));
  const events = await importBundle(bundleDir, ctx.eventsDir);
  await rebuildProjection(ctx.dbPath, await loadEventLogs(ctx.eventsDir));
  console.log(canonicalJson({ importedEvents: events.length }));
}

async function search(ctx: CliContext, args: Map<string, string | boolean>): Promise<void> {
  const query = readRequired(args, "query");
  await rebuildProjection(ctx.dbPath, await loadEventLogs(ctx.eventsDir));
  console.log(canonicalJson(await searchObjects(ctx.dbPath, query)));
}

async function showObject(ctx: CliContext, args: Map<string, string | boolean>): Promise<void> {
  await rebuildProjection(ctx.dbPath, await loadEventLogs(ctx.eventsDir));
  const object = await getObject(ctx.dbPath, readRequired(args, "id") as ObjectId);
  if (!object) throw new Error("Object not found");
  console.log(canonicalJson(object));
}

async function verify(ctx: CliContext, args: Map<string, string | boolean>): Promise<void> {
  const bundle = readOption(args, "bundle");
  if (bundle) {
    const result = await verifyBundle(path.resolve(ctx.root, bundle));
    console.log(canonicalJson(result));
    if (!result.ok) process.exitCode = 1;
    return;
  }
  const events = await loadEventLogs(ctx.eventsDir);
  replayEvents(events);
  console.log(canonicalJson({ ok: true, events: events.length }));
}

async function actorId(ctx: CliContext, args: Map<string, string | boolean>): Promise<ActorId> {
  const explicit = readOption(args, "actor");
  if (explicit) return explicit as ActorId;
  const events = await loadEventLogs(ctx.eventsDir);
  const actor = events.find((event) => event.type === "actor.created")?.actor;
  if (actor) return actor;
  const signer = createLocalDevelopmentSigner("local");
  const event = createActorEvent({ name: "local", signer });
  await appendEvent(ctx.logPath, event);
  return event.actor;
}

function parseArgs(args: string[]): Map<string, string | boolean> {
  const parsed = new Map<string, string | boolean>();
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg?.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = args[index + 1];
    if (next === undefined || next.startsWith("--")) {
      parsed.set(key, true);
    } else {
      parsed.set(key, next);
      index += 1;
    }
  }
  return parsed;
}

function readOption(args: Map<string, string | boolean>, key: string): string | undefined {
  const value = args.get(key);
  return typeof value === "string" ? value : undefined;
}

function readRequired(args: Map<string, string | boolean>, key: string): string {
  const value = readOption(args, key);
  if (!value) throw new Error(`Missing required --${key}`);
  return value;
}

function readTags(args: Map<string, string | boolean>): string[] {
  return (readOption(args, "tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

main().catch((error: unknown) => {
  console.error((error as Error).message);
  process.exitCode = 1;
});
