import { readFile, writeFile } from "node:fs/promises"
const manifest = JSON.parse(await readFile("package.json", "utf8"))
const lock = JSON.parse(await readFile("package-lock.json", "utf8"))
for (const group of ["dependencies", "devDependencies"]) {
  for (const name of Object.keys(manifest[group])) {
    const installed = JSON.parse(await readFile(`node_modules/${name}/package.json`, "utf8"))
    manifest[group][name] = installed.version
    lock.packages[""][group][name] = installed.version
  }
}
await writeFile("package.json", JSON.stringify(manifest, null, 2)+"\n")
await writeFile("package-lock.json", JSON.stringify(lock, null, 2)+"\n")
console.log("Pinned direct dependencies to the tested installed versions.")
