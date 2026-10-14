import assert from "node:assert/strict";
import fs from "node:fs";
import { performance } from "node:perf_hooks";
import { question, seeded, matches } from "../src/adventure/questions.js";
import { fresh, restore, finishQuest, save, load } from "../src/adventure/progress.js";
import { SKILLS, QUESTS } from "../src/adventure/content.js";
import { blocked, pathfind, World } from "../src/adventure/world.js";
import { Race, profile } from "../src/adventure/online-model.js";

const rng = seeded(20261012), results = [];
function measure(name, operations, run) {
  const start = performance.now();
  run();
  results.push({ name, operations, ms: +(performance.now() - start).toFixed(2), passed: true });
}
function independent(q) {
  let m;
  if ((m = q.text.match(/^(\d+) ([+−×÷]) (\d+)$/))) {
    const a = +m[1], b = +m[3];
    return { "+": a + b, "−": a - b, "×": a * b, "÷": a / b }[m[2]];
  }
  if ((m = q.text.match(/^([\d.]+) \+ ([\d.]+)$/))) return +m[1] + +m[2];
  if ((m = q.text.match(/^(\d+)% of (\d+)$/))) return +m[1] * +m[2] / 100;
  if ((m = q.text.match(/^(\d+) \+ (\d+) × (\d+)$/))) return +m[1] + +m[2] * +m[3];
  if ((m = q.text.match(/^(\d+)\/(\d+) of (\d+)$/))) return +m[1] / +m[2] * +m[3];
  if ((m = q.text.match(/^(\d+) baskets hold (\d+) apples/))) return +m[1] * +m[2];
  if ((m = q.text.match(/^Share (\d+) litres equally among (\d+)/))) return +m[1] / +m[2];
  throw Error("Unknown question: " + q.text);
}
measure("independently checked maths across 8 skills and 3 levels", 240000, () => {
  for (const skill of Object.keys(SKILLS).filter(k => k !== "mixed"))
    for (const level of [1, 2, 3]) for (let i = 0; i < 10000; i++) {
      const q = question(skill, level, rng);
      assert.ok(Math.abs(independent(q) - q.answer) < 1e-8, q.text);
      assert.ok(matches(String(q.answer), q.answer));
    }
});
measure("complete stories, duplicate rewards, and save round trips", 1000, () => {
  let encoded;
  const storage = { setItem: (_, value) => encoded = value, getItem: () => encoded };
  for (let i = 0; i < 1000; i++) {
    const state = fresh();
    for (const q of QUESTS) {
      assert.equal(finishQuest(state, q.id), true);
      assert.equal(finishQuest(state, q.id), false);
    }
    assert.equal(state.coins, 340);
    assert.equal(state.xp, 490);
    assert.equal(save(storage, state), true);
    assert.deepEqual(load(storage), restore(state));
  }
});
measure("random country paths never enter solid tiles", 2000, () => {
  const state = fresh();
  for (let i = 0; i < 2000; i++) {
    const target = { x: Math.floor(rng() * 60), y: Math.floor(rng() * 44) };
    for (const p of pathfind("village", state.player, target, state))
      assert.equal(blocked("village", p.x, p.y, state), false);
  }
});
measure("sustained movement at 20, 30, 60 and 120 FPS", 100000, () => {
  const state = fresh();
  const world = { state, paused: false, keys: new Set(), path: [], target: null };
  const directions = ["w", "a", "s", "d"];
  for (let i = 0; i < 100000; i++) {
    world.keys.clear(); world.keys.add(directions[Math.floor(rng() * 4)]);
    World.prototype.step.call(world, [1/20, 1/30, 1/60, 1/120][i % 4]);
    assert.equal(blocked("village", state.player.x, state.player.y, state), false);
  }
});
measure("four-player races reject duplicate and spectator answers", 1000, () => {
  const factory = () => ({ text: "8 × 7", answer: 56, hint: "Multiply." });
  for (let i = 0; i < 1000; i++) {
    const race = new Race(["h", "a", "b", "c"], "multiply", 1, 0, factory);
    let now = 3000;
    for (let round = 0; round < 5; round++) {
      race.advance(now);
      assert.equal(race.answer("spectator", race.round, "56", now + 400).ok, false);
      for (const id of race.ids) {
        assert.equal(race.answer(id, race.round, "56", now + 500).ok, true);
        assert.equal(race.answer(id, race.round, "56", now + 900).ok, false);
      }
      race.advance(now + 1000);
      now += 4000;
    }
    race.advance(now);
    assert.equal(race.phase, "results");
    assert.deepEqual(race.scores, { h: 65, a: 65, b: 65, c: 65 });
  }
});
measure("malformed saves and multiplayer profiles remain bounded", 10000, () => {
  const values = [null, [], {}, "bad", -1, Infinity, NaN, true];
  for (let i = 0; i < 10000; i++) {
    const value = values[i % values.length];
    const state = restore({ version: 1, coins: value, xp: value, completed: value, player: { x: value, y: value } });
    const p = profile({ name: value, x: value, y: value, dir: value, avatar: value });
    assert.ok(Number.isFinite(state.coins) && state.coins >= 0);
    assert.ok(Number.isFinite(state.xp) && state.xp >= 0);
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
  }
});
const report = { date: new Date().toISOString().slice(0, 10), seed: 20261012, scope: "local deterministic simulation; no server flood or physical-device benchmark", results };
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
