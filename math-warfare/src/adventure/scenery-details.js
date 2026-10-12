// Authored ground details cluster around places, rather than covering every tile.
// They are decorative; map-layout.js remains the collision authority.
const GRASS = [
  [2.7, 11.7], [6.2, 12.0], [12.4, 15.8], [18.6, 15.6],
  [8.8, 22.2], [10.4, 23.0], [24.2, 22.6], [27.5, 23.2],
  [4.6, 28.6], [6.1, 29.5], [11.7, 30.7], [19.7, 30.9],
  [25.8, 32.3], [27.6, 36.8], [32.5, 36.0], [35.8, 39.0],
  [45.2, 15.8], [47.2, 20.8], [52.8, 21.7], [56.2, 26.7],
  [54.2, 36.1], [57.5, 36.8],
];
const FLOWERS = [
  [5.0, 16.2, "#e5d29b"], [5.4, 16.4, "#e5d29b"],
  [6.7, 21.9, "#c8b4c3"], [7.0, 22.0, "#c8b4c3"],
  [17.9, 32.7, "#e1c287"], [18.2, 32.4, "#e1c287"],
  [13.2, 36.8, "#c8b4c3"], [13.5, 37.0, "#c8b4c3"],
  [53.0, 18.8, "#e5d29b"], [53.4, 19.1, "#e5d29b"],
];
export function drawSceneryDetails(w) {
  const r = w.rect.bind(w);
  for (const [tx, ty] of GRASS) {
    const x = Math.round(tx * 32 / 2) * 2, y = Math.round(ty * 32 / 2) * 2;
    for (const [dx, dy] of [[0, 0], [10, 4], [18, -2]]) {
      r(x + dx, y + dy, 2, 6, "#537548");
      r(x + dx - 2, y + dy + 2, 2, 2, "#9cac73");
      r(x + dx + 2, y + dy - 2, 2, 4, "#9cac73");
    }
  }
  for (const [tx, ty, color] of FLOWERS) {
    const x = Math.round(tx * 16) * 2, y = Math.round(ty * 16) * 2;
    r(x, y, 2, 8, "#55764b");
    r(x - 2, y - 2, 6, 4, color);
    r(x, y - 2, 2, 2, "#f1dfaa");
  }
}
export function drawSquareApron(w) {
  const r = w.rect.bind(w);
  // Draw before the lantern so paving never covers the repairable landmark.
  for (const [tx, ty] of [[15, 11], [16, 11], [17, 11], [15, 12], [16, 12], [17, 12]]) {
    r(tx * 32 + 2, ty * 32 + 2, 28, 28, "#b9b296");
    r(tx * 32 + 2, ty * 32 + 14, 28, 2, "#a29f84");
    r(tx * 32 + 12, ty * 32 + 2, 2, 12, "#a29f84");
    r(tx * 32 + 20, ty * 32 + 16, 2, 14, "#a29f84");
  }
}
