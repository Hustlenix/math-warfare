import "./styles.css";
import "./adventure/polish.css";
import artUrls from "virtual:licensed-art";
import { QUESTS, SKILLS, SHOP, NPCS } from "./adventure/content.js";
import {
  fresh,
  load,
  save,
  finishQuest,
  available,
  purchase,
  nextQuest,
} from "./adventure/progress.js";
import {
  question,
  matches,
  parseAnswer,
  seeded,
} from "./adventure/questions.js";
import { World, blocked } from "./adventure/world.js";
const $ = (id) => document.getElementById(id),
  esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
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
  world.paused = true;
  world.keys.clear();
  if (!panel.open) previousFocus = document.activeElement;
  content.innerHTML = html;
  if (!panel.open) panel.showModal();
  content.querySelector("input,button,select")?.focus();
}
function close() {
  panel.close();
  world.paused = false;
  world.keys.clear();
  previousFocus?.focus?.();
}
function modalHead(eyebrow, title) {
  return `<div class="modal-heading"><div><span class="eyebrow">${eyebrow}</span><h2>${title}</h2></div><button class="close-panel" aria-label="Close">×</button></div>`;
}
function bindClose() {
  content.querySelector(".close-panel")?.addEventListener("click", () => {
    if (battle) pause();
    else close();
  });
}
function refresh() {
  $("coins").textContent = `${state.coins} coins`;
  $("xp").textContent = `${state.xp} XP`;
  $("sound").textContent = `Sound: ${state.muted ? "off" : "on"}`;
  document.body.classList.toggle("reduce-motion", state.reducedMotion);
  $("quest-count").textContent = `${state.completed.length} / ${QUESTS.length}`;
  $("quest-progress").style.width =
    `${(state.completed.length / QUESTS.length) * 100}%`;
  const next = nextQuest(state);
  $("active-title").textContent = next?.title ?? "The light lives on.";
  $("active-copy").textContent = next
    ? `${next.person} needs your help. ${SKILLS[next.skill]} · ${next.count} bright ideas.`
    : "Every lantern is restored. Revisit your neighbours or chase a new arena record.";
  $("next-quest").textContent = next
    ? `Meet ${next.person} →`
    : "Explore the arena →";
  $("zone-label").textContent =
    state.zone === "village"
      ? "CHAPTER 01 · THE VILLAGE"
      : "CHAPTER 02 · LANTERN HOLLOW";
  $("zone-title").textContent =
    state.zone === "village"
      ? "Welcome to Numberglen."
      : "A light beneath the roots.";
  $("scene-caption").textContent = state.completed.includes("king")
    ? "Every small answer helped bring the light home."
    : state.zone === "village"
      ? "A village of small problems. A world of bright ideas."
      : "Even the strangest neighbours have ordinary problems.";
  $("neighbour-count").textContent =
    state.zone === "village" ? "NUMBERGLEN" : "HOLLOW";
  $("neighbours").innerHTML = NPCS[state.zone]
    .map((n) => {
      const q = QUESTS.find((q) => q.id === n.id),
        done = state.completed.includes(n.id),
        locked = q && !available(state, n.id);
      return `<button data-neighbour="${n.id}" class="neighbour"><img alt="" src="${art[n.art + "Face"]?.src ?? art.person2Face.src}" class="portrait"><span>${n.name}<small>${done ? "✓ Helped" : locked ? "Waiting for another quest" : q ? q.title : n.label}</small></span><b>${done ? "✓" : locked ? "·" : "↗"}</b></button>`;
    })
    .join("");
  document
    .querySelectorAll("[data-neighbour]")
    .forEach((b) => (b.onclick = () => world.go(b.dataset.neighbour)));
  $("mistake-count").textContent = state.mistakes.length
    ? `${state.mistakes.length} notes to revisit →`
    : "Nothing to revise yet →";
  persist();
}
function route() {
  const q = nextQuest(state);
  if (!q) {
    arena();
    return;
  }
  if (q.zone !== state.zone) {
    toast(
      q.zone === "cave"
        ? "Visit the cave trail at the east edge."
        : "Return to the village trail first.",
    );
    world.go("portal");
    return;
  }
  world.go(q.id);
}
function interact(n) {
  if (n.id === "portal") {
    if (state.zone === "village" && !state.completed.includes("library")) {
      open(
        modalHead("THE TRAIL IS CLOSED", "One page is still missing.") +
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
    collection();
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
      )}</p></div><div class="quest-stamp"><span>${q.count} questions · no time limit</span><strong>${done ? "Already rewarded" : `${q.reward} coins + ${q.count * 10} XP`}</strong></div><div class="button-row">${ready ? `<button id="start-quest" class="primary">${done ? "Practise this skill" : "Let’s help →"}</button>` : ""}<button id="back">Keep exploring</button></div>`,
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
  const rng =
    options.mode === "daily"
      ? seeded(
          Number(new Date().toISOString().slice(0, 10).replaceAll("-", "")),
        )
      : Math.random;
  battle = {
    ...options,
    rng,
    index: 0,
    correct: 0,
    attempts: 0,
    streak: 0,
    bestStreak: 0,
    score: 0,
    hearts: 3,
    started: Date.now(),
    pauseMs: 0,
    pausedAt: 0,
    seconds: 0,
    assists: 0,
    results: [],
    q: options.review?.[0] ?? question(options.skill, state.level, rng),
    feedback: false,
  };
  renderBattle();
  interval = setInterval(tick, 100);
}
function elapsed() {
  return (
    (Date.now() -
      battle.started -
      battle.pauseMs -
      (battle.pausedAt ? Date.now() - battle.pausedAt : 0)) /
    1000
  );
}
function tick() {
  if (!battle || battle.pausedAt) return;
  battle.seconds = elapsed();
  if (battle.mode === "sprint") {
    const remaining = Math.max(0, 60 - battle.seconds);
    if ($("clock")) $("clock").textContent = `${Math.ceil(remaining)}s`;
    if (remaining <= 0) finish();
  } else if ($("clock"))
    $("clock").textContent = `${Math.floor(battle.seconds)}s`;
}
function renderBattle() {
  const b = battle,
    q = b.q,
    isQuest = b.mode === "quest",
    boss = b.quest?.boss;
  open(
    `<div class="battle-header"><span class="eyebrow">${esc(b.quest?.title ?? (b.mode === "daily" ? "DAILY EXPEDITION" : b.mode === "review" ? "LEARNING NOTES" : "PRACTICE ARENA"))}</span><button class="close-panel" aria-label="Pause challenge">Ⅱ</button></div><div class="battle-stage ${boss ? "boss-stage" : ""}"><div class="battle-land"><img class="battle-hero" src="${art.person1Face.src}" alt="Your adventurer"><div class="battle-beam"></div><img class="battle-monster" src="${art[boss ? "boss" : b.skill === "percent" ? "owl" : b.skill === "fraction" ? "beetle" : "slime"].src}" alt="${boss ? "The Fungus King" : "Practice creature"}"></div><div class="battle-status"><span id="hearts">${"♥".repeat(b.hearts)}${"♡".repeat(3 - b.hearts)}</span><span id="clock">${b.mode === "sprint" ? "60s" : "0s"}</span><span id="score">${b.score} points</span></div></div><div class="battle-body"><div class="question-top"><span>${SKILLS[q.skill] ?? "Revision"}</span><span id="step">${b.mode === "sprint" ? "60 SECOND SPRINT" : `${b.index + 1} / ${b.count}`}</span></div><h2 id="equation">${esc(q.text)}</h2><p class="answer-prompt">${isQuest ? "One bright idea at a time." : "Type your answer, then press Enter."}</p><form id="answer-form" novalidate><label class="sr-only" for="answer">Your answer</label><input id="answer" inputmode="decimal" autocomplete="off" placeholder="?" maxlength="16"><button class="primary" type="submit">${isQuest ? "Send a spark" : "Answer"} ↗</button></form><div id="answer-feedback" role="status" aria-live="polite"></div><div class="keypad" aria-label="Answer keypad">${["7", "8", "9", "4", "5", "6", "1", "2", "3", "−", "0", "."].map((k) => `<button type="button" data-key="${k === "−" ? "-" : k}">${k}</button>`).join("")}<button type="button" id="erase">⌫</button><button type="button" id="clear-answer">Clear</button></div><div class="battle-footer"><button id="hint">Show a method</button><span id="streak">${b.streak ? `${b.streak} in a row` : "Accuracy first."}</span></div><div id="method" hidden></div><button id="next-question" class="primary full" hidden>Next bright idea →</button></div>`,
  );
  bindClose();
  $("answer-form").onsubmit = (e) => {
    e.preventDefault();
    submit();
  };
  document.querySelectorAll("[data-key]").forEach(
    (el) =>
      (el.onclick = () => {
        if (b.feedback) return;
        const a = $("answer");
        if (a.value.length < 16) a.value += el.dataset.key;
        a.focus();
      }),
  );
  $("erase").onclick = () => {
    $("answer").value = $("answer").value.slice(0, -1);
    $("answer").focus();
  };
  $("clear-answer").onclick = () => {
    $("answer").value = "";
    $("answer").focus();
  };
  $("hint").onclick = () => {
    if ($("method").hidden) {
      $("method").hidden = false;
      $("method").textContent = q.hint;
      b.assists++;
    }
  };
  $("next-question").onclick = advance;
  $("answer").focus();
  tick();
}
function submit() {
  const b = battle;
  if (!b || b.feedback || b.pausedAt) return;
  if (b.mode === "sprint" && elapsed() >= 60) {
    finish();
    return;
  }
  const input = $("answer").value;
  if (parseAnswer(input) === null) {
    $("answer-feedback").textContent = "Use a number, like 12 or 2.5.";
    return;
  }
  b.attempts++;
  const correct = matches(input, b.q.answer);
  b.results.push({ text: b.q.text, answer: b.q.answer, input, correct });
  if (correct) {
    b.correct++;
    b.streak++;
    b.bestStreak = Math.max(b.bestStreak, b.streak);
    b.score += 10 + Math.min(5, b.streak - 1) * 2;
    chime();
    $("answer-feedback").textContent =
      b.streak >= 3
        ? `${b.streak} bright ideas in a row!`
        : "That’s it! A spark of progress.";
    $("answer-feedback").className = "correct";
    content.querySelector(".battle-stage").classList.add("hit");
  } else {
    b.streak = 0;
    b.hearts = Math.max(0, b.hearts - 1);
    chime(false);
    $("answer-feedback").textContent =
      `A useful mistake. ${b.q.text} = ${b.q.answer}.`;
    $("answer-feedback").className = "incorrect";
    $("method").hidden = false;
    $("method").textContent = b.q.hint;
    state.mistakes = state.mistakes.filter((m) => m.text !== b.q.text);
    state.mistakes.push({ ...b.q });
    state.mistakes = state.mistakes.slice(-24);
    persist();
  }
  b.feedback = true;
  b.lastCorrect = correct;
  $("answer").disabled = true;
  $("answer-form").querySelector("button").disabled = true;
  $("hearts").textContent = "♥".repeat(b.hearts) + "♡".repeat(3 - b.hearts);
  $("score").textContent = `${b.score} points`;
  $("streak").textContent = `Best streak: ${b.bestStreak}`;
  $("next-question").hidden = false;
  $("next-question").textContent = correct
    ? "Next bright idea →"
    : b.mode === "quest"
      ? "Try a new question →"
      : "Keep going →";
  $("next-question").focus();
}
function advance() {
  if (!battle) return;
  const b = battle;
  if (b.mode === "quest" && !b.lastCorrect) {
    if (!b.hearts) {
      b.hearts = 3;
      toast("Take a breath. Your progress is safe. Keep learning.");
    }
  } else b.index++;
  if (b.mode === "review" && b.lastCorrect)
    state.mistakes = state.mistakes.filter((q) => q.text !== b.q.text);
  if (b.mode !== "sprint" && b.index >= b.count) {
    finish();
    return;
  }
  b.q = b.review?.[b.index] ?? question(b.skill, state.level, b.rng);
  b.feedback = false;
  renderBattle();
}
function finish() {
  const b = battle;
  if (!b) return;
  clearInterval(interval);
  b.seconds = elapsed();
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
          : "Every answer is practice.",
    ) +
      `<div class="result-stamp">${final ? "✦" : win ? "✓" : "×"}</div><p>${esc(win ? b.quest.done : accuracy >= 80 ? "Steady thinking. Keep practising and the speed will follow." : "Keep the methods you learned. Your learning notes are ready for another try.")}</p><div class="result-grid"><div><strong>${accuracy}%</strong><span>accuracy</span></div><div><strong>${Math.round(b.seconds)}s</strong><span>active time</span></div><div><strong>${b.bestStreak}</strong><span>best streak</span></div></div><p class="reward-line">+ ${reward}</p>${b.assists ? `<p class="muted">You used ${b.assists} method hints. Good tools are part of learning.</p>` : ""}<div class="button-row"><button id="return-world" class="primary">${final ? "Keep exploring" : "Back to the adventure"} →</button><button id="review-result">Learning notes</button></div>`,
  );
  bindClose();
  $("return-world").onclick = close;
  $("review-result").onclick = notes;
}
function pause() {
  if (!battle || battle.pausedAt) return;
  battle.pausedAt = Date.now();
  battle.savedDOM = document.createDocumentFragment();
  while (content.firstChild) battle.savedDOM.append(content.firstChild);
  open(
    modalHead("TAKE YOUR TIME", "A little breather.") +
      '<p>The clock is paused. Your current answer and feedback will be kept.</p><div class="button-row"><button id="resume" class="primary">Resume</button><button id="quit">Return to the adventure</button></div>',
  );
  content.querySelector(".close-panel").onclick = resume;
  $("resume").onclick = resume;
  $("quit").onclick = () => {
    clearInterval(interval);
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
  ($("next-question")?.hidden ? $("answer") : $("next-question"))?.focus();
  tick();
}
function arena() {
  const best = state.records
    .filter((r) => r.mode === "sprint")
    .reduce((n, r) => Math.max(n, r.score ?? 0), 0);
  open(
    modalHead("ROOK’S PRACTICE ARENA", "Train your bright ideas.") +
      `<p>Choose a skill and a pace. Training gives you room to think. Sprint gives you one minute to chase your best score.</p><label class="field-label" for="skill">Your skill</label><select id="skill">${Object.entries(
        SKILLS,
      )
        .map(
          ([id, name]) =>
            `<option value="${id}" ${id === "mixed" ? "selected" : ""}>${name}</option>`,
        )
        .join(
          "",
        )}</select><label class="field-label" for="level">Number size</label><select id="level"><option value="1">Gentle · build confidence</option><option value="2">Steady · stretch your skills</option><option value="3">Spicy · bigger numbers</option></select><div class="arena-options"><button id="train" class="primary">Training trail <small>10 questions · no timer</small></button><button id="sprint">60 second sprint <small>Personal best: ${best} points</small></button></div><p class="muted">Arena practice earns XP. Quest coins come from helping the village.</p>`,
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
    modalHead("ONE LITTLE RITUAL", `Daily expedition · ${date}`) +
      `<p>Ten mixed questions. Everyone using the same difficulty gets the same sequence today. The date changes at midnight UTC.</p><p class="reward-line">${state.dailyDone === date ? "Today’s 20 coins are already collected. Replay for practice XP." : "Complete the trail for 20 coins + practice XP."}</p><p class="muted">Current number size: ${["Gentle", "Steady", "Spicy"][state.level - 1]}. Change it in the arena.</p><button id="daily-start" class="primary full">Start today’s trail →</button>`,
  );
  bindClose();
  $("daily-start").onclick = () =>
    start({ mode: "daily", skill: "mixed", count: 10 });
}
function notes() {
  open(
    modalHead("YOUR LEARNING NOTES", "Mistakes become methods.") +
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
function collection() {
  open(
    modalHead("THE SUPPLY BENCH", "Make the village your own.") +
      `<p>You have <strong>${state.coins} coins</strong>. Upgrades are decorations, and maths rewards are the same for everyone.</p><div class="shop-list">${SHOP.map((s) => `<article><div><strong>${s.name}</strong><p>${s.description}</p></div><button data-buy="${s.id}" ${state.upgrades.includes(s.id) || state.coins < s.price ? "disabled" : ""}>${state.upgrades.includes(s.id) ? "Added ✓" : s.price + " coins"}</button></article>`).join("")}</div><label class="field-label" for="companion">Travelling companion</label><select id="companion"><option value="none">A quiet solo walk</option>${state.completed.includes("bakery") ? '<option value="cat">Pixel · the apologetic cat</option>' : ""}${state.completed.includes("garden") ? '<option value="frog">Pebble · the picky frog</option>' : ""}</select><p class="muted">Earn companions through Bram’s and Fern’s quests.</p>`,
  );
  bindClose();
  $("companion").value = state.companion;
  $("companion").onchange = () => {
    state.companion = $("companion").value;
    persist();
  };
  document.querySelectorAll("[data-buy]").forEach(
    (el) =>
      (el.onclick = () => {
        if (purchase(state, el.dataset.buy)) {
          refresh();
          collection();
          chime();
          toast("Your village upgrade is ready. Go take a look!");
        }
      }),
  );
}
function settings() {
  open(
    modalHead("A COMFORTABLE ADVENTURE", "Your settings.") +
      `<label class="setting-row"><input id="mute-setting" type="checkbox" ${state.muted ? "checked" : ""}>Mute game sounds</label><label class="setting-row"><input id="motion-setting" type="checkbox" ${state.reducedMotion ? "checked" : ""}>Reduce motion</label><p class="muted">Progress stays in this browser. No account, tracking or online leaderboard.</p><button id="reset-save">Start a new adventure</button><div id="reset-confirm" hidden><p>This clears adventure progress, coins and learning notes on this device. Your old MATH-Warefare scores are untouched.</p><button id="reset-yes">Clear this adventure</button> <button id="reset-no">Keep my save</button></div>`,
  );
  bindClose();
  $("mute-setting").onchange = () => {
    state.muted = $("mute-setting").checked;
    refresh();
  };
  $("motion-setting").onchange = () => {
    state.reducedMotion = $("motion-setting").checked;
    refresh();
  };
  $("reset-save").onclick = () => {
    $("reset-confirm").hidden = false;
  };
  $("reset-no").onclick = () => {
    $("reset-confirm").hidden = true;
  };
  $("reset-yes").onclick = () => {
    Object.assign(state, fresh());
    world.path = [];
    world.follow = { ...state.player };
    refresh();
    close();
    toast("A new adventure begins. Mira is waiting.");
  };
}
function about() {
  open(
    modalHead("MATH-WAREFARE", "Small answers. Big adventures.") +
      '<p>Lalith’s mental maths project, expanded into a village adventure. Built with JavaScript, Canvas and Vite. The adventure works without a maths API.</p><p>Characters, animals, furniture, cave tiles and fantasy battlers by <a href="https://limezu.itch.io/" target="_blank" rel="noreferrer">LimeZu</a>, used from Lalith’s locally supplied paid packs. Artwork remains the artist’s property.</p><p>This expansion was substantially implemented with Codex AI assistance. It should not be represented as human-only work or as verified compliance with a 30% AI limit. Stardance review and rewards are decided by its organisers.</p><p class="muted">Questions are practice aids. Number size changes difficulty, not curriculum certification.</p><a href="https://github.com/Hustlenix/math-warfare" target="_blank" rel="noreferrer">Project source ↗</a>',
  );
  bindClose();
}
panel.addEventListener("cancel", (e) => {
  e.preventDefault();
  battle ? pause() : close();
});
document.addEventListener("keydown", (e) => {
  if (panel.open) {
    if (battle?.feedback && e.key === "Enter" && !battle.pausedAt) {
      e.preventDefault();
      advance();
    }
    return;
  }
  if (e.key === ' ' && e.target instanceof Element && e.target.closest('button,a,input,select,textarea')) return;
  if (
    [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "w",
      "a",
      "s",
      "d",
    ].includes(e.key)
  ) {
    e.preventDefault();
    world?.keys.add(e.key);
  }
  if (e.key.toLowerCase() === "e" || e.key === " ") {
    e.preventDefault();
    world?.interact();
  }
});
document.addEventListener("keyup", (e) => world?.keys.delete(e.key));
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
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    world.keys.add(el.dataset.direction);
  };
  el.onpointerup =
    el.onpointercancel =
    el.onlostpointercapture =
      () => world.keys.delete(el.dataset.direction);
}
$("touch-toggle").onclick = () => {
  $("touch-controls").hidden = !$("touch-controls").hidden;
};
$("interact").onclick = () => world.interact();
$("help-route").onclick = $("next-quest").onclick = route;
$("practice").onclick = arena;
$("daily").onclick = daily;
$("mistakes").onclick = notes;
$("collection").onclick = collection;
$("settings").onclick = settings;
$("about").onclick = about;
$("sound").onclick = () => {
  state.muted = !state.muted;
  refresh();
  chime();
};
async function boot() {
  try {
    const names = [
      "person1",
      "person2",
      "person3",
      "person4",
      "person5",
      "person6",
      "person7",
      "person8",
      "cat",
      "frog",
      "butterfly",
      "desk",
      "books",
      "sofa",
      "plant",
      "rug",
      "chair",
      "cabinet",
      "fungus",
      "king",
      "cleric",
      "scout",
      "stone",
      "caveWall",
      "mushrooms",
      "throne",
      "chest",
      "crates",
      "bed",
      "caveSteps",
      "owl",
      "slime",
      "boss",
      "beetle",
      ...[
        "person1",
        "person2",
        "person3",
        "person4",
        "person5",
        "person6",
        "person7",
        "person8",
        "fungus",
        "king",
        "cleric",
        "scout",
      ].map((n) => n + "Face"),
    ];
    await Promise.all(
      names.map(
        (name) =>
          new Promise((resolve, reject) => {
            const im = new Image();
            im.onload = () => {
              art[name] = im;
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
    refresh();
    if (matchMedia("(pointer: coarse)").matches)
      $("touch-controls").hidden = false;
    if (!state.completed.length) {
      open(
        '<div class="welcome-stamp">✦</div><span class="eyebrow">A MATHS ADVENTURE</span><h2>A little maths.<br>A lot of heart.</h2><p>Numberglen has lost its light. Walk around, meet your neighbours and use bright ideas to bring it back.</p><div class="welcome-controls"><span>01 · Meet Mira in the square</span><span>02 · Help villagers through maths</span><span>03 · Explore the mushroom cave</span></div><button id="begin" class="primary full">Step into Numberglen →</button><p class="muted">WASD / arrows or click to walk. E to talk.<br>On mobile, tap a neighbour or use touch controls.</p>',
      );
      $("begin").onclick = () => {
        close();
        $("world").focus();
      };
    }
  } catch (err) {
    $("zone-title").textContent = "The artwork could not load.";
    $("scene-caption").textContent =
      "Run the local asset importer, then reload. See the README.";
    toast(err.message);
    console.error(err);
  }
}
boot();
