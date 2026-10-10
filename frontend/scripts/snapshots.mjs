import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath:
    process.env.SHADCN_CHROME ||
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const origin = process.env.SHADCN_URL || "http://127.0.0.1:8765";
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await mkdir("../docs/screenshots", { recursive: true });
await page.goto(`${origin}/admin/login/`);
await page.getByLabel(/Username/).fill("admin");
await page
  .getByLabel(/Password/)
  .fill(process.env.SHADCN_DEMO_PASSWORD || "Demo-test-1234");
await page.getByRole("button", { name: "Sign in", exact: true }).click();
await page.getByRole("heading", { name: "Overview", exact: true }).waitFor();
await page.waitForTimeout(1800);
await page.screenshot({
  path: "../docs/screenshots/dashboard-ltr.png",
  fullPage: true,
});
await page
  .getByRole("combobox", { name: "Language", exact: true })
  .selectOption("fa");
await page.getByRole("heading", { name: "نمای کلی", exact: true }).waitFor();
await page.waitForTimeout(1800);
await page.screenshot({
  path: "../docs/screenshots/dashboard-rtl.png",
  fullPage: true,
});
await page.goto(`${origin}/admin/workspace/customer/add/`);
await page.locator("#main-content h1").waitFor();
await page.screenshot({
  path: "../docs/screenshots/form-rtl.png",
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/admin/`);
await page.locator("#main-content h1").waitFor();
await page.locator('[data-slot="chart"]').waitFor();
await page.waitForTimeout(1800);
await page.screenshot({
  path: "../docs/screenshots/mobile-rtl.png",
  fullPage: true,
});
console.log(
  JSON.stringify({
    errors,
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  }),
);
await browser.close();
