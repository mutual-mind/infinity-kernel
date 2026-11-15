import { verifyInfinityEventId } from "./canonical-json.js";

export const CAUSAL_NODE_KINDS = [
  "observation",
  "state",
  "interpretation",
  "intention",
  "action",
  "outcome",
  "evidence",
  "capability",
  "event",
] as const;

export type CausalNodeKind = (typeof CAUSAL_NODE_KINDS)[number];

export const CAUSAL_RELATION_PREDICATES = [
  "causes",
  "influences",
  "enables",
  "inhibits",
  "interpreted_as",
  "motivates",
  "realized_by",
  "produces",
  "supports",
  "contradicts",
  "evidences",
  "revises",
  "supersedes",
  "depends_on",
  "part_of",
  "counterfactual_to",
] as const;

export type CausalRelationPredicate =
  (typeof CAUSAL_RELATION_PREDICATES)[number];

export const CAUSAL_MUTATION_EVENT_TYPES = [
  "object.created",
  "object.updated",
  "relation.created",
  "relation.removed",
] as const;

export const CAUSAL_SPINE_V0 = Object.freeze({
  schema: "infinity.causal-spine.v0",
  status: "FROZEN" as const,
  eventSchema: "infinity.event.v0",
  nodeSchema: "infinity.causal-node.v0",
  relationSchema: "infinity.causal-relation.v0",
  snapshotSchema: "infinity.causal-spine-snapshot.v0",
  nodeKinds: Object.freeze([...CAUSAL_NODE_KINDS]),
  relationPredicates: Object.freeze([...CAUSAL_RELATION_PREDICATES]),
  mutationEventTypes: Object.freeze([...CAUSAL_MUTATION_EVENT_TYPES]),
});

export interface TemporalExtentV0 {
  start?: string;
  end?: string;
  observedAt?: string;
}

export interface CausalSpineNodeV0 {
  schema: "infinity.causal-node.v0";
  id: string;
  kind: CausalNodeKind;
  title?: string;
  summary?: string;
  actorRefs: string[];
  time?: TemporalExtentV0;
  confidence?: number;
  attributes: Record<string, unknown>;
}

export interface CausalSpineRelationV0 {
  schema: "infinity.causal-relation.v0";
  id: string;
  source: string;
  target: string;
  predicate: CausalRelationPredicate;
  confidence?: number;
  attributes: Record<string, unknown>;
}

export interface InfinityEventV0 {
  schema: "infinity.event.v0";
  id: string;
  actor: string;
  time: string;
  type: string;
  subject?: string;
  payload: unknown;
  parents: string[];
  signature?: {
    algorithm: string;
    publicKey: string;
    signature: string;
  };
}

export interface CausalSpineSnapshotV0 {
  schema: "infinity.causal-spine-snapshot.v0";
  nodes: Record<string, CausalSpineNodeV0>;
  relations: Record<string, CausalSpineRelationV0>;
  appliedEventIds: string[];
}

const NODE_KIND_SET = new Set<string>(CAUSAL_NODE_KINDS);
const RELATION_SET = new Set<string>(CAUSAL_RELATION_PREDICATES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertExactKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  name: string,
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`unsupported ${name} field: ${key}`);
  }
}

function assertNonEmptyString(
  value: unknown,
  name: string,
): asserts value is string {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
}

function assertConfidence(value: unknown, name: string): void {
  if (value === undefined) return;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    throw new RangeError(`${name} must be between 0 and 1`);
  }
}

function assertIsoTime(value: unknown, name: string): void {
  if (value === undefined) return;
  assertNonEmptyString(value, name);
  if (!Number.isFinite(Date.parse(value))) {
    throw new TypeError(`${name} must be an ISO-8601-compatible timestamp`);
  }
}

export function assertInfinityEventV0(
  value: unknown,
): asserts value is InfinityEventV0 {
  if (!isRecord(value)) throw new TypeError("event must be an object");
  assertExactKeys(
    value,
    new Set([
      "schema",
      "id",
      "actor",
      "time",
      "type",
      "subject",
      "payload",
      "parents",
      "signature",
    ]),
    "event",
  );
  if (value.schema !== "infinity.event.v0")
    throw new TypeError("unsupported event schema");
  assertNonEmptyString(value.id, "event id");
  if (!/^event:[0-9a-f]{64}$/.test(value.id)) {
    throw new TypeError("event id must be event:<64 lowercase hex sha256>");
  }
  assertNonEmptyString(value.actor, "event actor");
  assertIsoTime(value.time, "event time");
  assertNonEmptyString(value.type, "event type");
  if (value.subject !== undefined)
    assertNonEmptyString(value.subject, "event subject");
  if (!Array.isArray(value.parents))
    throw new TypeError("event parents must be an array");
  const parentSet = new Set<string>();
  for (const parent of value.parents) {
    assertNonEmptyString(parent, "event parent");
    if (!/^event:[0-9a-f]{64}$/.test(parent)) {
      throw new TypeError(
        "event parent must be event:<64 lowercase hex sha256>",
      );
    }
    if (parentSet.has(parent))
      throw new Error(`duplicate event parent: ${parent}`);
    parentSet.add(parent);
  }
  if (value.signature !== undefined) {
    if (!isRecord(value.signature))
      throw new TypeError("event signature must be an object");
    assertExactKeys(
      value.signature,
      new Set(["algorithm", "publicKey", "signature"]),
      "event signature",
    );
    assertNonEmptyString(value.signature.algorithm, "signature algorithm");
    assertNonEmptyString(value.signature.publicKey, "signature publicKey");
    assertNonEmptyString(value.signature.signature, "signature signature");
  }
  if (!verifyInfinityEventId(value as unknown as InfinityEventV0)) {
    throw new Error(`event content id mismatch: ${value.id}`);
  }
}

export function assertCausalSpineNodeV0(
  value: unknown,
): asserts value is CausalSpineNodeV0 {
  if (!isRecord(value)) throw new TypeError("causal node must be an object");
  assertExactKeys(
    value,
    new Set([
      "schema",
      "id",
      "kind",
      "title",
      "summary",
      "actorRefs",
      "time",
      "confidence",
      "attributes",
    ]),
    "causal node",
  );
  if (value.schema !== "infinity.causal-node.v0")
    throw new TypeError("unsupported causal node schema");
  assertNonEmptyString(value.id, "causal node id");
  if (typeof value.kind !== "string" || !NODE_KIND_SET.has(value.kind)) {
    throw new TypeError(`unsupported causal node kind: ${String(value.kind)}`);
  }
  if (value.title !== undefined)
    assertNonEmptyString(value.title, "causal node title");
  if (value.summary !== undefined && typeof value.summary !== "string") {
    throw new TypeError("causal node summary must be a string");
  }
  if (
    !Array.isArray(value.actorRefs) ||
    value.actorRefs.some((v) => typeof v !== "string" || v.length === 0)
  ) {
    throw new TypeError(
      "causal node actorRefs must be an array of non-empty strings",
    );
  }
  if (new Set(value.actorRefs).size !== value.actorRefs.length) {
    throw new Error("causal node actorRefs must be unique");
  }
  if (value.time !== undefined) {
    if (!isRecord(value.time))
      throw new TypeError("causal node time must be an object");
    assertExactKeys(
      value.time,
      new Set(["start", "end", "observedAt"]),
      "causal node time",
    );
    assertIsoTime(value.time.start, "causal node time.start");
    assertIsoTime(value.time.end, "causal node time.end");
    assertIsoTime(value.time.observedAt, "causal node time.observedAt");
    if (
      typeof value.time.start === "string" &&
      typeof value.time.end === "string" &&
      Date.parse(value.time.start) > Date.parse(value.time.end)
    ) {
      throw new RangeError("causal node time.start must not be after time.end");
    }
  }
  assertConfidence(value.confidence, "causal node confidence");
  if (!isRecord(value.attributes))
    throw new TypeError("causal node attributes must be an object");
}

export function assertCausalSpineRelationV0(
  value: unknown,
): asserts value is CausalSpineRelationV0 {
  if (!isRecord(value))
    throw new TypeError("causal relation must be an object");
  assertExactKeys(
    value,
    new Set([
      "schema",
      "id",
      "source",
      "target",
      "predicate",
      "confidence",
      "attributes",
    ]),
    "causal relation",
  );
  if (value.schema !== "infinity.causal-relation.v0")
    throw new TypeError("unsupported causal relation schema");
  assertNonEmptyString(value.id, "causal relation id");
  assertNonEmptyString(value.source, "causal relation source");
  assertNonEmptyString(value.target, "causal relation target");
  if (value.source === value.target)
    throw new Error("causal relation cannot self-reference");
  if (
    typeof value.predicate !== "string" ||
    !RELATION_SET.has(value.predicate)
  ) {
    throw new TypeError(
      `unsupported causal relation predicate: ${String(value.predicate)}`,
    );
  }
  assertConfidence(value.confidence, "causal relation confidence");
  if (!isRecord(value.attributes))
    throw new TypeError("causal relation attributes must be an object");
}

export function emptyCausalSpineSnapshot(): CausalSpineSnapshotV0 {
  return {
    schema: "infinity.causal-spine-snapshot.v0",
    nodes: {},
    relations: {},
    appliedEventIds: [],
  };
}

export function replayCausalSpine(
  events: readonly InfinityEventV0[],
): CausalSpineSnapshotV0 {
  const snapshot = emptyCausalSpineSnapshot();
  const seenEvents = new Set<string>();

  for (const event of events) {
    assertInfinityEventV0(event);
    if (seenEvents.has(event.id))
      throw new Error(`duplicate event id: ${event.id}`);
    for (const parent of event.parents) {
      if (!seenEvents.has(parent)) {
        throw new Error(
          `event ${event.id} references parent not yet replayed: ${parent}`,
        );
      }
    }

    if (event.type === "object.created" || event.type === "object.updated") {
      if (!isRecord(event.payload) || !("object" in event.payload)) {
        throw new TypeError(`${event.type} payload must contain object`);
      }
      const object = event.payload.object;
      if (isRecord(object) && object.schema === "infinity.causal-node.v0") {
        assertCausalSpineNodeV0(object);
        if (event.subject !== undefined && event.subject !== object.id) {
          throw new Error(`${event.type} subject must equal causal node id`);
        }
        if (event.type === "object.created" && snapshot.nodes[object.id]) {
          throw new Error(`causal node already exists: ${object.id}`);
        }
        if (event.type === "object.updated" && !snapshot.nodes[object.id]) {
          throw new Error(`cannot update missing causal node: ${object.id}`);
        }
        snapshot.nodes[object.id] = structuredClone(object);
      }
    } else if (event.type === "relation.created") {
      if (!isRecord(event.payload) || !("relation" in event.payload)) {
        throw new TypeError("relation.created payload must contain relation");
      }
      const relation = event.payload.relation;
      if (
        isRecord(relation) &&
        relation.schema === "infinity.causal-relation.v0"
      ) {
        assertCausalSpineRelationV0(relation);
        if (event.subject !== undefined && event.subject !== relation.id) {
          throw new Error("relation.created subject must equal relation id");
        }
        if (snapshot.relations[relation.id])
          throw new Error(`causal relation already exists: ${relation.id}`);
        if (
          !snapshot.nodes[relation.source] ||
          !snapshot.nodes[relation.target]
        ) {
          throw new Error(
            `causal relation ${relation.id} references unknown node`,
          );
        }
        snapshot.relations[relation.id] = structuredClone(relation);
      }
    } else if (event.type === "relation.removed") {
      if (
        !isRecord(event.payload) ||
        typeof event.payload.relationId !== "string"
      ) {
        throw new TypeError("relation.removed payload must contain relationId");
      }
      if (
        event.subject !== undefined &&
        event.subject !== event.payload.relationId
      ) {
        throw new Error("relation.removed subject must equal relationId");
      }
      delete snapshot.relations[event.payload.relationId];
    }

    seenEvents.add(event.id);
    snapshot.appliedEventIds.push(event.id);
  }

  return snapshot;
}
