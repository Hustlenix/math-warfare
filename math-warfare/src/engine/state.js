// Screen state machine + game state. Pure JS, no DOM.
// Screen flow: START -> QUIZ -> RESULTS (plus QUIZ -> START quit, RESULTS -> QUIZ rematch).

export const SCREENS = Object.freeze({
  START: 'START',
  QUIZ: 'QUIZ',
  RESULTS: 'RESULTS',
});

const TRANSITIONS = Object.freeze({
  [SCREENS.START]: Object.freeze(new Set([SCREENS.QUIZ])),
  [SCREENS.QUIZ]: Object.freeze(new Set([SCREENS.START, SCREENS.RESULTS])),
  [SCREENS.RESULTS]: Object.freeze(new Set([SCREENS.START, SCREENS.QUIZ])),
});

export function canTransition(from, to) {
  return Boolean(TRANSITIONS[from] && TRANSITIONS[from].has(to));
}

// Shared game state. `timer` holds the interval id owned by the state module.
export const game = {
  name: '',
  mode: 'basic',
  ops: ['+'],
  format: 'classic', // 'classic' (N questions) | 'blitz' (battle clock)
  duration: 0, // blitz clock length in seconds
  total: 10,
  current: 0,
  score: 0,
  streak: 0,
  xp: 0,
  timeLeft: 10,
  maxTime: 10,
  timer: null,
  shield: 0, // streak shields held (max MAX_SHIELDS from scoring)
  boost: null, // one-use boost die face: '2x' | 'reveal' | 'bomb' | null
};

export function resetGame(settings) {
  game.name = settings.name || '';
  game.mode = settings.mode || 'basic';
  game.ops = Array.isArray(settings.ops) && settings.ops.length ? [...settings.ops] : ['+'];
  game.format = settings.format === 'blitz' ? 'blitz' : 'classic';
  game.duration = Number.isFinite(settings.duration) && settings.duration > 0 ? settings.duration : 0;
  // 0 is valid for blitz (uncapped) — only fall back when unset.
  game.total = Number.isFinite(settings.total) ? settings.total : 10;
  game.current = 0;
  game.score = 0;
  game.streak = 0;
  game.xp = 0;
  game.timeLeft = settings.time || 10;
  game.maxTime = game.timeLeft;
  game.shield = 0;
  game.boost = null;
  stopTimer();
}

export function startTimer(onTick, onExpire, intervalMs = 100) {
  stopTimer();
  const step = intervalMs / 1000;
  game.timer = window.setInterval(() => {
    game.timeLeft = Math.max(0, game.timeLeft - step);
    onTick(game.timeLeft);
    if (game.timeLeft <= 0) {
      stopTimer();
      onExpire();
    }
  }, intervalMs);
}

export function stopTimer() {
  if (game.timer !== null) {
    window.clearInterval(game.timer);
    game.timer = null;
  }
}
