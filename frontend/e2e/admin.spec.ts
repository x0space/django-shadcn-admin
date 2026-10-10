import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import inventory from "../src/inventory.json" with { type: "json" };

async function selectLanguage(page: Page, language: "en" | "fa" | "ar") {
  if ((await page.locator('input[name="language"]').inputValue()) === language)
    return;
  await page
    .locator("form")
    .filter({ has: page.locator('input[name="language"]') })
    .getByRole("combobox")
    .click();
  await page
    .getByRole("option", {
      name: { en: "English", fa: "فارسی", ar: "العربية" }[language],
      exact: true,
    })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", language);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/admin/login/");
  await page.getByLabel(/Username/).fill("admin");
  await page
    .getByLabel(/Password/)
    .fill(process.env.SHADCN_DEMO_PASSWORD || "Demo-test-1234");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
});

test("dashboard, CRUD and inline forms work through Django", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/admin/workspace/customer/add/");
  await page
    .getByLabel("Name", { exact: false })
    .first()
    .fill("Browser Customer");
  await page
    .getByLabel("Email", { exact: false })
    .first()
    .fill(`browser-${Date.now()}@example.com`);
  await page.getByLabel("Joined", { exact: false }).first().fill("2026-10-09");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm and continue", exact: true })
    .click();
  await expect(page.getByRole("table")).toContainText("Browser Customer");
  await page.goto("/admin/workspace/order/add/");
  await page.getByRole("button", { name: "Add another", exact: true }).click();
  await expect(
    page.locator('input[name="orderline_set-TOTAL_FORMS"]'),
  ).toHaveValue("1");
  await expect(page.locator('[name="orderline_set-0-quantity"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test("language, theme, portals, command search and mobile layout", async ({
  page,
  browser,
}) => {
  await selectLanguage(page, "fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", { name: "نمای کلی", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "ظاهر", exact: true }).click();
  await page.getByRole("menuitem", { name: "تاریک", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/admin/workspace/customer/add/");
  await page.getByRole("button", { name: /تقویم/ }).click();
  await expect(page.locator('[data-slot="popover-content"]')).toHaveAttribute(
    "dir",
    "rtl",
  );
  await page.keyboard.press("Escape");
  const mobileContext = await browser.newContext({
    baseURL: new URL(page.url()).origin,
    viewport: { width: 390, height: 844 },
    storageState: await page.context().storageState(),
  });
  const mobile = await mobileContext.newPage();
  await mobile.goto("/admin/workspace/customer/add/");
  await expect(
    mobile.getByRole("button", { name: "ناوبری", exact: true }),
  ).toBeVisible();
  expect(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await selectLanguage(mobile, "ar");
  await expect(mobile.locator("html")).toHaveAttribute("lang", "ar");
  await expect(mobile.locator("html")).toHaveAttribute("dir", "rtl");
  await mobileContext.close();
});

test("shadcn relationship controls, autocomplete, filters and file clearing retain Django behavior", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const subject = `Shadcn widget ${Date.now()}`;
  await page.goto("/admin/workspace/ticket/add/");
  await page.getByLabel("Subject", { exact: false }).fill(subject);
  await page.getByRole("combobox", { name: "Customer", exact: true }).click();
  await page.getByRole("option", { name: "Emma Laurent", exact: true }).click();
  await page.getByRole("combobox", { name: /Priority/ }).click();
  await page.getByRole("option", { name: "Urgent", exact: true }).click();
  await page.getByLabel("Attachment", { exact: true }).setInputFiles({
    name: "shadcn.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Widget upload"),
  });
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm and continue", exact: true })
    .click();
  await page.getByRole("link", { name: subject, exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Customer", exact: true }),
  ).toContainText("Emma Laurent");
  await page.getByRole("checkbox", { name: "Remove current file", exact: true }).check();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm and continue", exact: true })
    .click();
  await page.getByRole("link", { name: subject, exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Remove current file", exact: true }),
  ).toHaveCount(0);

  await page.goto("/admin/workspace/order/add/");
  await page
    .getByRole("combobox", { name: "Customer", exact: true })
    .fill("Emma");
  await page.getByRole("option", { name: "Emma Laurent", exact: true }).click();
  await page.getByRole("combobox", { name: /Status/ }).click();
  await page.getByRole("option", { name: "Processing", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Placed", exact: true })
    .fill("2026-10-10");
  await page.getByRole("button", { name: "Add another", exact: true }).click();
  await page.getByRole("combobox", { name: "Product", exact: true }).click();
  await page
    .getByRole("option", { name: "Studio notebook", exact: true })
    .click();
  await page.getByLabel("Quantity", { exact: false }).fill("2");
  await page.getByLabel("Unit price", { exact: false }).fill("19.75");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm and continue", exact: true })
    .click();
  const row = page.getByRole("row").filter({ hasText: "Emma Laurent" }).first();
  const orderUrl = await row.getByRole("link").first().getAttribute("href");
  await page.getByRole("combobox", { name: "Status", exact: true }).click();
  await page.getByRole("option", { name: "Processing", exact: true }).click();
  await expect(page).toHaveURL(/status__exact=processing/);
  await page
    .getByRole("row")
    .filter({ has: page.locator(`a[href^="${orderUrl}"]`) })
    .getByRole("checkbox")
    .check();
  await page.getByRole("combobox", { name: "Actions", exact: true }).click();
  await page
    .getByRole("option", {
      name: "Mark selected orders as shipped",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Run action", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Processing");
  await page
    .getByRole("button", { name: "Confirm and continue", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto(orderUrl!);
  await expect(page.getByRole("combobox", { name: /Status/ })).toContainText(
    "Shipped",
  );
  await expect(page.locator("select:visible")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("supported screens have no serious accessibility violations", async ({
  page,
}) => {
  for (const url of [
    "/admin/",
    "/admin/workspace/product/",
    "/admin/workspace/customer/add/",
  ]) {
    await page.goto(url);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const result = await new AxeBuilder({ page }).analyze();
    expect(
      result.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact || ""),
      ),
    ).toEqual([]);
  }
});

test("all 64 component families render two contexts without runtime errors", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/admin/components/");
  const accessibilityIssues: {
    component: string;
    violations: { id: string; elements: string[] }[];
  }[] = [];
  for (const component of inventory) {
    await page
      .getByRole("button", { name: component.name, exact: true })
      .click();
    await expect(
      page.locator(`[data-component-example="${component.slug}:operations"]`),
    ).toBeVisible();
    await expect(
      page.locator(`[data-component-example="${component.slug}:onboarding"]`),
    ).toBeVisible();
    const accessibility = await new AxeBuilder({ page })
      .include("[data-component-example]")
      .analyze();
    const violations = accessibility.violations
      .filter((violation) =>
        ["serious", "critical"].includes(violation.impact || ""),
      )
      .map((violation) => ({
        id: violation.id,
        elements: violation.nodes.map((node) => node.html),
      }));
    if (violations.length)
      accessibilityIssues.push({ component: component.slug, violations });
  }
  expect(accessibilityIssues).toEqual([]);
  expect(errors).toEqual([]);
});

test("every locale and theme remains responsive at mobile, tablet and desktop widths", async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  for (const language of ["en", "fa", "ar"]) {
    await selectLanguage(page, language as "en" | "fa" | "ar");
    await expect(page.locator("html")).toHaveAttribute("lang", language);
    for (const theme of ["light", "dark"]) {
      const strings =
        language === "fa"
          ? { appearance: "ظاهر", light: "روشن", dark: "تاریک" }
          : language === "ar"
            ? { appearance: "المظهر", light: "فاتح", dark: "داكن" }
            : { appearance: "Appearance", light: "Light", dark: "Dark" };
      await page
        .getByRole("button", { name: strings.appearance, exact: true })
        .click();
      await page
        .getByRole("menuitem", {
          name: theme === "light" ? strings.light : strings.dark,
          exact: true,
        })
        .click();
      await expect
        .poll(() =>
          page.evaluate(() =>
            document.documentElement.classList.contains("dark"),
          ),
        )
        .toBe(theme === "dark");
      for (const width of [390, 768, 1440]) {
        const sizedContext = await browser.newContext({
          baseURL: new URL(page.url()).origin,
          viewport: { width, height: 900 },
          storageState: await page.context().storageState(),
        });
        const sizedPage = await sizedContext.newPage();
        await sizedPage.goto("/admin/");
        await expect(sizedPage.locator("#main-content h1")).toBeVisible();
        await expect
          .poll(() =>
            sizedPage.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          )
          .toBe(true);
        await sizedContext.close();
      }
    }
  }
});

test("component overlays support RTL and keyboard dismissal", async ({
  page,
}) => {
  await selectLanguage(page, "fa");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await page.goto("/admin/components/?component=dialog");
  await page
    .locator('[data-component-example="dialog:operations"]')
    .getByRole("button")
    .click();
  await expect(page.getByRole("dialog")).toHaveAttribute("dir", "rtl");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
