// WebAudio oscillator synth. No audio files, no dependencies.
// Mute state persists to localStorage. Never throws — audio must not crash the game.

const MUTE_KEY = 'warfare_muted';

let ctx = null;
let muted = false;

try {
  muted = localStorage.getItem(MUTE_KEY) === '1';
} catch {
  muted = false;
}

function ensureCtx() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

// Call from a user gesture (ENTER BATTLE click) to unlock audio on mobile.
export function unlockAudio() {
  ensureCtx();
}

function tone({ f0, f1, dur, type = 'square', volume = 0.12 }) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    const t0 = c.currentTime;
    osc.frequency.setValueAtTime(Math.max(1, f0), t0);
    if (f1 > f0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    } else {
      osc.frequency.linearRampToValueAtTime(Math.max(1, f1), t0 + dur);
    }
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    /* never crash the game over audio */
  }
}

// Rising-pitch combo: each correct answer in a streak lands a slightly higher
// tone (+4.5% per streak, capped at 2x) with ±5% random jitter so repeated
// sounds never feel identical. The climb itself is the reward audio.
const MAX_PITCH = 2.0;
function pitchFor(streak) {
  const ramp = Math.min(MAX_PITCH, 1 + (streak || 0) * 0.045);
  return ramp * (0.95 + Math.random() * 0.1);
}

// correct: 600 -> 1200 Hz ramp over 0.2s (pitched up with the streak)
export const playCorrect = (streak = 0) => {
  const p = pitchFor(streak);
  tone({ f0: 600 * p, f1: 1200 * p, dur: 0.2, type: 'square' });
};

// combo: 800 -> 1500 Hz over 0.1s (pitched up with the streak)
export const playCombo = (streak = 0) => {
  const p = pitchFor(streak);
  tone({ f0: 800 * p, f1: 1500 * p, dur: 0.1, type: 'square', volume: 0.14 });
};

// wrong / time out: sawtooth 150 -> 50 Hz over 0.3s
export const playWrong = () => tone({ f0: 150, f1: 50, dur: 0.3, type: 'sawtooth', volume: 0.16 });

// boss horn: two low sawtooth blasts (100->200 then 80->160)
export const playBoss = () => {
  tone({ f0: 100, f1: 200, dur: 0.4, type: 'sawtooth', volume: 0.18 });
  window.setTimeout(
    () => tone({ f0: 80, f1: 160, dur: 0.4, type: 'sawtooth', volume: 0.14 }),
    200
  );
};

export const playTimeOut = playWrong;

export function isMuted() {
  return muted;
}

export function toggleMuted() {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* storage unavailable — in-memory mute still works */
  }
  return muted;
}
