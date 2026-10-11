import { drawHeroFace } from "./wardrobe.js";
export function setupIntro(art, state, onStart) {
  const overlay = document.getElementById("intro"),
    canvas = document.getElementById("intro-scene"),
    c = canvas.getContext("2d");
  const title = document.getElementById("intro-start"),
    status = document.getElementById("intro-status"),
    fill = document.getElementById("intro-progress");
  let ready = false,
    frame,
    exited = false;
  const reduced =
    state.reducedMotion ||
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rect = (x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const image = (name, x, y, scale = 3) => {
    if (name === "playerFace" || name.startsWith("hero-")) {
      if (art.heroFaces)
        drawHeroFace(
          c,
          art,
          name === "playerFace" ? state.appearance.id : name,
          x,
          y,
          scale,
        );
      return;
    }
    const im = art[name];
    if (im)
      c.drawImage(
        im,
        Math.round(x),
        Math.round(y),
        im.width * scale,
        im.height * scale,
      );
  };
  function tree(x, y, s = 1) {
    rect(x + 9 * s, y + 20 * s, 8 * s, 30 * s, "#70573e");
    rect(x - 6 * s, y - 10 * s, 38 * s, 33 * s, "#3e6c54");
    rect(x - 13 * s, y, 50 * s, 20 * s, "#527b59");
    rect(x, y - 17 * s, 24 * s, 15 * s, "#7c9c65");
  }
  function cottage(x, y, s = 1) {
    rect(x, y, 92 * s, 66 * s, "#dec49b");
    rect(x + 13 * s, y + 30 * s, 18 * s, 25 * s, "#537d78");
    rect(x + 65 * s, y + 30 * s, 14 * s, 36 * s, "#86694a");
    for (let i = 0; i < 3; i++) {
      rect(
        x - 15 * s + i * 5 * s,
        y - 18 * s + i * 12 * s,
        (122 - i * 10) * s,
        15 * s,
        "#ad7154",
      );
      for (let j = 0; j < 7; j++)
        rect(
          x + (j * 16 - 8) * s,
          y - 7 * s + i * 12 * s,
          12 * s,
          2 * s,
          "#cf9d75",
        );
    }
    rect(x + 65 * s, y - 24 * s, 10 * s, 22 * s, "#9a8269");
  }
  function draw(t) {
    if (exited) return;
    c.imageSmoothingEnabled = false;
    const time = reduced ? 0 : t / 1000;
    rect(0, 0, 960, 540, "#c3a56e");
    rect(0, 0, 960, 205, "#e3bd7e");
    rect(0, 105, 960, 100, "#c99861");
    rect(460, 74, 112, 112, "#f7e4b2");
    rect(448, 97, 136, 62, "#f7e4b2");
    for (let i = 0; i < 6; i++) {
      const x = (i * 192 + Math.sin(time * 0.12) * 20) % 1080;
      rect(x, 40 + (i % 3) * 23, 93, 8, "#f9e7c3");
      rect(x + 19, 34 + (i % 3) * 23, 37, 6, "#f9e7c3");
    }
    for (let x = 0; x < 960; x += 16) {
      const y = 170 + Math.sin(x * 0.008) * 32;
      rect(x, y, 16, 370, "#a98555");
    }
    for (let x = 0; x < 960; x += 16) {
      const y = 219 + Math.sin(x * 0.012 + 1) * 22;
      rect(x, y, 16, 325, "#7e8053");
    }
    rect(0, 308, 960, 232, "#9b905c");
    rect(0, 424, 960, 116, "#727c4d");
    // Sandstone mesas and a distant caravan make the title card a frontier ensemble.
    for (const [x, y, width, height] of [
      [80, 157, 130, 60],
      [273, 173, 92, 60],
      [625, 155, 174, 67],
    ]) {
      rect(x, y, width, height, "#9c754c");
      rect(x + 12, y - 8, width - 24, 12, "#bd915e");
      rect(x, y + height - 8, width, 10, "#786f47");
    }
    for (let y = 302; y < 540; y += 8) {
      const w = (y - 280) * 1.5;
      rect(480 - w / 2, y, w, 9, y % 16 ? "#d5b27b" : "#c9a671");
    }
    cottage(130, 240, 1.6);
    cottage(670, 240, 1.4);
    tree(35, 250, 3);
    tree(865, 269, 3);
    tree(353, 270, 1.8);
    rect(35, 359, 270, 50, "#7d9b81");
    for (let i = 0; i < 14; i++) {
      rect(44 + i * 18, 370, 5, 13, "#adbe86");
      rect(46 + i * 18, 366, 10, 6, "#d8ac74");
    }
    for (let i = 0; i < 10; i++) {
      const x = 20 + i * 29;
      rect(x, 360, 5, 52, "#b49a71");
      rect(x, 370, 30, 5, "#d6c299");
      rect(x, 390, 30, 5, "#c0a97e");
    }
    image("mushrooms", 744, 391, 3);
    image("fungusFace", 811, 385, 3);
    image("kingFace", 856, 399, 3);
    // Ensemble composition: the actual playable hero leads the actual villagers.
    for (const [n, x, y, s] of [
      ["person3Face", 113, 358, 3],
      ["person4Face", 190, 350, 3],
      ["person9Face", 270, 355, 3],
      ["person2Face", 333, 335, 3.5],
      ["playerFace", 424, 289, 5],
      ["person5Face", 530, 337, 3.5],
      ["person6Face", 613, 350, 3],
      ["person7Face", 678, 362, 3],
      ["person8Face", 743, 361, 3],
      ["person10Face", 52, 392, 2.8],
      ["person11Face", 900, 400, 2.5],
    ]) {
      rect(x + 6, y + 32 * s - 5, 16 * s - 8, 7, "#1b393d55");
      image(n, x, y, s);
    }
    image("hero-218", 795, 354, 3);
    image("hero-309", 850, 359, 3);
    if (art.cat) {
      const f = reduced ? 0 : Math.floor(time * 5) % 12;
      c.drawImage(art.cat, f * 48, 0, 48, 16, 346, 450, 96, 32);
    }
    if (art.frog) {
      const f = reduced ? 0 : Math.floor(time * 4) % 6;
      c.drawImage(art.frog, f * 16, 0, 16, 16, 543, 457, 40, 40);
    }
    for (let i = 0; i < 12; i++) {
      const x = 30 + i * 81,
        y = 492 + (i % 3) * 11;
      rect(x, y, 3, 13, "#a2b770");
      rect(x - 3, y - 3, 10, 5, i % 2 ? "#eac694" : "#c7adc1");
    }
    const badges = [
      ["+", 299, 272],
      ["×", 581, 268],
      ["÷", 628, 308],
      ["−", 343, 307],
    ];
    c.textAlign = "center";
    for (const [s, x, y] of badges) {
      const yy = y + Math.sin(time * 1.3 + x) * 3;
      rect(x - 14, yy - 17, 28, 27, "#203f3bdd");
      c.fillStyle = "#f3d79a";
      c.font = "bold 24px Georgia";
      c.fillText(s, x, yy + 4);
    }
    frame = requestAnimationFrame(draw);
  }
  draw(0);
  title.onclick = () => {
    if (!ready || exited) return;
    exited = true;
    cancelAnimationFrame(frame);
    overlay.hidden = true;
    onStart();
  };
  return {
    progress(done, total) {
      fill.style.width = `${Math.round((done / total) * 100)}%`;
      status.textContent = `Gathering the villagers · ${done} / ${total}`;
    },
    ready() {
      ready = true;
      fill.style.width = "100%";
      status.textContent =
        "The village is ready. Your bright ideas are needed.";
      title.disabled = false;
      document.getElementById("intro-wardrobe").disabled = false;
      title.textContent = state.completed.length
        ? "Continue your adventure →"
        : "Step into Numberglen →";
    },
    error() {
      status.textContent = "Something could not load. Reload to try again.";
      document.getElementById("intro-retry").hidden = false;
      document.getElementById("intro-retry").onclick = () => location.reload();
    },
  };
}
