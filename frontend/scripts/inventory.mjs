import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
const files = (await readdir("src/components/ui"))
  .filter((f) => f.endsWith(".tsx"))
  .sort();
const composed = ["data-table", "date-picker", "typography"];
const slugs = [...files.map((f) => f.slice(0, -4)), ...composed].sort();
const inventory = slugs.map((slug) => ({
  slug,
  name: slug
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" "),
  upstream: `https://ui.shadcn.com/docs/components/base/${slug === "message-scroller" ? "message-scroller" : slug}`,
  examples: ["Operations", "Onboarding"],
}));
await writeFile(
  "../src/django_shadcn/component-inventory.json",
  JSON.stringify(inventory, null, 2) + "\n",
);
await writeFile(
  "src/inventory.json",
  JSON.stringify(inventory, null, 2) + "\n",
);
await mkdir("src/components", { recursive: true });
const calendar = await readFile("src/components/ui/calendar.tsx", "utf8");
await writeFile(
  "src/components/persian-calendar.tsx",
  calendar
    .replace(/  DayPicker,\r?\n/, "")
    .replace(
      '"use client"',
      '"use client"\nimport { DayPicker, getDateLib } from "@daypicker/persian"',
    )
    .replaceAll("function Calendar(", "function PersianCalendar(")
    .replace(
      'date.toLocaleString(locale?.code, { month: "short" })',
      'getDateLib({locale}).format(date, "LLLL")',
    )
    .replace(
      "export { Calendar, CalendarDayButton }",
      "export { PersianCalendar }",
    ),
);
await writeFile(
  "src/index.ts",
  [
    'import "./styles.css"',
    'export * from "./types"',
    'export * from "./mount"',
    'export * from "./context"',
    'export * from "./compositions"',
    'export * from "./adapters/fields"',
    'export * from "./adapters/forms"',
    'export * from "./components/persian-calendar"',
    ...files.map((f) => `export * from "./components/ui/${f.slice(0, -4)}"`),
  ].join("\n") + "\n",
);
console.log(
  `Inventory: ${slugs.length} official component families. Persian calendar and public exports generated.`,
);
