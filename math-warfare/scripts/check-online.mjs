import test from "node:test";
import assert from "node:assert/strict";
import {
  Race,
  profile,
  roomCode,
  validCode,
} from "../src/adventure/online-model.js";
const q = () => ({
  text: "8 × 7",
  answer: 56,
  hint: "Try seven groups of eight.",
});
test("Room codes and guest profiles have bounded safe values", () => {
  for (let i = 0; i < 100; i++) assert.ok(validCode(roomCode()));
  assert.equal(validCode("bad-code"), false);
  const p = profile({
    name: "<script>\u0000",
    avatar: "invalid",
    x: Infinity,
    y: -50,
    zone: "invalid",
    dir: 99,
  });
  assert.equal(p.name, "script");
  assert.equal(p.x, 16.5);
  assert.equal(p.y, 2);
  assert.equal(p.zone, "village");
  assert.equal(p.dir, 3);
  assert.ok(p.avatar.startsWith("hero-"));
  assert.doesNotThrow(() => profile(null));
});
test("The host keeps answers private and awards correct answers only once", () => {
  const r = new Race(["host", "guest"], "multiply", 1, 0, q);
  assert.equal(r.answer("host", 0, "56", 2000).ok, false);
  r.advance(3000);
  assert.equal(r.snapshot(3000).solution, null);
  assert.equal(JSON.stringify(r.snapshot()).includes("56"), false);
  assert.equal(r.answer("intruder", 1, "56", 3100).ok, false);
  assert.equal(r.answer("host", 1, "56", 3100).earned, 13);
  assert.equal(r.answer("host", 1, "56", 3500).ok, false);
  assert.equal(r.scores.host, 13);
  assert.equal(r.answer("guest", 0, "56", 3500).ok, false);
  assert.equal(r.answer("guest", 1, "56", 3500).ok, true);
  r.advance(3500);
  assert.equal(r.phase, "between");
  assert.equal(r.snapshot().solution, 56);
});
test("Retries, malformed answers and deadlines cannot manufacture points", () => {
  const r = new Race(["h", "g"], "multiply", 1, 0, q);
  r.advance(3000);
  assert.equal(r.answer("h", 1, "56abc", 3100).ok, false);
  assert.equal(r.attempts.h, undefined);
  r.answer("h", 1, "0", 3100);
  r.answer("h", 1, "0", 3101);
  assert.equal(r.attempts.h, 1);
  r.answer("h", 1, "0", 3500);
  r.answer("h", 1, "0", 3900);
  assert.equal(r.answer("h", 1, "56", 4400).ok, false);
  assert.equal(r.answer("g", 1, "56", 21000).ok, false);
  assert.deepEqual(r.scores, { h: 0, g: 0 });
});
test("Five shared rounds end; disconnects and rematches reset room competition", () => {
  const r = new Race(["h", "g"], "multiply", 1, 0, q);
  let now = 3000;
  for (let i = 0; i < 5; i++) {
    r.advance(now);
    assert.equal(r.phase, "question");
    r.answer("h", r.round, "56", now + 500);
    r.answer("g", r.round, "56", now + 800);
    r.advance(now + 800);
    assert.equal(r.phase, "between");
    now += 3600;
  }
  r.advance(now);
  assert.equal(r.phase, "results");
  assert.equal(r.round, 5);
  assert.deepEqual(r.scores, { h: 65, g: 65 });
  const next = new Race(["h", "g"], "add", 2, now, q);
  assert.deepEqual(next.scores, { h: 0, g: 0 });
  next.remove("g");
  assert.equal(next.phase, "results");
  assert.deepEqual(next.ids, ["h"]);
});
