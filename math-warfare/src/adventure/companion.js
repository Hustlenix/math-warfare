export const petName = (value, kind = "cat") => {
  const clean = typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 18) : "";
  return clean || (kind === "frog" ? "Pebble" : "Pixel");
};
const tile = (p) => `${Math.floor(p.x)},${Math.floor(p.y)}`;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// The pet walks a delayed trail through the same BFS/collision rules as the hero.
// It never interpolates straight through furniture or teleports to catch up.
export class Companion {
  constructor(player, route, solid) {
    this.route = route;
    this.solid = solid;
    this.reset(player);
  }
  reset(player) {
    const candidates = [[-1, 0], [1, 0], [0, 1], [0, -1], [0, 0]];
    const [dx, dy] = candidates.find(([x, y]) => !this.solid(Math.floor(player.x) + x, Math.floor(player.y) + y)) ?? [0, 0];
    this.x = Math.floor(player.x) + dx + 0.5;
    this.y = Math.floor(player.y) + dy + 0.5;
    this.path = [];
    this.trail = [{ x: Math.floor(player.x) + 0.5, y: Math.floor(player.y) + 0.5 }];
    this.lastTile = tile(player);
    this.dir = 3;
    this.moving = false;
    this.idle = 0;
    this.affection = 0;
    this.mode = "follow";
  }
  stay() {
    this.mode = "stay";
    this.path = [];
    this.moving = false;
  }
  recall(player) {
    this.mode = "follow";
    this.trail = [{ x: Math.floor(player.x) + 0.5, y: Math.floor(player.y) + 0.5 }];
    this.lastTile = tile(player);
    this.path = this.route(this, this.trail[0]);
    // Stop at the last adjacent tile instead of standing on top of the hero.
    if (this.path.length) this.path.splice(-Math.min(2, this.path.length));
  }
  pet(player) {
    if (distance(this, player) > 2.2) return false;
    this.affection = 3;
    this.idle = 0;
    return true;
  }
  update(dt, player, active = true) {
    this.affection = Math.max(0, this.affection - dt);
    this.moving = false;
    if (!active) return;
    const here = tile(player);
    if (here !== this.lastTile) {
      this.lastTile = here;
      this.trail.push({ x: Math.floor(player.x) + 0.5, y: Math.floor(player.y) + 0.5 });
      if (this.trail.length > 80) this.trail.shift();
    }
    if (this.mode === "stay") {
      this.idle += dt;
      return;
    }
    // Two tiles of clearance keep a north-following cat clear of the hero's silhouette,
    // rather than looking like it is sitting on a tall character's head.
    while (!this.path.length && this.trail.length > 2) {
      const target = this.trail.shift();
      if (tile(this) === tile(target) && distance(this, target) < 0.05) continue;
      // Align to this tile's centre before taking a grid route around a corner.
      const centre = { x: Math.floor(this.x) + 0.5, y: Math.floor(this.y) + 0.5 };
      const route = this.route(this, target);
      if (route.length) this.path = distance(this, centre) > 0.02 ? [centre, ...route] : route;
    }
    let budget = dt * 5.4;
    while (this.path.length && budget > 0) {
      const goal = this.path[0], d = distance(this, goal);
      if (d < 0.001) { this.path.shift(); continue; }
      const dx = goal.x - this.x, dy = goal.y - this.y;
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 0) : dy > 0 ? 3 : 1;
      const step = Math.min(d, budget), x = this.x + dx / d * step, y = this.y + dy / d * step;
      if (this.solid(x, y)) { this.path = []; break; }
      this.x = x; this.y = y;
      this.moving = true;
      budget -= step;
      if (step === d) this.path.shift();
    }
    this.idle = this.moving ? 0 : this.idle + dt;
  }
}

// Original tiny walking poses. The owned LimeZu curled cat is reserved for naps.
// Each bitmap cell is a whole pixel; no smoothing, stretched sleeping frame or sliding feet.
const CAT_SIDE = [
  "................", "................", "..........d..d..", "..........dssd..",
  "..........swws..", "...d......swks..", "..dsddddddsssss.", "..dsssssssssss..",
  "..dsswsssssssd..", "...sswssssssd...", "...ddddddddd....", "....p.....p.....",
  "....p.....p.....", "................", "................", "................",
];
const CAT_FRONT = [
  "................", "................", "....d......d....", "....ddssssdd....",
  "....dssssssd....", "....sswsswss....", "....ssksksss....", ".....swwwws.....",
  ".....dsssssd....", "....dsssssssd...", "....dsswwsssd...", "....dsswwsssd...",
  ".....p....p.....", ".....p....p.....", "................", "................",
];
const CAT_BACK = [
  "................", "................", "....d......d....", "....ddssssdd....",
  "....dssssssd....", "....dssssssd....", ".....dddddd.....", ".....dsssssd....",
  "....dsssssssd...", "....dsssssssd...", "....dssddsssd...", "....dssd.sssd...",
  ".....p.d..p.....", ".....p.d..p.....", ".......d........", "................",
];
export function drawCompanion(ctx, pet, kind, art, time, reduced = false) {
  const x = Math.round(pet.x * 32), y = Math.round(pet.y * 32);
  ctx.fillStyle = "#30282044";
  ctx.fillRect(x - 10, y - 3, 20, 5);
  const walk = !reduced && pet.moving;
  if (kind === "cat" && !pet.moving && pet.idle > 7 && !pet.affection) {
    const f = reduced ? 0 : Math.floor(time * 4) % 12;
    // 48px source cells contain a 26px curled cat and generous transparent padding.
    ctx.drawImage(art.cat, f * 48 + 8, 0, 32, 16, x - 16, y - 17, 32, 16);
  } else if (kind === "cat") {
    const bitmap = pet.dir === 1 ? CAT_BACK : pet.dir === 3 ? CAT_FRONT : CAT_SIDE;
    const palette = { d: "#3e4354", s: "#828c9e", w: "#c5cbd1", k: "#172f32", p: "#4d5366" };
    const stride = walk ? Math.floor(time * 10) % 4 : 0;
    for (let row = 0; row < 16; row++) for (let col = 0; col < 16; col++) {
      const pixel = bitmap[row][col];
      if (pixel === ".") continue;
      const foot = pixel === "p" ? ((col < 8 ? stride % 2 : (stride + 1) % 2) * (walk ? 1 : 0)) : 0;
      ctx.fillStyle = palette[pixel];
      const cx = pet.dir === 0 ? 15 - col : col;
      ctx.fillRect(x - 16 + cx * 2 + foot * (pet.dir === 0 ? -2 : 2), y - 27 + row * 2 - (walk && stride === 1 && row < 11 ? 1 : 0), 2, 2);
    }
  } else {
    const f = reduced ? 0 : Math.floor(time * (walk ? 8 : 3)) % 6;
    const hop = walk ? Math.abs(Math.sin(time * 10)) * 6 : 0;
    ctx.save();
    ctx.translate(x, y - hop);
    if (pet.dir === 0) ctx.scale(-1, 1);
    ctx.drawImage(art.frog, f * 16, 0, 16, 16, -12, -21, 24, 24);
    ctx.restore();
  }
  if (pet.affection > 0) {
    const rise = reduced ? 0 : Math.sin(time * 4) * 2;
    ctx.fillStyle = "#e8a09c";
    ctx.fillRect(x - 4, y - 35 + rise, 3, 3);
    ctx.fillRect(x + 1, y - 35 + rise, 3, 3);
    ctx.fillRect(x - 3, y - 32 + rise, 6, 3);
    ctx.fillRect(x - 1, y - 29 + rise, 2, 2);
  }
}
