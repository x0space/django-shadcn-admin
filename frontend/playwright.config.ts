import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";
const python =
  process.env.SHADCN_PYTHON ||
  (process.platform === "win32"
    ? "../.venv/Scripts/python.exe"
    : "../.venv/bin/python");
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:8765",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.SHADCN_CHROME
          ? { launchOptions: { executablePath: process.env.SHADCN_CHROME } }
          : {}),
      },
    },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `"${resolve(python)}" ../demo/manage.py runserver 127.0.0.1:8765 --noreload`,
    url: "http://127.0.0.1:8765/admin/login/",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
