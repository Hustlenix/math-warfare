import "./styles.css";
import "./adventure/polish.css";
import "./adventure/intro.css";
import "./adventure/frontier.css";
import "./adventure/fullscreen.css";
import "./adventure/game-theme.css";
import { icon, mountIcons } from "./adventure/icons.js";
import { escapeHtml as esc } from "./adventure/html.js";
import { QUEST_EFFECTS, questProgress } from "./adventure/quest-tasks.js";
import { questCompletionMarkup, resolveQuestScene } from "./adventure/quest-ui.js";
import { battleMarkup, bindBattleControls } from "./adventure/battle-ui.js";
import {
  advanceBattle,
  answerBattle,
  createBattle,
  elapsedBattle,
} from "./adventure/battle-session.js";
import { setupOnline } from "./adventure/online-ui.js";
import { setupIntro } from "./adventure/intro.js";
import { setupWorldPanels } from "./adventure/world-panels.js";
import { openWardrobe } from "./adventure/wardrobe-ui.js";
import { portraitStyle } from "./adventure/wardrobe.js";
import artUrls from "virtual:licensed-art";
import { QUESTS, SKILLS, NPCS } from "./adventure/content.js";
import {
  load,
  save,
  finishQuest,
  available,
  nextQuest,
} from "./adventure/progress.js";
import { World, blocked } from "./adventure/world.js";
import { movementKey } from "./adventure/movement-input.js";
import { AMBIENT } from "./adventure/village-life.js";
import { LANDMARKS } from "./adventure/map-layout.js";
import { petName } from "./adventure/companion.js";

const $ = (id) => document.getElementById(id);
mountIcons();
let storage;
try {
  storage = localStorage;
} catch {
  storage = {
    getItem: () => null,
    setItem: () => {
      throw Error("Storage unavailable");
    },
  };
}
const state = load(storage),
  panel = $("panel"),
  content = $("panel-content");
let art = {},
  world,
  battle = null,
  interval,
  previousFocus,
  toastTimeout,
  audioCtx;
let online;
const journal = $("journal-panel");
function closeJournal() {
  journal.close();
  if (world) world.paused = panel.open || !$("intro").hidden;
  world?.keys.clear();
}
function openJournal() {
  if (panel.open || !$("intro").hidden) return;
  world.paused = true;
  world.keys.clear();
  journal.showModal();
  $("journal-close").focus();
}
async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    toast(
      "Fullscreen is unavailable in this browser. The game still fills this window.",
    );
  }
}
function toast(text) {
  $("toast").textContent = text;
  $("toast").classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $("toast").classList.remove("show"), 3500);
}
function persist() {
  const ok = save(storage, state);
  $("save-status").textContent = ok
    ? "Saved on this device"
    : "Saving unavailable · keep this tab open";
}
function chime(good = true) {
  if (state.muted) return;
  try {
    audioCtx ??= new AudioContext();
    audioCtx.resume().catch(() => {});
    const osc = audioCtx.createOscillator(),
      g = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(good ? 523 : 150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      good ? 1046 : 85,
      audioCtx.currentTime + 0.15,
    );
    g.gain.setValueAtTime(0.045, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.23);
  } catch {}
}
function open(html) {
  closeJournal();
  world.paused = true;
  world.keys.clear();
  if (!panel.open) previousFocus = document.activeElement;
  content.innerHTML = html;
  if (!panel.open) panel.showModal();
  content.querySelector("input,button,select")?.focus();
}
function close() {
  panel.close();
  world.paused = !$("intro").hidden;
  world.keys.clear();
  previousFocus?.focus?.();
}
function modalHead(eyebrow, title) {
  return `<div class="modal-heading"><div>${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ""}<h2>${title}</h2></div><button class="close-panel" aria-label="Close">${icon("close")}</button></div>`;
}
function bindClose() {
  content.querySelector(".close-panel")?.addEventListener("click", () => {
    if (battle) pause();
    else close();
  });
}
function refresh() {
  if (world) world.needsRedraw = true;
  $("pet-open").textContent = state.companion === "none" ? "Companion · B" : `${petName(state.petNames[state.companion], state.companion)} · B`;
  $("coins").textContent = `${state.coins} coins`;
  $("xp").textContent = `${state.xp} XP`;
  $("character-open").innerHTML =
    `<span aria-hidden="true" class="hero-mini" style="${portraitStyle(art, state.appearance.id, 2)}"></span><span class="character-name">${esc(state.appearance.name)}</span><span aria-hidden="true">✎</span>`;
  $("sound").textContent = `Sound: ${state.muted ? "off" : "on"}`;
  document.body.classList.toggle("reduce-motion", state.reducedMotion);
  $("quest-count").textContent = `${state.completed.length} / ${QUESTS.length}`;
  $("hud-progress").style.width =
    `${(state.completed.length / QUESTS.length) * 100}%`;
  $("quest-progress").style.width =
    `${(state.completed.length / QUESTS.length) * 100}%`;
  const next = nextQuest(state);
  $("help-route").textContent = next ? `Find ${next.person === "The Fungus King" ? "the King" : next.person}` : "Quests";
  $("hud-quest").textContent = next?.title ?? "All lanterns restored";
  $("hud-zone").textContent =
    state.zone === "village" ? "NUMBERGLEN" : "LANTERN HOLLOW";
  $("active-title").textContent = next?.title ?? "The light lives on.";
  $("active-copy").textContent = next
    ? `${next.person}: ${state.questWork[next.id] ?? 0} / ${next.count} tasks checked. ${QUEST_EFFECTS[next.id].change}`
    : "Every lantern is restored. Revisit your neighbours or chase a new arena record.";
  $("next-quest").textContent = next
    ? `Meet ${next.person} →`
    : "Explore the arena →";
  $("zone-label").textContent =
    state.zone === "village"
      ? "CHAPTER 01 · THE DUSTLIGHT FRONTIER"
      : "CHAPTER 02 · LANTERN HOLLOW";
  $("village-life").parentElement.hidden = state.zone !== "village";
  $("zone-title").textContent =
    state.zone === "village"
      ? "Numberglen, at high noon."
      : "A light beneath the roots.";
  $("scene-caption").textContent = state.completed.includes("king")
    ? "Every small answer helped bring the light home."
    : state.zone === "village"
      ? "Dust on your boots. Bright ideas in your pocket."
      : "Even the strangest neighbours have ordinary problems.";
  $("neighbour-count").textContent =
    state.zone === "village" ? "NUMBERGLEN" : "HOLLOW";
  $("neighbours").innerHTML = [
    ...NPCS[state.zone],
    ...(state.zone === "village" ? [...AMBIENT, ...LANDMARKS] : []),
  ]
    .map((n) => {
      const q = QUESTS.find((q) => q.id === n.id),
        done = state.completed.includes(n.id),
        locked = q && !available(state, n.id);
      const portrait = !n.art ? '<span class="place-icon" aria-hidden="true">↟</span>' : n.art?.startsWith("hero-")
        ? `<span aria-hidden="true" class="hero-mini" style="${portraitStyle(art, n.art, 1)}"></span>`
        : `<img alt="" src="${art[n.art + "Face"]?.src ?? art.person2Face.src}" class="portrait">`;
      return `<button data-neighbour="${n.id}" class="neighbour">${portrait}<span>${n.name}<small>${done ? "✓ Helped" : locked ? "Waiting for another quest" : q ? q.title : n.label}</small></span><b>${done ? "✓" : locked ? "·" : "↗"}</b></button>`;
    })
    .join("");
  document.querySelectorAll("[data-neighbour]").forEach(
    (b) =>
      (b.onclick = () => {
        closeJournal();
        world.go(b.dataset.neighbour);
        $("world").focus();
      }),
  );
  $("mistake-count").textContent = state.mistakes.length
    ? `${state.mistakes.length} notes to revisit →`
    : "Nothing to revise yet →";
  persist();
}
function route() {
  closeJournal();
  const q = nextQuest(state);
  if (!q) {
    arena();
    return;
  }
  if (q.zone !== state.zone) {
    toast(
      q.zone === "cave"
        ? "Visit the cave trail east of the town square."
        : "Return to the village trail first.",
    );
    world.go("portal");
    return;
  }
  world.go(q.id);
}
function interact(n) {
  if (LANDMARKS.some((place) => place.id === n.id)) {
    open(modalHead("ON THE COUNTRY TRAIL", esc(n.name)) +
      `<p>${esc(n.copy)}</p><div class="button-row"><button id="place-action" class="primary">${n.skill ? "Practise " + SKILLS[n.skill].toLowerCase() : "Meet your companion"}</button><button id="back">Keep exploring</button></div>`);
    bindClose();
    $("back").onclick = close;
    $("place-action").onclick = () => n.skill ? start({ mode: "practice", skill: n.skill, count: 10 }) : panels.companions();
    return;
  }
  if (AMBIENT.some((a) => a.id === n.id)) {
    open(
      modalHead("A NUMBERGLEN NEIGHBOUR", esc(n.name)) +
        `<div class="dialogue-art">${n.art.startsWith("hero-") ? `<span role="img" aria-label="${esc(n.name)}" class="hero-face" style="${portraitStyle(art, n.art, 3)}"></span>` : `<img class="speaker" alt="${esc(n.name)}" src="${art[n.art + "Face"].src}">`}<p>${esc(n.lines[Math.floor(world.lifeTime / 40) % n.lines.length])}</p></div><p class="muted">${esc(n.activity ?? "Taking a village stroll")}</p><button id="back" class="primary">See you around →</button>`,
    );
    bindClose();
    $("back").onclick = close;
    return;
  }
  if (n.id === "portal") {
    if (state.zone === "village" && !state.completed.includes("library")) {
      open(
        modalHead("THE TRAIL IS CLOSED", "Cave trail closed") +
          '<p>Help Bram and Fern, then recover Ada’s map in the library. The cave trail will open.</p><button id="back" class="primary">Back to the village</button>',
      );
      bindClose();
      $("back").onclick = close;
      return;
    }
    world.changeZone(state.zone === "village" ? "cave" : "village");
    refresh();
    toast(
      state.zone === "cave"
        ? "Welcome to Lantern Hollow. Find Scout by the first gate."
        : "Back in Numberglen.",
    );
    return;
  }
  if (n.id === "shop") {
    panels.collection();
    return;
  }
  if (n.id === "arena") {
    arena();
    return;
  }
  const q = QUESTS.find((q) => q.id === n.id);
  if (!q) return;
  const done = state.completed.includes(q.id),
    ready = available(state, q.id);
  open(
    modalHead(`${n.label} · ${SKILLS[q.skill]}`, esc(n.name)) +
      `<div class="dialogue-art"><img class="speaker" alt="${esc(n.name)}" src="${art[n.art + "Face"].src}"><p>${esc(
        done
          ? q.done
          : ready
            ? q.intro
            : "I need a little help from the others first. Come back after: " +
              q.requires
                .filter((r) => !state.completed.includes(r))
                .map((id) => QUESTS.find((v) => v.id === id).title)
                .join(", ") +
              ".",
      )}</p></div><p class="quest-objective"><strong>Your task:</strong> ${esc(QUEST_EFFECTS[q.id].change)}</p><div class="quest-stamp"><span>${state.questWork[q.id] ?? 0} / ${q.count} tasks checked · no time limit</span><strong>${done ? "Already rewarded" : `${q.reward} coins + ${q.count * 10} XP`}</strong></div><div class="button-row">${ready ? `<button id="start-quest" class="primary">${done ? "Practise this skill" : "Let’s help →"}</button>` : ""}<button id="back">Keep exploring</button></div>`,
  );
  bindClose();
  $("back").onclick = close;
  if (ready)
    $("start-quest").onclick = () =>
      start({
        mode: done ? "practice" : "quest",
        quest: q,
        skill: q.skill,
        count: q.count,
      });
}
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
    $("answer-feedback").textContent = result.message;
    $("answer-feedback").className = "correct";
    content.querySelector(".battle-stage").classList.add("hit");
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
    ? "Next question"
    : b.mode === "quest"
      ? "Try a new question →"
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
function arena() {
  const best = state.records
    .filter((r) => r.mode === "sprint")
    .reduce((n, r) => Math.max(n, r.score ?? 0), 0);
  open(
    modalHead("ROOK’S ARENA", "Practice") +
      `<p>Choose a skill. Training has 10 questions; sprint lasts 60 seconds.</p><label class="field-label" for="skill">Your skill</label><select id="skill">${Object.entries(
        SKILLS,
      )
        .map(
          ([id, name]) =>
            `<option value="${id}" ${id === "mixed" ? "selected" : ""}>${name}</option>`,
        )
        .join(
          "",
        )}</select><label class="field-label" for="level">Number size</label><select id="level"><option value="1">Small numbers</option><option value="2">Medium numbers</option><option value="3">Large numbers</option></select><div class="arena-options"><button id="train" class="primary">Training trail <small>10 questions · no timer</small></button><button id="sprint">60 second sprint <small>Personal best: ${best} points</small></button></div><p class="muted">Arena practice earns XP. Quest coins come from helping the village.</p>`,
  );
  bindClose();
  $("level").value = state.level;
  for (const mode of ["train", "sprint"])
    $(mode).onclick = () => {
      state.level = Number($("level").value);
      persist();
      start({
        mode: mode === "train" ? "practice" : "sprint",
        skill: $("skill").value,
        count: 10,
      });
    };
}
function daily() {
  const date = new Date().toISOString().slice(0, 10);
  open(
    modalHead("DAILY PRACTICE", date) +
      `<p>Ten mixed questions. Everyone using the same difficulty gets the same sequence today. The date changes at midnight UTC.</p><p class="reward-line">${state.dailyDone === date ? "Today’s 20 coins are already collected. Replay for practice XP." : "Complete the trail for 20 coins + practice XP."}</p><p class="muted">Current number size: ${["Small", "Medium", "Large"][state.level - 1]}. Change it in the arena.</p><button id="daily-start" class="primary full">Start today’s trail →</button>`,
  );
  bindClose();
  $("daily-start").onclick = () =>
    start({ mode: "daily", skill: "mixed", count: 10 });
}
function notes() {
  open(
    modalHead("", "Revision notes") +
      `<p>These questions tripped you up. A correct revision answer clears its note.</p>${state.mistakes.length ? `<button id="review-notes" class="primary full">Practise ${state.mistakes.length} notes →</button><div class="notes-list">${state.mistakes.map((q) => `<article><strong>${esc(q.text)} = ${q.answer}</strong><p>${esc(q.hint)}</p></article>`).join("")}</div>` : '<div class="empty-note">No notes yet. Try a quest or the arena.</div>'}`,
  );
  bindClose();
  if ($("review-notes"))
    $("review-notes").onclick = () =>
      start({
        mode: "review",
        skill: "mixed",
        count: state.mistakes.length,
        review: state.mistakes.map((q) => ({ ...q })),
      });
}
function wardrobe() {
  openWardrobe({ art, state, open, close, refresh, toast });
}
function about() {
  open(
    modalHead("MATH WARFARE", "About & credits") +
      '<p>Lalith’s mental maths project, expanded into a village adventure. Built with JavaScript, Canvas and Vite. The adventure works without a maths API.</p><p>Characters, animals, furniture, cave tiles and fantasy battlers by <a href="https://limezu.itch.io/" target="_blank" rel="noreferrer">LimeZu</a>, used from Lalith’s locally supplied paid packs. Artwork remains the artist’s property.</p><p>This expansion was substantially implemented with Codex AI assistance. It should not be represented as human-only work or as verified compliance with a 30% AI limit. Stardance review and rewards are decided by its organisers.</p><p class="muted">Questions are practice aids. Number size changes difficulty, not curriculum certification.</p><a href="https://github.com/Hustlenix/math-warfare" target="_blank" rel="noreferrer">Project source ↗</a>',
  );
  bindClose();
}
const panels = setupWorldPanels({
  state,
  getWorld: () => world,
  art,
  content,
  open,
  close,
  refresh,
  toast,
  chime,
  modalHead,
  bindClose,
  fullscreen,
  about,
});
panel.addEventListener("cancel", (e) => {
  e.preventDefault();
  battle ? pause() : close();
});
document.addEventListener("keydown", (e) => {
  if (!$("intro").hidden) return;
  if (journal.open) return;
  if (panel.open) {
    // Native dialog controls own Enter; feedback already focuses Next question.
    return;
  }
  if (
    e.key === " " &&
    e.target instanceof Element &&
    e.target.closest("button,a,input,select,textarea")
  )
    return;
  if (e.target instanceof Element && e.target.closest("input,select,textarea"))
    return;
  const shortcut = {
    j: openJournal,
    p: arena,
    o: () => online.open(),
    c: wardrobe,
    b: panels.companions,
    m: panels.countryMap,
    f: fullscreen,
    Escape: panels.settings,
  }[e.key === "Escape" ? e.key : e.key.toLowerCase()];
  if (shortcut && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    shortcut();
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  // Focused controls retain their native keyboard behavior.
  if (e.target instanceof Element && e.target.closest("button,a")) return;
  const key = movementKey(e);
  if (key) {
    e.preventDefault();
    world?.keys.press(`keyboard:${e.code || key}`, key);
  }
  if (!e.repeat && (e.key.toLowerCase() === "e" || e.key === " ")) {
    e.preventDefault();
    world?.interact();
  }
});
document.addEventListener("keyup", (e) =>
  world?.keys.release(`keyboard:${e.code || (e.key.length === 1 ? e.key.toLowerCase() : e.key)}`),
);
window.addEventListener("blur", () => world?.keys.clear());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    world?.keys.clear();
    if (battle && !battle.pausedAt) pause();
    persist();
  }
});
window.addEventListener("pagehide", persist);
for (const el of document.querySelectorAll("[data-direction]")) {
  el.onpointerdown = (e) => {
    if (!world || world.paused || document.hidden) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    world.keys.press(`pointer:${e.pointerId}`, el.dataset.direction);
  };
  el.onpointerup =
    el.onpointercancel =
    el.onlostpointercapture =
      (e) => world?.keys.release(`pointer:${e.pointerId}`);
}
$("touch-toggle").onclick = () => {
  $("touch-controls").hidden = !$("touch-controls").hidden;
};
$("interact").onclick = () => world.interact();
$("help-route").onclick = $("next-quest").onclick = route;
$("practice").onclick = arena;
$("daily").onclick = daily;
$("mistakes").onclick = notes;
$("collection").onclick = panels.collection;
$("pet-open").onclick = panels.companions;
$("map-open").onclick = panels.countryMap;
$("settings").onclick = panels.settings;
$("journal-open").onclick = $("menu-open").onclick = openJournal;
$("journal-close").onclick = () => {
  closeJournal();
  $("world").focus();
};
journal.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeJournal();
  $("world").focus();
});
$("train-open").onclick = arena;
$("online-open").onclick = $("online-hud").onclick = () => online.open();
$("fullscreen").onclick = fullscreen;
document.addEventListener("fullscreenchange", () =>
  $("fullscreen").setAttribute(
    "aria-label",
    document.fullscreenElement ? "Exit fullscreen" : "Enter fullscreen",
  ),
);
$("wardrobe").onclick =
  $("character-open").onclick =
  $("intro-wardrobe").onclick =
    wardrobe;
$("about").onclick = about;
$("sound").onclick = () => {
  state.muted = !state.muted;
  refresh();
  chime();
};
async function boot() {
  const intro = setupIntro(art, state, (mode) => {
    document.getElementById("app").inert = false;
    world.paused = false;
    if (mode === "online") {
      online.open();
      return;
    }
    if (!state.completed.length) {
      open(
        '<span class="eyebrow">START HERE</span><h2>Mira needs a hand</h2><p>Walk with WASD or the arrow keys, or click a destination. Press E near a neighbour to talk. Find Mira takes you to the first quest.</p><p>Quests have no timer. If you miss an answer, you get a method and another try. Progress is saved in this browser.</p><button id="begin" class="primary full">Start exploring</button>',
      );
      $("begin").onclick = () => {
        close();
        $("world").focus();
      };
    } else $("world").focus();
  });
  document.getElementById("app").inert = true;
  try {
    const names = Object.keys(artUrls);
    let loaded = 0;
    /* The importer supplies only the artwork used by this game. */
    await Promise.all(
      names.map(
        (name) =>
          new Promise((resolve, reject) => {
            const im = new Image();
            im.onload = () => {
              art[name] = im;
              intro.progress(++loaded, names.length);
              resolve();
            };
            im.onerror = () => reject(new Error("Missing artwork: " + name));
            im.src = artUrls[name];
          }),
      ),
    );
    if (blocked(state.zone, state.player.x, state.player.y, state))
      state.player = {
        x: state.zone === "village" ? 16.5 : 4.5,
        y: state.zone === "village" ? 14.5 : 20.5,
      };
    world = new World($("world"), state, art, interact, toast);
    online = setupOnline({
      state,
      art,
      getWorld: () => world,
      open,
      close,
      esc,
      toast,
      panel,
      content,
    });
    refresh();
    if (matchMedia("(pointer: coarse)").matches)
      $("touch-controls").hidden = false;
    world.paused = true;
    intro.ready();
  } catch (err) {
    intro.error();
    $("zone-title").textContent = "The artwork could not load.";
    $("scene-caption").textContent =
      "Run the local asset importer, then reload. See the README.";
    toast(err.message);
    console.error(err);
  }
}
boot();
