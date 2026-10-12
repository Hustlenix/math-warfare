import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const root = process.cwd(),
  out = path.join(root, "release");
const hash = (p) =>
  crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
    );
}
if (!fs.existsSync(path.join(root, "dist", "index.html")))
  throw Error("Build first.");
if (out !== path.join(root, "release") || !root.endsWith("math-warfare"))
  throw Error("Unexpected workspace");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.cpSync(path.join(root, "dist"), out, { recursive: true });
if (walk(out).some((p) => p.endsWith(".png")))
  throw Error("Raw artist images must not be published.");
fs.copyFileSync("CREDITS.md", path.join(out, "CREDITS.md"));
const source = [
  ...walk("src/adventure"),
  "src/main.js",
  "src/styles.css",
  ...walk("scripts"),
  ...walk("api"),
  "vercel.json",
  "vite.config.js",
  "index.html",
  "package.json",
  "package-lock.json",
  "CREDITS.md",
  "public/pixel.ttf",
  "public/FONT-LICENSE.txt",
];
const manifest = {
  version: 1,
  source: Object.fromEntries(
    source.map((p) => [p.replaceAll("\\", "/"), hash(p)]),
  ),
  release: Object.fromEntries(
    walk(out).map((p) => [
      path.relative(out, p).replaceAll("\\", "/"),
      hash(p),
    ]),
  ),
};
fs.writeFileSync(
  path.join(out, "source-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log("Packaged compiled game; paid image source excluded.");
