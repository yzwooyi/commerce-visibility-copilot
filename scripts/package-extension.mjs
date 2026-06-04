import { existsSync, mkdirSync, rmSync } from "node:fs";
import { cp, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const tmp = resolve(root, ".tmp-extension-package");
const downloads = resolve(dist, "downloads");
const zipPath = resolve(downloads, "commerce-visibility-copilot-extension.zip");

if (!existsSync(resolve(dist, "manifest.json"))) {
  throw new Error("Build dist first with npm run build before packaging the extension.");
}

rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

for (const entry of await readdir(dist)) {
  if (entry === "downloads") continue;
  await cp(resolve(dist, entry), resolve(tmp, entry), { recursive: true });
}

mkdirSync(downloads, { recursive: true });
rmSync(zipPath, { force: true });
execFileSync("zip", ["-qr", zipPath, "."], { cwd: tmp });
rmSync(tmp, { recursive: true, force: true });

console.log(`Packaged Chrome extension: ${zipPath}`);
