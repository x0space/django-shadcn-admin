import { readdir, mkdir, cp, unlink } from "node:fs/promises";
import { resolve } from "node:path";
const target = resolve("../src/django_shadcn/static/django_shadcn");
await mkdir(target, { recursive: true });
const currentAssets = new Set(await readdir("dist/assets"));
await mkdir(`${target}/assets`, { recursive: true });
// Only remove individual obsolete files inside this exact managed asset directory.
if (process.argv.includes("--prune"))
  for (const oldFile of await readdir(`${target}/assets`, {
    withFileTypes: true,
  })) {
    if (oldFile.isFile() && !currentAssets.has(oldFile.name))
      await unlink(`${target}/assets/${oldFile.name}`);
  }
await cp("dist/assets", `${target}/assets`, { recursive: true });
await cp("dist/.vite/manifest.json", `${target}/manifest.json`);
await mkdir(`${target}/licenses`, { recursive: true });
for (const name of ["geist", "noto-sans-arabic"]) {
  const fontPath = `node_modules/@fontsource-variable/${name}`;
  for (const file of await readdir(fontPath)) {
    if (/license|ofl/i.test(file))
      await cp(`${fontPath}/${file}`, `${target}/licenses/${name}-${file}`);
  }
}
console.log("Packaged Django assets, manifest, and font licenses.");
await cp("../LICENSE", "LICENSE");
await cp("../THIRD_PARTY_NOTICES.md", "THIRD_PARTY_NOTICES.md");
await import("./licenses.mjs");
