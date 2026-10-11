import './styles.css';
import { generateQuestion, settingsFor } from './engine/questions.js';
import { createSession, parseAnswer, recordAnswer, summarize } from './engine/session.js';
import { read, write, recentRuns, saveRun, addXp } from './engine/storage.js';
import { playCorrect, playCombo, playWrong, playBoss, toggleMuted, isMuted, unlockAudio } from './fx/audio.js';

const $ = id => document.getElementById(id);
const formatNames = { run: 'Adventure', sprint: 'Speed sprint', focus: 'Practice room' };
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let view = 'home', session = null, question = null, phase = 'idle', paused = false;
let frame = null, lastTick = 0, elapsed = 0, feedbackTime = 0, retryQuestions = null, lastSettings = null;

function show(id) {
  ['home', 'battle', 'results'].forEach(name => $(name).classList.toggle('hidden', name !== id));
  view = id;
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function soundState() {
  $('sound').textContent = isMuted() ? 'Sound off' : 'Sound on';
  $('sound').setAttribute('aria-pressed', String(isMuted()));
  $('sound').setAttribute('aria-label', isMuted() ? 'Unmute sound' : 'Mute sound');
}
function syncSetup() {
  const format = document.querySelector('[name="format"]:checked').value;
  const mode = document.querySelector('[name="difficulty"]:checked').value;
  const details = { basic: 'Whole numbers · tables up to 12', pro: 'Negative numbers · decimals · tables up to 20', god: 'Larger numbers · decimal multiplication' };
  $('difficulty-note').textContent = `${details[mode]} · ${format === 'focus' ? 'no time limit' : format === 'sprint' ? '60s per run' : `${settingsFor(mode).time}s per question`}`;
  $('length').disabled = format === 'sprint';
  document.querySelector('[value="run"] + span + .mode-tag').textContent = `${$('length').value} Q`;
  $('setup-error').textContent = '';
}
function settings() {
  return {
    name: $('callsign').value.trim() || 'Player one',
    mode: document.querySelector('[name="difficulty"]:checked').value,
    format: document.querySelector('[name="format"]:checked').value,
    ops: [...document.querySelectorAll('[name="operation"]:checked')].map(el => el.value),
    total: Number($('length').value),
  };
}
function renderHistory() {
  const runs = recentRuns().slice(0, 3);
  $('recent-runs').innerHTML = runs.length ? runs.map(r => `<div class="run-record"><div><b>${escape(r.name)}</b><small>${escape(formatNames[r.format] || 'Practice')} / ${escape(settingsFor(r.mode).label)} · ${r.correct}/${r.attempted} correct</small></div><strong>${r.points} PT</strong></div>`).join('') : '<div class="empty-record"><span aria-hidden="true">✦</span><div><b>Your first run starts here.</b><p>Finish a round to put a score on the board.</p></div></div>';
}
function stopFrame() { if (frame !== null) cancelAnimationFrame(frame); frame = null; }
function startFrame() { stopFrame(); lastTick = performance.now(); frame = requestAnimationFrame(tick); }
function clock() {
  const untimed = session.format === 'focus';
  $('clock-label').textContent = untimed ? 'YOUR PACE' : 'TIME LEFT';
  $('clock').textContent = untimed ? '∞' : `${Math.ceil(session.remaining)}s`;
  $('timer').classList.toggle('hidden', untimed);
  const max = session.format === 'sprint' ? 60 : (question.boss ? settingsFor(session.mode).bossTime : settingsFor(session.mode).time);
  $('timer-fill').style.width = `${Math.max(0, Math.min(100, session.remaining / max * 100))}%`;
  $('timer').setAttribute('aria-valuemax', max);
  $('timer').setAttribute('aria-valuenow', Math.ceil(session.remaining));
  $('timer').classList.toggle('low', session.remaining < 4);
  document.querySelector('.clock').classList.toggle('low', !untimed && session.remaining < 4);
}
function tick(now) {
  if (view !== 'battle' || paused) return;
  const delta = Math.max(0, (now - lastTick) / 1000);
  lastTick = now;
  if (phase === 'question') elapsed += delta;
  if (session.format === 'sprint' || (session.format === 'run' && phase === 'question')) {
    session.remaining = Math.max(0, session.remaining - delta);
    clock();
    if (session.remaining <= 0) {
      if (session.format === 'sprint') {
        if (phase === 'question') recordAnswer(session, question, null, elapsed, 'timeout');
        finish(); return;
      }
      judge(null, 'timeout');
    }
  }
  if (phase === 'feedback') {
    feedbackTime += delta;
    const last = session.records.at(-1);
    if ((last.correct && feedbackTime > .65) || (session.format === 'sprint' && feedbackTime > 1.8)) nextQuestion();
  }
  if (view === 'battle' && !paused) frame = requestAnimationFrame(tick);
}
function updateHud() {
  $('score').textContent = session.points;
  $('streak').textContent = session.streak;
  $('stage-number').textContent = session.format === 'sprint' ? `Q ${session.records.length + 1}` : `${String(session.records.length + 1).padStart(2, '0')} / ${session.total}`;
  const count = session.format === 'sprint' ? Math.max(10, session.records.length + 1) : session.total;
  $('route').innerHTML = Array.from({ length: count }, (_, i) => `<span class="${i < session.records.length ? session.records[i].correct ? 'done' : 'missed' : i === session.records.length ? 'current' : ''}"></span>`).join('');
}
function nextQuestion() {
  if (view !== 'battle' || paused) return;
  if (session.format !== 'sprint' && session.records.length >= session.total) { finish(); return; }
  const number = session.records.length + 1;
  const boss = !retryQuestions && session.format !== 'focus' && number % 10 === 0;
  question = retryQuestions ? { ...retryQuestions[session.records.length], boss: false } : generateQuestion(session.mode, session.ops, { boss });
  phase = 'question'; elapsed = 0; feedbackTime = 0;
  if (session.format === 'run') session.remaining = boss ? settingsFor(session.mode).bossTime : settingsFor(session.mode).time;
  $('equation').textContent = question.text;
  $('question-kicker').textContent = boss ? 'BOSS EQUATION · TRIPLE POINTS' : `${retryQuestions ? 'REPLAY' : 'QUESTION'} ${String(number).padStart(2, '0')}`;
  $('answer').value = ''; $('answer').disabled = false; $('submit').disabled = false; $('skip').disabled = false;
  $('feedback').classList.add('hidden'); $('question-panel').classList.remove('feedback-state');
  $('answer-note').textContent = 'Exact answers, up to 2 decimal places. Enter to check.';
  $('answer').removeAttribute('aria-invalid');
  $('enemy').classList.toggle('boss', boss); $('enemy').textContent = boss ? '×' : '?';
  $('stage').textContent = boss ? 'BOSS AT THE GATE' : retryQuestions ? 'THE PRACTICE ROOM' : 'THE NUMBER FRONTIER';
  updateHud(); clock();
  if (boss) playBoss();
  $('answer').focus({ preventScroll: true });
}
function begin(config, questions = null) {
  stopFrame(); unlockAudio();
  retryQuestions = questions;
  session = createSession({ ...config, total: questions ? questions.length : config.total, format: questions ? 'focus' : config.format });
  lastSettings = { ...config, ops: [...config.ops] };
  phase = 'idle'; paused = false;
  $('battle-mode').textContent = `${questions ? 'Missed question practice' : formatNames[config.format]} / ${settingsFor(config.mode).label}`;
  $('arena-message').textContent = 'ONE ANSWER AT A TIME.';
  show('battle'); nextQuestion(); startFrame();
}
function judge(input, reason = 'answer') {
  if (view !== 'battle' || phase !== 'question' || paused) return;
  const record = recordAnswer(session, question, input, elapsed, reason);
  phase = 'feedback'; feedbackTime = 0;
  $('answer').disabled = true; $('submit').disabled = true; $('skip').disabled = true;
  $('feedback').classList.remove('hidden'); $('feedback').classList.toggle('miss', !record.correct);
  $('question-panel').classList.add('feedback-state');
  $('feedback-title').textContent = record.correct ? `Calculated. +${record.points} points` : reason === 'timeout' ? 'Time’s up. Here’s the answer.' : reason === 'skip' ? 'A useful one to practise.' : 'Close the gap. Try this approach.';
  $('feedback-detail').textContent = record.correct ? `${question.text} = ${question.answer}. ${session.streak >= 3 ? `${session.streak} in a row!` : 'Keep your rhythm.'}` : `${question.text} = ${question.answer}. ${question.hint}`;
  $('answer-note').textContent = record.correct ? 'Next question incoming…' : 'Take a moment to understand it. Enter to continue.';
  $('next').textContent = session.format !== 'sprint' && session.records.length >= session.total ? 'See your results →' : 'Next question →';
  $('score').textContent = session.points; $('streak').textContent = session.streak;
  $('arena-message').textContent = record.correct ? `${session.streak} HIT STREAK. KEEP GOING.` : 'REGROUP. YOU’VE GOT THIS.';
  const arena = document.querySelector('.arena');
  arena.classList.remove('hit', 'miss'); void arena.offsetWidth; arena.classList.add(record.correct ? 'hit' : 'miss');
  if (record.correct) { playCorrect(session.streak); if (session.streak % 3 === 0) playCombo(session.streak); }
  else { playWrong(); $('next').focus({ preventScroll: true }); }
}
function submit() {
  if (paused || view !== 'battle') return;
  if (phase === 'feedback') { nextQuestion(); return; }
  const answer = parseAnswer($('answer').value);
  if (answer === null) {
    $('answer-note').textContent = 'Enter a number, for example 12, −4 or 3.5.';
    $('answer').setAttribute('aria-invalid', 'true'); $('answer').focus(); return;
  }
  judge(answer);
}
function finish() {
  stopFrame(); phase = 'done';
  const stats = summarize(session);
  const signature = JSON.stringify([session.name, session.format, session.mode, [...session.ops].sort(), session.format === 'sprint' ? 60 : session.total, !!retryQuestions]);
  const previous = recentRuns().filter(r => r.signature === signature);
  const best = Math.max(0, ...previous.map(r => r.points));
  const persisted = saveRun({ name: session.name, format: session.format, mode: session.mode, points: session.points, signature, ...stats, date: Date.now() });
  addXp(session.name, session.points);
  $('result-score').textContent = session.points;
  $('result-accuracy').textContent = `${stats.accuracy}%`;
  $('result-speed').textContent = stats.average === null ? '—' : `${stats.average.toFixed(1)}s`;
  $('result-streak').textContent = session.bestStreak;
  $('result-title').textContent = stats.accuracy === 100 ? 'Flawless calculations.' : stats.accuracy >= 70 ? 'That’s a solid run.' : 'Every rep makes you better.';
  $('result-subtitle').textContent = `${session.name}, you got ${stats.correct} of ${stats.attempted} right. ${stats.accuracy < 100 ? 'Your next improvement starts below.' : 'Ready for another challenge?'}`;
  $('result-record').textContent = !persisted ? 'Storage is unavailable. This run is kept for this session only.' : previous.length && session.points > best ? 'NEW PERSONAL BEST FOR THIS SETUP ✦' : previous.length ? `Best for this setup: ${Math.max(best, session.points)} points.` : 'First score saved for this setup. Your journey starts here.';
  const missed = session.records.filter(r => !r.correct);
  $('retry').classList.toggle('hidden', !missed.length);
  $('review-list').innerHTML = missed.length ? missed.map(r => `<article class="review-row"><div><b>${escape(r.question.text)} = ${r.question.answer}</b><small>${r.reason === 'timeout' ? 'Time ran out' : r.reason === 'skip' ? 'Skipped' : `You answered ${escape(r.input)}`}</small></div><p>${escape(r.question.hint)}</p></article>`).join('') : '<div class="perfect">✦ No missed questions this time. Try a harder difficulty or chase a faster average.</div>';
  show('results'); $('result-title').setAttribute('tabindex', '-1'); $('result-title').focus({ preventScroll: true }); renderHistory();
}
function pause() {
  if (view !== 'battle' || paused) return;
  paused = true; stopFrame(); $('pause-dialog').showModal();
}
function resume() {
  if (!paused) return;
  $('pause-dialog').close(); paused = false; startFrame();
  (phase === 'question' ? $('answer') : $('next')).focus({ preventScroll: true });
}
function home() {
  stopFrame(); $('pause-dialog').close(); paused = false; phase = 'idle'; show('home'); renderHistory(); $('setup-title').setAttribute('tabindex', '-1'); $('setup-title').focus({ preventScroll: true });
}

$('setup').addEventListener('change', syncSetup);
$('setup').addEventListener('submit', event => {
  event.preventDefault(); const config = settings();
  if (!config.ops.length) { $('setup-error').textContent = 'Pick at least one operation before you play.'; return; }
  write('warfare_arcade_preferences', config); begin(config);
});
$('answer-form').addEventListener('submit', event => { event.preventDefault(); submit(); });
$('next').addEventListener('click', nextQuestion);
$('skip').addEventListener('click', () => judge(null, 'skip'));
$('sound').addEventListener('click', () => { toggleMuted(); soundState(); });
$('pause').addEventListener('click', pause); $('resume').addEventListener('click', resume); $('quit').addEventListener('click', home);
$('pause-dialog').addEventListener('cancel', event => { event.preventDefault(); resume(); });
$('again').addEventListener('click', () => begin(lastSettings, retryQuestions));
$('back-home').addEventListener('click', home);
$('retry').addEventListener('click', () => begin(lastSettings, session.records.filter(r => !r.correct).map(r => r.question)));
document.querySelectorAll('[data-key]').forEach(button => button.addEventListener('click', () => {
  if (phase !== 'question' || paused) return;
  const key = button.dataset.key, input = $('answer');
  if (key === 'clear') input.value = '';
  else if (key === 'backspace') input.value = input.value.slice(0, -1);
  else if (key === '-') input.value = input.value.startsWith('-') ? input.value.slice(1) : `-${input.value}`;
  else if (key !== '.' || !input.value.includes('.')) input.value = (input.value + key).slice(0, 16);
  // Keep touch input on our keypad; hardware keyboard users get focus back.
  if (matchMedia('(pointer:fine)').matches) input.focus({ preventScroll: true });
}));
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && view === 'battle' && !$('pause-dialog').open) { event.preventDefault(); pause(); }
  if (event.key === 'Enter' && phase === 'feedback' && view === 'battle' && !paused && event.target !== $('next')) { event.preventDefault(); nextQuestion(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

const preferences = read('warfare_arcade_preferences', null);
if (preferences && typeof preferences === 'object') {
  $('callsign').value = typeof preferences.name === 'string' ? preferences.name.slice(0, 24) : '';
  if (['basic', 'pro', 'god'].includes(preferences.mode)) document.querySelector(`[name="difficulty"][value="${preferences.mode}"]`).checked = true;
  if (['run', 'sprint', 'focus'].includes(preferences.format)) document.querySelector(`[name="format"][value="${preferences.format}"]`).checked = true;
  if ([10, 20, 30].includes(preferences.total)) $('length').value = preferences.total;
  if (Array.isArray(preferences.ops)) document.querySelectorAll('[name="operation"]').forEach(el => { el.checked = preferences.ops.includes(el.value); });
}
$('answer').maxLength = 16;
soundState(); syncSetup(); renderHistory();
