import { createHash, createHmac } from "node:crypto";

export const EVENT_SCHEMA = "infinity.event.v0" as const;
export const ACTOR_SCHEMA = "infinity.actor.v0" as const;
export const OBJECT_SCHEMA = "infinity.object.v0" as const;

export const objectKinds = [
  "agent",
  "perspective",
  "wish",
  "problem",
  "idea",
  "project",
  "task",
  "artifact",
  "claim",
  "evidence",
  "offer",
  "update",
  "relation",
] as const;

export const eventTypes = [
  "actor.created",
  "object.created",
  "object.updated",
  "object.status_changed",
  "relation.created",
  "relation.removed",
  "claim.added",
  "evidence.added",
  "task.added",
  "artifact.added",
  "offer.added",
  "update.added",
  "proposal.created",
  "proposal.accepted",
  "proposal.rejected",
] as const;

export const relationPredicates = [
  "proposes",
  "criticizes",
  "depends_on",
  "implements",
  "evidences",
  "requests",
  "offers",
  "forks",
  "supersedes",
  "belongs_to",
  "contains",
  "blocks",
  "enables",
  "updates",
] as const;

export type ActorId = `actor:${string}`;
export type EventId = `event:${string}`;
export type ObjectId = `obj:${string}`;
export type RelationId = `rel:${string}`;
export type ProposalId = `proposal:${string}`;
export type ObjectKind = (typeof objectKinds)[number] | (string & {});
export type EventType = (typeof eventTypes)[number];
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface SignatureEnvelope {
  algorithm: string;
  publicKey: string;
  signature: string;
}

export interface ActorV0 {
  schema: typeof ACTOR_SCHEMA;
  id: ActorId;
  name: string;
  kind: "local" | "person" | "organization" | "bot" | "process" | string;
  publicKey?: string | undefined;
  createdAt: string;
  attributes: Record<string, JsonValue>;
}

export interface InfinityObjectV0 {
  schema: typeof OBJECT_SCHEMA;
  id: ObjectId;
  kind: ObjectKind;
  title?: string | undefined;
  summary?: string | undefined;
  body?: string | undefined;
  status?: string | undefined;
  tags: string[];
  createdBy: ActorId;
  createdAt: string;
  updatedAt: string;
  attributes: Record<string, JsonValue>;
}

export interface RelationV0 {
  id: RelationId;
  predicate: string;
  from: ObjectId;
  to: ObjectId;
  createdBy: ActorId;
  createdAt: string;
  attributes: Record<string, JsonValue>;
  active: boolean;
}

export interface ClaimV0 {
  id: ObjectId;
  objectId?: ObjectId | undefined;
  text: string;
  confidence?: number | undefined;
}

export interface EvidenceV0 {
  id: ObjectId;
  claimId?: ObjectId | undefined;
  uri?: string | undefined;
  text?: string | undefined;
}

export interface TaskV0 {
  id: ObjectId;
  projectId?: ObjectId | undefined;
  title: string;
  status?: string | undefined;
}

export interface ArtifactV0 {
  id: ObjectId;
  projectId?: ObjectId | undefined;
  uri?: string | undefined;
  description?: string | undefined;
}

export interface OfferV0 {
  id: ObjectId;
  projectId?: ObjectId | undefined;
  text: string;
}

export interface UpdateV0 {
  id: ObjectId;
  projectId?: ObjectId | undefined;
  text: string;
}

export interface ProposalV0 {
  id: ProposalId;
  proposedBy: ActorId;
  status: "proposed" | "accepted" | "rejected";
  event: Omit<InfinityEventV0, "id" | "signature">;
  createdAt: string;
  resolvedAt?: string | undefined;
  resolvedBy?: ActorId | undefined;
}

export interface InfinityEventV0 {
  schema: typeof EVENT_SCHEMA;
  id: EventId;
  actor: ActorId;
  time: string;
  type: EventType;
  subject?: string | undefined;
  payload: JsonValue;
  parents: EventId[];
  signature?: SignatureEnvelope | undefined;
}

export interface KernelProjection {
  actors: Map<ActorId, ActorV0>;
  objects: Map<ObjectId, InfinityObjectV0>;
  relations: Map<RelationId, RelationV0>;
  claims: Map<ObjectId, ClaimV0>;
  evidence: Map<ObjectId, EvidenceV0>;
  tasks: Map<ObjectId, TaskV0>;
  artifacts: Map<ObjectId, ArtifactV0>;
  offers: Map<ObjectId, OfferV0>;
  updates: Map<ObjectId, UpdateV0>;
  proposals: Map<ProposalId, ProposalV0>;
  events: Map<EventId, InfinityEventV0>;
}

export interface Signer {
  algorithm: string;
  publicKey: string;
  sign(message: string): string;
  verify(message: string, signature: string): boolean;
}

export class KernelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KernelError";
  }
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(normalizeJson(value));
}

export function normalizeJson(value: unknown): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new KernelError("Non-finite numbers are not valid JSON");
    return value;
  }
  if (Array.isArray(value)) return value.map((entry) => normalizeJson(entry));
  if (typeof value === "object") {
    const output: Record<string, JsonValue> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const entry = (value as Record<string, unknown>)[key];
      if (entry === undefined || typeof entry === "function" || typeof entry === "symbol") {
        throw new KernelError(`Invalid JSON value at key ${key}`);
      }
      output[key] = normalizeJson(entry);
    }
    return output;
  }
  throw new KernelError(`Invalid JSON value of type ${typeof value}`);
}

export function eventHashContent(event: Omit<InfinityEventV0, "id"> | InfinityEventV0): JsonValue {
  const content = { ...event } as Record<string, unknown>;
  delete content.id;
  delete content.signature;
  return normalizeJson(content);
}

export function computeEventId(event: Omit<InfinityEventV0, "id"> | InfinityEventV0): EventId {
  return `event:${sha256Hex(canonicalJson(eventHashContent(event)))}`;
}

export function computeObjectId(eventId: EventId): ObjectId {
  return `obj:${sha256Hex(eventId)}`;
}

export function computeActorId(publicKeyOrName: string): ActorId {
  return `actor:${sha256Hex(publicKeyOrName)}`;
}

export function computeRelationId(from: ObjectId, predicate: string, to: ObjectId, createdAt: string): RelationId {
  return `rel:${sha256Hex(canonicalJson({ createdAt, from, predicate, to }))}`;
}

export function computeProposalId(eventId: EventId): ProposalId {
  return `proposal:${sha256Hex(eventId)}`;
}

export function createLocalDevelopmentSigner(name: string, secret = name): Signer {
  const publicKey = `local-dev:${sha256Hex(name)}`;
  return {
    algorithm: "infinity.local-dev.hmac-sha256",
    publicKey,
    sign(message: string): string {
      return createHmac("sha256", secret).update(message, "utf8").digest("hex");
    },
    verify(message: string, signature: string): boolean {
      return createHmac("sha256", secret).update(message, "utf8").digest("hex") === signature;
    },
  };
}

export function createEvent(input: {
  actor: ActorId;
  time?: string | undefined;
  type: EventType;
  subject?: string | undefined;
  payload: unknown;
  parents?: EventId[] | undefined;
  signer?: Signer | undefined;
}): InfinityEventV0 {
  const base: Omit<InfinityEventV0, "id" | "signature"> = {
    schema: EVENT_SCHEMA,
    actor: input.actor,
    time: input.time ?? new Date().toISOString(),
    type: input.type,
    payload: normalizeJson(input.payload),
    parents: input.parents ?? [],
  };
  const withSubject = input.subject === undefined ? base : { ...base, subject: input.subject };
  const id = computeEventId(withSubject);
  const unsigned = { ...withSubject, id };
  if (!input.signer) return unsigned;
  const signatureContent = canonicalJson(eventHashContent(unsigned));
  return {
    ...unsigned,
    signature: {
      algorithm: input.signer.algorithm,
      publicKey: input.signer.publicKey,
      signature: input.signer.sign(signatureContent),
    },
  };
}

export function createActorEvent(input: {
  name: string;
  kind?: ActorV0["kind"] | undefined;
  actor?: ActorId | undefined;
  time?: string | undefined;
  publicKey?: string | undefined;
  attributes?: Record<string, JsonValue> | undefined;
  signer?: Signer | undefined;
}): InfinityEventV0 {
  const publicKey = input.publicKey ?? input.signer?.publicKey ?? `local:${input.name}`;
  const actor = input.actor ?? computeActorId(publicKey);
  const payload: ActorV0 = {
    schema: ACTOR_SCHEMA,
    id: actor,
    name: input.name,
    kind: input.kind ?? "local",
    publicKey,
    createdAt: input.time ?? new Date().toISOString(),
    attributes: input.attributes ?? {},
  };
  return createEvent({ actor, time: payload.createdAt, type: "actor.created", payload, signer: input.signer });
}

export function createObjectEvent(input: {
  actor: ActorId;
  kind: ObjectKind;
  time?: string | undefined;
  title?: string | undefined;
  summary?: string | undefined;
  body?: string | undefined;
  status?: string | undefined;
  tags?: string[] | undefined;
  attributes?: Record<string, JsonValue> | undefined;
  parents?: EventId[] | undefined;
  signer?: Signer | undefined;
}): InfinityEventV0 {
  const time = input.time ?? new Date().toISOString();
  const basePayload = {
    schema: OBJECT_SCHEMA,
    kind: input.kind,
    tags: input.tags ?? [],
    createdBy: input.actor,
    createdAt: time,
    updatedAt: time,
    attributes: input.attributes ?? {},
    ...(input.title === undefined ? {} : { title: input.title }),
    ...(input.summary === undefined ? {} : { summary: input.summary }),
    ...(input.body === undefined ? {} : { body: input.body }),
    ...(input.status === undefined ? {} : { status: input.status }),
  };
  const provisional = createEvent({
    actor: input.actor,
    time,
    type: "object.created",
    payload: { ...basePayload, id: "obj:pending" },
    parents: input.parents,
  });
  const id = computeObjectId(provisional.id);
  return createEvent({
    actor: input.actor,
    time,
    type: "object.created",
    subject: id,
    payload: { ...basePayload, id },
    parents: input.parents,
    signer: input.signer,
  });
}

export function validateEvent(event: unknown): InfinityEventV0 {
  if (!isRecord(event)) throw new KernelError("Event must be an object");
  if (event.schema !== EVENT_SCHEMA) throw new KernelError("Invalid event schema");
  if (typeof event.id !== "string" || !event.id.startsWith("event:")) throw new KernelError("Invalid event id");
  if (typeof event.actor !== "string" || !event.actor.startsWith("actor:")) throw new KernelError("Invalid actor id");
  if (typeof event.time !== "string" || Number.isNaN(Date.parse(event.time))) throw new KernelError("Invalid event time");
  if (!eventTypes.includes(event.type as EventType)) throw new KernelError(`Invalid event type: ${String(event.type)}`);
  if (!Array.isArray(event.parents) || !event.parents.every((parent) => typeof parent === "string" && parent.startsWith("event:"))) {
    throw new KernelError("Invalid event parents");
  }
  normalizeJson(event.payload);
  const computed = computeEventId(event as unknown as InfinityEventV0);
  if (computed !== event.id) throw new KernelError(`Event id mismatch: expected ${computed}, got ${event.id}`);
  if ("signature" in event && event.signature !== undefined) {
    if (!isRecord(event.signature)) throw new KernelError("Invalid signature");
    if (typeof event.signature.algorithm !== "string" || typeof event.signature.publicKey !== "string" || typeof event.signature.signature !== "string") {
      throw new KernelError("Invalid signature envelope");
    }
  }
  return event as unknown as InfinityEventV0;
}

export function verifyEventSignature(event: InfinityEventV0, verifier: Signer): boolean {
  validateEvent(event);
  if (!event.signature) return false;
  if (event.signature.algorithm !== verifier.algorithm || event.signature.publicKey !== verifier.publicKey) return false;
  return verifier.verify(canonicalJson(eventHashContent(event)), event.signature.signature);
}

export function verifyEvents(events: InfinityEventV0[]): void {
  const seen = new Map<EventId, string>();
  for (const event of events) {
    validateEvent(event);
    const canonical = canonicalJson(event);
    const prior = seen.get(event.id);
    if (prior !== undefined && prior !== canonical) throw new KernelError(`Duplicate event id with different content: ${event.id}`);
    seen.set(event.id, canonical);
  }
}

export function sortEventsDeterministically(events: InfinityEventV0[]): InfinityEventV0[] {
  return [...events].sort((left, right) => {
    const timeOrder = left.time.localeCompare(right.time);
    return timeOrder === 0 ? left.id.localeCompare(right.id) : timeOrder;
  });
}

export function createEmptyProjection(): KernelProjection {
  return {
    actors: new Map(),
    objects: new Map(),
    relations: new Map(),
    claims: new Map(),
    evidence: new Map(),
    tasks: new Map(),
    artifacts: new Map(),
    offers: new Map(),
    updates: new Map(),
    proposals: new Map(),
    events: new Map(),
  };
}

export function replayEvents(events: InfinityEventV0[], options: { sort?: boolean } = {}): KernelProjection {
  verifyEvents(events);
  const projection = createEmptyProjection();
  const ordered = options.sort === false ? events : sortEventsDeterministically(events);
  for (const event of ordered) {
    applyEvent(projection, event);
    projection.events.set(event.id, event);
  }
  return projection;
}

export function projectionToJson(projection: KernelProjection): JsonValue {
  return normalizeJson({
    actors: sortedValues(projection.actors),
    artifacts: sortedValues(projection.artifacts),
    claims: sortedValues(projection.claims),
    evidence: sortedValues(projection.evidence),
    events: sortedValues(projection.events),
    objects: sortedValues(projection.objects),
    offers: sortedValues(projection.offers),
    proposals: sortedValues(projection.proposals),
    relations: sortedValues(projection.relations),
    tasks: sortedValues(projection.tasks),
    updates: sortedValues(projection.updates),
  });
}

function applyEvent(projection: KernelProjection, event: InfinityEventV0): void {
  switch (event.type) {
    case "actor.created": {
      const actor = parseActor(event.payload);
      projection.actors.set(actor.id, actor);
      break;
    }
    case "object.created":
    case "claim.added":
    case "evidence.added":
    case "task.added":
    case "artifact.added":
    case "offer.added":
    case "update.added": {
      const object = parseObject(event.payload, event);
      projection.objects.set(object.id, object);
      indexTypedObject(projection, object);
      break;
    }
    case "object.updated": {
      const payload = requireRecord(event.payload, "object.updated payload");
      const id = requireObjectId(String(event.subject ?? payload.id));
      const existing = projection.objects.get(id);
      if (!existing) break;
      const updates = requireRecord(payload.updates ?? payload, "object update fields");
      const next = mergeObject(existing, updates, event.time);
      projection.objects.set(id, next);
      indexTypedObject(projection, next);
      break;
    }
    case "object.status_changed": {
      const id = requireObjectId(String(event.subject ?? requireRecord(event.payload, "payload").id));
      const existing = projection.objects.get(id);
      if (!existing) break;
      const status = requireString(requireRecord(event.payload, "payload").status, "status");
      const next = { ...existing, status, updatedAt: event.time };
      projection.objects.set(id, next);
      indexTypedObject(projection, next);
      break;
    }
    case "relation.created": {
      const relation = parseRelation(event.payload, event);
      projection.relations.set(relation.id, relation);
      break;
    }
    case "relation.removed": {
      const payload = requireRecord(event.payload, "relation.removed payload");
      const id = String(payload.id ?? event.subject);
      const existing = projection.relations.get(id as RelationId);
      if (existing) projection.relations.set(existing.id, { ...existing, active: false });
      break;
    }
    case "proposal.created": {
      const payload = requireRecord(event.payload, "proposal.created payload");
      const proposal: ProposalV0 = {
        id: String(payload.id ?? computeProposalId(event.id)) as ProposalId,
        proposedBy: requireActorId(String(payload.proposedBy ?? event.actor)),
        status: "proposed",
        event: requireRecord(payload.event, "proposal event") as Omit<InfinityEventV0, "id" | "signature">,
        createdAt: event.time,
      };
      projection.proposals.set(proposal.id, proposal);
      break;
    }
    case "proposal.accepted":
    case "proposal.rejected": {
      const payload = requireRecord(event.payload, "proposal resolution payload");
      const id = String(payload.id ?? event.subject) as ProposalId;
      const existing = projection.proposals.get(id);
      if (existing) {
        projection.proposals.set(id, {
          ...existing,
          status: event.type === "proposal.accepted" ? "accepted" : "rejected",
          resolvedAt: event.time,
          resolvedBy: event.actor,
        });
      }
      break;
    }
    default:
      assertNever(event.type);
  }
}

function parseActor(value: JsonValue): ActorV0 {
  const payload = requireRecord(value, "actor payload");
  const actor: ActorV0 = {
    schema: ACTOR_SCHEMA,
    id: requireActorId(String(payload.id)),
    name: requireString(payload.name, "actor.name"),
    kind: requireString(payload.kind, "actor.kind"),
    createdAt: requireString(payload.createdAt, "actor.createdAt"),
    attributes: readAttributes(payload.attributes),
  };
  if (typeof payload.publicKey === "string") actor.publicKey = payload.publicKey;
  return actor;
}

function parseObject(value: JsonValue, event: InfinityEventV0): InfinityObjectV0 {
  const payload = requireRecord(value, "object payload");
  const id = requireObjectId(String(payload.id ?? event.subject));
  const object: InfinityObjectV0 = {
    schema: OBJECT_SCHEMA,
    id,
    kind: requireString(payload.kind, "object.kind"),
    tags: readStringArray(payload.tags),
    createdBy: requireActorId(String(payload.createdBy ?? event.actor)),
    createdAt: requireString(payload.createdAt ?? event.time, "object.createdAt"),
    updatedAt: requireString(payload.updatedAt ?? event.time, "object.updatedAt"),
    attributes: readAttributes(payload.attributes),
  };
  if (typeof payload.title === "string") object.title = payload.title;
  if (typeof payload.summary === "string") object.summary = payload.summary;
  if (typeof payload.body === "string") object.body = payload.body;
  if (typeof payload.status === "string") object.status = payload.status;
  return object;
}

function parseRelation(value: JsonValue, event: InfinityEventV0): RelationV0 {
  const payload = requireRecord(value, "relation payload");
  const from = requireObjectId(String(payload.from));
  const to = requireObjectId(String(payload.to));
  const predicate = requireString(payload.predicate, "relation.predicate");
  return {
    id: String(payload.id ?? computeRelationId(from, predicate, to, event.time)) as RelationId,
    predicate,
    from,
    to,
    createdBy: requireActorId(String(payload.createdBy ?? event.actor)),
    createdAt: requireString(payload.createdAt ?? event.time, "relation.createdAt"),
    attributes: readAttributes(payload.attributes),
    active: payload.active === undefined ? true : Boolean(payload.active),
  };
}

function indexTypedObject(projection: KernelProjection, object: InfinityObjectV0): void {
  if (object.kind === "claim") projection.claims.set(object.id, { id: object.id, text: object.title ?? object.summary ?? object.body ?? "" });
  if (object.kind === "evidence") projection.evidence.set(object.id, { id: object.id, text: object.title ?? object.summary ?? object.body });
  if (object.kind === "task") projection.tasks.set(object.id, { id: object.id, title: object.title ?? "Untitled task", status: object.status });
  if (object.kind === "artifact") projection.artifacts.set(object.id, { id: object.id, uri: readOptionalString(object.attributes.uri), description: object.summary ?? object.body });
  if (object.kind === "offer") projection.offers.set(object.id, { id: object.id, text: object.title ?? object.summary ?? object.body ?? "" });
  if (object.kind === "update") projection.updates.set(object.id, { id: object.id, text: object.title ?? object.summary ?? object.body ?? "" });
}

function mergeObject(existing: InfinityObjectV0, updates: Record<string, JsonValue>, updatedAt: string): InfinityObjectV0 {
  return {
    ...existing,
    title: typeof updates.title === "string" ? updates.title : existing.title,
    summary: typeof updates.summary === "string" ? updates.summary : existing.summary,
    body: typeof updates.body === "string" ? updates.body : existing.body,
    status: typeof updates.status === "string" ? updates.status : existing.status,
    tags: Array.isArray(updates.tags) ? readStringArray(updates.tags) : existing.tags,
    attributes: isRecord(updates.attributes) ? readAttributes(updates.attributes) : existing.attributes,
    updatedAt,
  };
}

function sortedValues<T>(map: Map<string, T>): T[] {
  return [...map.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, value]) => value);
}

function readStringArray(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) throw new KernelError("Expected string array");
  return value;
}

function readAttributes(value: unknown): Record<string, JsonValue> {
  if (value === undefined) return {};
  if (!isRecord(value)) throw new KernelError("Attributes must be an object");
  return normalizeJson(value) as Record<string, JsonValue>;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function requireRecord(value: unknown, label: string): Record<string, JsonValue> {
  if (!isRecord(value)) throw new KernelError(`${label} must be an object`);
  return value as Record<string, JsonValue>;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string") throw new KernelError(`${label} must be a string`);
  return value;
}

function requireActorId(value: string): ActorId {
  if (!value.startsWith("actor:")) throw new KernelError("Expected actor id");
  return value as ActorId;
}

function requireObjectId(value: string): ObjectId {
  if (!value.startsWith("obj:")) throw new KernelError("Expected object id");
  return value as ObjectId;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertNever(value: never): never {
  throw new KernelError(`Unhandled event type ${String(value)}`);
}
