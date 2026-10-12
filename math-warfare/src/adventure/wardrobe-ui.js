import { icon } from "./icons.js";
import {
  ARCHETYPES,
  SKINS,
  LOOKS,
  CATALOG,
  hero,
  selection,
  normalizeAppearance,
  portraitStyle,
  heroFrame,
} from "./wardrobe.js";
export function openWardrobe({ art, state, open, close, refresh, toast }) {
  let draft = normalizeAppearance(state.appearance),
    page = 0;
  const options = (xs) =>
    xs.map((x, i) => `<option value="${i}">${x.name}</option>`).join("");
  open(`<div class="modal-heading"><div><span class="eyebrow">${CATALOG.length} CHARACTERS</span><h2>Choose a character</h2></div><button class="close-panel" aria-label="Close">${icon("close")}</button></div>
    <p class="wardrobe-intro">Choose a style, skin tone and outfit. Use the preview to check the walking directions.</p>
    <div class="wardrobe-layout"><section class="wardrobe-dressing" aria-label="Character customisation">
    <div class="wardrobe-stage"><span id="hero-portrait" role="img" aria-label="Selected character"></span><div><h3 id="hero-title"></h3><p id="hero-description"></p><span class="wardrobe-free">Change character whenever you like.</span></div></div>
    <label for="hero-name">Your traveller’s name</label><input id="hero-name" maxlength="24" autocomplete="off" placeholder="Traveller">
    <label for="hero-style">Character style</label><select id="hero-style">${options(ARCHETYPES)}</select>
    <label for="hero-skin">Skin tone</label><select id="hero-skin">${options(SKINS)}</select>
    <label for="hero-look">Outfit colour</label><select id="hero-look">${options(LOOKS)}</select>
    <div class="wardrobe-angles" aria-label="Four-direction preview">${["Front", "Left", "Right", "Back"].map((label, i) => `<figure><canvas id="hero-angle-${i}" width="32" height="64" aria-label="${label} character view"></canvas><figcaption>${label}</figcaption></figure>`).join("")}</div>
    <label class="wardrobe-walk"><input id="hero-walk" type="checkbox" ${state.reducedMotion ? "" : "checked"}>Preview walking</label>
    <div class="button-row"><button id="hero-apply" class="primary">Use character</button><button id="hero-cancel">Cancel</button></div><p class="wardrobe-save">Your quests, coins and companions stay with you.</p>
    </section><section class="wardrobe-catalogue" aria-label="Ready-made character catalogue">
    <div class="wardrobe-browse"><label for="hero-search">Find a look</label><input id="hero-search" type="search" placeholder="Try curly, cowboy, chemist…"><label class="sr-only" for="hero-group">Character collection</label><select id="hero-group"><option>All collections</option><option>Neighbours</option><option>Desert</option><option>Frontier</option></select></div>
    <p id="hero-catalogue-status" role="status" aria-live="polite"></p><div id="hero-grid" class="hero-grid"></div><div class="wardrobe-pages"><button id="hero-prev" aria-label="Previous character page">←</button><span id="hero-page"></span><button id="hero-next" aria-label="Next character page">→</button></div>
    </section></div>`);
  const $ = (id) => document.getElementById(id),
    parent = $("panel");
  parent.classList.add("wardrobe-panel");
  const stop = () => {
    parent.classList.remove("wardrobe-panel");
    cancelAnimationFrame(frame);
  };
  let frame;
  parent.addEventListener("close", stop, { once: true });
  $("hero-name").value = draft.name;
  function preview() {
    const h = hero(draft.id);
    $("hero-style").value = String(h.archetype);
    $("hero-skin").value = String(h.skin);
    $("hero-look").value = String(h.look);
    $("hero-portrait").setAttribute("style", portraitStyle(art, draft.id, 3));
    $("hero-title").textContent = ARCHETYPES[h.archetype].name;
    $("hero-description").textContent = h.description;
  }
  function filtered() {
    const search = $("hero-search").value.trim().toLowerCase(),
      group = $("hero-group").value;
    return CATALOG.filter(
      (h) =>
        (group === "All collections" || h.group === group) &&
        `${h.name} ${h.group} ${h.description}`.toLowerCase().includes(search),
    ).sort(
      (a, b) =>
        a.skin * 36 +
        a.look * 12 +
        a.archetype -
        (b.skin * 36 + b.look * 12 + b.archetype),
    );
  }
  function grid() {
    const xs = filtered(),
      pages = Math.max(1, Math.ceil(xs.length / 24));
    page = Math.min(page, pages - 1);
    $("hero-grid").innerHTML = xs
      .slice(page * 24, page * 24 + 24)
      .map(
        (h) =>
          `<button type="button" data-hero="${h.id}" class="hero-card ${h.id === draft.id ? "chosen" : ""}" aria-pressed="${h.id === draft.id}" aria-label="${h.name}"><span aria-hidden="true" class="hero-mini" style="${portraitStyle(art, h.id, 2)}"></span><span>${ARCHETYPES[h.archetype].name}<small>${SKINS[h.skin].name} · ${LOOKS[h.look].name}</small></span></button>`,
      )
      .join("");
    if (!xs.length)
      $("hero-grid").textContent =
        "No matching travellers. Try another name or collection.";
    $("hero-catalogue-status").textContent =
      `${xs.length} of ${CATALOG.length} ready-made looks`;
    $("hero-page").textContent = `Page ${page + 1} / ${pages}`;
    $("hero-prev").disabled = page === 0;
    $("hero-next").disabled = page === pages - 1;
    for (const b of $("hero-grid").querySelectorAll("[data-hero]"))
      b.onclick = () => {
        draft.id = b.dataset.hero;
        preview();
        grid();
      };
  }
  for (const id of ["hero-style", "hero-skin", "hero-look"])
    $(id).onchange = () => {
      draft.id = selection(
        $("hero-style").value,
        $("hero-skin").value,
        $("hero-look").value,
      ).id;
      preview();
      grid();
    };
  $("hero-search").oninput = $("hero-group").onchange = () => {
    page = 0;
    grid();
  };
  $("hero-prev").onclick = () => {
    page--;
    grid();
  };
  $("hero-next").onclick = () => {
    page++;
    grid();
  };
  $("hero-apply").onclick = () => {
    state.appearance = normalizeAppearance({
      ...draft,
      name: $("hero-name").value,
    });
    refresh();
    close();
    toast("Character updated.");
  };
  $("hero-cancel").onclick = $("panel-content").querySelector(
    ".close-panel",
  ).onclick = close;
  function animate(time) {
    if (!$("hero-angle-0")) return;
    for (const [i, dir] of [3, 0, 2, 1].entries()) {
      const canvas = $(`hero-angle-${i}`),
        ctx = canvas.getContext("2d"),
        f = heroFrame(
          draft.id,
          dir,
          $("hero-walk").checked,
          time / 1000,
          state.reducedMotion,
        );
      ctx.clearRect(0, 0, 32, 64);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(art.heroAtlas, f.sx, f.sy, 16, 32, 0, 0, 32, 64);
    }
    frame = requestAnimationFrame(animate);
  }
  preview();
  grid();
  frame = requestAnimationFrame(animate);
}
