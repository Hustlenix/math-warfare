// Leaderboards: local (localStorage) + a mock remote API.
//
// RemoteLeaderboard schema — swap in a real API by implementing the same
// two methods (they are already async and Promise-based):
//
//   getScores(limit) -> Promise<{ name: string, xp: number }[]>   sorted desc
//   submitScore({ name, xp }) -> Promise<{ rank: number }>
//
// The mock simulates ~300ms latency and seeds a few clearly-fake "global"
// entries so the UI always has something to show.

const LB_KEY = 'warfare_lb'; // { name: xp } — leaderboard standings
const PX_KEY = 'warfare_xp'; // { name: xp } — per-player XP totals
const PB_KEY = 'warfare_pb'; // { name: xp } — best single-battle XP
const LAST_KEY = 'warfare_last'; // { name: xp } — last battle's XP

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — session-only leaderboard */
  }
}

export function getPlayerXp(name) {
  return read(PX_KEY, {})[name] || 0;
}

export function getBestBattle(name) {
  return read(PB_KEY, {})[name] || 0;
}

export function getLastBattle(name) {
  return read(LAST_KEY, {})[name] || 0;
}

// Called when a battle ends: adds earned XP to the player total, updates the
// leaderboard standings, and records the personal best / last battle XP.
export function addBattleResult(name, xpEarned) {
  const totals = read(PX_KEY, {});
  totals[name] = (totals[name] || 0) + xpEarned;
  write(PX_KEY, totals);
  const lb = read(LB_KEY, {});
  lb[name] = totals[name];
  write(LB_KEY, lb);
  const pbs = read(PB_KEY, {});
  if (xpEarned > (pbs[name] || 0)) {
    pbs[name] = xpEarned;
    write(PB_KEY, pbs);
  }
  const lasts = read(LAST_KEY, {});
  lasts[name] = xpEarned;
  write(LAST_KEY, lasts);
  return totals[name];
}

export function getTopLocal(limit = 5) {
  return Object.entries(read(LB_KEY, {}))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, xp]) => ({ name, xp }));
}

// ---- mock remote leaderboard ----

const REMOTE_KEY = 'warfare_remote_sim';
const SEED = [
  { name: 'PIZZA_PRO', xp: 4520 },
  { name: 'MAX_EVIL', xp: 3810 },
  { name: 'BRO_MATH', xp: 2975 },
  { name: 'KAIZEN_99', xp: 2240 },
  { name: 'RATIO_KING', xp: 1690 },
];

export class RemoteLeaderboard {
  constructor({ latencyMs = 300 } = {}) {
    this.latencyMs = latencyMs;
    this.scores = read(REMOTE_KEY, null) || [...SEED];
    write(REMOTE_KEY, this.scores);
  }

  wait() {
    return new Promise((resolve) => setTimeout(resolve, this.latencyMs));
  }

  async getScores(limit = 5) {
    await this.wait();
    return [...this.scores].sort((a, b) => b.xp - a.xp).slice(0, limit);
  }

  async submitScore(entry) {
    await this.wait();
    this.scores.push({ ...entry });
    write(REMOTE_KEY, this.scores);
    const sorted = [...this.scores].sort((a, b) => b.xp - a.xp);
    const rank = sorted.findIndex((s) => s.name === entry.name && s.xp === entry.xp) + 1;
    return { rank };
  }
}

export const remoteLeaderboard = new RemoteLeaderboard();
