import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createActorEvent, createObjectEvent } from "@infinity/kernel";
import { exportBundle, importBundle, loadEventLog, replayBundle, saveEventLog, verifyBundle } from "../src/index.js";

describe("@infinity/storage-files", () => {
  it("round-trips event logs through a portable bundle", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "infinity-storage-"));
    const sourceEvents = path.join(root, "source", "events");
    const targetEvents = path.join(root, "target", "events");
    const bundle = path.join(root, "bundle");
    const actor = createActorEvent({ name: "tester", time: "2026-01-01T00:00:00.000Z" });
    const wish = createObjectEvent({ actor: actor.actor, time: "2026-01-01T00:00:01.000Z", kind: "wish", title: "Portable state" });
    await saveEventLog(path.join(sourceEvents, "main.jsonl"), [actor, wish]);

    const manifest = await exportBundle({ sourceEventsDir: sourceEvents, bundleDir: bundle, createdAt: "2026-01-01T00:00:02.000Z" });
    expect(manifest.events).toHaveLength(1);
    expect((await verifyBundle(bundle)).ok).toBe(true);
    const imported = await importBundle(bundle, targetEvents);
    expect(imported).toHaveLength(2);
    expect((await loadEventLog(path.join(targetEvents, "main.jsonl"))).map((event) => event.id)).toEqual([actor.id, wish.id]);
    expect((await replayBundle(bundle)).objects.size).toBe(1);
  });

  it("detects tampered bundle event content", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "infinity-storage-tamper-"));
    const sourceEvents = path.join(root, "source", "events");
    const bundle = path.join(root, "bundle");
    const actor = createActorEvent({ name: "tester", time: "2026-01-01T00:00:00.000Z" });
    await saveEventLog(path.join(sourceEvents, "main.jsonl"), [actor]);
    await exportBundle({ sourceEventsDir: sourceEvents, bundleDir: bundle, createdAt: "2026-01-01T00:00:02.000Z" });

    const eventPath = path.join(bundle, "events", "main.jsonl");
    await writeFile(eventPath, (await readFile(eventPath, "utf8")).replace("tester", "attacker"));
    const result = await verifyBundle(bundle);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/checksum|id mismatch/iu);
  });
});
