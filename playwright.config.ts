import { defineConfig } from "@playwright/test";

// Local runs use the installed Google Chrome (no browser download needed);
// CI installs and uses Playwright's chromium.
const isCI = !!process.env.CI;

// the app reads its API from .env.local; the suite has to assert against that
// same backend or the counts disagree — pointing the page at Railway while the
// test counted a local Django was failing every count assertion
try {
  process.loadEnvFile(".env.local");
} catch {
  /* optional file */
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  retries: isCI ? 1 : 0,
  // html report is what the CI failure-artifact step uploads
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    // this is the site under test, which is not the API — they were the same
    // variable, so overriding one silently moved the other
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    channel: isCI ? undefined : "chrome",
    viewport: { width: 1280, height: 900 },
  },
  webServer: [
    {
      // override with DJANGO_RUN_CMD in CI (system python instead of the venv)
      command: process.env.DJANGO_RUN_CMD ?? ".venv/bin/python manage.py runserver 8000",
      cwd: "backend",
      port: 8000,
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
    {
      command: isCI ? "npm run start" : "npm run dev",
      port: 3000,
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
  ],
});
