import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";

// Only compiled game code contains the game-specific paid-art crops.
// The public source repository never contains the original sheets or image files.
const licensedArt = {
  name: "local-licensed-art",
  resolveId(id) {
    if (id === "virtual:licensed-art") return "\0licensed-art";
  },
  load(id) {
    if (id !== "\0licensed-art") return null;
    const dir = path.resolve(".licensed-art");
    if (!fs.existsSync(dir))
      throw new Error(
        "Run scripts/import-art.py with your owned asset packs before building.",
      );
    const entries = fs
      .readdirSync(dir)
      .filter((n) => n.endsWith(".png"))
      .map((name) => [
        name.slice(0, -4),
        "data:image/png;base64," +
          fs.readFileSync(path.join(dir, name)).toString("base64"),
      ]);
    return "export default " + JSON.stringify(Object.fromEntries(entries));
  },
};
export default defineConfig({ base: "./", plugins: [licensedArt] });
