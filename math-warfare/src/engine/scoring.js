// Pure scoring: streak -> multiplier -> XP, plus ranks/shields/boosts/bosses.
// No DOM, no side effects.

export const BASE_XP = 10;
export const BOSS_XP_MULT = 5; // boss questions pay 5x
export const BOOST_XP_MULT = 2; // "2x POINTS" boost die face pays 2x
export const REVENGE_XP_MULT = 0.5; // redeemed answers pay half

export const BOSS_EVERY = 10; // question N is a boss when N % 10 === 0
export const BOOST_EVERY = 5; // boost die rolls after every 5th correct answer
export const SHIELD_EVERY = 15; // streak shield granted every 15th streak
export const MAX_SHIELDS = 2;

// multiplier = floor(streak/3) + 1  ->  x1, x2, x3, ...
export function multiplierFor(streak) {
  return Math.floor(streak / 3) + 1;
}

// Base XP with optional multipliers, applied multiplicatively, floored at the
// end: boss x5, boost x2, revenge x0.5.
export function xpForCorrect(streak, { boss = false, boost = false, revenge = false } = {}) {
  let xp = BASE_XP * multiplierFor(streak);
  if (boss) xp *= BOSS_XP_MULT;
  if (boost) xp *= BOOST_XP_MULT;
  if (revenge) xp *= REVENGE_XP_MULT;
  return Math.floor(xp);
}

// True when the multiplier just went up (streak hits 3, 6, 9 ...).
export function isComboUp(streak) {
  return streak > 0 && streak % 3 === 0;
}

// Meme drop every 5th streak.
export function isMemeStreak(streak) {
  return streak % 5 === 0;
}

export function isBossQuestion(n) {
  return n > 0 && n % BOSS_EVERY === 0;
}

export function isBoostDrop(streak) {
  return streak > 0 && streak % BOOST_EVERY === 0;
}

export function isShieldEarn(streak) {
  return streak > 0 && streak % SHIELD_EVERY === 0;
}

// ---- ranks (persistent ladder keyed on total XP) ----

export const RANKS = Object.freeze([
  Object.freeze({ min: 0, name: 'PAPER TIGER' }),
  Object.freeze({ min: 100, name: 'PENCIL PUSHER' }),
  Object.freeze({ min: 300, name: 'NUMBER CRUNCHER' }),
  Object.freeze({ min: 600, name: 'CALCULUS COMMANDER' }),
  Object.freeze({ min: 1000, name: 'MATH MARAUDER' }),
  Object.freeze({ min: 1500, name: 'FRACTION WRAITH' }),
  Object.freeze({ min: 2200, name: 'ALGEBRA ASSASSIN' }),
  Object.freeze({ min: 3000, name: 'OMEGA OVERLORD' }),
]);

export function rankFor(xp) {
  let rank = RANKS[0];
  let index = 0;
  RANKS.forEach((r, i) => {
    if (xp >= r.min) {
      rank = r;
      index = i;
    }
  });
  return { ...rank, index };
}

// Answer checking: |input - correct| < 0.01 tolerance.
// Empty/NaN inputs are handled by the caller (ignored before judging).
export function isAnswerCorrect(input, correct) {
  if (typeof input !== 'number' || Number.isNaN(input)) return false;
  return Math.abs(input - correct) < 0.01;
}
