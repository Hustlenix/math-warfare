import { question, matches, parseAnswer } from "./questions.js";
import { SKILLS } from "./content.js";
import { normalizeAppearance } from "./wardrobe.js";

export const PROTOCOL = 1;
export const MAX_PLAYERS = 4;
export const ROUND_MS = 18000;
export const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const validCode = (code) => /^[A-HJ-NP-Z2-9]{8}$/.test(code);
export function roomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return [...bytes]
    .map((n) => ROOM_ALPHABET[n % ROOM_ALPHABET.length])
    .join("");
}
export function profile(input = {}) {
  if (!input || typeof input !== "object") input = {};
  const appearance = normalizeAppearance({
    id: input.avatar,
    name: input.name,
  });
  const n = (v, min, max, fallback) =>
    Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
  return {
    name: appearance.name,
    avatar: appearance.id,
    x: n(input.x, 1, 32, 16.5),
    y: n(input.y, 2, 24, 14.5),
    zone: input.zone === "cave" ? "cave" : "village",
    dir:
      Number.isInteger(input.dir) && input.dir >= 0 && input.dir < 4
        ? input.dir
        : 3,
    moving: input.moving === true,
  };
}

// The host owns answers, deadlines and scores. Clients only submit an answer.
export class Race {
  constructor(
    ids,
    skill = "mixed",
    level = 1,
    now = Date.now(),
    makeQuestion = question,
  ) {
    this.id = `${now}-${Math.random().toString(36).slice(2, 10)}`;
    this.ids = [...new Set(ids)].slice(0, MAX_PLAYERS);
    this.skill = Object.hasOwn(SKILLS, skill) ? skill : "mixed";
    this.level = [1, 2, 3].includes(level) ? level : 1;
    this.makeQuestion = makeQuestion;
    this.scores = Object.fromEntries(this.ids.map((id) => [id, 0]));
    this.phase = "countdown";
    this.round = 0;
    this.deadline = now + 3000;
    this.q = null;
    this.solved = [];
    this.attempts = {};
    this.lastAttempt = {};
  }
  advance(now = Date.now()) {
    if (this.phase === "results" || now < this.deadline) return false;
    if (this.phase === "countdown" || this.phase === "between") {
      if (this.round === 5) {
        this.phase = "results";
        return true;
      }
      this.round++;
      this.q = this.makeQuestion(this.skill, this.level);
      this.solved = [];
      this.attempts = {};
      this.lastAttempt = {};
      this.phase = "question";
      this.deadline = now + ROUND_MS;
    } else {
      this.phase = "between";
      this.deadline = now + 2800;
    }
    return true;
  }
  answer(id, round, raw, now = Date.now()) {
    if (
      this.phase !== "question" ||
      round !== this.round ||
      !this.ids.includes(id) ||
      this.solved.includes(id) ||
      now >= this.deadline
    )
      return { ok: false, text: "This round is closed." };
    if (typeof raw !== "string" || raw.length > 32 || parseAnswer(raw) === null)
      return { ok: false, text: "Enter a number or decimal." };
    if ((this.attempts[id] ?? 0) >= 3)
      return { ok: false, text: "Three tries used. Watch the solution." };
    if (now - (this.lastAttempt[id] ?? -Infinity) < 250)
      return { ok: false, text: "Give your answer a moment." };
    this.attempts[id] = (this.attempts[id] ?? 0) + 1;
    this.lastAttempt[id] = now;
    if (!matches(raw, this.q.answer))
      return {
        ok: false,
        text: `${this.q.hint} · ${3 - this.attempts[id]} tries left.`,
      };
    const earned =
      10 + Math.max(0, Math.ceil(((this.deadline - now) / ROUND_MS) * 3));
    this.scores[id] += earned;
    this.solved.push(id);
    if (this.ids.every((p) => this.solved.includes(p))) this.deadline = now;
    return { ok: true, text: `Correct! +${earned} points.`, earned };
  }
  remove(id) {
    this.ids = this.ids.filter((p) => p !== id);
    delete this.scores[id];
    if (this.ids.length < 2) this.phase = "results";
  }
  snapshot(now = Date.now()) {
    return {
      id: this.id,
      phase: this.phase,
      round: this.round,
      total: 5,
      skill: this.skill,
      level: this.level,
      remaining: Math.max(0, this.deadline - now),
      scores: { ...this.scores },
      participants: [...this.ids],
      solved: [...this.solved],
      question: this.q?.text ?? "",
      solution:
        this.phase === "between" || this.phase === "results"
          ? (this.q?.answer ?? null)
          : null,
    };
  }
}
