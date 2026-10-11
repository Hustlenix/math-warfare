import test from 'node:test';
import assert from 'node:assert/strict';
import { generateQuestion } from '../src/engine/questions.js';
import { parseAnswer, createSession, recordAnswer, summarize } from '../src/engine/session.js';
import { read, write, addXp, recentRuns } from '../src/engine/storage.js';

for (const mode of ['basic', 'pro', 'god']) for (const op of ['+', '-', '*', '/']) {
  test(`${mode} ${op}: 500 equations have exact answers, including bosses`, () => {
    for (let i = 0; i < 500; i++) {
      const q = generateQuestion(mode, [op], { boss: i % 10 === 0 });
      const actual = op === '+' ? q.a + q.b : op === '-' ? q.a - q.b : op === '*' ? q.a * q.b : q.a / q.b;
      assert.ok(Math.abs(actual - q.answer) < 0.000001, `${q.text} expected ${actual}, got ${q.answer}`);
      assert.ok(Number.isFinite(q.answer));
      assert.equal(q.op, op);
      if (mode === 'basic') assert.ok(Number.isInteger(q.answer));
    }
  });
}
test('unknown mode and operations fall back safely', () => {
  const q = generateQuestion('invalid', ['%', '']);
  assert.equal(q.mode, 'basic'); assert.equal(q.op, '+');
});
test('decimal products are not silently rounded to one decimal', () => {
  const original = Math.random;
  try { Math.random = () => .13; const q = generateQuestion('god', ['*']); assert.equal(q.answer, Math.round(q.a * q.b * 100) / 100); assert.notEqual(q.answer, Math.round(q.answer * 10) / 10); }
  finally { Math.random = original; }
});
test('answer parsing rejects partial numbers and accepts negatives, zero and decimals', () => {
  for (const input of ['', ' ', '12junk', '1e2', 'Infinity', '3/4', '.', '--2']) assert.equal(parseAnswer(input), null);
  for (const [input, value] of [['0', 0], [' -4 ', -4], ['−4', -4], ['.5', .5], ['12.34', 12.34]]) assert.equal(parseAnswer(input), value);
});
test('scoring counts misses, resets combo and measures only answered questions', () => {
  const s = createSession({ format: 'run' }); const q = { answer: 12, boss: false };
  recordAnswer(s, q, 12, 2); recordAnswer(s, q, 12, 4); recordAnswer(s, q, 12, 3);
  assert.equal(s.points, 40); assert.equal(s.streak, 3);
  recordAnswer(s, q, null, 15, 'timeout'); recordAnswer(s, q, 1, 5);
  assert.equal(s.streak, 0); assert.equal(s.bestStreak, 3);
  assert.deepEqual(summarize(s), { attempted: 5, correct: 3, accuracy: 60, average: 3.5 });
});
test('boss reward is triple and unfinished sessions have safe stats', () => {
  const s = createSession({ format: 'sprint' }); assert.equal(s.remaining, 60);
  assert.deepEqual(summarize(s), { attempted: 0, correct: 0, accuracy: 0, average: null });
  recordAnswer(s, { answer: 0, boss: true }, 0, 1); assert.equal(s.points, 30);
});
test('storage falls back to session memory and unusual callsigns do not alter prototypes', () => {
  globalThis.localStorage = { getItem() { throw Error('disabled'); }, setItem() { throw Error('disabled'); } };
  assert.equal(write('sample', { works: true }), false); assert.deepEqual(read('sample', null), { works: true });
  assert.equal(addXp('__proto__', 10), 10);
  write('warfare_arcade_runs', { broken: true }); assert.deepEqual(recentRuns(), []);
});
