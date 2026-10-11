export function villagePath(x, y) {
  return (
    (x >= 14 && x <= 17) ||
    (y >= 12 && y <= 14) ||
    ((x === 7 || x === 8 || x === 24 || x === 25) && y >= 8 && y <= 19) ||
    (y === 19 && x >= 6 && x <= 27) ||
    (y === 8 && x >= 6 && x <= 26)
  );
}
export function drawCountryside(w) {
  const T = 32,
    c = w.ctx,
    r = w.rect.bind(w),
    sprite = w.sprite.bind(w);
  // Narrow lanes, chalk stone edges, crops and shelter give the map a rural scale.
  for (let x = 1; x < 32; x++)
    for (let y = 2; y < 24; y++)
      if (villagePath(x, y)) {
        r(x * T, y * T, T, T, (x + y) % 3 ? "#d2b580" : "#caae78");
        if ((x * 7 + y) % 5 === 0) {
          r(x * T + 5, y * T + 7, 5, 2, "#b89e70");
          r(x * T + 21, y * T + 23, 3, 2, "#efe0ad");
        }
      }
  const fence = (x, y, count) => {
    for (let i = 0; i < count; i++) {
      r((x + i) * T, y * T + 9, T, 4, "#b29668");
      r((x + i) * T, y * T + 20, T, 4, "#9e8056");
      r((x + i) * T + 5, y * T + 3, 5, 29, "#ceb585");
      r((x + i) * T + 5, y * T + 3, 5, 3, "#e8d6a5");
    }
  };
  const roof = (x, y, width, color) => {
    r(x * T - 8, y * T + width * 2 + 12, width * T + 20, 65, "#304c4455");
    for (let row = 0; row < 3; row++) {
      const pad = (2 - row) * 9;
      r(x * T - pad, y * T + row * 17, width * T + pad * 2, 19, color);
      for (let col = 0; col < width * 2; col++) {
        r(
          x * T - pad + col * 16 + (row % 2) * 8,
          y * T + row * 17 + 15,
          14,
          2,
          "#533e3644",
        );
        r(x * T - pad + col * 16, y * T + row * 17, 14, 2, "#ffe0a329");
      }
    }
    r(x * T - 20, y * T + 51, width * T + 40, 7, "#5a4936");
  };
  for (const [bx, title, color] of [
    [3, "BRAM’S BAKERY", "#a86c4b"],
    [20, "ADA’S LIBRARY", "#647d83"],
  ]) {
    r(bx * T + 4, 3 * T, 9 * T, 8 * T, "#38574855");
    r(bx * T, 4 * T, 9 * T, 7 * T, "#e0c79d");
    r((bx + 1) * T, 5 * T, 7 * T, 5 * T, "#bca582");
    for (let y = 5; y < 10; y++)
      for (let x = bx + 1; x < bx + 8; x++) {
        r(x * T, y * T + 29, T, 2, "#a18c6f");
        if ((x + y) % 2 === 0) r(x * T + 1, y * T, 1, T, "#d3bd95");
      }
    r(bx * T, 4 * T, T, 7 * T, "#baa277");
    r((bx + 8) * T, 4 * T, T, 7 * T, "#b49c75");
    r(bx * T, 10 * T, 9 * T, T, "#d9bf8b");
    r((bx + 4) * T, 10 * T, T, T, "#b99b70");
    roof(bx, 3, 9, color);
    r((bx + 6) * T, 2.5 * T, 18, 43, "#7e7361");
    r((bx + 6) * T - 3, 2.5 * T, 24, 6, "#aa997e");
    if (!w.state.reducedMotion)
      for (let i = 0; i < 3; i++) {
        const rise = (w.time * 10 + i * 18) % 55;
        r(
          (bx + 6) * T + 4 + Math.sin(w.time + i) * 7,
          2.5 * T - rise,
          11 + i * 3,
          6,
          "#e8e6ce55",
        );
      }
    sprite("books", (bx + 1.5) * T, 6.1 * T);
    sprite("desk", (bx + 4.7) * T, 6 * T);
    sprite("plant", (bx + 6.5) * T, 7.2 * T);
    r((bx + 2) * T, 10 * T - 5, 40, 23, "#314d43");
    w.label(title, (bx + 4.5) * T, 10 * T + 18, "#fff0bf", 11);
    for (const x of [bx + 0.35, bx + 8.05]) {
      r(x * T, 7 * T, 20, 27, "#586f67");
      r(x * T + 2, 7 * T + 2, 16, 21, "#a9c4b7");
      r(x * T + 9, 7 * T + 2, 2, 21, "#617d71");
    }
    for (let i = 0; i < 3; i++) {
      const x = (bx + 1 + i * 0.65) * T;
      r(x, 10 * T + 14, 13, 13, "#8b7651");
      r(x - 1, 10 * T + 11, 15, 5, "#b9cc7e");
      r(x + 3, 10 * T + 9, 4, 4, "#e5af89");
    }
  }
  // A spring-fed pond with reeds, ripples and a little wooden landing.
  r(3 * T - 8, 17 * T - 7, 3 * T + 16, 5 * T + 14, "#a4b17e");
  r(3 * T, 17 * T, 3 * T, 5 * T, "#557e83");
  for (let y = 17; y < 22; y++)
    for (let x = 3; x < 6; x++) {
      const drift = w.state.reducedMotion
        ? 0
        : Math.sin(w.time * 1.4 + y + x) * 4;
      r(x * T + 8 + drift, y * T + 12, 13, 2, "#8faea1");
    }
  for (let i = 0; i < 7; i++) {
    const x = (3 + (i % 3)) * T + 9,
      y = (17 + Math.floor(i / 3) * 2) * T + 9;
    r(x, y, 15, 9, "#8fac69");
    r(x + 4, y + 2, 4, 3, "#c6d39a");
  }
  for (let y = 17; y < 22; y += 2) {
    r(3 * T - 8, y * T, 3, 26, "#627c50");
    r(3 * T - 13, y * T + 8, 4, 14, "#779361");
  }
  r(5.5 * T, 18.8 * T, 1.5 * T, 18, "#9b8055");
  for (let x = 0; x < 6; x++) r(5.5 * T + x * 8, 18.8 * T, 2, 18, "#d3b685");
  const f = w.state.reducedMotion ? 0 : Math.floor(w.time * 5) % 6;
  c.drawImage(w.art.frog, f * 16, 0, 16, 16, 6 * T, 18 * T, 32, 32);
  // Vegetable plots and a market awning, rather than furniture floating in grass.
  for (let x = 9; x < 13; x++)
    for (let y = 18; y < 23; y++) {
      r(x * T + 2, y * T + 2, 28, 26, "#94784f");
      r(x * T + 4, y * T + 16, 24, 3, "#6d5a3f");
      const sway = w.state.reducedMotion ? 0 : Math.sin(w.time + x) * 1.5;
      for (let i = 0; i < 3; i++) {
        r(x * T + 6 + i * 8, y * T + 10 + sway, 3, 10, "#466d42");
        r(x * T + 3 + i * 8, y * T + 9 + sway, 9, 4, "#81a563");
        if (y % 2) r(x * T + 5 + i * 8, y * T + 7 + sway, 4, 4, "#df9c69");
      }
    }
  fence(9, 17, 4);
  fence(9, 23, 4);
  w.label("FERN’S POND", 5 * T, 17 * T - 15, "#e8efc8", 10);
  r(22 * T, 17 * T, 5 * T, 36, "#8d714f");
  r(22 * T + 5, 17 * T + 26, 5 * T - 10, 6, "#b49867");
  for (let x = 22; x < 27; x++) {
    r(x * T, 16 * T, 32, 17, x % 2 ? "#c38562" : "#e4cda0");
    r(x * T, 16 * T + 17, 32, 5, x % 2 ? "#a26346" : "#c7ad80");
  }
  r(22 * T - 4, 16 * T, 4, 64, "#78613f");
  r(27 * T, 16 * T, 4, 64, "#78613f");
  for (let i = 0; i < 9; i++) {
    const x = 22.3 * T + i * 14;
    r(x, 17 * T - 2, 11, 10, "#ac8751");
    r(x + 1, 17 * T - 7, 9, 6, i < 4 ? "#b0bb67" : "#ce856b");
  }
  sprite("crates", 27 * T, 18 * T, 1.4);
  w.label("NOOR’S FARM STALL", 24.5 * T, 16 * T - 12, "#fff0bf", 10);
  // The village lantern, a well, and a sheltered place to sit.
  r(16 * T, 12 * T, 32, 32, "#8a917c");
  r(16 * T + 10, 12 * T - 24, 12, 30, "#887c56");
  r(
    16 * T + 6,
    12 * T - 31,
    20,
    12,
    w.state.completed.includes("welcome") ? "#ffe38a" : "#7c8b87",
  );
  if (w.state.completed.includes("welcome")) {
    const grad = c.createRadialGradient(
      16 * T + 16,
      12 * T - 20,
      5,
      16 * T + 16,
      12 * T - 20,
      50,
    );
    grad.addColorStop(0, "#ffd67555");
    grad.addColorStop(1, "#ffd67500");
    c.fillStyle = grad;
    c.fillRect(16 * T - 34, 12 * T - 70, 100, 100);
  }
  r(11 * T, 10 * T, 47, 24, "#b1ae91");
  r(11 * T + 6, 10 * T + 3, 35, 13, "#536c69");
  r(11 * T, 10 * T - 18, 4, 41, "#8b704c");
  r(11 * T + 43, 10 * T - 18, 4, 41, "#8b704c");
  r(11 * T - 3, 10 * T - 23, 53, 8, "#9e7850");
  sprite("chair", 18 * T, 9 * T, 1.6);
  sprite("books", 18.7 * T, 8.6 * T, 1.1);
  // Orchard and hedgerows enclose the open map without covering its entrances.
  for (const [x, y] of [
    [2, 3],
    [2, 7],
    [2, 12],
    [2, 16],
    [2, 23],
    [30, 3],
    [30, 7],
    [30, 17],
    [30, 22],
    [12, 3],
    [18, 3],
    [9, 22],
    [28, 22],
  ])
    w.tree(x * T, y * T);
  for (const [x, y] of [
    [2, 3],
    [30, 7],
    [30, 22],
  ])
    for (let i = 0; i < 4; i++)
      r(
        x * T + (i % 2) * 17,
        y * T - 4 + Math.floor(i / 2) * 13,
        5,
        5,
        "#d7a471",
      );
  fence(3, 23, 5);
  fence(22, 23, 8);
  // A cottage in the southern meadow with flowers by the door.
  r(27 * T, 20 * T, 3 * T, 3 * T, "#dfc499");
  roof(27, 19.7, 3, "#ae7953");
  r(28 * T, 21.5 * T, 22, 43, "#705943");
  r(28 * T + 15, 22 * T, 3, 3, "#dcb96f");
  r(27.3 * T, 21.6 * T, 16, 20, "#8eaea0");
  if (w.state.upgrades.includes("garden"))
    for (let i = 0; i < 30; i++) {
      const x = (12 + (i % 3)) * T + 10,
        y = (6 + Math.floor(i / 3)) * T + 10;
      if (villagePath(Math.floor(x / T), Math.floor(y / T))) continue;
      r(x, y, 3, 7, "#57774a");
      r(x - 3, y - 4, 9, 5, i % 2 ? "#dca989" : "#c2afc4");
    }
  if (w.state.upgrades.includes("picnic")) {
    sprite("rug", 13 * T, 20 * T);
    sprite("sofa", 15 * T, 21 * T);
    sprite("books", 17 * T, 20 * T);
  }
  if (w.state.upgrades.includes("lanterns"))
    for (const x of [13, 18]) for (const y of [8, 18]) w.lantern(x * T, y * T);
  // Chickens peck and wander in their patch; small birds cross the canopy.
  for (let i = 0; i < 4; i++) {
    const t = w.state.reducedMotion ? i : w.time * 0.35 + i * 1.8,
      x = (8.2 + Math.sin(t) * 0.55) * T,
      y = (20.2 + i * 0.55 + Math.cos(t) * 0.2) * T,
      peck = !w.state.reducedMotion && Math.sin(w.time * 3 + i) > 0;
    r(x, y, 13, 8, "#f2e4bc");
    r(x + (peck ? 11 : 9), y + (peck ? 4 : -4), 7, 7, "#f7ebcf");
    r(x + 12, y + (peck ? 3 : -6), 4, 3, "#bd7252");
    r(x + 15, y + (peck ? 7 : 0), 3, 2, "#d1a361");
    r(x + 3, y + 8, 2, 4, "#a17b42");
    r(x + 9, y + 8, 2, 4, "#a17b42");
  }
  if (!w.state.reducedMotion)
    for (let i = 0; i < 3; i++) {
      const x = (w.time * 23 + i * 117) % (33 * T),
        y = 80 + Math.sin(w.time * 0.4 + i) * 35;
      r(x, y, 4, 2, "#f3e8bf");
      r(x - 3, y + (Math.sin(w.time * 8) > 0 ? -2 : 2), 3, 2, "#e6dbc0");
      r(x + 4, y + (Math.sin(w.time * 8) > 0 ? -2 : 2), 3, 2, "#e6dbc0");
    }
}
