import { test } from "node:test";
import assert from "node:assert/strict";
import { World, blocked } from "../src/adventure/world.js";
import { NPCS } from "../src/adventure/content.js";
import { fresh } from "../src/adventure/progress.js";
import { dimensions } from "../src/adventure/map-layout.js";
import {
  spriteFrame,
  createResidents,
  advanceResident,
  facing,
  MEETINGS,
  AMBIENT,
  AMBIENT_ROUTES,
  routeStops,
} from "../src/adventure/village-life.js";

test("farmers and ranchers keep their configured village routes", () => {
  for (const id of ["farmer", "rancher"]) {
    const actor = AMBIENT.find((resident) => resident.id === id);
    assert.ok(actor?.stops?.length);
    assert.strictEqual(routeStops(actor), actor.stops);
  }
});

test("Hazel uses Hazel's fallback route, not a configured farmer route", () => {
  const hazel = AMBIENT.find((resident) => resident.id === "hazel");
  const farmer = AMBIENT.find((resident) => resident.id === "farmer");
  assert.deepEqual(routeStops(hazel), AMBIENT_ROUTES.hazel);
  assert.notDeepEqual(routeStops(farmer), AMBIENT_ROUTES.hazel);
});

test("farmer, rancher and Hazel walk their own scheduled route through open tiles", () => {
  const state = fresh();
  const residents = createResidents(NPCS.village);
  const world = {
    state,
    residents,
    lifeTime: 0,
    nextMeeting: Infinity,
    meetingIndex: 0,
    meeting: null,
    pinnedId: null,
    path: [],
    lifeLabel: null,
  };
  const { width, height } = dimensions("village");

  for (const id of ["farmer", "rancher", "hazel"]) {
    const actor = residents.find((resident) => resident.id === id);
    actor.wait = 0;
    actor.stop = 0;
    World.prototype.updateLife.call(world, 0.01);

    const [x, y] = routeStops(actor)[1];
    assert.deepEqual(actor.path.at(-1), { x: x + 0.5, y: y + 0.5 }, id);
    for (const point of actor.path) {
      assert.ok(point.x >= 1 && point.x < width - 1, `${id} x=${point.x}`);
      assert.ok(point.y >= 2 && point.y < height - 1, `${id} y=${point.y}`);
      assert.equal(blocked("village", point.x, point.y, state), false, id);
    }
  }
});

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
