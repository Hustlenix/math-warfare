import { test } from "node:test";
import assert from "node:assert/strict";
import {
  advanceBattle,
  answerBattle,
  createBattle,
  elapsedBattle,
} from "../src/adventure/battle-session.js";

test("daily challenges seed their questions from the supplied UTC date", () => {
  const options = { mode: "daily", skill: "mixed", count: 10 };
  const first = createBattle(options, 1, Date.UTC(2026, 9, 14));
  const repeat = createBattle(options, 1, Date.UTC(2026, 9, 14));
  const nextDay = createBattle(options, 1, Date.UTC(2026, 9, 15));
  assert.equal(first.q.text, repeat.q.text);
  assert.notEqual(first.rng(), nextDay.rng());
});

test("answers validate before recording and preserve streak, points and hearts", () => {
  const battle = createBattle({ mode: "practice", skill: "mixed", count: 3 }, 1, 0, () => 0.2);
  battle.q = { text: "6 × 7", answer: 42, hint: "Six groups of seven." };
  assert.equal(answerBattle(battle, "42oops").status, "invalid");
  assert.equal(battle.attempts, 0);

  assert.deepEqual(answerBattle(battle, "42"), {
    status: "correct",
    correct: true,
    message: "Correct.",
  });
  battle.feedback = false;
  answerBattle(battle, "42");
  assert.equal(battle.score, 22);
  assert.equal(battle.bestStreak, 2);

  battle.feedback = false;
  const missed = answerBattle(battle, "41");
  assert.equal(missed.status, "incorrect");
  assert.equal(battle.hearts, 2);
  assert.equal(battle.streak, 0);
  assert.equal(battle.bestStreak, 2);
  assert.equal(battle.attempts, 3);
});

test("quest retries restore hearts without advancing, then correct answers progress", () => {
  const battle = createBattle({ mode: "quest", skill: "add", count: 2 }, 1, 0, () => 0.2);
  battle.q = { text: "1 + 1", answer: 2 };
  battle.lastCorrect = false;
  battle.hearts = 0;
  assert.deepEqual(advanceBattle(battle, 1), {
    finished: false,
    resetHearts: true,
    removedMistake: null,
  });
  assert.equal(battle.index, 0);
  assert.equal(battle.hearts, 3);

  battle.lastCorrect = true;
  assert.equal(advanceBattle(battle, 1).finished, false);
  assert.equal(battle.index, 1);
  battle.lastCorrect = true;
  assert.equal(advanceBattle(battle, 1).finished, true);
});

test("review answers remove solved mistakes and active time excludes a pause", () => {
  const review = [
    { text: "2 + 2", answer: 4 },
    { text: "3 + 3", answer: 6 },
  ];
  const battle = createBattle({ mode: "review", skill: "add", count: 2, review }, 1, 1000);
  assert.equal(battle.q, review[0]);
  battle.lastCorrect = true;
  assert.deepEqual(advanceBattle(battle, 1), {
    finished: false,
    resetHearts: false,
    removedMistake: "2 + 2",
  });
  assert.equal(battle.q, review[1]);
  battle.lastCorrect = true;
  assert.deepEqual(advanceBattle(battle, 1), {
    finished: true,
    resetHearts: false,
    removedMistake: "3 + 3",
  });

  battle.started = 1000;
  battle.pauseMs = 2000;
  battle.pausedAt = 6000;
  assert.equal(elapsedBattle(battle, 10000), 3);
});
