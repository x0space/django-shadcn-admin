import { chromium } from "playwright"
import { mkdir } from "node:fs/promises"
const browser = await chromium.launch({executablePath: process.env.SHADCN_CHROME || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true})
const page = await browser.newPage({viewport: {width: 1440, height: 1000}})
const errors = []
page.on("pageerror", error => errors.push(error.message))
await page.goto("http://127.0.0.1:8765/admin/login/")
await page.waitForTimeout(1500)
await mkdir("../.cache/screenshots", {recursive: true})
await page.screenshot({path: "../.cache/screenshots/login.png", fullPage: true})
console.log(JSON.stringify({errors, text: (await page.locator("body").innerText()).slice(0, 1000), inputs: await page.locator("input").evaluateAll(inputs => inputs.map(i => ({id: i.id, name: i.name, type: i.type})))}))
await browser.close()
