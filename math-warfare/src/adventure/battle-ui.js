import { icon } from "./icons.js";
import { portraitStyle } from "./wardrobe.js";
import { SKILLS } from "./content.js";
import { escapeHtml } from "./html.js";
import { questSceneMarkup } from "./quest-ui.js";

const KEYPAD_KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "−", "0", "."];

export function battleMarkup(battle, art, appearance) {
  const title =
    battle.quest?.title ??
    (battle.mode === "daily"
      ? "DAILY EXPEDITION"
      : battle.mode === "review"
        ? "LEARNING NOTES"
        : "PRACTICE ARENA");
  const monster =
    battle.quest?.boss
      ? "boss"
      : battle.skill === "percent"
        ? "owl"
        : battle.skill === "fraction"
          ? "beetle"
          : "slime";
  const step =
    battle.mode === "sprint"
      ? "60 SECOND SPRINT"
      : `${battle.index + 1} / ${battle.count}`;
  const hearts = "♥".repeat(battle.hearts) + "♡".repeat(3 - battle.hearts);

  return `<div class="battle-header"><span class="eyebrow">${escapeHtml(title)}</span><button class="close-panel" aria-label="Pause challenge">${icon("pause")}</button></div>
  <div class="battle-stage ${battle.quest ? "quest-task-stage" : ""} ${battle.quest?.boss ? "boss-stage" : ""}">
    <div class="battle-land"><span class="battle-hero hero-face" role="img" aria-label="Your adventurer" style="${portraitStyle(art, appearance.id, 3)}"></span><div class="battle-beam"></div><img class="battle-monster" src="${art[monster].src}" alt="${battle.quest?.boss ? "The Fungus King" : "Practice creature"}"></div>
    <div class="battle-status"><span id="hearts">${hearts}</span><span id="clock">${battle.mode === "sprint" ? "60s" : "0s"}</span><span id="score">${battle.score} points</span></div>
  </div>
  <div class="battle-body">
    ${battle.mode === "quest" ? questSceneMarkup(battle.q) : ""}
    <div class="question-top"><span>${SKILLS[battle.q.skill] ?? "Revision"}</span><span id="step">${step}</span></div>
    <h2 id="equation" class="${battle.q.scene ? "context-question" : ""}">${escapeHtml(battle.q.text)}</h2>
    <p class="answer-prompt">Type your answer, then press Enter.</p>
    <form id="answer-form" novalidate><label class="sr-only" for="answer">Your answer</label><input id="answer" inputmode="decimal" autocomplete="off" placeholder="?" maxlength="16"><button class="primary" type="submit">Answer</button></form>
    <div id="answer-feedback" role="status" aria-live="polite"></div>
    <div id="answer-keypad" class="keypad" aria-label="Answer keypad" ${battle.keypadOpen ? "" : "hidden"}>${KEYPAD_KEYS.map((key) => `<button type="button" data-key="${key === "−" ? "-" : key}">${key}</button>`).join("")}<button type="button" id="erase">⌫</button><button type="button" id="clear-answer">Clear</button></div>
    <div class="battle-footer"><button id="hint">Show a method</button><button id="keypad-toggle" aria-controls="answer-keypad" aria-expanded="${battle.keypadOpen}">Keypad</button><span id="streak">${battle.streak ? `${battle.streak} in a row` : "Streak: 0"}</span></div>
    <div id="method" hidden></div><button id="next-question" class="primary full" hidden>Next question</button>
  </div>`;
}

export function bindBattleControls(content, battle, { onSubmit, onAdvance }) {
  content.querySelector("#answer-form").onsubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };
  content.querySelectorAll("[data-key]").forEach((button) => {
    button.onclick = () => {
      if (battle.feedback) return;
      const answer = content.querySelector("#answer");
      if (answer.value.length < 16) answer.value += button.dataset.key;
      answer.focus();
    };
  });
  content.querySelector("#erase").onclick = () => {
    const answer = content.querySelector("#answer");
    answer.value = answer.value.slice(0, -1);
    answer.focus();
  };
  content.querySelector("#clear-answer").onclick = () => {
    const answer = content.querySelector("#answer");
    answer.value = "";
    answer.focus();
  };
  content.querySelector("#hint").onclick = () => {
    const method = content.querySelector("#method");
    if (method.hidden) {
      method.hidden = false;
      method.textContent = battle.q.hint;
      battle.assists++;
    }
  };
  content.querySelector("#next-question").onclick = onAdvance;
  content.querySelector("#keypad-toggle").onclick = (event) => {
    battle.keypadOpen = !battle.keypadOpen;
    content.querySelector("#answer-keypad").hidden = !battle.keypadOpen;
    event.currentTarget.setAttribute("aria-expanded", String(battle.keypadOpen));
  };
  content.querySelector("#answer").focus();
}
