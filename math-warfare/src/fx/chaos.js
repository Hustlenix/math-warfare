// GOD-mode chaos FX: tilt + background flip + screen shake.
// Pure CSS class toggling — the keyframes live in styles.css.

export function setChaos(on, container) {
  document.body.classList.toggle('chaos-bg', on);
  if (container) {
    container.classList.toggle('chaos-tilt', on);
  }
}

// Restart the one-shot screen-shake animation (reflow trick).
export function shakeScreen() {
  const b = document.body;
  b.classList.remove('shake-screen');
  void b.offsetWidth;
  b.classList.add('shake-screen');
}
