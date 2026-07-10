import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  canonicalJson,
  computeEventId,
  type EventId,
  type InfinityEventV0,
  type JsonValue,
  KernelError,
  replayEvents,
  sha256Hex,
  validateEvent,
  verifyEvents,
} from "@infinity/kernel";

export const BUNDLE_SCHEMA = "infinity.bundle.v0" as const;

export interface EventLogInfo {
  path: string;
  sha256: string;
  count: number;
}

export interface BundleManifestV0 {
  schema: typeof BUNDLE_SCHEMA;
  bundleId: string;
  createdAt: string;
  events: EventLogInfo[];
  schemas: string[];
  actors: string[];
  projectionChecksum: string | null;
}

export interface VerifyBundleResult {
  ok: boolean;
  errors: string[];
  manifest?: BundleManifestV0 | undefined;
}

export async function ensureStore(rootDir: string): Promise<void> {
  await mkdir(path.join(rootDir, "actors"), { recursive: true });
  await mkdir(path.join(rootDir, "events"), { recursive: true });
  await mkdir(path.join(rootDir, "bundles"), { recursive: true });
  await mkdir(path.join(rootDir, "projections"), { recursive: true });
}

export async function appendEvent(logPath: string, event: InfinityEventV0): Promise<void> {
  validateEvent(event);
  await mkdir(path.dirname(logPath), { recursive: true });
  await writeFile(logPath, `${canonicalJson(event)}\n`, { flag: "a" });
}

export async function saveEventLog(logPath: string, events: InfinityEventV0[]): Promise<void> {
  verifyEvents(events);
  await mkdir(path.dirname(logPath), { recursive: true });
  await writeFile(logPath, events.map((event) => canonicalJson(event)).join("\n") + (events.length > 0 ? "\n" : ""));
}

export async function loadEventLog(logPath: string): Promise<InfinityEventV0[]> {
  const content = await readFile(logPath, "utf8");
  if (content.trim() === "") return [];
  return content
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      try {
        return validateEvent(JSON.parse(line));
      } catch (error) {
        throw new KernelError(`${logPath}:${index + 1}: ${(error as Error).message}`);
      }
    });
}

export async function loadEventLogs(eventsDir: string): Promise<InfinityEventV0[]> {
  const files = (await listFiles(eventsDir)).filter((file) => file.endsWith(".jsonl")).sort();
  const events: InfinityEventV0[] = [];
  for (const file of files) events.push(...(await loadEventLog(file)));
  verifyEvents(events);
  return events;
}

export async function exportBundle(input: {
  sourceEventsDir: string;
  bundleDir: string;
  createdAt?: string;
  readme?: string;
}): Promise<BundleManifestV0> {
  await rm(input.bundleDir, { recursive: true, force: true });
  await mkdir(path.join(input.bundleDir, "events"), { recursive: true });
  await mkdir(path.join(input.bundleDir, "schemas"), { recursive: true });
  await mkdir(path.join(input.bundleDir, "actors"), { recursive: true });

  const eventFiles = (await listFiles(input.sourceEventsDir)).filter((file) => file.endsWith(".jsonl")).sort();
  const infos: EventLogInfo[] = [];
  const checksums: Record<string, string> = {};
  for (const file of eventFiles) {
    const events = await loadEventLog(file);
    const relative = path.join("events", path.basename(file));
    const content = events.map((event) => canonicalJson(event)).join("\n") + (events.length > 0 ? "\n" : "");
    const sha256 = sha256Hex(content);
    await writeFile(path.join(input.bundleDir, relative), content);
    infos.push({ path: relative, sha256, count: events.length });
    checksums[relative] = sha256;
  }

  const manifestWithoutId = {
    schema: BUNDLE_SCHEMA,
    bundleId: "bundle:pending",
    createdAt: input.createdAt ?? new Date().toISOString(),
    events: infos,
    schemas: [],
    actors: [],
    projectionChecksum: null,
  };
  const bundleId = `bundle:${sha256Hex(canonicalJson({ manifest: { ...manifestWithoutId, bundleId: "bundle:pending" }, checksums }))}`;
  const manifest: BundleManifestV0 = { ...manifestWithoutId, bundleId };
  checksums["manifest.json"] = sha256Hex(canonicalJson(manifest));

  await writeFile(path.join(input.bundleDir, "manifest.json"), `${canonicalJson(manifest)}\n`);
  await writeFile(path.join(input.bundleDir, "checksums.json"), `${canonicalJson(checksums)}\n`);
  await writeFile(
    path.join(input.bundleDir, "README.md"),
    input.readme ?? "# Infinity bundle\n\nThis folder contains portable Infinity event logs.\n",
  );
  return manifest;
}

export async function importBundle(bundleDir: string, targetEventsDir: string): Promise<InfinityEventV0[]> {
  const verification = await verifyBundle(bundleDir);
  if (!verification.ok) throw new KernelError(`Invalid bundle: ${verification.errors.join("; ")}`);
  await mkdir(targetEventsDir, { recursive: true });
  const manifest = verification.manifest;
  if (!manifest) throw new KernelError("Bundle manifest missing after verification");
  const imported: InfinityEventV0[] = [];
  for (const info of manifest.events) {
    const events = await loadEventLog(path.join(bundleDir, info.path));
    imported.push(...events);
    await saveEventLog(path.join(targetEventsDir, path.basename(info.path)), events);
  }
  return imported;
}

export async function verifyBundle(bundleDir: string): Promise<VerifyBundleResult> {
  const errors: string[] = [];
  let manifest: BundleManifestV0 | undefined;
  try {
    manifest = JSON.parse(await readFile(path.join(bundleDir, "manifest.json"), "utf8")) as BundleManifestV0;
    if (manifest.schema !== BUNDLE_SCHEMA) errors.push("Invalid bundle schema");
    if (typeof manifest.bundleId !== "string" || !manifest.bundleId.startsWith("bundle:")) errors.push("Invalid bundle id");
  } catch (error) {
    errors.push(`Cannot read manifest: ${(error as Error).message}`);
  }

  if (manifest) {
    let checksums: Record<string, string> = {};
    try {
      checksums = JSON.parse(await readFile(path.join(bundleDir, "checksums.json"), "utf8")) as Record<string, string>;
      const manifestChecksum = sha256Hex(canonicalJson(manifest));
      if (checksums["manifest.json"] !== manifestChecksum) errors.push("checksums.json manifest checksum mismatch");
    } catch (error) {
      errors.push(`Cannot read checksums.json: ${(error as Error).message}`);
    }
    const seen = new Map<EventId, string>();
    for (const info of manifest.events) {
      try {
        const filePath = path.join(bundleDir, info.path);
        const content = await readFile(filePath, "utf8");
        const sha256 = sha256Hex(content);
        if (sha256 !== info.sha256) errors.push(`Manifest checksum mismatch for ${info.path}`);
        if (checksums[info.path] !== undefined && checksums[info.path] !== sha256) errors.push(`checksums.json mismatch for ${info.path}`);
        const events = await loadEventLog(filePath);
        if (events.length !== info.count) errors.push(`Manifest count mismatch for ${info.path}`);
        for (const event of events) {
          const canonical = canonicalJson(event);
          if (computeEventId(event) !== event.id) errors.push(`Invalid content id for ${event.id}`);
          const prior = seen.get(event.id);
          if (prior !== undefined && prior !== canonical) errors.push(`Duplicate event id with different content: ${event.id}`);
          seen.set(event.id, canonical);
        }
      } catch (error) {
        errors.push(`Cannot verify ${info.path}: ${(error as Error).message}`);
      }
    }
  }

  return { ok: errors.length === 0, errors, manifest };
}

export async function replayBundle(bundleDir: string) {
  const verification = await verifyBundle(bundleDir);
  if (!verification.ok) throw new KernelError(`Invalid bundle: ${verification.errors.join("; ")}`);
  const manifest = verification.manifest;
  if (!manifest) throw new KernelError("Bundle manifest missing after verification");
  const events: InfinityEventV0[] = [];
  for (const info of manifest.events) events.push(...(await loadEventLog(path.join(bundleDir, info.path))));
  return replayEvents(events);
}

async function listFiles(dir: string): Promise<string[]> {
  try {
    const dirStat = await stat(dir);
    if (!dirStat.isDirectory()) return [];
  } catch {
    return [];
  }
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(fullPath)));
    if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

void (undefined satisfies JsonValue | undefined);
