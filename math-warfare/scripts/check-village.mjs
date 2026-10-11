import { test } from "node:test";
import assert from "node:assert/strict";
import { World, blocked } from "../src/adventure/world.js";
import { NPCS } from "../src/adventure/content.js";
import { fresh } from "../src/adventure/progress.js";
import {
  spriteFrame,
  createResidents,
  advanceResident,
  facing,
  MEETINGS,
} from "../src/adventure/village-life.js";

test("left/right/up/down choose distinct normalized strips, and idle stops the walk cycle", () => {
  assert.equal(facing(-1, 0), 0);
  assert.equal(facing(1, 0), 2);
  assert.equal(facing(0, -1), 1);
  assert.equal(facing(0, 1), 3);
  for (let dir = 0; dir < 4; dir++) {
    assert.equal(spriteFrame(dir, false, 9), dir * 7);
    assert.equal(spriteFrame(dir, true, 9, true), dir * 7);
    for (const time of [0, 0.13, 0.7, 9])
      assert.ok(
        spriteFrame(dir, true, time) >= dir * 7 + 1 &&
          spriteFrame(dir, true, time) <= dir * 7 + 6,
      );
  }
});
test("residents can finish a walking route at low frame rates", () => {
  const a = createResidents(NPCS.village)[0];
  a.path = [
    { x: a.x - 1, y: a.y },
    { x: a.x - 1, y: a.y + 1 },
  ];
  for (let i = 0; i < 100; i++) advanceResident(a, 0.05);
  assert.equal(a.path.length, 0);
  assert.equal(a.dir, 3);
  assert.equal(a.x, a.home.x - 1);
  assert.equal(a.y, a.home.y + 1);
});
test("village routines produce meetings, reciprocal conversation and returns without crossing blocked tiles", () => {
  const state = fresh(),
    residents = createResidents(NPCS.village);
  const w = {
    state,
    residents,
    lifeTime: 0,
    nextMeeting: 6,
    meetingIndex: 0,
    meeting: null,
    pinnedId: null,
    path: [],
    canvas: {
      parentElement: {
        querySelector() {
          return null;
        },
      },
    },
  };
  const voices = new Set(),
    pairs = new Set(),
    homes = new Set();
  for (let i = 0; i < 6000; i++) {
    World.prototype.updateLife.call(w, 0.05);
    for (const a of residents) {
      assert.equal(blocked("village", a.x, a.y, state), false, a.name);
      if (a.bubble) voices.add(a.name);
      if (a.activity === "Back at work") homes.add(a.id);
    }
    if (w.meeting?.phase === "chat") pairs.add(w.meeting.spec.pair.join(","));
  }
  assert.equal(pairs.size, MEETINGS.length);
  assert.ok(voices.size >= 9);
  assert.ok(homes.has("bakery"));
  assert.ok(homes.has("market"));
  assert.ok(homes.has("library"));
});
test("following a moving neighbour pins them, and arrival opens that neighbour exactly once", () => {
  const state = fresh(),
    residents = createResidents(NPCS.village);
  let spoke = null;
  const w = {
    state,
    residents,
    pinnedId: null,
    path: [],
    npcs: residents.map((a) => ({
      ...a,
      x: a.x - 0.5,
      y: a.y - 0.5,
      actor: a,
    })),
    onInteract(n) {
      spoke = n.id;
    },
    canvas: { scrollIntoView() {} },
    onNotice() {},
  };
  const previous = globalThis.window;
  globalThis.window = { innerWidth: 1000 };
  try {
    World.prototype.go.call(w, "bakery");
    assert.equal(w.pinnedId, "bakery");
    assert.ok(w.path.length);
  } finally {
    globalThis.window = previous;
  }
  assert.equal(spoke, null);
  w.keys = new Set();
  w.paused = false;
  w.follow = { ...state.player };
  let talks = 0;
  w.onInteract = (n) => {
    spoke = n.id;
    talks++;
  };
  for (let i = 0; i < 500; i++) World.prototype.step.call(w, 0.05);
  assert.equal(spoke, "bakery");
  assert.equal(talks, 1);
  assert.equal(w.path.length, 0);
});
