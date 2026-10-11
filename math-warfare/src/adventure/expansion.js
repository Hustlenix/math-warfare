import { FARM, TREES, BRIDGES, cropTile, farmFence, landscapeBlocked, villagePath } from "./map-layout.js";

export function drawExpansion(w) {
  const T = 32, r = w.rect.bind(w), c = w.ctx, still = w.state.reducedMotion;
  // The outer country is greener than the old dusty town, with clear road verges.
  for (const [x, y] of TREES) w.tree(x * T, y * T);
  const fence = (x, y, vertical = false) => {
    r(x * T + 4, y * T + 4, 5, 28, "#dbc393");
    r(x * T + 4, y * T + 4, 5, 4, "#f1deb0");
    if (vertical) {
      r(x * T + 5, y * T, 3, T, "#a88758");
      r(x * T + 18, y * T, 3, T, "#b99a66");
    } else {
      r(x * T, y * T + 12, T, 4, "#a88758");
      r(x * T, y * T + 24, T, 4, "#b99a66");
    }
  };
  for (let y = FARM.y; y < FARM.y + FARM.height; y++)
    for (let x = FARM.x; x < FARM.x + FARM.width; x++) {
      if (farmFence(x, y)) fence(x, y, x === FARM.x || x === FARM.x + FARM.width - 1);
      if (!cropTile(x, y)) continue;
      r(x * T + 2, y * T + 2, 28, 28, "#8c714b");
      r(x * T + 3, y * T + 20, 26, 3, "#6b553c");
      for (let i = 0; i < 3; i++) {
        const sway = still ? 0 : Math.sin(w.time * 1.3 + x + i) * 0.7;
        r(x * T + 7 + i * 8, y * T + 11, 2, 11, "#416d44");
        r(x * T + 4 + i * 8 + sway, y * T + 10, 8, 4, "#8bab68");
        r(x * T + 6 + i * 8, y * T + 7, 4, 5, y < 28 ? "#e4a064" : "#bcb570");
      }
    }
  w.label("COPPERFIELD FARM", 42 * T, 23.5 * T, "#fff0bf", 12);
  w.label("GATE", 41.5 * T, 24.5 * T, "#ffe5a0", 9);
  w.sprite("crates", 47 * T, 25 * T, 1.4);
  w.sprite("plant", 47 * T, 31 * T, 1.6);
  // A timber barn stands off the ranch lane. Its footprint is solid, not scenery on a path.
  r(36 * T + 8, 5 * T + 15, 7 * T, 5 * T, "#30403344");
  r(36 * T, 5 * T, 7 * T, 5 * T, "#95624a");
  for (let i = 0; i < 14; i++) r(36 * T + i * 16, 5 * T, 2, 5 * T, "#6d4b3d");
  for (let row = 0; row < 3; row++) r(36 * T - (2 - row) * 7, 5 * T + row * 14, 7 * T + (2 - row) * 14, 16, "#6b7370");
  r(38 * T, 7 * T, 3 * T, 3 * T, "#5c4a3c");
  r(39.5 * T, 7 * T, 3, 3 * T, "#bfa57b");
  for (let i = 0; i < 3; i++) {
    r((44 + i % 2) * T, (7 + Math.floor(i / 2)) * T, 25, 21, "#c8a65f");
    r((44 + i % 2) * T + 5, (7 + Math.floor(i / 2)) * T, 2, 21, "#8b7245");
  }
  w.label("SUNSET RANCH", 39.5 * T, 5 * T - 12, "#fff0bf", 12);
  // A chicken paddock beside the barn, not on a road or planted bed.
  for (let i = 0; i < 5; i++) {
    const a = still ? i : w.time * 0.35 + i * 1.7;
    const x = (44.6 + Math.sin(a) * 0.6) * T, y = (10.2 + i * 0.4 + Math.cos(a) * 0.15) * T;
    const peck = !still && Math.sin(w.time * 3 + i) > 0;
    r(x, y, 13, 8, "#f2e4bc");
    r(x + 9, y + (peck ? 3 : -4), 7, 7, "#f7ebcf");
    r(x + 12, y + (peck ? 2 : -6), 4, 3, "#bd7252");
    r(x + 15, y + (peck ? 6 : 0), 3, 2, "#d1a361");
    r(x + 3, y + 8, 2, 4, "#a17b42");
    r(x + 9, y + 8, 2, 4, "#a17b42");
  }
  // Narrow creek: explicit banks and two bridges, all using the collision coordinates.
  for (let y = 3; y <= 40; y++) {
    r(50 * T - 5, y * T, 2 * T + 10, T, "#9aac7f");
    r(50 * T, y * T, 2 * T, T, "#557f83");
    if (BRIDGES.includes(y)) {
      r(50 * T - 4, y * T, 2 * T + 8, T, "#aa8559");
      for (let i = 0; i < 4; i++) r(50 * T - 4, y * T + i * 8, 2 * T + 8, 2, "#d5b57e");
      if (y === 13 || y === 33) r(50 * T - 8, y * T, 2 * T + 16, 5, "#6c5943");
      if (y === 14 || y === 34) r(50 * T - 8, (y + 1) * T - 5, 2 * T + 16, 5, "#6c5943");
    } else {
      const drift = still ? 0 : Math.sin(w.time + y) * 4;
      r(50 * T + 12 + drift, y * T + 9, 18, 2, "#9ac0b4");
      r(51 * T + 6 - drift, y * T + 24, 15, 2, "#729f9b");
      if (y % 3 === 0) {
        r(50 * T - 7, y * T + 5, 3, 18, "#5c7a4b");
        r(52 * T + 3, y * T + 15, 3, 17, "#6e8b56");
      }
    }
  }
  // Camp equipment leaves the north/south footpath clear.
  r(56 * T, 19 * T, 2 * T, 2 * T, "#bd986e");
  for (let i = 0; i < 4; i++) r(56 * T + i * 8, 19 * T + i * 6, 64 - i * 16, 8, "#d4bb87");
  r(56 * T + 25, 19 * T + 26, 15, 38, "#705b42");
  w.sprite("rug", 56 * T, 22 * T, 1.5);
  w.sprite("chair", 53 * T, 21 * T, 1.6);
  w.label("WILLOW CREEK", 55 * T, 16 * T, "#e8efc8", 12);
  // Companion shelter in the south-west meadow. The large clearing is walkable.
  r(8 * T, 33 * T, 5 * T, 3 * T, "#b8986d");
  r(8 * T - 6, 33 * T, 5 * T + 12, 25, "#73866a");
  r(9.5 * T, 34 * T, 2 * T, 2 * T, "#6c6048");
  w.sprite("rug", 7 * T, 36 * T, 1.5);
  w.sprite("plant", 13 * T, 34 * T, 1.5);
  w.label("SMALL PAWS · BIG TRAILS", 11 * T, 33 * T - 13, "#f2e9c4", 11);
  if (w.state.upgrades.includes("picnic")) {
    w.sprite("rug", 20 * T, 36 * T);
    w.sprite("sofa", 22 * T, 37 * T);
    w.sprite("books", 24 * T, 36 * T);
    w.label("THE PICNIC GREEN", 22 * T, 35 * T, "#e8efc8", 10);
  }
  for (const [x, y] of [[19, 28], [32, 31], [48, 35], [53, 12]]) {
    w.lantern(x * T, y * T);
  }
  // Wildflowers occupy verges, never the marked lanes.
  for (let i = 0; i < 60; i++) {
    const x = (3 + (i * 7 % 24)) * T + 9, y = (26 + (i * 11 % 15)) * T + 9;
    if (villagePath(Math.floor(x / T), Math.floor(y / T)) || landscapeBlocked(Math.floor(x / T), Math.floor(y / T))) continue;
    r(x, y, 2, 7, "#587647");
    r(x - 2, y - 2, 6, 3, i % 3 ? "#dac6aa" : "#d7a597");
  }
  c.imageSmoothingEnabled = false;
}
