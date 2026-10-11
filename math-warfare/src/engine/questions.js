// Exact arithmetic: all operands are integers or tenths; products keep hundredths.
export const MODES = Object.freeze({
  basic: { label: 'Rookie', time: 15, bossTime: 20 },
  pro: { label: 'Tactician', time: 12, bossTime: 18 },
  god: { label: 'Boss level', time: 10, bossTime: 15 },
});
export const settingsFor = (mode) => MODES[mode] || MODES.basic;
export const round1 = (x) => Math.round(x * 10) / 10;
const round2 = (x) => Math.round(x * 100) / 100;
const integer = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const show = (n) => n < 0 ? `(${n})` : `${n}`;
const glyphs = { '+': '+', '-': '−', '*': '×', '/': '÷' };

export function generateQuestion(mode, ops, { boss = false } = {}) {
  mode = Object.hasOwn(MODES, mode) ? mode : 'basic';
  const allowed = Array.isArray(ops) ? ops.filter(op => Object.hasOwn(glyphs, op)) : [];
  const op = (allowed.length ? allowed : ['+'])[integer(0, Math.max(0, allowed.length - 1))];
  let a, b, answer, hint;
  if (op === '+' || op === '-') {
    const max = mode === 'basic' ? (boss ? 100 : 50) : mode === 'pro' ? 100 : 500;
    a = mode === 'basic' ? integer(1, max) : integer(-max * 10, max * 10) / 10;
    b = mode === 'basic' ? integer(1, max) : integer(-max * 10, max * 10) / 10;
    if (mode === 'basic' && op === '-' && b > a) [a, b] = [b, a];
    answer = round2(op === '+' ? a + b : a - b);
    hint = op === '+' ? 'Add the whole-number parts first, then the decimal parts. Watch the signs.' : `Check with the inverse: ${answer} + ${show(b)} = ${a}.`;
  } else if (op === '*') {
    const max = mode === 'basic' ? (boss ? 15 : 12) : mode === 'pro' ? 20 : 50;
    a = mode === 'god' ? integer(10, max * 10) / 10 : integer(1, max);
    b = mode === 'god' ? integer(10, max * 10) / 10 : integer(1, max);
    answer = round2(a * b);
    hint = Number.isInteger(b) && b >= 10 ? `Split ${b} into 10 + ${b - 10}: ${a} × 10 + ${a} × ${b - 10} = ${answer}.` : 'Multiply without decimal points, then put back the total number of decimal places.';
  } else {
    b = integer(2, mode === 'god' ? 25 : 12);
    answer = mode === 'basic' ? integer(1, boss ? 15 : 12) : integer(1, mode === 'pro' ? 200 : 500) / 10;
    a = round2(answer * b);
    hint = `Think multiplication: ${b} × ${answer} = ${a}.`;
  }
  return { text: `${show(a)} ${glyphs[op]} ${show(b)}`, answer, op, mode, boss, a, b, hint };
}
