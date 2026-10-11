import test from "node:test";
import assert from "node:assert/strict";
import { blocked, pathfind } from "../src/adventure/world.js";
import { dimensions, LANDMARKS, FARM, cropTile, villagePath } from "../src/adventure/map-layout.js";
import { Companion, petName, drawCompanion } from "../src/adventure/companion.js";
import { fresh, restore } from "../src/adventure/progress.js";
import { profile } from "../src/adventure/online-model.js";
import { AMBIENT } from "../src/adventure/village-life.js";
import { CATALOG } from "../src/adventure/wardrobe.js";
const state = fresh();
const petFor = (player, zone = "village") => new Companion(player,
  (a, b) => pathfind(zone, a, b, state), (x, y) => blocked(zone, x, y, state));

test("the expanded country has reachable districts, separated crop beds and two creek crossings", () => {
  AMBIENT.filter((a) => a.art.startsWith("hero-")).forEach((a) => assert.ok(CATALOG.some((look) => look.id === a.art), a.name + " uses a real prebuilt look"));
  assert.deepEqual(dimensions("village"), { width: 60, height: 44 });
  assert.deepEqual(dimensions("cave"), { width: 33, height: 25 });
  for (const place of LANDMARKS) {
    const path = pathfind("village", state.player, place, state);
    assert.ok(path.length > 0, place.name);
    path.forEach((p) => assert.equal(blocked("village", p.x, p.y, state), false));
  }
  for (let x = 9; x <= 12; x++) for (let y = 18; y <= 22; y++)
    assert.equal(blocked("village", x, y, state), false, "former crops are walkable");
  for (let x = FARM.x; x < FARM.x + FARM.width; x++) for (let y = FARM.y; y < FARM.y + FARM.height; y++) {
    if (cropTile(x, y)) {
      assert.equal(villagePath(x, y), false);
      assert.equal(blocked("village", x, y, state), true);
    }
  }
  assert.equal(blocked("village", 50, 22, state), true);
  assert.equal(blocked("village", 50, 13, state), false);
  assert.equal(blocked("village", 51, 34, state), false);
  assert.equal(blocked("cave", 34, 15, state), true, "the cave did not silently become a village-sized map");
});

test("a following pet rounds the pond, field fence and creek without crossing solids at 20 FPS", () => {
  const hero = { x: 7.5, y: 19.5 }, pet = petFor(hero);
  let maxStep = 0;
  for (const goal of [{ x: 16.5, y: 24.5 }, { x: 41.5, y: 28.5 }, { x: 55.5, y: 17.5 }]) {
    const path = pathfind("village", hero, goal, state);
    assert.ok(path.length);
    for (const q of path) {
      while (Math.hypot(q.x - hero.x, q.y - hero.y) > 0.001) {
        const dx = q.x - hero.x, dy = q.y - hero.y, d = Math.hypot(dx, dy), move = Math.min(d, 0.225);
        hero.x += dx / d * move; hero.y += dy / d * move;
        const before = { x: pet.x, y: pet.y };
        pet.update(0.05, hero);
        maxStep = Math.max(maxStep, Math.hypot(pet.x - before.x, pet.y - before.y));
        assert.equal(blocked("village", pet.x, pet.y, state), false);
      }
    }
    for (let i = 0; i < 160; i++) {
      pet.update(0.05, hero);
      assert.equal(blocked("village", pet.x, pet.y, state), false);
    }
    assert.ok(Math.hypot(hero.x - pet.x, hero.y - pet.y) <= 2, "pet catches up on paths");
  }
  assert.ok(maxStep <= 0.271, "no teleport or over-speed catch-up");
});

test("stay, recall, affection and map changes have distinct pet behavior", () => {
  const hero = { x: 18.5, y: 14.5 }, pet = petFor(hero);
  pet.stay(); const at = { x: pet.x, y: pet.y };
  hero.x = 25.5;
  for (let i = 0; i < 200; i++) pet.update(0.05, hero);
  assert.equal(pet.x, at.x); assert.equal(pet.y, at.y);
  assert.equal(pet.pet(hero), false);
  pet.recall(hero);
  for (let i = 0; i < 200; i++) pet.update(0.05, hero);
  assert.equal(pet.mode, "follow");
  assert.ok(Math.hypot(hero.x - pet.x, hero.y - pet.y) <= 2.1);
  assert.equal(pet.pet(hero), true);
  assert.equal(pet.affection, 3);
  pet.update(0.05, hero, false);
  assert.equal(pet.moving, false);
  pet.reset({ x: 41.5, y: 28.5 });
  assert.equal(blocked("village", pet.x, pet.y, state), false);
  assert.equal(pet.path.length, 0); assert.equal(pet.mode, "follow");
});

test("small cat poses face four directions and sleeping art is only used at rest", () => {
  const pixels = [], images = [], ctx = {
    fillRect(...args) { pixels.push([this.fillStyle, ...args]); },
    drawImage(...args) { images.push(args); }, save() {}, restore() {}, translate() {}, scale() {},
  };
  const pet = { x: 3, y: 3, dir: 0, moving: true, idle: 0, affection: 0 };
  const snapshots = [];
  for (let dir = 0; dir < 4; dir++) {
    pixels.length = 0; pet.dir = dir;
    drawCompanion(ctx, pet, "cat", { cat: "nap" }, 0.1);
    snapshots.push(JSON.stringify(pixels));
    assert.equal(images.length, 0, "walking never uses the curled sleeping sheet");
    assert.ok(pixels.every(([, , , width]) => width <= 20));
  }
  assert.equal(new Set(snapshots).size, 4);
  pet.moving = false; pet.idle = 8;
  drawCompanion(ctx, pet, "cat", { cat: "nap" }, 1);
  assert.equal(images[0][7], 32, "nap is 32 pixels wide, not 96");
});

test("old progress and names survive reload; expanded coordinates stay valid for saves and peers", () => {
  const old = { ...fresh(), completed: ["welcome", "bakery"], coins: 40, companion: "cat" };
  const migrated = restore(old);
  assert.equal(migrated.companion, "cat"); assert.equal(migrated.coins, 40);
  assert.equal(migrated.petNames.cat, "Pixel");
  const expanded = restore({ ...old, player: { x: 55.5, y: 37.5 }, petNames: { cat: "Dusty", frog: "<Pond>" } });
  assert.deepEqual(expanded.player, { x: 55.5, y: 37.5 });
  assert.equal(expanded.petNames.cat, "Dusty"); assert.equal(expanded.petNames.frog, "Pond");
  assert.equal(petName("\u0000", "frog"), "Pebble");
  assert.equal(profile({ x: 55.5, y: 37.5 }).x, 55.5);
  assert.equal(profile({ x: 55.5, y: 37.5, zone: "cave" }).x, 32);
  assert.equal(profile({ x: 55.5, y: 37.5, zone: "cave" }).y, 24);
});
