// Authored frontier scenery. Solid caravan bounds are shared with world collision rules.
export function drawFrontier(w) {
  const T = 32,
    r = w.rect.bind(w),
    c = w.ctx;
  // Layered mesas frame the northern skyline, outside walkable paths.
  for (const [x, y, width, height] of [
    [0, 0, 155, 61],
    [160, 10, 100, 46],
    [610, 0, 110, 62],
    [915, 0, 142, 57],
  ]) {
    r(x, y, width, height, "#8a7351");
    r(x + 12, y, width - 24, 8, "#ae8759");
    r(x, y + height - 13, width, 13, "#6b6948");
    for (let i = 0; i < width; i += 23)
      r(x + i, y + 10, 3, height - 23, "#795d4355");
  }
  function cactus(x, y, s = 1) {
    r(x + 5 * s, y + 24 * s, 25 * s, 6 * s, "#625a3e44");
    r(x + 14 * s, y - 26 * s, 9 * s, 55 * s, "#596b46");
    r(x + 16 * s, y - 28 * s, 5 * s, 3 * s, "#8b9860");
    r(x + 3 * s, y - 10 * s, 7 * s, 21 * s, "#697d50");
    r(x + 5 * s, y + 5 * s, 13 * s, 6 * s, "#697d50");
    r(x + 28 * s, y - 18 * s, 7 * s, 25 * s, "#697d50");
    r(x + 20 * s, y + 1 * s, 14 * s, 6 * s, "#697d50");
    r(x + 16 * s, y - 22 * s, 2 * s, 47 * s, "#95a065");
    r(x + 5 * s, y - 7 * s, 2 * s, 15 * s, "#9ba66b");
  }
  for (const [x, y, s] of [
    [1, 11, 1],
    [31, 9, 1],
    [1, 20, 0.8],
    [30, 23, 0.7],
    [13, 4, 0.7],
    [18, 4, 0.6],
  ])
    cactus(x * T, y * T, s);
  // Timber-front reading room and a bakery with the character of a frontier main street.
  for (const [bx, text] of [
    [3, "BRAM’S BAKERY"],
    [20, "ADA’S READING ROOM"],
  ]) {
    r(bx * T - 4, 3 * T + 30, 9 * T + 8, 27, "#79573d");
    r(bx * T + 8, 3 * T + 32, 9 * T - 16, 3, "#bf9665");
    r((bx + 2) * T, 3 * T + 6, 5 * T, 41, "#98724e");
    r((bx + 2) * T + 5, 3 * T + 10, 5 * T - 10, 3, "#b99567");
    w.label(text, (bx + 4.5) * T, 3 * T + 34, "#f3d9a3", 11);
    for (let x = bx; x <= bx + 8; x += 2) {
      r(x * T + 3, 10 * T + 10, 7, 30, "#866843");
      r(x * T + 3, 10 * T + 10, 7, 3, "#bea379");
    }
    r(bx * T, 11 * T + 8, 9 * T, 8, "#967b50");
  }
  // A striped, weathered caravan: parked, with an awning and maths sketches nearby.
  const x = 19 * T,
    y = 21 * T;
  r(x - 5, y + 57, 170, 10, "#67593e66");
  r(x, y, 160, 58, "#d4cdb0");
  r(x + 8, y - 6, 136, 9, "#e5ddc0");
  r(x, y + 34, 160, 9, "#ae6d3f");
  r(x, y + 43, 160, 5, "#7e6e47");
  r(x + 7, y + 8, 47, 20, "#627b74");
  r(x + 9, y + 10, 43, 3, "#9aa990");
  r(x + 28, y + 8, 2, 20, "#c4bea0");
  r(x + 64, y + 4, 30, 54, "#bcb49a");
  r(x + 69, y + 8, 20, 18, "#607571");
  r(x + 87, y + 33, 3, 4, "#5c5741");
  r(x + 108, y + 9, 39, 20, "#526963");
  r(x + 115, y + 11, 24, 2, "#a5b5a0");
  for (const xx of [20, 128]) {
    r(x + xx, y + 48, 21, 20, "#323b35");
    r(x + xx + 5, y + 53, 11, 10, "#8a8a77");
  }
  r(x + 154, y + 22, 11, 29, "#b8b09a");
  r(x + 157, y + 32, 8, 6, "#bd945e");
  for (let i = 0; i < 6; i++)
    r(x + i * 25, y - 12, 25, 6, i % 2 ? "#7a8051" : "#bca36e");
  r(x - 1, y - 6, 3, 64, "#8e7650");
  r(x + 151, y - 6, 3, 64, "#8e7650");
  w.label("CAL’S CARAVAN", x + 80, y - 22, "#f7dfad", 10);
  r(18 * T, 20.3 * T, 23, 22, "#4b5544");
  w.label("1:4", 18 * T + 11, 20.3 * T + 16, "#e1d7a5", 10);
  // The classic frontier notice board, with a maths challenge instead of a bounty.
  r(29 * T, 15 * T, 4, 51, "#735d3d");
  r(29 * T + 29, 15 * T, 4, 51, "#735d3d");
  r(29 * T - 4, 14.8 * T, 42, 29, "#866643");
  r(29 * T + 1, 15 * T, 30, 20, "#e2c997");
  w.label("× 12", 29 * T + 16, 15 * T + 14, "#463d2f", 10);
  // Wind-blown dust and a tumbleweed; reduced motion keeps them still.
  if (!w.state.reducedMotion) {
    const px = (w.time * 16) % (33 * T),
      py = 14.4 * T + Math.sin(w.time * 0.8) * 8;
    c.strokeStyle = "#8e7545";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(px, py, 8, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.moveTo(px - 7, py);
    c.lineTo(px + 7, py);
    c.moveTo(px, py - 7);
    c.lineTo(px, py + 7);
    c.stroke();
    for (let i = 0; i < 7; i++) {
      const dx = (w.time * 20 + i * 149) % (33 * T);
      r(dx, 14 * T + (i % 3) * 10, 16, 1, "#edd29a55");
    }
  }
}
