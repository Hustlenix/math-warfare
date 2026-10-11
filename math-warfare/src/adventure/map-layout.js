// Rendering, saves, online presence and collision use the same world dimensions.
export const MAPS = { village: { width: 60, height: 44 }, cave: { width: 33, height: 25 } };
export const dimensions = (zone) => MAPS[zone] ?? MAPS.village;
export const FARM = { x: 37, y: 24, width: 10, height: 9, aisleX: 41, aisleY: 28 };
export const BRIDGES = [13, 14, 33, 34];
export const TREES = [
  [33, 4], [45, 5], [47, 9], [33, 19], [48, 20], [35, 27],
  [33, 37], [46, 37], [54, 5], [57, 10], [56, 23], [54, 29],
  [57, 38], [4, 29], [6, 38], [12, 40], [23, 29], [26, 38],
  [28, 32], [20, 40], [38, 40],
];
export const LANDMARKS = [
  { id: "farm-trail", name: "Copperfield farm", x: 36, y: 25, label: "Crop beds & multiplication", skill: "multiply", copy: "Real fields have paths between their beds. Take the gate to the centre aisle, watch the chickens, or practise counting a harvest in equal rows." },
  { id: "ranch-trail", name: "Sunset ranch", x: 41, y: 11, label: "Ranch & word problems", skill: "word", copy: "The barn sits behind the trail. Count supplies, plan fair shares and make room for the animals. A good ranch runs on small calculations." },
  { id: "creek-trail", name: "Willow creek camp", x: 55, y: 17, label: "Creek bridges & fractions", skill: "fraction", copy: "Two bridges connect the far bank. Rest beside the creek and practise dividing a whole into fair portions. Water is solid to walkers and pets; use a bridge." },
  { id: "pet-trail", name: "Companion meadow", x: 15, y: 35, label: "A place for your travelling friend", copy: "A quiet patch of country for small paws. Name your companion, give it a scratch, ask it to stay, or call it back to the trail. Pets follow walkable ground like you do." },
];
export function cropTile(x, y) {
  return x > FARM.x && x < FARM.x + FARM.width - 1 &&
    y > FARM.y && y < FARM.y + FARM.height - 1 &&
    x !== FARM.aisleX && y !== FARM.aisleY;
}
export function farmFence(x, y) {
  const f = FARM;
  return ((y === f.y || y === f.y + f.height - 1) && x >= f.x && x < f.x + f.width && x !== f.aisleX) ||
    ((x === f.x || x === f.x + f.width - 1) && y > f.y && y < f.y + f.height - 1 && y !== f.aisleY);
}
export function landscapeBlocked(x, y) {
  return cropTile(x, y) || farmFence(x, y) ||
    (x >= 50 && x <= 51 && y >= 3 && y <= 40 && !BRIDGES.includes(y)) ||
    (x >= 36 && x <= 42 && y >= 5 && y <= 9) ||
    (x >= 8 && x <= 12 && y >= 33 && y <= 35) ||
    (y === 17 && x >= 22 && x <= 26) ||
    TREES.some(([tx, ty]) => x === tx && y === ty + 1);
}
export function villagePath(x, y) {
  // Roads stop at district edges; planted beds never cover a walking lane.
  return (x >= 14 && x <= 17 && y >= 2 && y <= 40) ||
    (y >= 12 && y <= 14 && x >= 1 && x <= 58) ||
    ((x === 7 || x === 8 || x === 24 || x === 25) && y >= 8 && y <= 19) ||
    (y === 19 && x >= 6 && x <= 27) || (y === 8 && x >= 6 && x <= 26) ||
    (x >= 34 && x <= 36 && y >= 3 && y <= 40) ||
    (y >= 33 && y <= 34 && x >= 14 && x <= 57) ||
    (y === 23 && x >= 35 && x <= 48) ||
    (x === 48 && y >= 14 && y <= 34) ||
    (x >= 54 && x <= 55 && y >= 14 && y <= 34) ||
    (x === FARM.aisleX && y >= FARM.y && y < FARM.y + FARM.height) ||
    (y === FARM.aisleY && x >= FARM.x && x < FARM.x + FARM.width);
}
