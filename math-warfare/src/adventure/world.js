import { NPCS, QUESTS } from "./content.js";
export const W = 33,
  H = 25,
  T = 32;
const key = (x, y) => `${x},${y}`;
export function pointerToWorld(point, bounds, bitmap, camera) {
  return {
    x: (((point.x - bounds.left) * bitmap.width) / bounds.width + camera.x) / T,
    y:
      (((point.y - bounds.top) * bitmap.height) / bounds.height + camera.y) / T,
  };
}
export function blocked(zone, x, y, state) {
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 1 || y < 2 || x >= W - 1 || y >= H - 1) return true;
  if (zone === "village") {
    for (const bx of [3, 20]) {
      if (y === 3 && x >= bx && x <= bx + 8) return true;
      if (y >= 4 && y <= 9 && (x === bx || x === bx + 8)) return true;
      if (y === 10 && x >= bx && x <= bx + 8 && x !== bx + 4) return true;
    }
    if (x >= 3 && x <= 5 && y >= 17 && y <= 21) return true;
    if ((x === 16 && y === 12) || (y === 5 && [5, 6, 22, 23, 26].includes(x)))
      return true;
  } else {
    if (
      x === 10 &&
      y >= 3 &&
      y <= 22 &&
      !(y === 17 && state.completed.includes("bridge"))
    )
      return true;
    if (
      x === 20 &&
      y >= 3 &&
      y <= 22 &&
      !(y === 11 && state.completed.includes("fungi"))
    )
      return true;
  }
  return false;
}
export function pathfind(zone, start, goal, state) {
  const sx = Math.floor(start.x),
    sy = Math.floor(start.y),
    gx = Math.floor(goal.x),
    gy = Math.floor(goal.y);
  if (blocked(zone, gx, gy, state)) return [];
  const queue = [[sx, sy]],
    seen = new Map([[key(sx, sy), null]]);
  let head = 0;
  while (head < queue.length) {
    const [x, y] = queue[head++];
    if (x === gx && y === gy) {
      const path = [];
      let k = key(x, y);
      while (seen.get(k)) {
        const [px, py] = k.split(",").map(Number);
        path.unshift({ x: px + 0.5, y: py + 0.5 });
        k = seen.get(k);
      }
      return path;
    }
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        k = key(nx, ny);
      if (!seen.has(k) && !blocked(zone, nx, ny, state)) {
        seen.set(k, key(x, y));
        queue.push([nx, ny]);
      }
    }
  }
  return [];
}
export class World {
  constructor(canvas, state, art, onInteract, onNotice) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.state = state;
    this.art = art;
    this.onInteract = onInteract;
    this.onNotice = onNotice;
    this.keys = new Set();
    this.path = [];
    this.target = null;
    this.camera = { x: 0, y: 0 };
    this.time = 0;
    this.dir = 3;
    this.moving = false;
    this.paused = false;
    this.last = 0;
    this.particles = [];
    this.follow = { ...state.player };
    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    canvas.addEventListener("pointerdown", (e) => this.click(e));
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }
  resize() {
    const b = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(320, Math.round(b.width));
    this.canvas.height = Math.max(240, Math.round(b.height));
    this.ctx.imageSmoothingEnabled = false;
  }
  get npcs() {
    return NPCS[this.state.zone];
  }
  nearest() {
    return this.npcs
      .map((n) => ({
        n,
        d: Math.hypot(
          n.x + 0.5 - this.state.player.x,
          n.y + 0.5 - this.state.player.y,
        ),
      }))
      .sort((a, b) => a.d - b.d)[0];
  }
  interact() {
    const near = this.nearest();
    if (near?.d < 2.4) this.onInteract(near.n);
    else
      this.onNotice(
        "Walk closer to a neighbour, or choose one in the journal.",
      );
  }
  go(id) {
    const n = this.npcs.find((n) => n.id === id);
    if (!n) return;
    if (
      Math.hypot(
        n.x + 0.5 - this.state.player.x,
        n.y + 0.5 - this.state.player.y,
      ) < 1.7
    ) {
      this.onInteract(n);
      return;
    }
    if (window.innerWidth < 780)
      this.canvas.scrollIntoView({ block: "center", behavior: "instant" });
    const candidates = [
      [n.x, n.y + 1],
      [n.x + 1, n.y],
      [n.x - 1, n.y],
      [n.x, n.y - 1],
      [n.x, n.y],
    ]
      .filter(([x, y]) => !blocked(this.state.zone, x, y, this.state))
      .map(([x, y]) =>
        pathfind(this.state.zone, this.state.player, { x, y }, this.state),
      )
      .filter((p) => p.length)
      .sort((a, b) => a.length - b.length);
    if (candidates.length) {
      this.path = candidates[0];
      this.target = n;
    } else if (
      Math.hypot(
        this.state.player.x - n.x - 0.5,
        this.state.player.y - n.y - 0.5,
      ) < 2.4
    )
      this.onInteract(n);
    else
      this.onNotice("A gate blocks that route. Help the nearest guide first.");
  }
  click(e) {
    if (this.paused) return;
    const b = this.canvas.getBoundingClientRect();
    const { x, y } = pointerToWorld(
      { x: e.clientX, y: e.clientY },
      b,
      this.canvas,
      this.camera,
    );
    const n = this.npcs.find(
      (n) => Math.hypot(n.x + 0.5 - x, n.y + 0.1 - y) < 1.2,
    );
    if (n) {
      this.go(n.id);
      return;
    }
    this.target = null;
    this.path = pathfind(
      this.state.zone,
      this.state.player,
      { x, y },
      this.state,
    );
  }
  changeZone(zone) {
    this.state.zone = zone;
    this.state.player =
      zone === "cave" ? { x: 4.5, y: 20.5 } : { x: 29.5, y: 13.5 };
    this.follow = { ...this.state.player };
    this.path = [];
    this.target = null;
  }
  step(dt) {
    if (this.paused) {
      this.moving = false;
      return;
    }
    const p = this.state.player;
    let dx = 0,
      dy = 0;
    if (this.keys.has("ArrowLeft") || this.keys.has("a")) dx--;
    if (this.keys.has("ArrowRight") || this.keys.has("d")) dx++;
    if (this.keys.has("ArrowUp") || this.keys.has("w")) dy--;
    if (this.keys.has("ArrowDown") || this.keys.has("s")) dy++;
    if (dx || dy) {
      this.path = [];
      this.target = null;
    } else if (this.path.length) {
      const next = this.path[0],
        dist = Math.hypot(next.x - p.x, next.y - p.y);
      // Stop at the next waypoint instead of stepping past it at low frame rates.
      if (dist <= Math.max(0.07, dt * 4.5)) {
        p.x = next.x;
        p.y = next.y;
        this.path.shift();
        if (!this.path.length && this.target) {
          const n = this.target;
          this.target = null;
          this.onInteract(n);
        }
        return;
      }
      dx = (next.x - p.x) / dist;
      dy = (next.y - p.y) / dist;
    }
    this.moving = !!(dx || dy);
    if (this.moving) {
      this.dir =
        Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 0) : dy > 0 ? 3 : 1;
      const len = Math.max(1, Math.hypot(dx, dy)),
        sx = (dx / len) * dt * 4.5,
        sy = (dy / len) * dt * 4.5;
      if (!blocked(this.state.zone, p.x + sx, p.y, this.state)) p.x += sx;
      if (!blocked(this.state.zone, p.x, p.y + sy, this.state)) p.y += sy;
    }
    const d = Math.hypot(p.x - this.follow.x, p.y - this.follow.y);
    if (d > 1.2) {
      this.follow.x += (p.x - this.follow.x) * Math.min(1, dt * 4);
      this.follow.y += (p.y - this.follow.y) * Math.min(1, dt * 4);
    }
  }
  frame(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000 || 0);
    this.last = t;
    this.time = t / 1000;
    this.step(dt);
    this.draw();
    requestAnimationFrame(this.frame);
  }
  rect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      Math.round(x),
      Math.round(y),
      Math.round(w),
      Math.round(h),
    );
  }
  sprite(name, x, y, scale = 2) {
    const im = this.art[name];
    if (im)
      this.ctx.drawImage(
        im,
        Math.round(x),
        Math.round(y),
        im.width * scale,
        im.height * scale,
      );
  }
  label(text, x, y, color = "#fff1c8", size = 12) {
    const c = this.ctx;
    c.font = `${size}px monospace`;
    c.textAlign = "center";
    c.fillStyle = "#152a2b";
    c.fillRect(
      x - c.measureText(text).width / 2 - 5,
      y - size - 3,
      c.measureText(text).width + 10,
      size + 8,
    );
    c.fillStyle = color;
    c.fillText(text, x, y);
  }
  character(art, x, y, dir = 3, moving = false) {
    const im = this.art[art];
    if (!im) return;
    const frame = this.state.reducedMotion
      ? 1
      : moving
        ? Math.floor(this.time * 9) % 6
        : 1;
    const sx = art.startsWith("person")
        ? (dir * 6 + frame) * 16
        : Math.min(frame % 3, 2) * 16,
      sy = art.startsWith("person") ? 0 : dir * 32;
    this.rect(x - 10, y - 5, 20, 7, "#152a2b55");
    this.ctx.drawImage(
      im,
      sx,
      sy,
      16,
      32,
      Math.round(x - 16),
      Math.round(y - 56),
      32,
      64,
    );
  }
  draw() {
    const c = this.ctx,
      p = this.state.player,
      cw = this.canvas.width,
      ch = this.canvas.height;
    this.camera.x = Math.max(0, Math.min(W * T - cw, p.x * T - cw / 2));
    this.camera.y = Math.max(0, Math.min(H * T - ch, p.y * T - ch / 2));
    c.save();
    c.clearRect(0, 0, cw, ch);
    c.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));
    const village = this.state.zone === "village";
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (village) {
          const road =
            (x >= 13 && x <= 18) ||
            (y >= 11 && y <= 15) ||
            (y === 8 && x >= 6 && x <= 26) ||
            (y === 19 && x >= 6 && x <= 26);
          this.rect(
            x * T,
            y * T,
            T,
            T,
            road
              ? (x + y) % 3
                ? "#d6bd81"
                : "#cdb17b"
              : (x * 7 + y * 3) % 4
                ? "#739b69"
                : "#7ba570",
          );
          if (!road && (x * 19 + y * 11) % 7 === 0) {
            this.rect(x * T + 7, y * T + 15, 2, 6, "#527e58");
            this.rect(x * T + 18, y * T + 9, 4, 2, "#93b37c");
          }
        } else {
          c.drawImage(this.art.stone, x * T, y * T, T, T);
          if ((x * 7 + y * 3) % 9 === 0)
            this.rect(x * T + 4, y * T + 12, 3, 2, "#756a7c");
        }
        if (x < 1 || y < 2 || x >= W - 1 || y >= H - 1)
          this.rect(x * T, y * T, T, T, village ? "#3d6953" : "#292636");
      }
    if (village) this.village();
    else this.cave();
    if (this.path.length) {
      for (let i = 0; i < this.path.length; i += 2) {
        const q = this.path[i];
        this.rect(q.x * T - 2, q.y * T - 2, 4, 4, "#fff6bb99");
      }
    }
    const entities = [
      ...this.npcs.map((n) => ({
        ...n,
        px: (n.x + 0.5) * T,
        py: (n.y + 0.5) * T,
      })),
      { id: "player", px: p.x * T, py: p.y * T },
    ].sort((a, b) => a.py - b.py);
    for (const n of entities) {
      if (n.id === "player") {
        this.character("person1", n.px, n.py, this.dir, this.moving);
        continue;
      }
      if (n.art) this.character(n.art, n.px, n.py, 3, false);
      else {
        this.rect(n.px - 6, n.py - 35, 12, 35, "#705b42");
        this.rect(n.px - 22, n.py - 40, 44, 18, "#b09b62");
      }
      const q = QUESTS.find((q) => q.id === n.id);
      const done = this.state.completed.includes(n.id);
      const unlocked = q?.requires.every((id) =>
        this.state.completed.includes(id),
      );
      if (q && !done) {
        const bounce = this.state.reducedMotion
          ? 0
          : Math.sin(this.time * 3) * 3;
        this.label(
          unlocked ? "!" : "·",
          n.px,
          n.py - 66 + bounce,
          unlocked ? "#ffd35c" : "#bbc7ac",
          16,
        );
      }
      const near = Math.hypot(n.px / T - p.x, n.py / T - p.y) < 2.8;
      if (near) this.label(n.name, n.px, n.py + 20);
    }
    const animal = this.state.companion;
    if (animal !== "none") {
      const im = this.art[animal],
        size = animal === "cat" ? 48 : 16,
        frames = im.width / size;
      const frame = this.state.reducedMotion
        ? 0
        : Math.floor(this.time * 6) % frames;
      c.drawImage(
        im,
        frame * size,
        0,
        size,
        16,
        Math.round(this.follow.x * T - size),
        Math.round(this.follow.y * T - 20),
        size * 2,
        32,
      );
    }
    if (village) {
      for (let i = 0; i < 3; i++) {
        const im = this.art.butterfly;
        const x = (9 + i * 8) * T + Math.sin(this.time * 0.6 + i) * 24,
          y = (16 + (i % 2) * 3) * T + Math.cos(this.time + i) * 12;
        const f = this.state.reducedMotion ? 0 : Math.floor(this.time * 6) % 4;
        c.drawImage(
          im,
          f * 16,
          0,
          16,
          16,
          Math.round(x),
          Math.round(y),
          24,
          24,
        );
      }
    }
    c.restore();
    this.minimap();
  }
  village() {
    for (const [bx, title] of [
      [3, "BRAM’S BAKERY"],
      [20, "ADA’S LIBRARY"],
    ]) {
      this.rect(bx * T, 3 * T, 9 * T, 8 * T, "#4f6c68");
      this.rect((bx + 1) * T, 4 * T, 7 * T, 6 * T, "#c4aa82");
      for (let x = bx + 1; x < bx + 8; x++)
        for (let y = 4; y < 10; y++) {
          if ((x + y) % 2 === 0) this.rect(x * T, y * T, T, T, "#baa27d");
        }
      this.rect(bx * T, 3 * T, 9 * T, T, "#4b726c");
      this.rect(bx * T, 3 * T, 9 * T, 5, "#d1b06b");
      this.rect((bx + 4) * T, 10 * T, T, T, "#d6bd81");
      this.label(title, (bx + 4.5) * T, 3 * T + 22, "#fff3cb", 12);
      this.sprite("books", (bx + 2) * T, 4.6 * T);
      this.sprite("desk", (bx + 4) * T, 4.5 * T);
      this.sprite("plant", (bx + 6.2) * T, 7 * T);
    }
    this.rect(3 * T, 17 * T, 3 * T, 5 * T, "#426d77");
    for (let i = 0; i < 6; i++) {
      this.rect(
        (3 + (i % 3)) * T + 8,
        (17 + Math.floor(i / 3) * 2) * T + 13,
        15,
        8,
        "#9bba74",
      );
    }
    const frogFrame = this.state.reducedMotion
      ? 0
      : Math.floor(this.time * 5) % 6;
    this.ctx.drawImage(
      this.art.frog,
      frogFrame * 16,
      0,
      16,
      16,
      6 * T,
      18 * T,
      32,
      32,
    );
    this.sprite("sofa", 22 * T, 17 * T);
    this.sprite("desk", 24 * T, 17 * T);
    this.sprite("rug", 21 * T, 19.3 * T);
    this.label("FERN’S POND", 7 * T, 17 * T, "#fff1c8", 11);
    this.label("MARKET", 24 * T, 17 * T - 8, "#fff1c8", 11);
    this.rect(16 * T, 12 * T, 32, 32, "#687a6d");
    this.rect(16 * T + 10, 12 * T - 24, 12, 30, "#887c56");
    this.rect(
      16 * T + 6,
      12 * T - 31,
      20,
      12,
      this.state.completed.includes("welcome") ? "#ffe38a" : "#7c8b87",
    );
    if (this.state.completed.includes("welcome")) {
      const grad = this.ctx.createRadialGradient(
        16 * T + 16,
        12 * T - 20,
        5,
        16 * T + 16,
        12 * T - 20,
        50,
      );
      grad.addColorStop(0, "#ffd67545");
      grad.addColorStop(1, "#ffd67500");
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(16 * T - 34, 12 * T - 70, 100, 100);
    }
    this.label("NUMBERGLEN", 16 * T, 5 * T, "#fff3cc", 17);
    for (let i = 0; i < 8; i++) {
      const x = (i % 2 ? 30 : 2) * T,
        y = (3 + Math.floor(i / 2) * 6) * T;
      this.tree(x, y);
    }
    if (this.state.upgrades.includes("garden"))
      for (let i = 0; i < 36; i++) {
        const x = (12 + (i % 9)) * T + 8,
          y = (6 + Math.floor(i / 9)) * T + 10;
        this.rect(x, y, 4, 8, "#47734c");
        this.rect(x - 3, y - 3, 10, 5, i % 2 ? "#e4ad77" : "#b3a4d1");
      }
    if (this.state.upgrades.includes("picnic")) {
      this.sprite("rug", 13 * T, 19 * T);
      this.sprite("sofa", 15 * T, 20 * T);
      this.sprite("books", 17 * T, 19 * T);
    }
    if (this.state.upgrades.includes("lanterns"))
      for (const x of [12, 19])
        for (const y of [8, 18]) this.lantern(x * T, y * T);
  }
  tree(x, y) {
    this.rect(x + 10, y + 22, 12, 32, "#6f6445");
    this.rect(x - 6, y - 15, 44, 42, "#416b51");
    this.rect(x - 12, y - 4, 56, 26, "#4d7d59");
    this.rect(x + 1, y - 20, 30, 20, "#5b8962");
    this.rect(x - 3, y - 9, 20, 6, "#709b6b");
  }
  lantern(x, y) {
    this.rect(x + 10, y - 20, 6, 48, "#786541");
    this.rect(x + 5, y - 25, 16, 15, "#ffdf94");
  }
  cave() {
    for (let y = 3; y < 23; y++)
      for (const x of [10, 20])
        if (blocked("cave", x, y, this.state)) {
          this.ctx.drawImage(this.art.caveWall, x * T, y * T, T, T);
        }
    for (const [x, y] of [
      [3, 4],
      [13, 4],
      [23, 13],
      [28, 20],
      [14, 20],
      [27, 3],
    ])
      this.sprite("mushrooms", x * T, y * T);
    this.sprite("throne", 25 * T, 3 * T);
    this.sprite("bed", 22 * T, 18 * T);
    this.sprite("crates", 26 * T, 18 * T);
    this.sprite("chest", 28 * T, 15 * T);
    this.label("LANTERN HOLLOW", 6 * T, 5 * T, "#e1cee7", 14);
    this.label("SOUP CLEARING", 15 * T, 8 * T, "#e1cee7", 12);
    this.label("REFUGEE CAMP", 26 * T, 21 * T, "#e1cee7", 12);
    if (this.state.completed.includes("king")) {
      this.lantern(27 * T, 7 * T);
      this.label("LIGHT RESTORED", 26 * T, 3 * T - 15, "#ffdc95", 12);
    }
    if (this.state.upgrades.includes("lanterns"))
      for (const [x, y] of [
        [5, 13],
        [14, 16],
        [24, 12],
      ])
        this.lantern(x * T, y * T);
  }
  minimap() {
    const c = this.ctx,
      w = 99,
      h = 75,
      x = this.canvas.width - w - 15,
      y = 15;
    this.rect(x - 5, y - 5, w + 10, h + 10, "#152a2bdd");
    this.rect(
      x,
      y,
      w,
      h,
      this.state.zone === "village" ? "#739b69" : "#645e6e",
    );
    for (let ty = 0; ty < H; ty++)
      for (let tx = 0; tx < W; tx++)
        if (blocked(this.state.zone, tx, ty, this.state))
          this.rect(x + tx * 3, y + ty * 3, 3, 3, "#233e3b");
    for (const n of this.npcs)
      this.rect(x + n.x * 3, y + n.y * 3, 3, 3, "#ffd275");
    this.rect(
      x + this.state.player.x * 3 - 2,
      y + this.state.player.y * 3 - 2,
      4,
      4,
      "#fff",
    );
    c.textAlign = "right";
    c.font = "10px monospace";
    c.fillStyle = "#fff1c8";
    c.fillText("YOU · QUESTS", x + w, y + h + 19);
  }
}
