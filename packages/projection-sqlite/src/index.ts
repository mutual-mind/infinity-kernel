import { execFileSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  canonicalJson,
  type InfinityEventV0,
  type InfinityObjectV0,
  type RelationV0,
  replayEvents,
  type ObjectId,
} from "@infinity/kernel";

export interface SearchResult {
  id: ObjectId;
  kind: string;
  title: string | null;
  summary: string | null;
  rank: number;
}

export async function resetProjection(dbPath: string): Promise<void> {
  await mkdir(path.dirname(dbPath), { recursive: true });
  await rm(dbPath, { force: true });
  await execSql(dbPath, schemaSql);
}

export async function rebuildProjection(dbPath: string, events: InfinityEventV0[]): Promise<void> {
  await resetProjection(dbPath);
  await projectEvents(dbPath, events);
}

export async function projectEvents(dbPath: string, events: InfinityEventV0[]): Promise<void> {
  const projection = replayEvents(events);
  const statements: string[] = ["BEGIN;"];
  for (const event of [...projection.events.values()].sort((left, right) => left.id.localeCompare(right.id))) {
    statements.push(
      `INSERT OR REPLACE INTO events (id, actor, time, type, subject, payload_json, parents_json, content_json) VALUES (${sqlString(event.id)}, ${sqlString(event.actor)}, ${sqlString(event.time)}, ${sqlString(event.type)}, ${sqlString(event.subject ?? null)}, ${sqlString(canonicalJson(event.payload))}, ${sqlString(canonicalJson(event.parents))}, ${sqlString(canonicalJson(event))});`,
    );
  }
  for (const object of [...projection.objects.values()].sort((left, right) => left.id.localeCompare(right.id))) {
    statements.push(insertObjectSql(object));
  }
  for (const relation of [...projection.relations.values()].sort((left, right) => left.id.localeCompare(right.id))) {
    statements.push(insertRelationSql(relation));
  }
  statements.push("COMMIT;");
  await execSql(dbPath, statements.join("\n"));
}

export async function searchObjects(dbPath: string, query: string, limit = 20): Promise<SearchResult[]> {
  const sql = `SELECT id, kind, title, summary, rank FROM search_index WHERE search_index MATCH ${sqlString(escapeFtsQuery(query))} ORDER BY rank LIMIT ${Number(limit)};`;
  const output = await queryJson(dbPath, sql);
  return output.map((row, index) => ({
    id: String(row.id) as ObjectId,
    kind: String(row.kind),
    title: nullableString(row.title),
    summary: nullableString(row.summary),
    rank: typeof row.rank === "number" ? row.rank : index,
  }));
}

export async function getObject(dbPath: string, id: ObjectId): Promise<InfinityObjectV0 | null> {
  const rows = await queryJson(dbPath, `SELECT content_json FROM objects WHERE id = ${sqlString(id)} LIMIT 1;`);
  if (rows.length === 0) return null;
  return JSON.parse(String(rows[0]?.content_json)) as InfinityObjectV0;
}

export async function listObjects(dbPath: string): Promise<InfinityObjectV0[]> {
  const rows = await queryJson(dbPath, "SELECT content_json FROM objects ORDER BY id;");
  return rows.map((row) => JSON.parse(String(row.content_json)) as InfinityObjectV0);
}

export async function countRows(dbPath: string, table: string): Promise<number> {
  if (!/^[a-z_]+$/u.test(table)) throw new Error("Invalid table name");
  const rows = await queryJson(dbPath, `SELECT COUNT(*) AS count FROM ${table};`);
  return Number(rows[0]?.count ?? 0);
}

function insertObjectSql(object: InfinityObjectV0): string {
  const searchText = [object.title, object.summary, object.body, object.tags.join(" "), canonicalJson(object.attributes)]
    .filter(Boolean)
    .join("\n");
  const common = `${sqlString(object.id)}, ${sqlString(object.kind)}, ${sqlString(object.title ?? null)}, ${sqlString(object.summary ?? null)}, ${sqlString(object.body ?? null)}, ${sqlString(object.status ?? null)}, ${sqlString(canonicalJson(object.tags))}, ${sqlString(object.createdBy)}, ${sqlString(object.createdAt)}, ${sqlString(object.updatedAt)}, ${sqlString(canonicalJson(object.attributes))}, ${sqlString(canonicalJson(object))}`;
  const statements = [
    `INSERT OR REPLACE INTO objects (id, kind, title, summary, body, status, tags_json, created_by, created_at, updated_at, attributes_json, content_json) VALUES (${common});`,
    `INSERT OR REPLACE INTO search_index (id, kind, title, summary, body, search_text) VALUES (${sqlString(object.id)}, ${sqlString(object.kind)}, ${sqlString(object.title ?? "")}, ${sqlString(object.summary ?? "")}, ${sqlString(object.body ?? "")}, ${sqlString(searchText)});`,
  ];
  if (object.kind === "claim") statements.push(`INSERT OR REPLACE INTO claims (id, object_id, text) VALUES (${sqlString(object.id)}, ${sqlString(object.id)}, ${sqlString(object.title ?? object.summary ?? object.body ?? "")});`);
  if (object.kind === "evidence") statements.push(`INSERT OR REPLACE INTO evidence (id, object_id, text) VALUES (${sqlString(object.id)}, ${sqlString(object.id)}, ${sqlString(object.title ?? object.summary ?? object.body ?? "")});`);
  if (object.kind === "task") statements.push(`INSERT OR REPLACE INTO tasks (id, object_id, status, title) VALUES (${sqlString(object.id)}, ${sqlString(object.id)}, ${sqlString(object.status ?? null)}, ${sqlString(object.title ?? "")});`);
  if (object.kind === "artifact") statements.push(`INSERT OR REPLACE INTO artifacts (id, object_id, uri, description) VALUES (${sqlString(object.id)}, ${sqlString(object.id)}, ${sqlString(readAttributeString(object, "uri"))}, ${sqlString(object.summary ?? object.body ?? "")});`);
  if (object.kind === "offer") statements.push(`INSERT OR REPLACE INTO offers (id, object_id, text) VALUES (${sqlString(object.id)}, ${sqlString(object.id)}, ${sqlString(object.title ?? object.summary ?? object.body ?? "")});`);
  if (object.kind === "update") statements.push(`INSERT OR REPLACE INTO updates (id, object_id, text) VALUES (${sqlString(object.id)}, ${sqlString(object.id)}, ${sqlString(object.title ?? object.summary ?? object.body ?? "")});`);
  return statements.join("\n");
}

function insertRelationSql(relation: RelationV0): string {
  return `INSERT OR REPLACE INTO relations (id, predicate, from_id, to_id, active, created_by, created_at, attributes_json) VALUES (${sqlString(relation.id)}, ${sqlString(relation.predicate)}, ${sqlString(relation.from)}, ${sqlString(relation.to)}, ${relation.active ? 1 : 0}, ${sqlString(relation.createdBy)}, ${sqlString(relation.createdAt)}, ${sqlString(canonicalJson(relation.attributes))});`;
}

async function queryJson(dbPath: string, sql: string): Promise<Array<Record<string, unknown>>> {
  const output = execFileSync("sqlite3", ["-json", dbPath, sql], { encoding: "utf8" });
  if (output.trim() === "") return [];
  return JSON.parse(output) as Array<Record<string, unknown>>;
}

async function execSql(dbPath: string, sql: string): Promise<void> {
  const sqlPath = path.join(tmpdir(), `infinity-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.sql`);
  await writeFile(sqlPath, sql);
  try {
    execFileSync("sqlite3", [dbPath, `.read ${sqlPath}`], { encoding: "utf8" });
  } finally {
    await rm(sqlPath, { force: true });
  }
}

function sqlString(value: string | number | boolean | null): string {
  if (value === null) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  return `'${value.replaceAll("'", "''")}'`;
}

function escapeFtsQuery(query: string): string {
  return query
    .split(/\s+/u)
    .map((part) => part.replaceAll('"', "").trim())
    .filter(Boolean)
    .map((part) => `"${part}"`)
    .join(" ");
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readAttributeString(object: InfinityObjectV0, key: string): string | null {
  const value = object.attributes[key];
  return typeof value === "string" ? value : null;
}

const schemaSql = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  time TEXT NOT NULL,
  type TEXT NOT NULL,
  subject TEXT,
  payload_json TEXT NOT NULL,
  parents_json TEXT NOT NULL,
  content_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS objects (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  body TEXT,
  status TEXT,
  tags_json TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  attributes_json TEXT NOT NULL,
  content_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS relations (
  id TEXT PRIMARY KEY,
  predicate TEXT NOT NULL,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  active INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  attributes_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS claims (id TEXT PRIMARY KEY, object_id TEXT NOT NULL, text TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS evidence (id TEXT PRIMARY KEY, object_id TEXT NOT NULL, text TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, object_id TEXT NOT NULL, status TEXT, title TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS artifacts (id TEXT PRIMARY KEY, object_id TEXT NOT NULL, uri TEXT, description TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS offers (id TEXT PRIMARY KEY, object_id TEXT NOT NULL, text TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS updates (id TEXT PRIMARY KEY, object_id TEXT NOT NULL, text TEXT NOT NULL);
CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(id UNINDEXED, kind UNINDEXED, title, summary, body, search_text);
`;
