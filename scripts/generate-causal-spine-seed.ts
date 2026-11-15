import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  createInfinityEventV0,
  replayCausalSpine,
  type CausalSpineNodeV0,
  type CausalSpineRelationV0,
  type InfinityEventV0,
} from "../packages/kernel/src/index.js";

const OUT_DIR = resolve("seeds/causal-spine");
const EVENTS_PATH = resolve(OUT_DIR, "flow-recent.jsonl");
const SNAPSHOT_PATH = resolve(OUT_DIR, "flow-recent.snapshot.json");

function node(
  id: string,
  kind: CausalSpineNodeV0["kind"],
  title: string,
  summary: string,
  actorRefs: string[],
  observedAt: string,
  attributes: Record<string, unknown> = {},
  confidence = 1,
): CausalSpineNodeV0 {
  return {
    schema: "infinity.causal-node.v0",
    id,
    kind,
    title,
    summary,
    actorRefs,
    time: { observedAt },
    confidence,
    attributes,
  };
}

function relation(
  id: string,
  source: string,
  target: string,
  predicate: CausalSpineRelationV0["predicate"],
  attributes: Record<string, unknown> = {},
  confidence = 1,
): CausalSpineRelationV0 {
  return {
    schema: "infinity.causal-relation.v0",
    id,
    source,
    target,
    predicate,
    confidence,
    attributes,
  };
}

const events: InfinityEventV0[] = [];

function append(
  time: string,
  type: string,
  subject: string,
  payload: unknown,
  parents: string[] = events.length ? [events.at(-1)!.id] : [],
): InfinityEventV0 {
  const next = createInfinityEventV0({
    schema: "infinity.event.v0",
    actor: "agent:saya",
    time,
    type,
    subject,
    payload,
    parents,
  });
  events.push(next);
  return next;
}

function createNode(
  time: string,
  value: CausalSpineNodeV0,
  parents?: string[],
): InfinityEventV0 {
  return append(time, "object.created", value.id, { object: value }, parents);
}

function createRelation(
  time: string,
  value: CausalSpineRelationV0,
  parents?: string[],
): InfinityEventV0 {
  return append(
    time,
    "relation.created",
    value.id,
    { relation: value },
    parents,
  );
}

// Episode 1 — Projection Plane acceptance on Flow, grounded in state/projection/state.json.
{
  let parent: string[] = [];
  const observed = node(
    "flow:projection:acceptance-observed",
    "observation",
    "Projection reveal accepted on eDP-1",
    "Flow recorded successful eDP projection-focus and full projection-reveal acceptance events.",
    ["agent:saya", "agent:mindey"],
    "2026-11-12T21:40:25.811074Z",
    {
      source: "/home/saya/flow-lab/state/projection/state.json",
      evidenceSummary: "eDP projection focus acceptance",
    },
  );
  const e1 = createNode("2026-11-12T21:40:25.811074Z", observed, parent);
  parent = [e1.id];

  const interpretation = node(
    "flow:projection:shared-membrane-interpretation",
    "interpretation",
    "Projection Plane can reveal semantic state without taking desktop ownership",
    "A bounded KWin reveal can make the semantic projection salient while leaving application placement and authentication boundaries intact.",
    ["agent:saya", "agent:mindey"],
    "2026-11-12T21:41:36.048266Z",
  );
  const e2 = createNode("2026-11-12T21:41:36.048266Z", interpretation, parent);
  parent = [e2.id];
  const e3 = createRelation(
    "2026-11-12T21:41:36.048266Z",
    relation(
      "rel:projection-observed-interpreted",
      observed.id,
      interpretation.id,
      "interpreted_as",
    ),
    parent,
  );
  parent = [e3.id];

  const intention = node(
    "flow:projection:make-reveal-durable",
    "intention",
    "Make the projection reveal path durable",
    "Promote the accepted bounded reveal from a diagnostic into the persistent Flow projection path.",
    ["agent:saya", "agent:mindey"],
    "2026-11-12T21:47:48.537759Z",
  );
  const e4 = createNode("2026-11-12T21:47:48.537759Z", intention, parent);
  parent = [e4.id];
  const e5 = createRelation(
    "2026-11-12T21:47:48.537759Z",
    relation(
      "rel:projection-interpretation-motivates",
      interpretation.id,
      intention.id,
      "motivates",
    ),
    parent,
  );
  parent = [e5.id];

  const action = node(
    "flow:projection:durable-reveal-action",
    "action",
    "Retain the projection reveal path",
    "Keep the accepted projection focus/reveal chain as the stable manual and automation path.",
    ["agent:saya"],
    "2026-11-12T21:52:50.650545Z",
  );
  const e6 = createNode("2026-11-12T21:52:50.650545Z", action, parent);
  parent = [e6.id];
  const e7 = createRelation(
    "2026-11-12T21:52:50.650545Z",
    relation(
      "rel:projection-intention-realized",
      intention.id,
      action.id,
      "realized_by",
    ),
    parent,
  );
  parent = [e7.id];

  const outcome = node(
    "flow:projection:reveal-permanent",
    "outcome",
    "Projection reveal path is now permanent",
    "Flow recorded the projection reveal path as a durable part of the Projection Plane runtime.",
    ["agent:saya", "agent:mindey"],
    "2026-11-12T21:52:50.650545Z",
    {
      source: "/home/saya/flow-lab/state/projection/state.json",
      evidenceSummary: "Projection reveal path is now permanent",
    },
  );
  const e8 = createNode("2026-11-12T21:52:50.650545Z", outcome, parent);
  parent = [e8.id];
  createRelation(
    "2026-11-12T21:52:50.650545Z",
    relation(
      "rel:projection-action-produces",
      action.id,
      outcome.id,
      "produces",
    ),
    parent,
  );
}

// Episode 2 — Fedora/KWin 6.8.3 upgrade and one-login Saya trial.
{
  let parent: string[] = [];
  const upgrade = node(
    "flow:kwin:fedora-upgrade-20261115",
    "observation",
    "Fedora package upgrade completed",
    "DNF transaction 21 upgraded the Flow system before the one-login Saya KWin 6.8.3 trial.",
    ["agent:saya", "agent:mindey"],
    "2026-11-15T10:32:25Z",
    { source: "dnf history transaction 21" },
  );
  const e1 = createNode("2026-11-15T10:32:25Z", upgrade, parent);
  parent = [e1.id];

  const trial = node(
    "flow:kwin:saya-6.8.3-one-login-trial",
    "action",
    "Run one-login Saya KWin 6.8.3 trial",
    "Arm the rebuilt Saya compositor for one login while keeping stock KWin preferred for the next login.",
    ["agent:saya", "agent:mindey"],
    "2026-11-15T10:40:00Z",
    { branch: "kwin-saya-6.8.3", rollback: "stock-preferred-next-login" },
  );
  const e2 = createNode("2026-11-15T10:40:00Z", trial, parent);
  parent = [e2.id];
  const e3 = createRelation(
    "2026-11-15T10:40:00Z",
    relation("rel:upgrade-enables-trial", upgrade.id, trial.id, "enables"),
    parent,
  );
  parent = [e3.id];

  const crash = node(
    "flow:kwin:saya-6.8.3-crash",
    "outcome",
    "Saya KWin 6.8.3 crashed repeatedly",
    "The trial compositor produced repeated SIGSEGV coredumps beginning at 10:40:43 UTC.",
    ["agent:saya", "agent:mindey"],
    "2026-11-15T10:40:43Z",
    { source: "coredumpctl", signal: "SIGSEGV", executable: "kwin_wayland" },
  );
  const e4 = createNode("2026-11-15T10:40:43Z", crash, parent);
  parent = [e4.id];
  const e5 = createRelation(
    "2026-11-15T10:40:43Z",
    relation("rel:kwin-trial-produces-crash", trial.id, crash.id, "produces"),
    parent,
  );
  parent = [e5.id];

  const interpretation = node(
    "flow:kwin:trial-incompatible-interpretation",
    "interpretation",
    "Treat the 6.8.3 Saya build as behaviorally incompatible until isolated",
    "Preserve the rebuild and crash evidence, but return the interactive session to stock KWin before further diagnosis.",
    ["agent:saya", "agent:mindey"],
    "2026-11-15T10:41:26Z",
  );
  const e6 = createNode("2026-11-15T10:41:26Z", interpretation, parent);
  parent = [e6.id];
  const e7 = createRelation(
    "2026-11-15T10:41:26Z",
    relation(
      "rel:kwin-crash-interpreted",
      crash.id,
      interpretation.id,
      "interpreted_as",
    ),
    parent,
  );
  parent = [e7.id];

  const fallback = node(
    "flow:kwin:return-to-stock",
    "action",
    "Return to stock KWin 6.8.3",
    "Use the already-preferred stock selector for the next login and restore a stable desktop session.",
    ["agent:saya", "agent:mindey"],
    "2026-11-15T10:42:00Z",
  );
  const e8 = createNode("2026-11-15T10:42:00Z", fallback, parent);
  parent = [e8.id];
  const e9 = createRelation(
    "2026-11-15T10:42:00Z",
    relation(
      "rel:kwin-interpretation-motivates-fallback",
      interpretation.id,
      fallback.id,
      "motivates",
    ),
    parent,
  );
  parent = [e9.id];

  const stable = node(
    "flow:kwin:stock-session-stable",
    "state",
    "Stock KWin session stable",
    "After relogin, Flow returned to the stock KWin 6.8.3 session and the desktop loaded.",
    ["agent:saya", "agent:mindey"],
    "2026-11-15T10:43:00Z",
  );
  const e10 = createNode("2026-11-15T10:43:00Z", stable, parent);
  parent = [e10.id];
  createRelation(
    "2026-11-15T10:43:00Z",
    relation(
      "rel:kwin-fallback-produces-stable",
      fallback.id,
      stable.id,
      "produces",
    ),
    parent,
  );
}

// Episode 3 — Causal Atlas physical SpaceBall navigation on Flow.
{
  let parent: string[] = [];
  const limitation = node(
    "flow:atlas:webhid-firefox-limitation",
    "observation",
    "Firefox cannot provide the Atlas WebHID SpaceBall path",
    "Causal Atlas reported WebHID unavailable in Firefox and required a Chromium-family browser for SpaceBall access.",
    ["agent:saya", "agent:mindey"],
    "2026-11-15T12:25:00Z",
  );
  const e1 = createNode("2026-11-15T12:25:00Z", limitation, parent);
  parent = [e1.id];

  const intention = node(
    "flow:atlas:enable-six-dof-navigation",
    "intention",
    "Enable physical six-degree Causal Atlas navigation",
    "Use the already-connected SpaceBall 5000 as the embodied navigation controller for the Atlas.",
    ["agent:saya", "agent:mindey"],
    "2026-11-15T12:25:30Z",
  );
  const e2 = createNode("2026-11-15T12:25:30Z", intention, parent);
  parent = [e2.id];
  const e3 = createRelation(
    "2026-11-15T12:25:30Z",
    relation(
      "rel:webhid-limitation-motivates",
      limitation.id,
      intention.id,
      "motivates",
    ),
    parent,
  );
  parent = [e3.id];

  const install = node(
    "flow:atlas:install-chromium-webhid",
    "action",
    "Install Chromium and device-scoped WebHID access",
    "Install Fedora Chromium 156.0.8078.79, add the 046d:c621 uaccess rule, and launch Atlas under Wayland.",
    ["agent:saya"],
    "2026-11-15T12:26:35Z",
    {
      source: "dnf history transaction 23",
      package: "chromium-156.0.8078.79-1.fc45.x86_64",
      usb: "046d:c621",
    },
  );
  const e4 = createNode("2026-11-15T12:26:35Z", install, parent);
  parent = [e4.id];
  const e5 = createRelation(
    "2026-11-15T12:26:35Z",
    relation(
      "rel:spaceball-intention-realized",
      intention.id,
      install.id,
      "realized_by",
    ),
    parent,
  );
  parent = [e5.id];

  const evidence = node(
    "flow:atlas:spaceball-hidraw-evidence",
    "evidence",
    "SpaceBall hidraw node is available to self",
    "/dev/hidraw8 matched 046d:c621 and carried read/write ACL for the active self session.",
    ["agent:saya", "agent:mindey"],
    "2026-11-15T12:27:00Z",
    { device: "/dev/hidraw8", access: "user:self:rw-", usb: "046d:c621" },
  );
  const e6 = createNode("2026-11-15T12:27:00Z", evidence, parent);
  parent = [e6.id];
  const e7 = createRelation(
    "2026-11-15T12:27:00Z",
    relation(
      "rel:install-produces-hidraw",
      install.id,
      evidence.id,
      "produces",
    ),
    parent,
  );
  parent = [e7.id];

  const outcome = node(
    "flow:atlas:spaceball-navigation-working",
    "outcome",
    "SpaceBall navigation works in Causal Atlas",
    "Mindey confirmed translation/navigation and visible trajectory drawing in the Chromium Atlas session.",
    ["agent:saya", "agent:mindey"],
    "2026-11-15T12:29:00Z",
  );
  const e8 = createNode("2026-11-15T12:29:00Z", outcome, parent);
  parent = [e8.id];
  const e9 = createRelation(
    "2026-11-15T12:29:00Z",
    relation(
      "rel:hidraw-supports-navigation",
      evidence.id,
      outcome.id,
      "supports",
    ),
    parent,
  );
  parent = [e9.id];

  const interpretation = node(
    "flow:atlas:inhabitable-geography",
    "interpretation",
    "Causal geography is directly inhabitable",
    "Six-degree physical locomotion plus trajectory memory makes the causal map behave more like a shared place than a static graph.",
    ["agent:saya", "agent:mindey"],
    "2026-11-15T12:31:00Z",
  );
  const e10 = createNode("2026-11-15T12:31:00Z", interpretation, parent);
  parent = [e10.id];
  createRelation(
    "2026-11-15T12:31:00Z",
    relation(
      "rel:navigation-interpreted-as-inhabitation",
      outcome.id,
      interpretation.id,
      "interpreted_as",
    ),
    parent,
  );
}

await mkdir(dirname(EVENTS_PATH), { recursive: true });
await writeFile(
  EVENTS_PATH,
  events.map((event) => JSON.stringify(event)).join("\n") + "\n",
  "utf8",
);
const snapshot = replayCausalSpine(events);
await writeFile(
  SNAPSHOT_PATH,
  JSON.stringify(snapshot, null, 2) + "\n",
  "utf8",
);
console.log(
  JSON.stringify({
    events: events.length,
    nodes: Object.keys(snapshot.nodes).length,
    relations: Object.keys(snapshot.relations).length,
    eventsPath: EVENTS_PATH,
    snapshotPath: SNAPSHOT_PATH,
  }),
);
