import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { PageDescriptor, ListPage } from "../src/types";

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

async function list(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator("#main-content h1")).toBeVisible();
  return JSON.parse(
    (await page.locator("#django-shadcn-data").textContent()) || "{}",
  ) as PageDescriptor & { page: ListPage };
}

test("saved views restore filters, columns and layout after navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await list(page, "/admin/workspace/order/?status__exact=new");
  await page.getByRole("button", { name: "Columns", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("checkbox", { name: "Placed", exact: true })
    .uncheck();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("columnheader", { name: "Placed", exact: false }),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: "Kanban", exact: true }).click();
  await page.getByRole("button", { name: "Save view", exact: true }).click();
  await page.getByLabel("View name", { exact: true }).fill("New order board");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save view", exact: true })
    .click();
  await list(page, "/admin/workspace/order/");
  await page
    .getByRole("button", { name: "New order board", exact: true })
    .click();
  await expect(page).toHaveURL(/status__exact=new#workspace=/);
  await expect(
    page.getByRole("tab", { name: "Kanban", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Table", exact: true }).click();
  await expect(
    page.getByRole("columnheader", { name: "Placed", exact: false }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("columnheader", { name: "Placed", exact: false }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("Kanban keyboard moves save through Django and calendar shows dated records", async ({
  page,
}, testInfo) => {
  const data = await list(page, "/admin/workspace/order/");
  const record = data.page.workspace!.records[0];
  const next = record.group === "new" ? "processing" : "new";
  await page.getByRole("tab", { name: "Kanban", exact: true }).click();
  await page.screenshot({
    path: testInfo.outputPath("kanban.png"),
    fullPage: true,
  });
  const select = page.getByRole("combobox", {
    name: `Move record ${record.label}`,
    exact: true,
  });
  await select.click();
  await page
    .getByRole("option", {
      name: next === "new" ? "New" : "Processing",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("combobox", {
      name: `Move record ${record.label}`,
      exact: true,
    }),
  ).toContainText(next === "new" ? "New" : "Processing");
  // Restore demo state after checking persistence.
  await page
    .getByRole("combobox", { name: `Move record ${record.label}`, exact: true })
    .click();
  await page
    .getByRole("option", {
      name: data.page.workspace!.groups.find((g) => g.value === record.group)!
        .label,
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("combobox", {
      name: `Move record ${record.label}`,
      exact: true,
    }),
  ).toContainText(
    data.page.workspace!.groups.find((g) => g.value === record.group)!.label,
  );
  await page.getByRole("tab", { name: "Calendar", exact: true }).click();
  await expect(page.locator('[data-slot="calendar"]')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("calendar.png"),
    fullPage: true,
  });
  await expect(
    page.getByRole("link", { name: record.label, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Without a date/ }).click();
  await expect(
    page.getByRole("heading", { name: "Without a date", exact: true }),
  ).toBeVisible();
});

test("compare records and follow relationships", async ({ page }, testInfo) => {
  const data = await list(page, "/admin/workspace/product/");
  for (const row of data.page.rows.slice(0, 2))
    await page
      .getByRole("checkbox", { name: `Actions ${row.key}`, exact: true })
      .check();
  await page
    .getByRole("button", { name: "Compare records", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("table")).toContainText(
    "Price",
  );
  await page.screenshot({ path: testInfo.outputPath("comparison.png") });
  await page
    .getByRole("checkbox", { name: "Only differences", exact: true })
    .check();
  await expect(
    page.getByRole("dialog").getByText("Changed", { exact: true }).first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  const customers = await list(page, "/admin/workspace/customer/");
  const customer = customers.page.workspace!.records.find(
    (r) => r.label === "Emma Laurent",
  )!;
  await page.goto(customer.url);
  await page
    .getByRole("button", { name: "Relationships", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Orders");
  await page.screenshot({ path: testInfo.outputPath("relationships.png") });
  await expect(
    page.getByRole("dialog").getByRole("link", { name: /ORD-/ }).first(),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^Explore ORD-/ })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText("Order lines");
});

test("save review can cancel and preserves save-and-continue", async ({
  page,
}) => {
  await list(page, "/admin/workspace/customer/");
  await page
    .getByRole("row")
    .filter({ hasText: "Emma Laurent" })
    .getByRole("link", { name: "Emma Laurent", exact: true })
    .click();
  const original = await page.getByLabel("City", { exact: true }).inputValue();
  const notes = page.locator('textarea[name="notes"]');
  const originalNotes = await notes.inputValue();
  await page.getByRole("button", { name: "Notes", exact: true }).click();
  await notes.fill("Keep this draft in a collapsed fieldset");
  await page.getByLabel("City", { exact: true }).fill("Review test city");
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(original);
  await expect(page.getByRole("dialog")).toContainText("Review test city");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(page.getByLabel("City", { exact: true })).toHaveValue(
    "Review test city",
  );
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm and continue", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page).toHaveURL(/\/change\/$/);
  await expect(page.getByLabel("City", { exact: true })).toHaveValue(
    "Review test city",
  );
  await page.getByLabel("City", { exact: true }).fill(original);
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm and continue", exact: true })
    .click();
  await expect(page.getByLabel("City", { exact: true })).toHaveValue(original);
  await expect(notes).toHaveValue("Keep this draft in a collapsed fieldset");
  await page.getByRole("button", { name: "Notes", exact: true }).click();
  await notes.fill(originalNotes);
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm and continue", exact: true })
    .click();
  await expect(notes).toHaveValue(originalNotes);
});

test("list edits review the record and retain Django formset values", async ({
  page,
}) => {
  const data = await list(page, "/admin/workspace/product/");
  const record = data.page.workspace!.records[0];
  const stock = data.page.rows[0].cells.find((cell) =>
    cell.field?.name.endsWith("-stock"),
  )!.field!;
  const input = page.locator(`input[name="${stock.name}"]`);
  const original = await input.inputValue();
  await input.fill(String(Number(original) + 1));
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(record.label);
  await expect(page.getByRole("dialog")).toContainText("Stock");
  await page
    .getByRole("button", { name: "Confirm and continue", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(input).toHaveValue(String(Number(original) + 1));
  await input.fill(original);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm and continue", exact: true })
    .click();
  await expect(input).toHaveValue(original);
});

test("bulk review can cancel before executing the configured action", async ({
  page,
}) => {
  const data = await list(page, "/admin/workspace/order/");
  const record = data.page.workspace!.records.find(
    (entry) => entry.group !== "shipped",
  )!;
  await page
    .getByRole("checkbox", { name: `Actions ${record.key}`, exact: true })
    .check();
  await page.getByRole("combobox", { name: "Actions", exact: true }).click();
  await page
    .getByRole("option", {
      name: "Mark selected orders as shipped",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Run action", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Shipped");
  await expect(page.getByRole("dialog")).toContainText(record.label);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  const unchanged = await page.request.get("/admin/workspace/order/", {
    headers: { Accept: "application/vnd.django-shadcn+json" },
  });
  expect(
    (await unchanged.json()).page.workspace.records.find(
      (entry: { key: string }) => entry.key === record.key,
    ).group,
  ).toBe(record.group);
  await page.getByRole("button", { name: "Run action", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(record.label);
  await page
    .getByRole("button", { name: "Confirm and continue", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const changed = await page.request.get("/admin/workspace/order/", {
    headers: { Accept: "application/vnd.django-shadcn+json" },
  });
  expect(
    (await changed.json()).page.workspace.records.find(
      (entry: { key: string }) => entry.key === record.key,
    ).group,
  ).toBe("shipped");
  expect(
    (
      await page.request.post(data.page.workspace!.move_url, {
        form: {
          csrfmiddlewaretoken: data.csrf,
          pk: record.key,
          expected: "shipped",
          value: record.group,
        },
      })
    ).ok(),
  ).toBe(true);
});

test("workspace views and dialogs are accessible and fit mobile RTL", async ({
  page,
  browser,
}) => {
  const data = await list(page, "/admin/workspace/order/");
  for (const view of ["Kanban", "Calendar"]) {
    await page.getByRole("tab", { name: view, exact: true }).click();
    const result = await new AxeBuilder({ page }).analyze();
    expect(
      result.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact || ""),
      ),
    ).toEqual([]);
  }
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await page.getByRole("menuitem", { name: /Jalali/ }).click();
  const year = new Intl.DateTimeFormat("en-u-ca-persian", { year: "numeric" })
    .format(new Date(`${data.page.workspace!.records[0].date}T12:00:00`))
    .replace(/\D/g, "");
  await expect
    .poll(async () =>
      (
        (await page.locator('[data-slot="calendar"]').textContent()) || ""
      ).replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x6f0)),
    )
    .toContain(year);
  const mobileContext = await browser.newContext({
    baseURL: new URL(page.url()).origin,
    viewport: { width: 390, height: 844 },
    storageState: await page.context().storageState(),
  });
  const mobile = await mobileContext.newPage();
  await mobile.goto("/admin/workspace/order/");
  await mobile.getByRole("combobox", { name: "Language", exact: true }).click();
  await mobile.getByRole("option", { name: "فارسی", exact: true }).click();
  await expect(mobile.locator("html")).toHaveAttribute("dir", "rtl");
  await mobile.getByRole("tab", { name: "کانبان", exact: true }).click();
  expect(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await mobile.getByRole("button", { name: "ذخیره نما", exact: true }).click();
  await expect(mobile.getByRole("dialog")).toHaveAttribute("dir", "rtl");
  expect(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await mobileContext.close();
});
