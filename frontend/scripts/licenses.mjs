import { readdir, readFile, writeFile, mkdir, cp } from "node:fs/promises"
const lock = JSON.parse(await readFile("package-lock.json", "utf8"))
const target = "../src/django_shadcn/static/django_shadcn/licenses/vendor"
await mkdir(target, {recursive: true})
const notices = []
for (const [path, item] of Object.entries(lock.packages)) {
  if (!path || item.dev) continue
  try {
    const manifest = JSON.parse(await readFile(`${path}/package.json`, "utf8"))
    const files = (await readdir(path)).filter(file => /^(license|licence|copying|ofl|notice)(\.|-|$)/i.test(file))
    const name = manifest.name.replaceAll("/", "_").replaceAll("@", "")
    for (const file of files) await cp(`${path}/${file}`, `${target}/${name}-${file}`)
    notices.push({name: manifest.name, version: manifest.version, license: manifest.license || item.license || "See package", files: files.map(file => `vendor/${name}-${file}`)})
  } catch { /* Optional packages for other platforms are absent locally. */ }
}
await writeFile("../src/django_shadcn/static/django_shadcn/licenses/index.json", JSON.stringify(notices, null, 2)+"\n")
console.log(`Recorded ${notices.length} runtime dependency license notices.`)
