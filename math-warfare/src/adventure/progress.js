import { QUESTS, SHOP } from "./content.js";
export const SAVE_KEY = "math-warfare-adventure-v1";
export const fresh = () => ({
  version: 1,
  coins: 0,
  xp: 0,
  completed: [],
  upgrades: [],
  companion: "none",
  level: 1,
  records: [],
  mistakes: [],
  dailyDone: null,
  zone: "village",
  player: { x: 16.5, y: 14.5 },
  muted: false,
  reducedMotion: false,
});
const unique = (xs, allowed) => [
  ...new Set(Array.isArray(xs) ? xs.filter((x) => allowed.includes(x)) : []),
];
export function restore(raw) {
  const s = fresh();
  if (!raw || raw.version !== 1) return s;
  s.completed = unique(
    raw.completed,
    QUESTS.map((q) => q.id),
  );
  s.upgrades = unique(
    raw.upgrades,
    SHOP.map((q) => q.id),
  );
  s.coins = Math.max(
    0,
    Math.min(1e6, Number.isFinite(raw.coins) ? Math.floor(raw.coins) : 0),
  );
  s.xp = Math.max(
    0,
    Math.min(1e8, Number.isFinite(raw.xp) ? Math.floor(raw.xp) : 0),
  );
  s.level = [1, 2, 3].includes(raw.level) ? raw.level : 1;
  s.companion = ["none", "cat", "frog"].includes(raw.companion)
    ? raw.companion
    : "none";
  if (
    (s.companion === "cat" && !s.completed.includes("bakery")) ||
    (s.companion === "frog" && !s.completed.includes("garden"))
  )
    s.companion = "none";
  s.muted = raw.muted === true;
  s.reducedMotion = raw.reducedMotion === true;
  s.dailyDone =
    typeof raw.dailyDone === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(raw.dailyDone)
      ? raw.dailyDone
      : null;
  s.records = Array.isArray(raw.records)
    ? raw.records
        .filter(
          (r) =>
            r &&
            Number.isFinite(r.correct) &&
            Number.isFinite(r.total) &&
            Number.isFinite(r.seconds) &&
            typeof r.mode === "string",
        )
        .slice(-30)
    : [];
  s.mistakes = Array.isArray(raw.mistakes)
    ? raw.mistakes
        .filter(
          (m) =>
            m &&
            typeof m.text === "string" &&
            Number.isFinite(m.answer) &&
            typeof m.hint === "string",
        )
        .slice(-24)
    : [];
  s.zone =
    raw.zone === "cave" && s.completed.includes("library") ? "cave" : "village";
  if (
    raw.player &&
    Number.isFinite(raw.player.x) &&
    Number.isFinite(raw.player.y) &&
    raw.player.x > 1 &&
    raw.player.x < 32 &&
    raw.player.y > 2 &&
    raw.player.y < 23
  )
    s.player = { x: raw.player.x, y: raw.player.y };
  return s;
}
export function available(state, id) {
  const q = QUESTS.find((q) => q.id === id);
  return !!q && q.requires.every((r) => state.completed.includes(r));
}
export function finishQuest(state, id) {
  const q = QUESTS.find((q) => q.id === id);
  if (!q || state.completed.includes(id) || !available(state, id)) return false;
  state.completed.push(id);
  state.coins += q.reward;
  state.xp += q.count * 10;
  if (id === "bakery") state.companion = "cat";
  if (id === "garden" && state.companion === "none") state.companion = "frog";
  return true;
}
export function purchase(state, id) {
  const item = SHOP.find((i) => i.id === id);
  if (!item || state.upgrades.includes(id) || state.coins < item.price)
    return false;
  state.coins -= item.price;
  state.upgrades.push(id);
  return true;
}
export function load(storage) {
  try {
    return restore(JSON.parse(storage.getItem(SAVE_KEY)));
  } catch {
    return fresh();
  }
}
export function save(storage, state) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
export function nextQuest(state) {
  return QUESTS.find(
    (q) => !state.completed.includes(q.id) && available(state, q.id),
  );
}
