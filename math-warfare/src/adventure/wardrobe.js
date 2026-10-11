import data from "./wardrobe-data.json" with { type: "json" };
import { spriteFrame } from "./village-life.js";
export const { archetypes: ARCHETYPES, skins: SKINS, looks: LOOKS } = data;
export const CATALOG = ARCHETYPES.flatMap((type, a) =>
  SKINS.flatMap((skin, s) =>
    LOOKS.map((look, l) => {
      const index = a * SKINS.length * LOOKS.length + s * LOOKS.length + l;
      return {
        id: `hero-${String(index + 1).padStart(3, "0")}`,
        index,
        archetype: a,
        skin: s,
        look: l,
        name: `${type.name} · ${skin.name} · ${look.name}`,
        group: type.group,
        description: type.description,
      };
    }),
  ),
);
const byId = new Map(CATALOG.map((h) => [h.id, h]));
export const DEFAULT_HERO = "hero-271";
export function hero(id) {
  return byId.get(id) ?? byId.get(DEFAULT_HERO);
}
export function selection(a, s, l) {
  return (
    CATALOG[(Number(a) || 0) * 27 + (Number(s) || 0) * 3 + (Number(l) || 0)] ??
    hero(DEFAULT_HERO)
  );
}
export function normalizeAppearance(raw) {
  const id = byId.has(raw?.id) ? raw.id : DEFAULT_HERO;
  const name =
    typeof raw?.name === "string"
      ? raw.name
          .replace(/[\u0000-\u001f<>]/g, "")
          .trim()
          .slice(0, 24)
      : "";
  return { id, name: name || "Traveller" };
}
export function heroFrame(id, direction, moving, time, reduced = false) {
  return {
    sx: spriteFrame(direction, moving, time, reduced) * 16,
    sy: hero(id).index * 32,
    width: 16,
    height: 32,
  };
}
export function drawHeroFace(ctx, art, id, x, y, scale = 3) {
  const h = hero(id);
  ctx.drawImage(
    art.heroFaces,
    (h.index % 20) * 16,
    Math.floor(h.index / 20) * 32,
    16,
    32,
    x,
    y,
    16 * scale,
    32 * scale,
  );
}
export function portraitStyle(art, id, scale = 2) {
  const h = hero(id);
  return `width:${16 * scale}px;height:${32 * scale}px;background-image:url('${art.heroFaces.src}');background-size:${320 * scale}px ${544 * scale}px;background-position:-${(h.index % 20) * 16 * scale}px -${Math.floor(h.index / 20) * 32 * scale}px`;
}
