import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { replayCausalSpine, type InfinityEventV0 } from "../src/index.js";

const seedPath = resolve(
  import.meta.dirname,
  "../../../seeds/causal-spine/flow-recent.jsonl",
);

describe("recent Flow Causal Spine seed", () => {
  it("replays the grounded episodes as one valid snapshot", () => {
    const events = readFileSync(seedPath, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as InfinityEventV0);
    const snapshot = replayCausalSpine(events);
    expect(events).toHaveLength(31);
    expect(Object.keys(snapshot.nodes)).toHaveLength(17);
    expect(Object.keys(snapshot.relations)).toHaveLength(14);
    expect(snapshot.nodes["flow:projection:reveal-permanent"]?.kind).toBe(
      "outcome",
    );
    expect(snapshot.nodes["flow:kwin:saya-6.8.3-crash"]?.kind).toBe("outcome");
    expect(snapshot.nodes["flow:atlas:inhabitable-geography"]?.kind).toBe(
      "interpretation",
    );
  });
});
