import { escapeHtml as esc } from "./html.js";
import { QUEST_EFFECTS } from "./quest-tasks.js";

export function questSceneMarkup(question) {
  const s = question.scene;
  if (!s) return "";
  const groups = Array.from({ length: s.groups }, (_, i) => {
    const count = Array.isArray(s.items) ? s.items[i] : s.items;
    const pictorial = Number.isInteger(count) && (s.operation === "groups" || s.operation === "combine");
    const dots = pictorial ? Array(Math.min(count, 14)).fill('<i aria-hidden="true"></i>').join("") : "";
    let label;
    if (s.operation === "share") label = (s.unit === "cups to share" ? "Pond bed " : "Soup group ") + (i + 1);
    else if (s.operation === "groups") label = (s.unit === "buns" ? "Bread basket " : "Ration bag ") + (i + 1);
    else if (s.operation === "price") label = i === 0 ? "Original price (coins)" : "Discount (%)";
    else if (s.operation === "lock") label = i === 0 ? "Loose turns" : "Paired gears (× 2)";
    else if (s.unit === "metres") label = "Trail section " + (i + 1) + " (m)";
    else label = i === 0 ? "Stock on hand" : s.operation === "missing" ? "Required total" : "Delivered pieces";
    return '<div class="task-group"><span>' + esc(label) + '</span><div class="task-pieces">' + dots + '</div><strong>' + (s.operation === "share" ? "?" : count) + '</strong></div>';
  }).join("");
  return '<section class="task-scene" aria-label="' + esc(s.title) + '"><h3>' + esc(s.title) + '</h3><p>' + esc(s.instruction) + '</p>' +
    (s.operation === "share" ? '<div class="task-total">' + s.items + " " + esc(s.unit) + " → " + s.groups + ' equal groups</div>' : "") +
    '<div class="task-groups">' + groups + '</div><p class="task-result" hidden></p></section>';
}

export function resolveQuestScene(content, question) {
  const scene = content.querySelector(".task-scene");
  if (!scene) return;
  scene.classList.add("task-resolved");
  if (question.scene.operation === "share")
    scene.querySelectorAll(".task-group strong").forEach(label => { label.textContent = question.answer; });
  const result = scene.querySelector(".task-result");
  result.hidden = false;
  result.textContent = question.success;
}

export function questCompletionMarkup(quest, reward, next) {
  const effect = QUEST_EFFECTS[quest.id];
  return '<div class="quest-change"><span class="eyebrow">CHANGED IN THE WORLD</span><h3>' + esc(effect.marker) + '</h3><p>' + esc(effect.change) +
    '</p></div><p>' + esc(quest.done) + '</p><p class="reward-line">+ ' + esc(reward) +
    '</p><p><strong>Unlocked:</strong> ' + esc(effect.unlock) + '</p><div class="next-objective"><strong>Next on the trail</strong><p>' +
    esc(next ? next.person + " needs help: " + next.title + "." : effect.next) + '</p></div><button id="return-world" class="primary full">See the change in the world</button><button id="review-result">Review a method</button>';
}
