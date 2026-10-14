// Routes and dialogue are deterministic so the settlement has a readable rhythm.
// Quest identity stays separate from an actor's temporary position.
export const MEETINGS = [
  {
    pair: ["farmer", "rancher"],
    places: [[43, 23], [44, 23]],
    lines: [["Wren", "Three baskets in each row. Want to count with me?"], ["Bo", "After feeding the chickens. They are terrible at fractions."]],
    activity: "Trading supplies on the farm lane",
  },
  {
    pair: ["chemist", "deputy"],
    places: [
      [18, 20],
      [19, 20],
    ],
    lines: [
      ["Cal", "One part concentrate, four parts water."],
      ["Mae", "Five parts lemonade. Now that is science."],
    ],
    activity: "Sharing lemonade by the caravan",
  },
  {
    pair: ["bakery", "market"],
    places: [
      [20, 15],
      [21, 15],
    ],
    lines: [
      ["Bram", "Fresh buns for the market!"],
      ["Noor", "And a basket of apples for you."],
    ],
    activity: "Sharing the morning delivery",
  },
  {
    pair: ["garden", "welcome"],
    places: [
      [12, 16],
      [13, 16],
    ],
    lines: [
      ["Fern", "The frogs have claimed my watering can."],
      ["Mira", "Have you tried asking them politely?"],
    ],
    activity: "Catching up by the garden",
  },
  {
    pair: ["library", "arena"],
    places: [
      [18, 10],
      [19, 10],
    ],
    lines: [
      ["Ada", "One chapter before another race?"],
      ["Rook", "Only if the chapter has dragons."],
    ],
    activity: "Trading stories and training tips",
  },
  {
    pair: ["shop", "market"],
    places: [
      [22, 16],
      [23, 16],
    ],
    lines: [
      ["Tess", "I fixed the lantern hooks."],
      ["Noor", "The square will look lovely tonight."],
    ],
    activity: "Planning the evening lights",
  },
];
export const AMBIENT = [
  {
    id: "farmer", name: "Wren", art: "hero-064", x: 40, y: 23,
    label: "Copperfield farmer", stops: [[40, 23], [41, 28], [41, 33]],
    lines: ["The beds are for seedlings. The centre aisle is for boots.", "Six carrots in a basket, four baskets on the cart. That is my kind of times table."],
  },
  {
    id: "rancher", name: "Bo", art: "hero-280", x: 43, y: 11,
    label: "Sunset rancher", stops: [[43, 11], [45, 15], [44, 23]],
    lines: ["Small paws are welcome on these trails. Give your pet time to catch up.", "I keep the barn off the lane. A wagon ought to have room to turn."],
  },
  {
    id: "chemist",
    name: "Cal",
    art: "hero-218",
    x: 20,
    y: 20,
    label: "Caravan chemist",
    lines: [
      "Exact ratios, clean work. That is chemistry—and maths.",
      "The caravan is parked. I am not missing the sunset.",
    ],
  },
  {
    id: "deputy",
    name: "Mae",
    art: "hero-309",
    x: 28,
    y: 16,
    label: "Frontier deputy",
    lines: [
      "No duels today. Settle this with times tables.",
      "A frontier town runs on fair shares and reliable neighbours.",
    ],
  },
  {
    id: "hazel",
    name: "Hazel",
    art: "person9",
    x: 10,
    y: 17,
    label: "Neighbour",
    lines: [
      "I take the long way home. There is always something happening here.",
      "Bram shares his extra buns with the whole village. Don’t tell Pixel.",
    ],
  },
  {
    id: "jun",
    name: "Jun",
    art: "person10",
    x: 18,
    y: 18,
    label: "Neighbour",
    lines: [
      "I am counting butterflies. They absolutely refuse to sit still.",
      "The cave sounds scary, but Pip makes excellent soup.",
    ],
  },
  {
    id: "sage",
    name: "Sage",
    art: "person11",
    x: 28,
    y: 11,
    label: "Neighbour",
    lines: [
      "We built this village a little at a time. Every helping hand matters.",
      "Listen to the birds. That’s the best clock we have.",
    ],
  },
];
export const AMBIENT_ROUTES = {
  chemist: [[20, 20], [18, 18], [20, 20]],
  deputy: [[28, 16], [24, 14], [18, 19]],
  hazel: [[10, 17], [12, 14], [11, 11]],
  jun: [[18, 18], [19, 14], [23, 14]],
  sage: [[28, 11], [29, 15], [26, 22]],
};
const DEFAULT_AMBIENT_ROUTE = [[28, 11], [29, 15], [26, 22]];
export function routeStops(actor) {
  return actor.stops ?? AMBIENT_ROUTES[actor.id] ?? DEFAULT_AMBIENT_ROUTE;
}
export function facing(dx, dy) {
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 0) : dy > 0 ? 3 : 1;
}
export function spriteFrame(direction, moving, time, reduced = false) {
  const dir = [0, 1, 2, 3].includes(direction) ? direction : 3;
  return dir * 7 + (moving && !reduced ? 1 + (Math.floor(time * 8) % 6) : 0);
}
export function createResidents(npcs) {
  return [...npcs.filter((n) => n.art), ...AMBIENT].map((n, i) => ({
    ...n,
    x: n.x + 0.5,
    y: n.y + 0.5,
    home: { x: n.x + 0.5, y: n.y + 0.5 },
    path: [],
    dir: 3,
    moving: false,
    wait: 4 + i * 1.5,
    phase: "home",
    meeting: null,
    bubble: null,
    activity:
      n.id === "bakery"
        ? "Preparing the next batch"
        : n.id === "garden"
          ? "Tending the pond"
          : n.id === "library"
            ? "Sorting the books"
            : "Enjoying the morning",
  }));
}
export function advanceResident(actor, dt) {
  actor.moving = false;
  if (!actor.path.length) return false;
  const next = actor.path[0],
    dx = next.x - actor.x,
    dy = next.y - actor.y,
    d = Math.hypot(dx, dy),
    distance = dt * 1.65;
  if (d <= Math.max(0.03, distance)) {
    actor.x = next.x;
    actor.y = next.y;
    actor.path.shift();
  } else {
    actor.dir = facing(dx, dy);
    actor.x += (dx / d) * distance;
    actor.y += (dy / d) * distance;
    actor.moving = true;
  }
  return !actor.path.length;
}
