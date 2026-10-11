import test from "node:test";
import assert from "node:assert/strict";
import {
  CATALOG,
  ARCHETYPES,
  SKINS,
  LOOKS,
  heroFrame,
  normalizeAppearance,
  DEFAULT_HERO,
  selection,
} from "../src/adventure/wardrobe.js";
import { restore, save, load, fresh } from "../src/adventure/progress.js";
import { blocked, pathfind } from "../src/adventure/world.js";
test("324 ready-made characters cover every style, skin and outfit without duplicate IDs", () => {
  assert.equal(CATALOG.length, 324);
  assert.equal(new Set(CATALOG.map((h) => h.id)).size, 324);
  for (let a = 0; a < ARCHETYPES.length; a++)
    for (let s = 0; s < SKINS.length; s++)
      for (let l = 0; l < LOOKS.length; l++) {
        const h = selection(a, s, l);
        assert.equal(h.archetype, a);
        assert.equal(h.skin, s);
        assert.equal(h.look, l);
      }
  assert.ok(ARCHETYPES.some((a) => a.id === "curly-guy"));
  assert.ok(ARCHETYPES.some((a) => a.id === "curly-gal"));
  assert.ok(ARCHETYPES.some((a) => a.id === "chemist"));
  assert.ok(ARCHETYPES.some((a) => a.id === "cowgirl"));
});
test("an old adventure gains a wardrobe without losing quests or rewards", () => {
  const legacy = {
    ...fresh(),
    completed: ["welcome", "bakery"],
    coins: 40,
    xp: 80,
  };
  delete legacy.appearance;
  const state = restore(legacy);
  assert.equal(state.appearance.id, DEFAULT_HERO);
  assert.deepEqual(state.completed, legacy.completed);
  assert.equal(state.coins, 40);
  assert.equal(state.xp, 80);
});
test("character changes survive reload while invalid IDs and unsafe names are contained", () => {
  const store = {
    value: null,
    setItem(k, v) {
      this.value = v;
    },
    getItem() {
      return this.value;
    },
  };
  const state = fresh();
  state.coins = 65;
  state.completed = ["welcome", "bakery", "garden"];
  state.appearance = { id: "hero-324", name: "Dust Rider" };
  save(store, state);
  const restored = load(store);
  assert.deepEqual(restored.appearance, state.appearance);
  assert.equal(restored.coins, 65);
  assert.deepEqual(restored.completed, state.completed);
  assert.equal(
    normalizeAppearance({ id: "no-such-hero", name: "<a>\n".repeat(40) }).id,
    DEFAULT_HERO,
  );
  assert.ok(normalizeAppearance({ name: "x".repeat(40) }).name.length <= 24);
  assert.equal(normalizeAppearance({ name: "" }).name, "Traveller");
});
test("every selected character animates inside its own atlas row in four directions", () => {
  for (const h of CATALOG)
    for (let dir = 0; dir < 4; dir++)
      for (let tick = 0; tick < 7; tick++) {
        const f = heroFrame(h.id, dir, true, tick / 8);
        assert.equal(f.sy, h.index * 32);
        assert.ok(f.sx >= dir * 112 && f.sx + 16 <= (dir + 1) * 112);
        assert.equal(heroFrame(h.id, dir, false, 10).sx, dir * 112);
      }
});
test("the parked caravan blocks walking without cutting off the chemist or frontier trail", () => {
  const state = fresh();
  assert.equal(blocked("village", 20.5, 21.5, state), true);
  for (const goal of [
    { x: 20.5, y: 20.5 },
    { x: 28.5, y: 16.5 },
    { x: 30.5, y: 13.5 },
  ]) {
    const path = pathfind("village", state.player, goal, state);
    assert.ok(path.length);
    assert.ok(path.every((p) => !blocked("village", p.x, p.y, state)));
  }
});
