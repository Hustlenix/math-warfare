// Small, hand-drawn symbols on one 16px grid; no emoji/font substitutions.
const paths = {
  journal: '<path d="M2 2h11v12H2zM5 2v12M7 5h4M7 8h4M7 11h3"/>',
  menu: '<path d="M2 4h12M2 8h12M2 12h12"/>',
  fullscreen: '<path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/>',
  settings: '<path d="M6 1h4v3h3v2h2v4h-3v3h-2v2H6v-3H3v-2H1V6h3V3h2zM6 6h4v4H6z"/>',
  close: '<path d="m3 3 10 10M13 3 3 13"/>',
  pause: '<path d="M5 3v10M11 3v10"/>',
};
export function icon(name) {
  return `<svg class="game-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">${paths[name] ?? paths.menu}</svg>`;
}
export function mountIcons(root = document) {
  for (const node of root.querySelectorAll('[data-icon]')) node.innerHTML = icon(node.dataset.icon);
}
