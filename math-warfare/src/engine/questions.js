// Pure question generator. No DOM, no side effects.
// Answers are ALWAYS exact: every operand is rounded with round1() BEFORE any
// arithmetic, and division builds the dividend from answer × divisor so there
// are never remainders or repeating decimals.

export const MODES = Object.freeze({
  basic: Object.freeze({ label: 'BASIC', time: 10, bossTime: 15 }),
  pro: Object.freeze({ label: 'PRO', time: 10, bossTime: 15 }),
  god: Object.freeze({ label: 'GOD', time: 5, bossTime: 10 }),
});

export const OPERATIONS = Object.freeze([
  Object.freeze({ id: '+', glyph: '+', label: 'ADD' }),
  Object.freeze({ id: '-', glyph: '-', label: 'SUB' }),
  Object.freeze({ id: '*', glyph: '×', label: 'MUL' }),
  Object.freeze({ id: '/', glyph: '÷', label: 'DIV' }),
]);

export function settingsFor(mode) {
  return MODES[mode] || MODES.basic;
}

// One-decimal rounding — applied to operands AND answers, never raw floats.
export const round1 = (x) => Math.round(x * 10) / 10;

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Float with at most one decimal inside [min, max] (bounds given in tenths).
function randFloat(min, max) {
  return round1(randInt(min * 10, max * 10) / 10);
}

const ADD_SUB_RANGES = {
  basic: { min: 1, max: 50 },
  pro: { min: -50, max: 50 },
  god: { min: -1000, max: 1000 },
};

const BOSS_ADD_SUB_RANGES = {
  basic: { min: 1, max: 100 },
  pro: { min: -150, max: 150 },
  god: { min: -2000, max: 2000 },
};

// Parenthesise negatives so "5 - -3" never appears.
const show = (n) => (n < 0 ? `(${n})` : `${n}`);

function genAddSub(op, mode, boss) {
  const r = boss ? BOSS_ADD_SUB_RANGES[mode] : ADD_SUB_RANGES[mode];
  let a;
  let b;
  if (mode === 'basic') {
    a = randInt(r.min, r.max);
    b = randInt(r.min, r.max);
  } else {
    a = randFloat(r.min, r.max);
    b = randFloat(r.min, r.max);
  }
  const answer = round1(op === '+' ? a + b : a - b);
  const glyph = op === '+' ? '+' : '-';
  return { text: `${a} ${glyph} ${show(b)}`, answer };
}

function genMul(mode, boss) {
  let a;
  let b;
  if (boss) {
    if (mode === 'god') {
      a = Math.random() < 0.3 ? round1(Math.random() * 149 + 1) : randInt(2, 150);
      b = Math.random() < 0.3 ? round1(Math.random() * 149 + 1) : randInt(2, 150);
    } else {
      a = randInt(2, 20);
      b = randInt(2, 20);
    }
  } else if (mode === 'basic' || mode === 'pro') {
    a = randInt(1, 12);
    b = randInt(1, 12);
  } else {
    // GOD: up to 100, sometimes one decimal, always round1()ed.
    a = Math.random() < 0.35 ? round1(Math.random() * 99 + 1) : randInt(1, 100);
    b = Math.random() < 0.35 ? round1(Math.random() * 99 + 1) : randInt(1, 100);
  }
  const answer = round1(a * b);
  return { text: `${show(a)} × ${show(b)}`, answer };
}

function genDiv(mode, boss) {
  let ans;
  let n2;
  if (mode === 'basic') {
    ans = randInt(1, boss ? 20 : 12);
    n2 = randInt(1, boss ? 12 : 10);
  } else {
    ans = round1(Math.random() * (boss ? 19 : 10) + 1);
    // Exactness: n1 = round1(ans × n2) must equal ans × n2.
    // If ans is an integer, any one-decimal n2 keeps the product exact.
    // If ans has one decimal, an integer n2 keeps the product exact.
    n2 = Number.isInteger(ans) ? round1(Math.random() * (boss ? 14 : 10) + 1) : randInt(1, boss ? 15 : 10);
  }
  const n1 = round1(ans * n2);
  return { text: `${n1} ÷ ${n2}`, answer: ans };
}

export function generateQuestion(mode, ops, { boss = false } = {}) {
  const safeMode = settingsFor(mode).label ? mode : 'basic';
  const safeOps = Array.isArray(ops) && ops.length ? ops : ['+'];
  const op = pick(safeOps);
  let q;
  if (op === '+' || op === '-') {
    q = genAddSub(op, safeMode, boss);
  } else if (op === '*') {
    q = genMul(safeMode, boss);
  } else {
    q = genDiv(safeMode, boss);
  }
  return { text: q.text, answer: q.answer, op, mode: safeMode, boss };
}
