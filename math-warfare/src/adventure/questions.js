const pick = (xs, r) => xs[Math.floor(r() * xs.length)];
const int = (lo, hi, r) => lo + Math.floor(r() * (hi - lo + 1));
const fmt = (n) => Number(n.toFixed(2)).toString();
export function seeded(seed) {
  let n = seed >>> 0;
  return () => {
    n = (n + 0x6d2b79f5) | 0;
    let t = Math.imul(n ^ (n >>> 15), 1 | n);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function question(skill = "mixed", level = 1, r = Math.random) {
  if (skill === "mixed")
    skill = pick(
      [
        "add",
        "multiply",
        "divide",
        "decimal",
        "percent",
        "order",
        "fraction",
        "word",
      ],
      r,
    );
  const cap = [20, 60, 150][level - 1] ?? 20;
  let a = int(3, cap, r),
    b = int(2, Math.max(4, Math.round(cap / 2)), r),
    text,
    answer,
    hint;
  switch (skill) {
    case "add": {
      const sub = r() < 0.4;
      if (sub && b > a) [a, b] = [b, a];
      text = `${a} ${sub ? "−" : "+"} ${b}`;
      answer = sub ? a - b : a + b;
      hint = sub
        ? `Subtract ${Math.floor(b / 10) * 10} first, then ${b % 10}.`
        : `Add ${Math.floor(b / 10) * 10} first, then ${b % 10}.`;
      break;
    }
    case "multiply":
      a = int(2, level === 1 ? 10 : level === 2 ? 12 : 20, r);
      b = int(2, level === 3 ? 15 : 10, r);
      text = `${a} × ${b}`;
      answer = a * b;
      hint = `${a} × ${b} = ${a} × ${Math.floor(b / 2)} + ${a} × ${b - Math.floor(b / 2)}.`;
      break;
    case "divide":
      b = int(2, 12, r);
      answer = int(2, level === 3 ? 20 : 12, r);
      a = b * answer;
      text = `${a} ÷ ${b}`;
      hint = `What number multiplied by ${b} makes ${a}?`;
      break;
    case "decimal": {
      a = int(10, cap * 10, r);
      b = int(1, cap * 5, r);
      text = `${fmt(a / 10)} + ${fmt(b / 10)}`;
      answer = (a + b) / 10;
      hint = `Count tenths: ${a} + ${b} tenths. Divide the total by 10.`;
      break;
    }
    case "percent": {
      a = pick(level === 1 ? [10, 50] : [5, 10, 20, 25, 50, 75], r);
      b = int(2, level === 3 ? 40 : 15, r) * 20;
      text = `${a}% of ${b}`;
      answer = (a * b) / 100;
      hint = `${a}% of ${b} = (${a} × ${b}) ÷ 100.`;
      break;
    }
    case "order":
      a = int(2, 20, r);
      b = int(2, 12, r);
      {
        const c = int(2, 9, r);
        text = `${a} + ${b} × ${c}`;
        answer = a + b * c;
        hint = `Multiply ${b} × ${c} first. Then add ${a}.`;
        break;
      }
    case "fraction": {
      b = pick([3, 4, 5, 8], r);
      a = int(1, b - 1, r);
      const total = b * int(2, 15, r);
      text = `${a}/${b} of ${total}`;
      answer = (total / b) * a;
      hint = `Divide ${total} by ${b}, then multiply by ${a}.`;
      break;
    }
    case "word":
      a = int(3, level === 3 ? 18 : 9, r);
      b = int(2, 9, r);
      if (r() < 0.5) {
        text = `${a} baskets hold ${b} apples each. How many apples?`;
        answer = a * b;
        hint = `Equal groups: ${a} × ${b}.`;
      } else {
        const total = a * b;
        text = `Share ${total} litres equally among ${b} campers. Litres each?`;
        answer = a;
        hint = `Equal sharing: ${total} ÷ ${b}.`;
      }
      break;
    default:
      throw new Error("Unknown skill: " + skill);
  }
  return { text, answer, hint, skill };
}
export function parseAnswer(input) {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(String(input).trim())) return null;
  const n = Number(input);
  return Number.isFinite(n) ? n : null;
}
export function matches(input, answer) {
  const n = parseAnswer(input);
  return n !== null && Math.abs(n - answer) < 1e-8;
}
