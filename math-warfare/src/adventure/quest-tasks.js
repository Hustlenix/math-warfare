// Quest truth is derived from existing completion IDs, so old saves gain effects.
export const QUEST_EFFECTS = {
  welcome: { change: "The square lantern is repaired and stays lit.", unlock: "Bram, Fern and Noor can now use your help.", next: "Visit Bram's bakery or Fern's pond.", unit: "repair supplies", marker: "LIGHT RESTORED" },
  bakery: { change: "Bram's packed bread order is ready beside the bakery.", unlock: "Pixel the cat can travel with you.", next: "Help Fern so Ada can recover the cave map.", unit: "bread", marker: "ORDER READY" },
  garden: { change: "Fern's pond beds have an equal supply of water.", unlock: "Pebble the frog can travel with you.", next: "Help Bram, then meet Ada at the library.", unit: "water", marker: "BEDS WATERED" },
  library: { change: "Ada's route measurements are repaired.", unlock: "The cave trail is open.", next: "Follow the cave trail and meet Scout.", unit: "metres", marker: "MAP REPAIRED" },
  market: { change: "Noor's market now displays checked sale prices.", unlock: "Noor's supplies are ready for the final lantern.", next: "Continue towards the cave; the king needs the whole village.", unit: "coins", marker: "PRICES CHECKED" },
  bridge: { change: "Scout's sequence lock opens the first tunnel gate.", unlock: "Pip's mushroom clearing is reachable.", next: "Find Pip beyond the first gate.", unit: "lock setting", marker: "GATE OPEN" },
  fungi: { change: "Pip's soup portions are ready for the lost camp.", unlock: "The second cave gate opens.", next: "Take the trail to Ivo's camp.", unit: "portions", marker: "SOUP SHARED" },
  camp: { change: "Ivo has counted the return journey's rations.", unlock: "The final lantern can be repaired once Noor is ready.", next: "Meet the Fungus King, or finish Noor's market task.", unit: "supplies", marker: "CAMP READY" },
  king: { change: "The last lantern beneath the village stays illuminated.", unlock: "The village's lantern trail is complete.", next: "Explore with your companion or revisit your learning notes.", unit: "lantern supplies", marker: "LAST LANTERN LIT" },
};
const OBJECTIVES = {
  welcome: "Count the supplies needed to repair the square lantern.",
  bakery: "Pack five bread orders from equal baskets.",
  garden: "Share five water supplies fairly among pond beds.",
  library: "Join the route measurements to recover Ada's cave map.",
  market: "Check five discounted prices for Noor's neighbours.",
  bridge: "Align Scout's gate by calculating the gear settings.",
  fungi: "Set aside fair soup portions for the lost camp.",
  camp: "Count the rations left for the journey home.",
  king: "Check every neighbour's contribution to restore the last lantern.",
};
for (const [id, objective] of Object.entries(OBJECTIVES))
  QUEST_EFFECTS[id].objective = objective;

const pick = (rng, low, high) => low + Math.floor(rng() * (high - low + 1));
function task(skill, text, answer, hint, scene, success) {
  return { skill, text, answer, hint, scene, success };
}
function scene(title, instruction, groups, items, unit, operation) {
  return { title, instruction, groups, items, unit, operation };
}

// Supplies are generated from the task itself, not wrapped around arena equations.
export function questQuestion(id, index, level = 1, rng = Math.random) {
  const limit = [6, 10, 14][level - 1] ?? 6;
  const groups = pick(rng, 2, Math.min(6, limit));
  const items = pick(rng, 2, limit);
  if (id === "welcome") {
    const stock = pick(rng, 3, limit), incoming = pick(rng, 2, limit);
    const subtract = index % 3 === 1;
    const total = stock + incoming;
    return task("add", subtract
      ? "The lantern needs " + total + " copper clips. Mira has " + stock + ". How many more clips are needed?"
      : "Mira has " + stock + " repair pieces. A crate brings " + incoming + " more. How many pieces are ready?",
      subtract ? incoming : total,
      subtract ? "Find the missing supply: " + total + " - " + stock + " = " + incoming + "."
        : "Combine the two supplies: " + stock + " + " + incoming + " = " + total + ".",
      scene(["Count the clips", "Fill the missing supplies", "Prepare the lantern"][index % 3],
        subtract ? "Known stock + missing clips = required supply" : "Combine the stock and the delivery.",
        2, [stock, subtract ? total : incoming], "pieces", subtract ? "missing" : "combine"),
      "Supply " + (index + 1) + " is checked. Mira can fit the next lantern part.");
  }
  if (id === "bakery") return task("multiply",
    "Bram has " + groups + " bread baskets with " + items + " buns in each. How many buns can he deliver?",
    groups * items, groups + " equal baskets means " + Array(groups).fill(items).join(" + ") + " = " + groups * items + ".",
    scene("Pack order " + (index + 1), "Count every equal basket, not just one.", groups, items, "buns", "groups"),
    "Order " + (index + 1) + " is packed: " + groups * items + " buns ready.");
  if (id === "garden") return task("divide",
    "Fern has " + groups * items + " cups of water for " + groups + " pond beds. How many cups should each bed receive?",
    items, "Share " + groups * items + " into " + groups + " equal beds: " + groups * items + " / " + groups + " = " + items + ".",
    scene("Water bed group " + (index + 1), "Every bed must receive the same amount.", groups, groups * items, "cups to share", "share"),
    "Each of the " + groups + " beds receives " + items + " cups. No bed is left dry.");
  if (id === "market") {
    const price = pick(rng, 2, limit) * 20, percent = [10, 25, 50][index % 3];
    const discount = price * percent / 100;
    return task("percent", "Noor's lamp oil costs " + price + " coins. It is " + percent + "% off. What is the sale price?",
      price - discount, percent + "% of " + price + " is " + discount + ". Subtract the discount: " + price + " - " + discount + " = " + (price - discount) + ".",
      scene("Check a market price", "Original price minus discount gives the price a neighbour pays.", 2, [price, percent], "coins / percent off", "price"),
      "Price checked: " + (price - discount) + " coins. Noor can label the order honestly.");
  }
  if (id === "library") {
    const a = pick(rng, 10, 50), b = pick(rng, 5, 25);
    return task("decimal", "Ada measures two trail sections: " + a / 10 + " m and " + b / 10 + " m. How long is the route?",
      (a + b) / 10, "Add the tenths: " + a + " + " + b + " = " + (a + b) + " tenths, or " + (a + b) / 10 + " metres.",
      scene("Repair a route measurement", "Join the two trail sections.", 2, [a / 10, b / 10], "metres", "combine"),
      "Ada marks the joined route on the cave map.");
  }
  if (id === "bridge") return task("order",
    "Scout's gate needs " + groups + " + " + items + " × 2 turns. What setting opens the lock?",
    groups + items * 2, "Turn the paired gears first: " + items + " × 2 = " + items * 2 + ". Then add " + groups + ".",
    scene("Set the tunnel lock", "Paired gears turn before the loose gear count.", 2, [groups, items], "gear turns", "lock"),
    "The next lock tumbler is aligned.");
  if (id === "fungi") return task("fraction",
    "Pip cooked " + groups * items + " soup portions. One of " + groups + " equal groups is for the camp. How many portions go there?",
    items, "One part out of " + groups + " means divide " + groups * items + " by " + groups + ": " + items + " portions.",
    scene("Share the soup batch", "Take one equal part for the camp.", groups, groups * items, "portions", "share"),
    "The camp's soup portions are set aside.");
  if (id === "camp") return task("word",
    "Ivo packs " + groups + " ration bags with " + items + " meals each. The camp eats " + groups + " meals. How many remain for the journey?",
    groups * items - groups, "Pack first: " + groups + " × " + items + " = " + groups * items + ". Then subtract " + groups + " eaten meals.",
    scene("Prepare the return journey", "Count the packed meals, then remove those used tonight.", groups, items, "meals per bag", "groups"),
    "Ivo checks the remaining rations for the journey.");
  if (id === "king") {
    const stage = ["welcome", "bakery", "garden", "library", "market", "bridge", "fungi", "camp"][index % 8];
    const q = questQuestion(stage, index, level, rng);
    return { ...q, scene: { ...q.scene, title: "Last lantern: " + q.scene.title }, success: "Another village contribution is ready for the last lantern." };
  }
  throw new Error("Unknown quest task: " + id);
}

export function questProgress(state, id) {
  return state.questWork?.[id] ?? 0;
}

export function drawQuestEffects(world) {
  const { state } = world;
  if (state.zone !== "village") return;
  if (state.completed.includes("bakery")) {
    for (let i = 0; i < 3; i++) {
      world.rect((8 + i * .65) * 32, 9.5 * 32, 18, 12, "#a76f4a");
      world.rect((8 + i * .65) * 32 + 3, 9.5 * 32 - 3, 12, 8, "#e8d4a2");
    }
    world.label("ORDER READY" + (state.questResults?.bakery ? ": " + state.questResults.bakery + " BUNS" : ""), 9 * 32, 10.2 * 32, "#182c29", 9);
  }
  if (state.completed.includes("garden")) {
    for (let i = 0; i < 4; i++) world.rect((8 + i * .5) * 32, 20 * 32, 10, 6, "#71a6b2");
    world.label("BEDS WATERED", 9 * 32, 20.6 * 32, "#182c29", 9);
  }
  if (state.completed.includes("market")) world.label(state.questResults?.market ? "SALE: " + state.questResults.market + " COINS" : "PRICES CHECKED", 25 * 32, 20 * 32, "#182c29", 9);
}
