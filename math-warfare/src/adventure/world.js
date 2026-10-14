import { NPCS, QUESTS } from "./content.js";
import { drawQuestEffects } from "./quest-tasks.js";
import {
  createResidents,
  facing,
  spriteFrame,
  updateVillageLife,
} from "./village-life.js";
import { drawCountryside, villagePath } from "./countryside.js";
import { heroFrame } from "./wardrobe.js";
import { drawFrontier } from "./frontier.js";
import { dimensions, landscapeBlocked, LANDMARKS } from "./map-layout.js";
import { drawExpansion } from "./expansion.js";
import { Companion, drawCompanion, petName } from "./companion.js";
import { MovementKeys } from "./movement-input.js";
import { drawSceneryDetails } from "./scenery-details.js";
export const W = 60,
  H = 44,
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
  const { width, height } = dimensions(zone);
  if (x < 1 || y < 2 || x >= width - 1 || y >= height - 1) return true;
  if (zone === "village") {
    if (landscapeBlocked(x, y)) return true;
    for (const bx of [3, 20]) {
      if (y === 3 && x >= bx && x <= bx + 8) return true;
      if (y >= 4 && y <= 9 && (x === bx || x === bx + 8)) return true;
      if (y === 10 && x >= bx && x <= bx + 8 && x !== bx + 4) return true;
    }
    if (x >= 3 && x <= 5 && y >= 17 && y <= 21) return true;
    if (x >= 27 && x <= 29 && y >= 20 && y <= 22) return true;
    if (x >= 19 && x <= 23 && y >= 21 && y <= 22) return true;
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
    this.keys = new MovementKeys();
    this.path = [];
    this.target = null;
    this.camera = { x: 0, y: 0 };
    this.time = 0;
    this.dir = 3;
    this.moving = false;
    this.paused = false;
    this.last = 0;
    this.particles = [];
    this.petKind = state.companion;
    this.pet = new Companion(state.player,
      (from, to) => pathfind(this.state.zone, from, to, this.state),
      (x, y) => blocked(this.state.zone, x, y, this.state));
    this.residents = createResidents(NPCS.village);
    this.lifeTime = 0;
    this.nextMeeting = 6;
    this.meetingIndex = 0;
    this.meeting = null;
    this.pinnedId = null;
    this.lifeLabel = document.getElementById("village-life");
    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    canvas.addEventListener("pointerdown", (e) => this.click(e));
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }
  resize() {
    const b = this.canvas.getBoundingClientRect();
    const scale = b.width >= 1200 || b.height >= 950 ? 2 : 1;
    this.canvas.width = Math.max(320, Math.round(b.width / scale));
    this.canvas.height = Math.max(240, Math.round(b.height / scale));
    this.ctx.imageSmoothingEnabled = false;
    this.needsRedraw = true;
  }
  get npcs() {
    if (this.state.zone !== "village") return NPCS[this.state.zone];
    return [
      ...this.residents.map((a) => ({
        ...a,
        x: a.x - 0.5,
        y: a.y - 0.5,
        actor: a,
      })),
      ...NPCS.village.filter((n) => !n.art),
      ...LANDMARKS,
    ];
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
    if (n.actor) {
      this.pinnedId = n.id;
      n.actor.bubble = null;
    }
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
    if (this.state.companion !== "none" && Math.hypot(this.pet.x - x, this.pet.y - y) < 0.65) {
      this.petAnimal();
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
    this.pet.reset(this.state.player);
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
      } else {
        dx = (next.x - p.x) / dist;
        dy = (next.y - p.y) / dist;
      }
    }
    this.moving = !!(dx || dy);
    if (this.moving) {
      this.dir = facing(dx, dy);
      const len = Math.max(1, Math.hypot(dx, dy)),
        sx = (dx / len) * dt * 4.5,
        sy = (dy / len) * dt * 4.5;
      if (!blocked(this.state.zone, p.x + sx, p.y, this.state)) p.x += sx;
      if (!blocked(this.state.zone, p.x, p.y + sy, this.state)) p.y += sy;
    }
    if (this.pet) {
      if (this.petKind !== this.state.companion) {
        this.petKind = this.state.companion;
        this.pet.reset(p);
      }
      this.pet.update(dt, p, this.state.companion !== "none");
    }
  }
  petAnimal() {
    if (this.state.companion === "none") return false;
    if (!this.pet.pet(this.state.player)) {
      this.onNotice("Walk closer to your companion, or use Recall in its menu.");
      return false;
    }
    this.onNotice(`${petName(this.state.petNames?.[this.state.companion], this.state.companion)} enjoys a little scratch.`);
    return true;
  }
  frame(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000 || 0);
    this.last = t;
    this.time = t / 1000;
    // Keep the last frame behind dialogs; resize/settings can invalidate it.
    // Hidden tabs never advance auto-walk or village routines.
    if (!document.hidden) {
      this.step(dt);
      if (!this.paused && this.state.zone === "village") this.updateLife(dt);
      if (!this.paused || this.needsRedraw) {
        this.draw();
        this.needsRedraw = false;
      }
    }
    requestAnimationFrame(this.frame);
  }
  rect(x, y, w, h, color) {
    if (this.worldDrawing && !this.visible(x, y, w, h)) return;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      Math.round(x),
      Math.round(y),
      Math.round(w),
      Math.round(h),
    );
  }
  visible(x, y, w, h) {
    // One pixel of margin protects rounded coordinates at the camera edge.
    return x + w >= this.camera.x - 1 && y + h >= this.camera.y - 1 &&
      x <= this.camera.x + this.canvas.width + 1 &&
      y <= this.camera.y + this.canvas.height + 1;
  }
  updateLife(dt) {
    updateVillageLife(this, dt, (actor, goal) =>
      pathfind("village", actor, goal, this.state),
    );
  }
  speech(text, x, y) {
    const c = this.ctx;
    c.font = "11px monospace";
    const words = text.split(" "),
      lines = [""];
    for (const word of words) {
      const i = lines.length - 1;
      if (c.measureText(lines[i] + word).width > 176 && lines[i])
        lines.push(word + " ");
      else lines[i] += word + " ";
    }
    const w = Math.max(...lines.map((l) => c.measureText(l.trim()).width)) + 20,
      h = lines.length * 15 + 12;
    x = Math.max(
      this.camera.x + w / 2 + 7,
      Math.min(x, this.camera.x + this.canvas.width - w / 2 - 7),
    );
    this.rect(x - w / 2 + 3, y - h + 3, w, h, "#1c383b66");
    this.rect(x - w / 2, y - h, w, h, "#fff3d6");
    this.rect(x - 3, y, 6, 5, "#fff3d6");
    c.fillStyle = "#29453c";
    c.textAlign = "center";
    lines.forEach((l, i) =>
      c.fillText(l.trim(), Math.round(x), Math.round(y - h + 15 + i * 15)),
    );
  }
  sprite(name, x, y, scale = 2) {
    const im = this.art[name];
    if (im && (!this.worldDrawing || this.visible(x, y, im.width * scale, im.height * scale)))
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
    const width = c.measureText(text).width + 10;
    if (this.worldDrawing && !this.visible(x - width / 2, y - size - 3, width, size + 8)) return;
    c.textAlign = "center";
    c.fillStyle = "#152a2b";
    c.fillRect(
      x - width / 2,
      y - size - 3,
      width,
      size + 8,
    );
    c.fillStyle = color;
    c.fillText(text, x, y);
  }
  character(art, x, y, dir = 3, moving = false) {
    if (this.worldDrawing && !this.visible(x - 16, y - 56, 32, 64)) return;
    if (art.startsWith("hero-")) {
      const f = heroFrame(
        art,
        dir,
        moving,
        this.time,
        this.state.reducedMotion,
      );
      this.rect(x - 10, y - 5, 20, 7, "#30282055");
      this.ctx.drawImage(
        this.art.heroAtlas,
        f.sx,
        f.sy,
        16,
        32,
        Math.round(x - 16),
        Math.round(y - 56),
        32,
        64,
      );
      return;
    }
    const im = this.art[art];
    if (!im) return;
    const frame = this.state.reducedMotion
      ? 1
      : moving
        ? Math.floor(this.time * 9) % 6
        : 1;
    const sx = art.startsWith("person")
        ? spriteFrame(dir, moving, this.time, this.state.reducedMotion) * 16
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
    const { width: W, height: H } = dimensions(this.state.zone);
    this.camera.x =
      cw > W * T
        ? (W * T - cw) / 2
        : Math.max(0, Math.min(W * T - cw, p.x * T - cw / 2));
    this.camera.y = Math.max(0, Math.min(H * T - ch, p.y * T - ch / 2));
    this.worldDrawing = true;
    c.save();
    c.clearRect(0, 0, cw, ch);
    c.fillStyle = this.state.zone === "village" ? "#756b4b" : "#292636";
    c.fillRect(0, 0, cw, ch);
    c.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));
    const village = this.state.zone === "village";
    const left = Math.max(0, Math.floor(this.camera.x / T) - 1), right = Math.min(W, Math.ceil((this.camera.x + cw) / T) + 1),
      top = Math.max(0, Math.floor(this.camera.y / T) - 1), bottom = Math.min(H, Math.ceil((this.camera.y + ch) / T) + 1);
    for (let y = top; y < bottom; y++)
      for (let x = left; x < right; x++) {
        if (village) {
          const road = villagePath(x, y);
          const green = x > 32 || y > 25;
          this.rect(
            x * T,
            y * T,
            T,
            T,
            road ? "#c5af85" : green ? "#809664" : "#879669",
          );
          if (road) {
            if (!villagePath(x - 1, y)) this.rect(x * T, y * T + 2, 2, T - 4, "#a0a079");
            if (!villagePath(x + 1, y)) this.rect((x + 1) * T - 2, y * T + 2, 2, T - 4, "#a0a079");
            if (!villagePath(x, y - 1)) this.rect(x * T + 2, y * T, T - 4, 2, "#a0a079");
            if (!villagePath(x, y + 1)) this.rect(x * T + 2, (y + 1) * T - 2, T - 4, 2, "#a0a079");
          }
        } else {
          c.drawImage(this.art.stone, x * T, y * T, T, T);
          if ((x * 7 + y * 3) % 9 === 0)
            this.rect(x * T + 4, y * T + 12, 3, 2, "#756a7c");
        }
        if (x < 1 || y < 2 || x >= W - 1 || y >= H - 1)
          this.rect(x * T, y * T, T, T, village ? "#7d7951" : "#292636");
      }
    if (village) this.village();
    else this.cave();
    drawQuestEffects(this);
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
      ...(this.state.companion !== "none" ? [{ id: "pet", px: this.pet.x * T, py: this.pet.y * T }] : []),
      ...(this.remotePlayers ?? [])
        .filter((r) => r.zone === this.state.zone)
        .map((r) => ({ ...r, remote: true, px: r.x * T, py: r.y * T })),
    ].sort((a, b) => a.py - b.py);
    for (const n of entities) {
      if (n.id === "pet") {
        drawCompanion(c, this.pet, this.state.companion, this.art, this.time, this.state.reducedMotion || this.paused);
        if (this.pet.mode === "stay") this.label("STAY", n.px, n.py - 38, "#ffe5a0", 9);
        continue;
      }
      if (n.remote) {
        this.rect(n.px - 14, n.py - 4, 28, 5, "#72d8cfaa");
        this.character(n.avatar, n.px, n.py, n.dir, n.moving);
        this.label(n.name, n.px, n.py - 64, "#c9fff1", 10);
        continue;
      }
      if (n.id === "player") {
        this.character(
          this.state.appearance.id,
          n.px,
          n.py,
          this.dir,
          this.moving,
        );
        continue;
      }
      if (n.art)
        this.character(n.art, n.px, n.py, n.dir ?? 3, n.moving ?? false);
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
    if (village)
      for (const a of this.residents)
        if (a.bubble) this.speech(a.bubble, a.x * T, a.y * T - 76);
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
    this.worldDrawing = false;
    this.minimap();
  }
  village() {
    drawCountryside(this);
    drawSceneryDetails(this);
    drawFrontier(this);
    drawExpansion(this);
  }
  tree(x, y) {
    const variant = (Math.floor(x / T) + Math.floor(y / T) * 2) % 3;
    const leaf = ["#52764d", "#456e4c", "#647e4e"][variant];
    const light = ["#7c965e", "#708b5b", "#91a16a"][variant];
    this.rect(x - 11, y + 40, 59, 13, "#34574044");
    this.rect(x + 10, y + 15, 12, 39, "#736247");
    this.rect(x + 11, y + 24, 3, 27, "#a28a59");
    this.rect(x - 4, y - 20, 40, 52, "#315b46");
    this.rect(x - 14, y - 8, 61, 27, "#315b46");
    this.rect(x - 8, y - 12, 49, 36, leaf);
    this.rect(x - 13, y - 4, 59, 17, leaf);
    this.rect(x + 1 - variant * 2, y - 24 + variant * 2, 28 + variant * 4, 30, light);
    this.rect(x - 4, y - 18, 34, 17, light);
    for (const [dx, dy, width] of [[0, -12, 8], [-6, 2, 6], [22, 8, 8], [10, 16, 6]])
      this.rect(x + dx, y + dy, width, 2, "#a0b075");
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
      y = Math.round(
        (88 * this.canvas.height) / this.canvas.getBoundingClientRect().height,
      );
    const { width: W, height: H } = dimensions(this.state.zone), sx = w / W, sy = h / H;
    this.rect(x - 5, y - 5, w + 10, h + 10, "#152a2bdd");
    // Terrain changes only when maps or quest-controlled gates change.
    const terrainKey = `${this.state.zone}:${this.state.completed.join(",")}`;
    if (this.minimapTerrain?.key !== terrainKey) {
      const layer = document.createElement("canvas");
      layer.width = w;
      layer.height = h;
      const ctx = layer.getContext("2d");
      ctx.fillStyle = this.state.zone === "village" ? "#739b69" : "#645e6e";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#233e3b";
      for (let ty = 0; ty < H; ty++)
        for (let tx = 0; tx < W; tx++)
          if (blocked(this.state.zone, tx, ty, this.state))
            ctx.fillRect(Math.round(tx * sx), Math.round(ty * sy), Math.ceil(sx), Math.ceil(sy));
      this.minimapTerrain = { key: terrainKey, layer };
    }
    c.drawImage(this.minimapTerrain.layer, x, y);
    for (const n of this.npcs)
      this.rect(x + n.x * sx, y + n.y * sy, 2, 2, "#ffd275");
    for (const r of this.remotePlayers ?? [])
      if (r.zone === this.state.zone)
        this.rect(x + r.x * sx, y + r.y * sy, 3, 3, "#72d8cf");
    if (this.state.companion !== "none")
      this.rect(x + this.pet.x * sx, y + this.pet.y * sy, 2, 2, "#edb2ae");
    c.strokeStyle = "#fff1c866";
    c.lineWidth = 1;
    c.strokeRect(x + Math.max(0, this.camera.x) / T * sx, y + Math.max(0, this.camera.y) / T * sy,
      Math.min(W, this.canvas.width / T) * sx, Math.min(H, this.canvas.height / T) * sy);
    this.rect(
      x + this.state.player.x * sx - 2,
      y + this.state.player.y * sy - 2,
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
