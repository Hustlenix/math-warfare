// MATH WARFARE: OMEGA ULTRA — bootstrap + UI wiring.
// Owns the DOM; engine/fx/api modules stay pure.
// Phase machine: 'question' -> 'feedback' (correct/fail feedback window) ->
// 'question' (advance). On a miss the player enters 'revenge' (REDEEM YOUR
// PRIDE!) before the fail feedback (classic only). Blitz replaces the
// per-question timer with a battle clock that never stops until zero.

import './styles.css';
import confetti from 'canvas-confetti';
import { SCREENS, canTransition, game, resetGame, startTimer, stopTimer } from './engine/state.js';
import { generateQuestion, settingsFor } from './engine/questions.js';
import {
  multiplierFor,
  xpForCorrect,
  isComboUp,
  isMemeStreak,
  isBossQuestion,
  isBoostDrop,
  isShieldEarn,
  rankFor,
  MAX_SHIELDS,
} from './engine/scoring.js';
import { playCorrect, playCombo, playWrong, playBoss, toggleMuted, isMuted, unlockAudio } from './fx/audio.js';
import { setChaos, shakeScreen } from './fx/chaos.js';
import { prefetchMemes, showMeme } from './api/memes.js';
import { addBattleResult, getTopLocal, remoteLeaderboard, getPlayerXp, getBestBattle, getLastBattle } from './api/leaderboard.js';

const REVENGE_TIME = 5;
const BOOST_LABEL = { '2x': '2× POINTS', reveal: 'REVEAL', bomb: 'BOMB' };
const BOOST_FACES = ['2x', 'reveal', 'bomb'];

const $ = (id) => document.getElementById(id);

const els = {
  start: $('screen-start'),
  quiz: $('screen-quiz'),
  results: $('screen-results'),
  form: $('start-form'),
  name: $('player-name'),
  difficulty: $('difficulty'),
  battleType: $('battle-type'),
  totalQs: $('total-qs'),
  qCount: $('q-count'),
  combo: $('combo-text'),
  streak: $('streak-text'),
  equation: $('equation'),
  answer: $('answer'),
  timerFill: $('timer-fill'),
  timerBar: $('timer-bar'),
  quizCard: $('quiz-card'),
  muteBtn: $('mute-btn'),
  shieldChip: $('shield-chip'),
  bossBanner: $('boss-banner'),
  revealFlash: $('reveal-flash'),
  revengeBox: $('revenge-box'),
  revengeBtn: $('revenge-btn'),
  revengeCount: $('revenge-count'),
  finalScore: $('final-score'),
  resultsTitle: $('results-title'),
  finalXp: $('final-xp'),
  pbStamp: $('pb-stamp'),
  rankText: $('rank-text'),
  pbDelta: $('pb-delta'),
  rematch: $('rematch-btn'),
  menu: $('menu-btn'),
  pause: $('pause-overlay'),
  resume: $('resume-btn'),
  quit: $('quit-btn'),
  meme: $('meme-overlay'),
  lbLocal: $('lb-local'),
  lbGlobal: $('lb-global'),
  playerStatus: $('player-status'),
};

const SCREEN_ELS = { [SCREENS.START]: els.start, [SCREENS.QUIZ]: els.quiz, [SCREENS.RESULTS]: els.results };

let currentScreen = SCREENS.START;
let phase = 'question'; // 'question' | 'feedback' | 'revenge'
let q = null; // current question { text, answer, op, mode, boss }
let bossBannerToken = 0;

function showScreen(name) {
  if (name === currentScreen) return;
  if (!canTransition(currentScreen, name)) return;
  Object.values(SCREEN_ELS).forEach((s) => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  const target = SCREEN_ELS[name];
  target.classList.remove('hidden');
  void target.offsetWidth; // restart popIn animation
  target.classList.add('active');
  currentScreen = name;
}

let pendingAdvance = null;
function scheduleAdvance(ms) {
  clearAdvance();
  pendingAdvance = window.setTimeout(() => {
    pendingAdvance = null;
    advance();
  }, ms);
}

function clearAdvance() {
  if (pendingAdvance !== null) {
    window.clearTimeout(pendingAdvance);
    pendingAdvance = null;
  }
}

// ---------- quiz flow ----------

function comboText() {
  const base = `x${multiplierFor(game.streak)} COMBO`;
  return game.boost ? `${base} · 🎲 ${BOOST_LABEL[game.boost]}` : base;
}

function updateShield() {
  els.shieldChip.textContent = `🛡×${game.shield}`;
}

function hideRevenge() {
  els.revengeBox.classList.add('hidden');
}

function showBossBanner() {
  const token = ++bossBannerToken;
  els.bossBanner.classList.remove('hidden');
  void els.bossBanner.offsetWidth; // restart popIn
  window.setTimeout(() => {
    if (token === bossBannerToken) els.bossBanner.classList.add('hidden');
  }, 1200);
}

function newQuestion() {
  if (game.format === 'classic' && game.current >= game.total) return endBattle();
  // If the player paused mid-feedback, the pause is lifted when the next
  // question arrives (timer semantics stay clean).
  if (!els.pause.classList.contains('hidden')) {
    els.pause.classList.add('hidden');
    els.pause.setAttribute('aria-hidden', 'true');
  }
  game.current += 1;
  const boss = isBossQuestion(game.current);
  q = generateQuestion(game.mode, game.ops, { boss });
  phase = 'question';
  if (game.format === 'blitz') {
    els.qCount.textContent = `⚡ ${Math.ceil(game.timeLeft)}s${boss ? ' ⚠' : ''}`;
  } else {
    els.qCount.textContent = `${game.current}/${game.total}${boss ? ' ⚠ BOSS' : ''}`;
  }
  els.equation.textContent = q.text;
  els.equation.classList.toggle('boss-equation', boss);
  els.combo.textContent = comboText();
  els.streak.textContent = '';
  els.answer.value = '';
  els.answer.classList.remove('shake-anim');
  els.equation.classList.remove('eq-bounce', 'hit-punch');
  els.revealFlash.classList.add('hidden');
  hideRevenge();

  if (boss) {
    showBossBanner();
    playBoss();
  }

  // BOMB boost: auto-dodge the next question (no timer, no XP).
  if (game.boost === 'bomb') {
    game.boost = null;
    els.streak.textContent = '💣 BOMB — QUESTION DODGED!';
    if (game.format === 'classic') updateTimer(0);
    scheduleAdvance(800);
    return;
  }

  // REVEAL boost: flash the answer for 1s, then consume.
  if (game.boost === 'reveal') {
    game.boost = null;
    els.revealFlash.textContent = `ANSWER: ${q.answer}`;
    els.revealFlash.classList.remove('hidden');
    window.setTimeout(() => els.revealFlash.classList.add('hidden'), 1000);
  }

  // Blitz: no per-question timer — the battle clock (started in startBattle)
  // keeps running through every question.
  if (game.format === 'blitz') {
    els.answer.focus();
    return;
  }

  const time = boss ? settingsFor(game.mode).bossTime : settingsFor(game.mode).time;
  game.timeLeft = time;
  game.maxTime = time;
  els.timerBar.setAttribute('aria-valuemax', String(time));
  updateTimer(time);
  startTimer(updateTimer, () => judgeFail('TIME OUT!'));
  els.answer.focus();
}

function updateTimer(timeLeft) {
  els.timerFill.style.width = `${(timeLeft / game.maxTime) * 100}%`;
  els.timerBar.setAttribute('aria-valuenow', String(Math.round(timeLeft)));
  els.timerBar.classList.toggle('timer-low', timeLeft <= game.maxTime * 0.25);
  if (game.format === 'blitz') {
    els.qCount.textContent = `⚡ ${Math.ceil(timeLeft)}s${q.boss ? ' ⚠' : ''}`;
  }
}

function playFlash(className) {
  els.quizCard.classList.remove('flash-good', 'flash-bad');
  void els.quizCard.offsetWidth;
  els.quizCard.classList.add(className);
}

// Floating reward text: spawns over the equation, drifts up, dies. Random
// horizontal jitter keeps simultaneous popups from stacking on one spot.
function floatText(text, { variant = '' } = {}) {
  const el = document.createElement('div');
  el.className = `float-text${variant ? ` float-${variant}` : ''}`;
  el.textContent = text;
  el.style.left = `calc(50% + ${Math.round(Math.random() * 90 - 45)}px)`;
  els.quizCard.appendChild(el);
  window.setTimeout(() => el.remove(), 1200);
}

// Confetti burst anchored at an element's on-screen position.
function confettiAt(el, { count = 40, spread = 70, startVelocity = 32 } = {}) {
  const r = el.getBoundingClientRect();
  confetti({
    particleCount: count,
    spread,
    startVelocity,
    ticks: 150,
    gravity: 0.8,
    origin: {
      x: (r.left + r.width / 2) / window.innerWidth,
      y: (r.top + r.height / 2) / window.innerHeight,
    },
  });
}

function submitAnswer() {
  if (phase === 'revenge') return revengeSubmit();
  if (phase !== 'question') return;
  const raw = els.answer.value.trim();
  if (raw === '') return; // ignore empty
  const val = Number(raw);
  if (Number.isNaN(val)) return; // ignore NaN
  if (Math.abs(val - q.answer) < 0.01) correct();
  else judgeFail('WRONG!');
}

function correct() {
  phase = 'feedback';
  if (game.format === 'classic') stopTimer(); // blitz: the battle clock never stops
  game.score += 1;
  game.streak += 1;

  const mult = multiplierFor(game.streak);
  const xp = xpForCorrect(game.streak, { boss: q.boss, boost: game.boost === '2x' });
  if (game.boost === '2x') game.boost = null;
  game.xp += xp;

  els.combo.textContent = comboText();
  els.streak.textContent = `🔥 STREAK: ${game.streak} 🔥`;

  if (isShieldEarn(game.streak) && game.shield < MAX_SHIELDS) {
    game.shield += 1;
    updateShield();
    els.streak.textContent = `🛡 SHIELD EARNED! (${game.shield}/${MAX_SHIELDS})`;
    floatText('🛡 SHIELD!');
  }

  // Equation reaction: slam (boss) or bounce. The punch doubles as the
  // hit-stop — the advance is also held ~200ms longer on boss kills.
  els.equation.classList.remove('eq-bounce', 'hit-punch');
  void els.equation.offsetWidth;
  if (q.boss) {
    els.equation.classList.add('hit-punch');
    confettiAt(els.answer, { count: 120, spread: 120, startVelocity: 40 });
    floatText(`BOSS DOWN! +${xp} XP`, { variant: 'boss' });
  } else {
    els.equation.classList.add('eq-bounce');
    floatText(`+${xp} XP`);
  }
  playFlash('flash-good');

  // Audio climbs with the streak; combo-ups also pop a small burst.
  if (isComboUp(game.streak)) {
    playCombo(game.streak);
    confettiAt(els.answer, { count: 36, spread: 70 });
  } else {
    playCorrect(game.streak);
  }

  if (isMemeStreak(game.streak)) showMeme(els.meme, 'win');
  if (isBoostDrop(game.streak)) rollBoost();

  scheduleAdvance(q.boss ? 700 : 500);
}

function rollBoost() {
  game.boost = BOOST_FACES[Math.floor(Math.random() * BOOST_FACES.length)];
  els.combo.textContent = comboText();
  els.streak.textContent = `🎲 BOOST DIE: ${BOOST_LABEL[game.boost]}!`;
}

// Miss (wrong answer or timer out). A held shield absorbs the miss without
// breaking the streak; otherwise the player gets a REVENGE window (classic)
// or goes straight to the fail feedback (blitz — the clock keeps running).
function judgeFail(reason) {
  if (phase !== 'question') return;
  if (game.format === 'classic') stopTimer();

  if (game.shield > 0) {
    phase = 'feedback';
    game.shield -= 1;
    updateShield();
    els.combo.textContent = comboText();
    els.streak.textContent = '🛡 SHIELD SAVED YOUR STREAK!';
    floatText('🛡 SAVED!');
    playWrong();
    playFlash('flash-bad');
    scheduleAdvance(1100);
    return;
  }

  game.streak = 0;
  els.combo.textContent = comboText();
  playWrong();
  shakeScreen();
  if (game.format === 'blitz') failFeedback(reason);
  else startRevenge(reason);
}

// Shared miss feedback window. Never touches the timer — classic callers
// already stopped theirs, and in blitz the battle clock must keep running.
function failFeedback(reason) {
  phase = 'feedback';
  hideRevenge();
  els.streak.textContent = reason === 'TIME OUT!' ? 'TIME OUT!' : 'WRONG!';
  playWrong();
  els.answer.classList.remove('shake-anim');
  void els.answer.offsetWidth;
  els.answer.classList.add('shake-anim');
  playFlash('flash-bad');
  shakeScreen();
  showMeme(els.meme, 'fail');
  scheduleAdvance(1800);
}

function failCommitted(reason) {
  if (phase !== 'revenge') return;
  stopTimer(); // stops the revenge countdown — blitz never reaches this path
  failFeedback(reason);
}

function startRevenge(reason) {
  phase = 'revenge';
  els.streak.textContent = reason === 'TIME OUT!' ? 'TIME OUT! — REDEEM YOUR PRIDE!' : 'WRONG! — REDEEM YOUR PRIDE!';
  els.revengeCount.textContent = String(REVENGE_TIME);
  els.revengeBox.classList.remove('hidden');
  game.timeLeft = REVENGE_TIME;
  game.maxTime = REVENGE_TIME;
  startTimer(
    (t) => {
      els.revengeCount.textContent = String(Math.ceil(t));
    },
    () => failCommitted('TIME OUT!')
  );
  els.answer.focus();
}

function revengeSubmit() {
  if (phase !== 'revenge') return;
  const raw = els.answer.value.trim();
  if (raw === '') return;
  const val = Number(raw);
  if (Number.isNaN(val)) return;
  if (Math.abs(val - q.answer) < 0.01) revengeCorrect();
  else failCommitted('WRONG!');
}

function revengeCorrect() {
  phase = 'feedback';
  stopTimer();
  hideRevenge();
  // Streak is already broken — redeemed answers pay half XP (x1 multiplier).
  const xp = xpForCorrect(0, { boss: q.boss, revenge: true });
  game.xp += xp;
  els.streak.textContent = `PRIDE RESTORED! +${xp} XP`;
  floatText(`PRIDE +${xp} XP`);
  playCorrect();
  els.equation.classList.remove('eq-bounce', 'hit-punch');
  void els.equation.offsetWidth;
  els.equation.classList.add('eq-bounce');
  playFlash('flash-good');
  scheduleAdvance(600);
}

function advance() {
  if (game.format === 'classic' && game.current >= game.total) endBattle();
  else newQuestion();
}

function endBattle() {
  clearAdvance();
  stopTimer();
  setChaos(false, els.quizCard);
  hideRevenge();

  const prevTotal = getPlayerXp(game.name);
  const prevBest = getBestBattle(game.name);
  const prevLast = getLastBattle(game.name);
  const prevRank = rankFor(prevTotal);

  addBattleResult(game.name, game.xp);
  const newRank = rankFor(getPlayerXp(game.name));

  els.resultsTitle.textContent = game.format === 'blitz' ? "TIME'S UP!" : 'BATTLE ENDED!';
  els.finalScore.textContent =
    game.format === 'blitz' ? `${game.score} ✓ / ${game.current} SEEN` : `${game.score}/${game.total}`;
  els.finalXp.textContent = `XP EARNED: ${game.xp}`;

  const isNewPb = game.xp > 0 && game.xp > prevBest;
  els.pbStamp.classList.toggle('hidden', !isNewPb);

  els.rankText.textContent =
    newRank.index > prevRank.index ? `RANK UP! → ${newRank.name}` : `RANK: ${newRank.name}`;

  if (prevLast > 0) {
    const d = game.xp - prevLast;
    els.pbDelta.textContent = `${d >= 0 ? '▲ +' : '▼ −'}${Math.abs(d)} XP vs last battle · PB ${Math.max(prevBest, game.xp)} XP`;
  } else {
    els.pbDelta.textContent = `PERSONAL BEST: ${Math.max(prevBest, game.xp)} XP`;
  }

  remoteLeaderboard.submitScore({ name: game.name, xp: game.xp }).catch(() => {});

  showScreen(SCREENS.RESULTS);
  confetti({ particleCount: 500, spread: 100, origin: { y: 0.6 } });
}

// ---------- battle lifecycle ----------

function startBattle() {
  const name = els.name.value.trim();
  if (!name) {
    alert('WHO IS PLAYING? Enter a name!');
    els.name.focus();
    return;
  }
  const mode = els.difficulty.value;
  const ops = [...els.form.querySelectorAll('input[name="ops"]:checked')].map((c) => c.value);
  if (ops.length === 0) {
    alert('PICK YOUR WEAPONS! Choose at least one operation.');
    return;
  }
  const battleType = els.battleType.value;
  const isBlitz = battleType !== 'classic';
  const duration = isBlitz ? parseInt(battleType, 10) : 0;
  let total = parseInt(els.totalQs.value, 10);
  if (Number.isNaN(total) || total < 1) total = 10;
  if (total > 100) total = 100;

  unlockAudio();
  clearAdvance();
  resetGame({
    name,
    mode,
    ops,
    total: isBlitz ? 0 : total,
    format: isBlitz ? 'blitz' : 'classic',
    duration,
    time: isBlitz ? duration : settingsFor(mode).time,
  });
  updateShield();
  showScreen(SCREENS.QUIZ);
  setChaos(mode === 'god', els.quizCard);
  if (isBlitz) {
    // Battle clock: never stops until it hits zero — every second counts.
    els.timerBar.setAttribute('aria-valuemax', String(duration));
    startTimer(updateTimer, endBattle);
  }
  newQuestion();
}

function rematch() {
  clearAdvance();
  resetGame({
    name: game.name,
    mode: game.mode,
    ops: game.ops,
    total: game.total,
    format: game.format,
    duration: game.duration,
    time: game.format === 'blitz' ? game.duration : settingsFor(game.mode).time,
  });
  updateShield();
  showScreen(SCREENS.QUIZ);
  setChaos(game.mode === 'god', els.quizCard);
  if (game.format === 'blitz') {
    els.timerBar.setAttribute('aria-valuemax', String(game.duration));
    startTimer(updateTimer, endBattle);
  }
  newQuestion();
}

function toMenu() {
  clearAdvance();
  stopTimer();
  setChaos(false, els.quizCard);
  hideRevenge();
  showScreen(SCREENS.START);
  renderLocalLB();
  renderGlobalLB();
  updatePlayerStatus();
}

// ---------- pause ----------

function pause() {
  if (currentScreen !== SCREENS.QUIZ) return;
  if (phase === 'feedback') return; // no pausing mid-feedback window
  stopTimer();
  els.pause.classList.remove('hidden');
  els.pause.setAttribute('aria-hidden', 'false');
  els.resume.focus();
}

function resume() {
  els.pause.classList.add('hidden');
  els.pause.setAttribute('aria-hidden', 'true');
  if (currentScreen !== SCREENS.QUIZ) return;
  game.timeLeft = Math.max(0.1, game.timeLeft);
  if (game.format === 'blitz') {
    startTimer(updateTimer, endBattle); // battle clock resumes
  } else if (phase === 'revenge') {
    startTimer(
      (t) => {
        els.revengeCount.textContent = String(Math.ceil(t));
      },
      () => failCommitted('TIME OUT!')
    );
  } else if (phase === 'question') {
    startTimer(updateTimer, () => judgeFail('TIME OUT!'));
  }
  els.answer.focus();
}

function quit() {
  clearAdvance();
  stopTimer();
  els.pause.classList.add('hidden');
  els.pause.setAttribute('aria-hidden', 'true');
  toMenu();
}

// ---------- leaderboard ----------

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

// Highlight + rank the current player's own row.
function lbRows(rows, highlightName = '') {
  if (!rows.length) return '<li class="lb-empty">NO BATTLES YET</li>';
  return rows
    .map((r, i) => {
      const isYou = highlightName !== '' && r.name === highlightName;
      const rankSuffix = isYou ? ` · ${rankFor(r.xp).name}` : '';
      return `<li${isYou ? ' class="lb-you"' : ''}><span>${i + 1}. ${escapeHtml(r.name)}${rankSuffix}</span><span>${r.xp} XP</span></li>`;
    })
    .join('');
}

function renderLocalLB() {
  els.lbLocal.innerHTML = lbRows(getTopLocal(5), els.name.value.trim());
}

async function renderGlobalLB() {
  els.lbGlobal.innerHTML = '<li class="lb-empty">LOADING...</li>';
  try {
    els.lbGlobal.innerHTML = lbRows(await remoteLeaderboard.getScores(5));
  } catch {
    els.lbGlobal.innerHTML = '<li class="lb-empty">GLOBAL OFFLINE</li>';
  }
}

function updatePlayerStatus() {
  const name = els.name.value.trim();
  if (!name) {
    els.playerStatus.textContent = 'ENTER YOUR CALLSIGN TO SEE YOUR RANK';
    return;
  }
  const total = getPlayerXp(name);
  const best = getBestBattle(name);
  els.playerStatus.textContent =
    best > 0
      ? `${rankFor(total).name} · TOTAL ${total} XP · BEST BATTLE ${best} XP`
      : `${rankFor(total).name} · 0 XP — GO FIGHT!`;
}

// ---------- mute ----------

function syncMuteBtn() {
  const muted = isMuted();
  els.muteBtn.textContent = muted ? '🔇' : '🔊';
  els.muteBtn.setAttribute('aria-pressed', String(muted));
  els.muteBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
}

// ---------- boot ----------

function init() {
  syncMuteBtn();
  renderLocalLB();
  renderGlobalLB();
  updateShield();
  prefetchMemes(); // background — never blocks the game

  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    startBattle();
  });
  // TIME ATTACK ignores the question count — grey it out.
  const syncTotalQs = () => {
    els.totalQs.disabled = els.battleType.value !== 'classic';
  };
  els.battleType.addEventListener('change', syncTotalQs);
  syncTotalQs();
  els.name.addEventListener('input', () => {
    updatePlayerStatus();
    renderLocalLB();
  });
  els.rematch.addEventListener('click', rematch);
  els.menu.addEventListener('click', toMenu);
  els.resume.addEventListener('click', resume);
  els.quit.addEventListener('click', quit);
  els.revengeBtn.addEventListener('click', revengeSubmit);
  els.muteBtn.addEventListener('click', () => {
    toggleMuted();
    syncMuteBtn();
  });
  els.answer.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitAnswer();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (els.pause.classList.contains('hidden')) pause();
      else resume();
    }
  });
}

init();
