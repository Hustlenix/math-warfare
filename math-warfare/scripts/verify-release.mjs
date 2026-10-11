import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const hash = (p) =>
  crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const manifest = JSON.parse(
  fs.readFileSync("release/source-manifest.json", "utf8"),
);
for (const [p, expected] of Object.entries(manifest.source)) {
  if (hash(p) !== expected)
    throw Error("Source changed; rebuild the release: " + p);
}
for (const [p, expected] of Object.entries(manifest.release)) {
  if (hash(path.join("release", p)) !== expected)
    throw Error("Release file mismatch: " + p);
}
console.log("Release matches the recorded source and compiled payload.");
