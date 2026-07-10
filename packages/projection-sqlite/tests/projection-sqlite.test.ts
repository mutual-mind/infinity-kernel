import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createActorEvent, createObjectEvent } from "@infinity/kernel";
import { countRows, getObject, rebuildProjection, searchObjects } from "../src/index.js";

describe("@infinity/projection-sqlite", () => {
  it("rebuilds disposable SQLite projection from event logs", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "infinity-sqlite-"));
    const dbPath = path.join(root, "projection.sqlite");
    const actor = createActorEvent({ name: "tester", time: "2026-01-01T00:00:00.000Z" });
    const project = createObjectEvent({
      actor: actor.actor,
      time: "2026-01-01T00:00:01.000Z",
      kind: "project",
      title: "Infinity Project",
      summary: "Searchable project seed",
    });

    await rebuildProjection(dbPath, [actor, project]);
    expect(await countRows(dbPath, "objects")).toBe(1);
    expect((await getObject(dbPath, project.subject as never))?.title).toBe("Infinity Project");
    expect((await searchObjects(dbPath, "Infinity"))[0]?.id).toBe(project.subject);

    await rm(dbPath, { force: true });
    await rebuildProjection(dbPath, [actor, project]);
    expect(await countRows(dbPath, "objects")).toBe(1);
  });
});
