import test from "node:test";
import assert from "node:assert/strict";
import { MovementKeys, movementKey } from "../src/adventure/movement-input.js";
import { World } from "../src/adventure/world.js";
import { fresh } from "../src/adventure/progress.js";

test("Caps Lock and shifted WASD work; browser modifier shortcuts stay native", () => {
  for (const key of ["W", "A", "S", "D", "w", "a", "s", "d"])
    assert.equal(movementKey({ key }), key.toLowerCase());
  for (const modifier of ["ctrlKey", "metaKey", "altKey"])
    assert.equal(movementKey({ key: "a", [modifier]: true }), null);
  assert.equal(movementKey({ key: "ArrowLeft" }), "ArrowLeft");
  assert.equal(movementKey({ key: "Enter" }), null);
});

test("releasing one finger or keyboard source preserves other held directions", () => {
  const keys = new MovementKeys();
  keys.press("keyboard:KeyW", "w");
  keys.press("pointer:1", "w");
  keys.press("pointer:2", "w");
  keys.press("pointer:3", "d");
  keys.release("pointer:1");
  keys.release("keyboard:KeyW");
  assert.deepEqual([...keys].sort(), ["d", "w"]);
  keys.release("pointer:2");
  assert.deepEqual([...keys], ["d"]);
  keys.clear(); // Dialog, lost focus, or interrupted touch.
  keys.release("pointer:3");
  keys.press("pointer:4", "a");
  assert.deepEqual([...keys], ["a"]);
});

test("paused frames stay frozen, invalidation redraws once, hidden frames never simulate", () => {
  const originalDocument = globalThis.document;
  const originalRAF = globalThis.requestAnimationFrame;
  let draws = 0, steps = 0, life = 0;
  globalThis.document = { hidden: false };
  globalThis.requestAnimationFrame = () => {};
  const world = {
    paused: true, state: fresh(), last: 0, needsRedraw: true,
    step() { steps++; }, updateLife() { life++; }, draw() { draws++; }, frame() {},
  };
  try {
    for (let i = 1; i <= 1000; i++) World.prototype.frame.call(world, i * 16);
    assert.equal(draws, 1);
    assert.equal(life, 0);
    world.needsRedraw = true;
    World.prototype.frame.call(world, 16016);
    assert.equal(draws, 2);
    world.paused = false;
    globalThis.document.hidden = true;
    const before = steps;
    for (let i = 0; i < 1000; i++) World.prototype.frame.call(world, 17000 + i * 16);
    assert.equal(steps, before);
    assert.equal(draws, 2);
    globalThis.document.hidden = false;
    World.prototype.frame.call(world, 34000);
    assert.equal(draws, 3);
    assert.equal(life, 1);
  } finally {
    globalThis.document = originalDocument;
    globalThis.requestAnimationFrame = originalRAF;
  }
});

test("minimap terrain is reused and a completed cave gate invalidates it", () => {
  const originalDocument = globalThis.document;
  const layers = [];
  globalThis.document = { createElement() {
    const pixels = [];
    const layer = { pixels, getContext: () => ({ fillRect: (...p) => pixels.push(p) }) };
    layers.push(layer);
    return layer;
  } };
  const world = {
    state: { ...fresh(), zone: "cave" },
    canvas: { width: 320, height: 568, getBoundingClientRect: () => ({ height: 568 }) },
    ctx: { drawImage() {}, strokeRect() {}, fillText() {} },
    camera: { x: 0, y: 0 }, npcs: [], rect() {},
  };
  try {
    for (let i = 0; i < 1000; i++) World.prototype.minimap.call(world);
    assert.equal(layers.length, 1);
    assert.ok(layers[0].pixels.some(p => p[0] === 30 && p[1] === 51));
    world.state.completed.push("bridge");
    World.prototype.minimap.call(world);
    assert.equal(layers.length, 2);
    assert.equal(layers[1].pixels.some(p => p[0] === 30 && p[1] === 51), false);
    world.state.zone = "village";
    World.prototype.minimap.call(world);
    assert.equal(layers.length, 3);
  } finally { globalThis.document = originalDocument; }
});

test("camera culling preserves edge pixels and screen-space HUD rectangles", () => {
  const rendered = [];
  const world = {
    camera: { x: 100, y: 200 }, canvas: { width: 320, height: 568 },
    ctx: { fillRect: (...args) => rendered.push(args) }, worldDrawing: true,
    visible: World.prototype.visible,
  };
  World.prototype.rect.call(world, 50, 50, 10, 10, "red");
  assert.equal(rendered.length, 0);
  World.prototype.rect.call(world, 90, 190, 10, 10, "red");
  World.prototype.rect.call(world, 420, 768, 2, 2, "red");
  assert.equal(rendered.length, 2);
  world.worldDrawing = false;
  World.prototype.rect.call(world, 5, 5, 99, 75, "blue");
  assert.equal(rendered.length, 3);
});
