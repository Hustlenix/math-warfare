import { matches, parseAnswer, question, seeded } from "./questions.js";
import { questQuestion } from "./quest-tasks.js";

export function createBattle(options, level, started = Date.now(), random = Math.random) {
  const rng =
    options.mode === "daily"
      ? seeded(
          Number(new Date(started).toISOString().slice(0, 10).replaceAll("-", "")),
        )
      : random;

  return {
    ...options,
    rng,
    index: options.progress ?? 0,
    correct: options.progress ?? 0,
    attempts: 0,
    streak: 0,
    bestStreak: 0,
    score: 0,
    hearts: 3,
    started,
    pauseMs: 0,
    pausedAt: 0,
    seconds: 0,
    assists: 0,
    results: [],
    q: options.mode === "quest" ? questQuestion(options.quest.id, options.progress ?? 0, level, rng) : options.review?.[0] ?? question(options.skill, level, rng),
    feedback: false,
  };
}

export function elapsedBattle(battle, now = Date.now()) {
  const pausedFor = battle.pausedAt ? now - battle.pausedAt : 0;
  return (now - battle.started - battle.pauseMs - pausedFor) / 1000;
}

export function answerBattle(battle, input) {
  if (parseAnswer(input) === null)
    return { status: "invalid", message: "Use a number, like 12 or 2.5." };

  battle.attempts++;
  const correct = matches(input, battle.q.answer);
  battle.results.push({
    text: battle.q.text,
    answer: battle.q.answer,
    input,
    correct,
  });

  if (correct) {
    battle.correct++;
    battle.streak++;
    battle.bestStreak = Math.max(battle.bestStreak, battle.streak);
    battle.score += 10 + Math.min(5, battle.streak - 1) * 2;
  } else {
    battle.streak = 0;
    battle.hearts = Math.max(0, battle.hearts - 1);
  }

  battle.feedback = true;
  battle.lastCorrect = correct;
  return {
    status: correct ? "correct" : "incorrect",
    correct,
    message: correct && battle.q.success ? battle.q.success : correct
      ? battle.streak >= 3
        ? `${battle.streak} correct in a row.`
        : "Correct."
      : `Not quite. ${battle.q.text} = ${battle.q.answer}.`,
  };
}

export function advanceBattle(battle, level) {
  let resetHearts = false;
  if (battle.mode === "quest" && !battle.lastCorrect) {
    if (!battle.hearts) {
      battle.hearts = 3;
      resetHearts = true;
    }
  } else {
    battle.index++;
  }

  const removedMistake =
    battle.mode === "review" && battle.lastCorrect ? battle.q.text : null;
  if (battle.mode !== "sprint" && battle.index >= battle.count)
    return { finished: true, resetHearts, removedMistake };

  battle.q = battle.mode === "quest" ? questQuestion(battle.quest.id, battle.index, level, battle.rng) : battle.review?.[battle.index] ?? question(battle.skill, level, battle.rng);
  battle.feedback = false;
  return { finished: false, resetHearts, removedMistake };
}
