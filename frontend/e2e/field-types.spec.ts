import { test, expect } from "@playwright/test";

test("structured fields, related dialogs and Persian mobile rendering", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/admin/login/");
  await page.getByLabel(/Username/).fill("admin");
  await page
    .getByLabel(/Password/)
    .fill(process.env.SHADCN_DEMO_PASSWORD || "Demo-test-1234");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/workspace/fieldsample/add/");
  await page
    .getByLabel("Name", { exact: false })
    .first()
    .fill(`Typed sample ${Date.now()}`);
  const tags = page.getByRole("region", { name: "Tags", exact: true });
  await tags.getByRole("button", { name: "Add item", exact: true }).click();
  await tags
    .getByRole("textbox", { name: "Tags 1", exact: true })
    .fill("فارسی");
  const category = `Dialog category ${Date.now()}`;
  await page.getByRole("button", { name: /Add another category/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const popup = page.frameLocator("iframe.related-dialog-frame");
  await popup.getByLabel("Name", { exact: false }).first().fill(category);
  await popup
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await popup
    .getByRole("button", { name: "Confirm and continue", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator('[data-slot="combobox-chip"]')).toContainText([
    category,
  ]);
  expect(page.context().pages()).toHaveLength(1);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm and continue", exact: true })
    .click();
  await expect(page.getByRole("table")).toContainText("فارسی");
  expect(errors).toEqual([]);

  await page
    .locator("form")
    .filter({ has: page.locator('input[name="language"]') })
    .getByRole("combobox")
    .click();
  await page.getByRole("option", { name: "فارسی", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  const context = await browser.newContext({
    baseURL: new URL(page.url()).origin,
    viewport: { width: 390, height: 844 },
    storageState: await page.context().storageState(),
  });
  const mobile = await context.newPage();
  await mobile.goto("/admin/workspace/fieldsample/add/");
  await expect(mobile.locator("html")).toHaveAttribute("dir", "rtl");
  await mobile.evaluate(() => document.fonts.ready);
  expect(
    await mobile
      .locator("body")
      .evaluate((node) => getComputedStyle(node).fontFamily),
  ).toContain("Vazirmatn");
  const overflow = await mobile.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: innerWidth,
    nodes: Array.from(document.querySelectorAll("body *"))
      .filter((node) => {
        const r = node.getBoundingClientRect();
        return r.width > 10 && (r.left < -2 || r.right > innerWidth + 2);
      })
      .map((node) => {
        const r = node.getBoundingClientRect();
        return {
          tag: node.tagName,
          cls: node.className,
          left: r.left,
          right: r.right,
          width: r.width,
        };
      })
      .slice(-15),
  }));
  expect(overflow.width, JSON.stringify(overflow)).toBeLessThanOrEqual(
    overflow.viewport,
  );
  await mobile.screenshot({
    path: "../.cache/field-types-persian-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await context.close();
});
