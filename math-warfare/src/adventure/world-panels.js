import { escapeHtml as esc } from "./html.js";
import { SHOP, NPCS } from "./content.js";
import { fresh, available, purchase } from "./progress.js";
import { LANDMARKS, dimensions, villagePath } from "./map-layout.js";
import { petName, drawCompanion } from "./companion.js";
import { blocked } from "./world.js";

const $ = (id) => document.getElementById(id);

export function setupWorldPanels({
  state,
  getWorld,
  art,
  content,
  open,
  close,
  refresh,
  toast,
  chime,
  modalHead,
  bindClose,
  fullscreen,
  about,
}) {
  function companions() {
    const world = getWorld();
    const unlocked = [
      state.completed.includes("bakery") ? "cat" : null,
      state.completed.includes("garden") ? "frog" : null,
    ].filter(Boolean);
    const kind = state.companion;
    const hasPet = kind !== "none";
    const name = petName(state.petNames[kind], kind);
    const distance = hasPet
      ? Math.hypot(world.pet.x - state.player.x, world.pet.y - state.player.y)
      : 0;

    open(
      modalHead("COMPANIONS", hasPet ? esc(name) : "Cat & frog") +
        `<div class="pet-card"><canvas id="pet-preview" width="128" height="96" aria-label="${hasPet ? esc(name) : "Companion"} pixel art preview"></canvas><div><strong>${hasPet ? (kind === "cat" ? "Bram’s bakery cat" : "Fern’s pond frog") : "Earn a companion"}</strong><p>${hasPet ? `${world.pet.mode === "stay" ? "Waiting where you asked." : "Following your footsteps."} ${distance > 3 ? "A little way back on the trail." : "Close by and ready to explore."}` : "Help Bram to befriend Pixel the cat. Help Fern to unlock Pebble the frog."}</p></div></div><label class="field-label" for="pet-kind">Travelling companion</label><select id="pet-kind"><option value="none">A quiet solo walk</option>${unlocked.map((pet) => `<option value="${pet}">${esc(petName(state.petNames[pet], pet))} · ${pet}</option>`).join("")}</select>` +
        (hasPet
          ? `<form id="pet-name-form"><label class="field-label" for="pet-name">Give your friend a name</label><div class="pet-name-row"><input id="pet-name" maxlength="18" value="${esc(name)}" autocomplete="off"><button type="submit">Save name</button></div></form><div class="pet-commands"><button id="pet-scratch" ${distance > 2.2 ? "disabled" : ""}>Give a scratch ♥</button><button id="pet-stay">Stay here</button><button id="pet-recall" class="primary">Recall / follow</button></div><p class="muted">Click your pet when nearby to give it a scratch. It uses paths around water, beds and buildings. After seven quiet seconds, it rests. Stay lasts until you recall it, change maps or reload.</p>`
          : `<button id="pet-unlock" class="primary">${unlocked.length ? "Choose a friend above" : "Meet " + (available(state, "bakery") ? "Bram" : "Mira") + " →"}</button>`),
    );
    bindClose();
    $("pet-kind").value = kind;
    $("pet-kind").onchange = () => {
      state.companion = $("pet-kind").value;
      world.petKind = state.companion;
      world.pet.reset(state.player);
      refresh();
      companions();
    };

    const canvas = $("pet-preview");
    const context = canvas.getContext("2d");
    const preview = (time) => {
      if (!document.querySelector("#panel")?.open || $("pet-preview") !== canvas)
        return;
      context.clearRect(0, 0, 128, 96);
      context.fillStyle = "#d8c798";
      context.fillRect(0, 0, 128, 96);
      if (hasPet) {
        context.save();
        context.scale(2, 2);
        context.imageSmoothingEnabled = false;
        drawCompanion(
          context,
          {
            x: 1,
            y: 1.3,
            dir: 2,
            moving: !state.reducedMotion,
            idle: 0,
            affection: 0,
          },
          kind,
          art,
          time / 1000,
          state.reducedMotion,
        );
        context.restore();
      }
      requestAnimationFrame(preview);
    };
    requestAnimationFrame(preview);

    if (hasPet) {
      $("pet-name-form").onsubmit = (event) => {
        event.preventDefault();
        state.petNames[kind] = petName($("pet-name").value, kind);
        refresh();
        companions();
        toast("Your companion’s name is saved.");
      };
      $("pet-scratch").onclick = () => {
        close();
        world.petAnimal();
      };
      $("pet-stay").onclick = () => {
        world.pet.stay();
        close();
        toast(`${name} will wait right here.`);
      };
      $("pet-recall").onclick = () => {
        world.pet.recall(state.player);
        close();
        toast(`${name} is finding the path back to you.`);
      };
    } else {
      $("pet-unlock").onclick = () => {
        if (unlocked.length) return;
        close();
        world.go(available(state, "bakery") ? "bakery" : "welcome");
      };
    }
  }

  function countryMap() {
    const world = getWorld();
    const places = state.zone === "village" ? LANDMARKS : NPCS.cave;
    const bounds = dimensions(state.zone);
    const width = 560;
    const height = 410;
    const scaleX = width / bounds.width;
    const scaleY = height / bounds.height;

    open(
      modalHead("COUNTRY MAP", state.zone === "village" ? "Numberglen" : "Lantern Hollow") +
        `<canvas id="country-map" width="${width}" height="${height}" aria-label="World map. White marks your position; gold marks destinations."></canvas><p class="muted">White: you · pink: companion · gold: destinations. Choose a trail below to walk there.</p><div class="map-destinations">${places.map((place) => `<button data-place="${place.id}">${esc(place.name)} <span>Walk there →</span></button>`).join("")}</div>`,
    );
    bindClose();

    const context = $("country-map").getContext("2d");
    for (let y = 0; y < bounds.height; y++) {
      for (let x = 0; x < bounds.width; x++) {
        context.fillStyle = blocked(state.zone, x, y, state)
          ? "#365348"
          : state.zone === "village"
            ? villagePath(x, y)
              ? "#d3b280"
              : "#93a371"
            : "#9e92a4";
        context.fillRect(x * scaleX, y * scaleY, Math.ceil(scaleX), Math.ceil(scaleY));
      }
    }
    const mark = (x, y, color, size = 6) => {
      context.fillStyle = color;
      context.fillRect(x * scaleX - size / 2, y * scaleY - size / 2, size, size);
    };
    places.forEach((place) => mark(place.x + 0.5, place.y + 0.5, "#ffe29d"));
    if (state.companion !== "none")
      mark(world.pet.x, world.pet.y, "#efacaa");
    mark(state.player.x, state.player.y, "#fff", 8);
    document.querySelectorAll("[data-place]").forEach((button) => {
      button.onclick = () => {
        close();
        world.go(button.dataset.place);
      };
    });
  }

  function collection() {
    open(
      modalHead("SUPPLY BENCH", "Village supplies") +
        `<p>You have <strong>${state.coins} coins</strong>. Upgrades are decorations, and maths rewards are the same for everyone.</p><div class="shop-list">${SHOP.map((item) => `<article><div><strong>${item.name}</strong><p>${item.description}</p></div><button data-buy="${item.id}" ${state.upgrades.includes(item.id) || state.coins < item.price ? "disabled" : ""}>${state.upgrades.includes(item.id) ? "Added ✓" : item.price + " coins"}</button></article>`).join("")}</div><label class="field-label" for="companion">Travelling companion</label><select id="companion"><option value="none">A quiet solo walk</option>${state.completed.includes("bakery") ? '<option value="cat">Pixel · the apologetic cat</option>' : ""}${state.completed.includes("garden") ? '<option value="frog">Pebble · the picky frog</option>' : ""}</select><p class="muted">Earn companions through Bram’s and Fern’s quests.</p>`,
    );
    bindClose();
    $("companion").value = state.companion;
    $("companion").onchange = () => {
      const world = getWorld();
      state.companion = $("companion").value;
      world.petKind = state.companion;
      world.pet.reset(state.player);
      refresh();
    };

    const petButton = document.createElement("button");
    petButton.textContent = "Name & care for your companion →";
    petButton.onclick = companions;
    content.append(petButton);

    document.querySelectorAll("[data-buy]").forEach((button) => {
      button.onclick = () => {
        if (!purchase(state, button.dataset.buy)) return;
        refresh();
        collection();
        chime();
        toast("Your village upgrade is ready. Go take a look!");
      };
    });
  }

  function settings() {
    open(
      modalHead("", "Settings") +
        `<label class="setting-row"><input id="mute-setting" type="checkbox" ${state.muted ? "checked" : ""}>Mute game sounds</label><label class="setting-row"><input id="motion-setting" type="checkbox" ${state.reducedMotion ? "checked" : ""}>Reduce motion</label><p class="muted">Solo progress stays in this browser. Online room scores disappear when the host leaves. No account is required.</p><button id="settings-fullscreen">Toggle fullscreen</button> <button id="settings-about">About & credits</button><hr><button id="reset-save">Start a new adventure</button><div id="reset-confirm" hidden><p>This clears adventure progress, coins and learning notes on this device. Your old MATH-Warefare scores are untouched.</p><button id="reset-yes">Clear this adventure</button> <button id="reset-no">Keep my save</button></div>`,
    );
    bindClose();
    $("settings-fullscreen").onclick = fullscreen;
    $("settings-about").onclick = about;
    $("mute-setting").onchange = () => {
      state.muted = $("mute-setting").checked;
      refresh();
    };
    $("motion-setting").onchange = () => {
      state.reducedMotion = $("motion-setting").checked;
      refresh();
    };
    $("reset-save").onclick = () => {
      $("reset-confirm").hidden = false;
    };
    $("reset-no").onclick = () => {
      $("reset-confirm").hidden = true;
    };
    $("reset-yes").onclick = () => {
      const world = getWorld();
      Object.assign(state, fresh());
      world.path = [];
      world.pet.reset(state.player);
      refresh();
      close();
      toast("A new adventure begins. Mira is waiting.");
    };
  }

  return { companions, countryMap, collection, settings };
}
