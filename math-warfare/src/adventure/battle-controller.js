import { createBattle, answerBattle, advanceBattle, elapsedBattle } from "./battle-session.js";
import { battleMarkup, bindBattleControls } from "./battle-ui.js";
import { questProgress } from "./quest-tasks.js";
import { questCompletionMarkup, resolveQuestScene } from "./quest-ui.js";
import { finishQuest, nextQuest } from "./progress.js";
import { escapeHtml as esc } from "./html.js";
const $ = (id) => document.getElementById(id);

export function setupBattleController({ state, art, content, open, close, bindClose, modalHead, refresh, persist, toast, chime, notes }) {
let battle = null, interval = null;
function start(options) {
  clearInterval(interval);
  battle = createBattle({ ...options, progress: options.mode === "quest" ? questProgress(state, options.quest.id) : 0 }, state.level);
  renderBattle();
  interval = setInterval(tick, 100);
}
function tick() {
  if (!battle || battle.pausedAt) return;
  battle.seconds = elapsedBattle(battle);
  if (battle.mode === "sprint") {
    const remaining = Math.max(0, 60 - battle.seconds);
    if ($("clock")) $("clock").textContent = `${Math.ceil(remaining)}s`;
    if (remaining <= 0) finish();
  } else if ($("clock"))
    $("clock").textContent = `${Math.floor(battle.seconds)}s`;
}
function renderBattle() {
  const b = battle;
  b.keypadOpen ??= matchMedia("(pointer: coarse)").matches || innerWidth <= 700;
  open(battleMarkup(b, art, state.appearance));
  bindClose();
  bindBattleControls(content, b, { onSubmit: submit, onAdvance: advance });
  tick();
}
function submit() {
  const b = battle;
  if (!b || b.feedback || b.pausedAt) return;
  if (b.mode === "sprint" && elapsedBattle(b) >= 60) {
    finish();
    return;
  }
  const result = answerBattle(b, $("answer").value);
  if (result.status === "invalid") {
    $("answer-feedback").textContent = result.message;
    return;
  }
  if (result.correct) {
    chime();
    if (b.mode === "quest") {
      resolveQuestScene(content, b.q);
      state.questResults[b.quest.id] = b.q.answer;
      persist();
    }
    $("answer-feedback").textContent = b.mode === "quest" ? "Task checked. Save it to continue." : result.message;
    $("answer-feedback").className = "correct";
    if (b.mode !== "quest") content.querySelector(".battle-stage").classList.add("hit");
  } else {
    chime(false);
    $("answer-feedback").textContent = result.message;
    $("answer-feedback").className = "incorrect";
    $("method").hidden = false;
    $("method").textContent = b.q.hint;
    state.mistakes = state.mistakes.filter((m) => m.text !== b.q.text);
    state.mistakes.push({ ...b.q });
    state.mistakes = state.mistakes.slice(-24);
    persist();
  }
  $("answer").disabled = true;
  $("answer-form").querySelector("button").disabled = true;
  $("hearts").textContent = "♥".repeat(b.hearts) + "♡".repeat(3 - b.hearts);
  $("score").textContent = `${b.score} points`;
  $("streak").textContent = `Best streak: ${b.bestStreak}`;
  $("next-question").hidden = false;
  $("next-question").textContent = result.correct
    ? b.mode === "quest" ? (b.index + 1 === b.count ? "Finish this repair" : "Save task & continue") : "Next question"
    : b.mode === "quest"
      ? "Try this task again"
      : "Keep going →";
  $("next-question").focus();
}
function advance() {
  if (!battle) return;
  const b = battle;
  const transition = advanceBattle(b, state.level);
  if (transition.resetHearts)
    toast("Take a breath. Your progress is safe. Keep learning.");
  if (transition.removedMistake)
    state.mistakes = state.mistakes.filter(
      (question) => question.text !== transition.removedMistake,
    );
  if (transition.finished) {
    finish();
    return;
  }
  if (b.mode === "quest") {
    state.questWork[b.quest.id] = b.index;
    refresh();
  }
  renderBattle();
}
function finish() {
  const b = battle;
  if (!b) return;
  clearInterval(interval);
  interval = null;
  b.seconds = elapsedBattle(b);
  let reward = "";
  if (b.mode === "quest" && finishQuest(state, b.quest.id))
    reward = `${b.quest.reward} coins · ${b.quest.count * 10} XP`;
  else {
    state.xp = Math.min(1e8, state.xp + b.correct * 5);
    reward = `${b.correct * 5} practice XP`;
  }
  if (b.mode === "daily") {
    const date = new Date().toISOString().slice(0, 10);
    if (state.dailyDone !== date) {
      state.dailyDone = date;
      state.coins += 20;
      reward += " · 20 daily coins";
    } else reward += " · daily coins already collected";
  }
  state.records.push({
    mode: b.mode,
    correct: b.correct,
    total: b.attempts,
    score: b.score,
    seconds: Math.round(b.seconds),
    skill: b.skill,
    day: new Date().toISOString().slice(0, 10),
  });
  state.records = state.records.slice(-30);
  const accuracy = b.attempts ? Math.round((b.correct / b.attempts) * 100) : 0,
    win = b.mode === "quest",
    final = win && b.quest.id === "king";
  battle = null;
  refresh();
  open(
    modalHead(
      final
        ? "THE LANTERNS ARE RESTORED"
        : win
          ? "QUEST COMPLETE"
          : "EXPEDITION COMPLETE",
      final
        ? "You brought the light home."
        : win
          ? b.quest.title
          : "Practice complete",
    ) +
      (win ? questCompletionMarkup(b.quest, reward, nextQuest(state)) : `<div class="result-stamp">${final ? "✦" : win ? "✓" : "×"}</div><p>${esc(win ? b.quest.done : accuracy >= 80 ? "Session saved. Try another skill or return to the village." : "The questions you missed are in your revision notes.")}</p><div class="result-grid"><div><strong>${accuracy}%</strong><span>accuracy</span></div><div><strong>${Math.round(b.seconds)}s</strong><span>active time</span></div><div><strong>${b.bestStreak}</strong><span>best streak</span></div></div><p class="reward-line">+ ${reward}</p>${b.assists ? `<p class="muted">You used ${b.assists} method hints. </p>` : ""}<div class="button-row"><button id="return-world" class="primary">${final ? "Keep exploring" : "Back to the adventure"} →</button><button id="review-result">Learning notes</button></div>`),
  );
  bindClose();
  $("return-world").onclick = close;
  $("review-result").onclick = notes;
}
function pause() {
  if (!battle || battle.pausedAt) return;
  battle.pausedAt = Date.now();
  clearInterval(interval);
  interval = null;
  battle.savedDOM = document.createDocumentFragment();
  while (content.firstChild) battle.savedDOM.append(content.firstChild);
  open(
    modalHead("", "Paused") +
      '<p>The clock is paused. Your current answer and feedback will be kept.</p><div class="button-row"><button id="resume" class="primary">Resume</button><button id="quit">Return to the adventure</button></div>',
  );
  content.querySelector(".close-panel").onclick = resume;
  $("resume").onclick = resume;
  $("quit").onclick = () => {
    clearInterval(interval);
    interval = null;
    battle = null;
    close();
    refresh();
  };
}
function resume() {
  if (!battle) return;
  battle.pauseMs += Date.now() - battle.pausedAt;
  battle.pausedAt = 0;
  content.replaceChildren(battle.savedDOM);
  battle.savedDOM = null;
  interval = setInterval(tick, 100);
  ($("next-question")?.hidden ? $("answer") : $("next-question"))?.focus();
  tick();
}

return { start, pause, resume, getBattle: () => battle };
}
