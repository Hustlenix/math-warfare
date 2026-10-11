import { test } from "node:test";
import assert from "node:assert/strict";
import {
  question,
  seeded,
  parseAnswer,
  matches,
} from "../src/adventure/questions.js";
import {
  fresh,
  restore,
  finishQuest,
  purchase,
  available,
  load,
  save,
} from "../src/adventure/progress.js";
import { QUESTS, SKILLS, NPCS } from "../src/adventure/content.js";
import {
  blocked,
  pathfind,
  pointerToWorld,
  World,
} from "../src/adventure/world.js";

test("auto-walking reaches a neighbour at 20 FPS without oscillating past tiles", () => {
  const state = fresh();
  let talks = 0;
  const controller = {
    state,
    paused: false,
    keys: new Set(),
    path: [
      { x: 15.5, y: 14.5 },
      { x: 14.5, y: 14.5 },
    ],
    target: { id: "welcome" },
    follow: { ...state.player },
    onInteract() {
      talks++;
    },
  };
  for (let i = 0; i < 100; i++) World.prototype.step.call(controller, 0.05);
  assert.equal(controller.path.length, 0);
  assert.equal(talks, 1);
  assert.equal(state.player.x, 14.5);
  assert.equal(state.player.y, 14.5);
});

test("pointer coordinates stay correct when a phone scales the canvas bitmap", () => {
  const bounds = { left: 10, top: 20, width: 160, height: 240 };
  assert.deepEqual(
    pointerToWorld(
      { x: 90, y: 140 },
      bounds,
      { width: 320, height: 480 },
      { x: 64, y: 32 },
    ),
    { x: 7, y: 8.5 },
  );
  assert.deepEqual(
    pointerToWorld(
      { x: 10, y: 20 },
      bounds,
      { width: 320, height: 480 },
      { x: 64, y: 32 },
    ),
    { x: 2, y: 1 },
  );
});

function calculate(q) {
  let m;
  if ((m = q.text.match(/^(\d+) ([+−×÷]) (\d+)$/))) {
    const a = +m[1],
      b = +m[3];
    return { "+": a + b, "−": a - b, "×": a * b, "÷": a / b }[m[2]];
  }
  if ((m = q.text.match(/^([\d.]+) \+ ([\d.]+)$/))) return +m[1] + +m[2];
  if ((m = q.text.match(/^(\d+)% of (\d+)$/))) return (+m[1] / 100) * +m[2];
  if ((m = q.text.match(/^(\d+) \+ (\d+) × (\d+)$/)))
    return +m[1] + +m[2] * +m[3];
  if ((m = q.text.match(/^(\d+)\/(\d+) of (\d+)$/)))
    return (+m[1] / +m[2]) * +m[3];
  if ((m = q.text.match(/^(\d+) baskets hold (\d+) apples/)))
    return +m[1] * +m[2];
  if ((m = q.text.match(/^Share (\d+) litres equally among (\d+)/)))
    return +m[1] / +m[2];
  throw Error("Unrecognised question " + q.text);
}
test("24,000 generated questions agree with independently parsed equations", () => {
  const rng = seeded(20261011);
  for (const skill of Object.keys(SKILLS).filter((k) => k !== "mixed"))
    for (const level of [1, 2, 3])
      for (let i = 0; i < 1000; i++) {
        const q = question(skill, level, rng);
        assert.ok(Number.isFinite(q.answer));
        assert.ok(Math.abs(calculate(q) - q.answer) < 1e-8, q.text);
        assert.ok(q.hint);
        assert.ok(matches(String(q.answer), q.answer));
      }
});
test("strict numeric input rejects coercion and accepts decimals", () => {
  for (const s of [
    "",
    " ",
    "Infinity",
    "NaN",
    "0x10",
    "12abc",
    "1/2",
    "1e3",
    "--1",
  ])
    assert.equal(parseAnswer(s), null);
  assert.equal(parseAnswer(" .5 "), 0.5);
  assert.equal(parseAnswer("-2.5"), -2.5);
  assert.equal(matches("2.5", 2.50000000001), true);
});
test("daily seeds repeat and different days change the trail", () => {
  const a = seeded(20261011),
    b = seeded(20261011),
    c = seeded(20261012);
  assert.deepEqual(
    Array.from({ length: 10 }, () => question("mixed", 2, a)),
    Array.from({ length: 10 }, () => question("mixed", 2, b)),
  );
  assert.notDeepEqual(
    question("mixed", 2, seeded(20261011)),
    question("mixed", 2, c),
  );
});
test("quest rewards gate progression and cannot be collected twice", () => {
  const s = fresh();
  assert.equal(finishQuest(s, "king"), false);
  for (const q of QUESTS) {
    assert.equal(available(s, q.id), true);
    assert.equal(finishQuest(s, q.id), true);
    const coins = s.coins;
    assert.equal(finishQuest(s, q.id), false);
    assert.equal(s.coins, coins);
  }
  assert.equal(s.completed.length, 9);
  assert.equal(s.coins, 340);
  assert.equal(s.xp, 490);
});
test("shop transaction cannot overdraft or duplicate an upgrade", () => {
  const s = fresh();
  assert.equal(purchase(s, "garden"), false);
  s.coins = 40;
  assert.equal(purchase(s, "garden"), true);
  assert.equal(s.coins, 0);
  s.coins = 99;
  assert.equal(purchase(s, "garden"), false);
  assert.equal(s.coins, 99);
  assert.equal(purchase(s, "missing"), false);
});
test("save reload keeps rewards and ignores corrupt data", () => {
  const s = fresh();
  finishQuest(s, "welcome");
  s.dailyDone = "2026-10-11";
  const mem = {
    value: null,
    getItem() {
      return this.value;
    },
    setItem(k, v) {
      this.value = v;
    },
  };
  assert.equal(save(mem, s), true);
  const restored = load(mem);
  assert.equal(finishQuest(restored, "welcome"), false);
  assert.equal(restored.coins, 15);
  assert.equal(restored.dailyDone, "2026-10-11");
  assert.equal(restore({ version: 99 }).coins, 0);
  assert.equal(restore({ version: 1, coins: -100, xp: Infinity }).coins, 0);
  assert.equal(
    load({
      getItem() {
        throw Error();
      },
    }).coins,
    0,
  );
  assert.equal(
    save(
      {
        setItem() {
          throw Error();
        },
      },
      s,
    ),
    false,
  );
});
test("every required neighbour is reachable when their quest is available", () => {
  const s = fresh();
  for (const q of QUESTS) {
    s.zone = q.zone;
    s.player =
      q.zone === "village" ? { x: 16.5, y: 14.5 } : { x: 4.5, y: 20.5 };
    const n = NPCS[q.zone].find((n) => n.id === q.id);
    const path = pathfind(q.zone, s.player, { x: n.x, y: n.y + 1 }, s);
    assert.ok(path.length, `${q.id} is unreachable`);
    for (const p of path) assert.equal(blocked(q.zone, p.x, p.y, s), false);
    finishQuest(s, q.id);
  }
});
test("cave gates are closed until their specific quest is completed", () => {
  const s = fresh();
  assert.equal(blocked("cave", 10, 17, s), true);
  s.completed.push("bridge");
  assert.equal(blocked("cave", 10, 17, s), false);
  assert.equal(blocked("cave", 20, 11, s), true);
  s.completed.push("fungi");
  assert.equal(blocked("cave", 20, 11, s), false);
  assert.equal(blocked("village", 0, 10, s), true);
});
