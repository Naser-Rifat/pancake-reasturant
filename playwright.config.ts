import { defineConfig } from "@playwright/test";

// Local runs use the installed Google Chrome (no browser download needed);
// CI installs and uses Playwright's chromium.
const isCI = !!process.env.CI;
const externalSite = process.env.E2E_BASE_URL;
const externalApi = process.env.E2E_API_URL;
const localSite = "http://127.0.0.1:3100";
const localApi = "http://127.0.0.1:8100/api";
const localAdminGateSecret = "e2e-admin-gate";
const localCloudinaryCloud = "e2e-cloud";
const localCloudinaryPreset = "e2e-preset";

if (externalSite && !externalApi) {
  throw new Error("E2E_API_URL is required when E2E_BASE_URL targets a deployed site.");
}

// the app reads its API from .env.local; the suite has to assert against that
// same backend or the counts disagree — pointing the page at Railway while the
// test counted a local Django was failing every count assertion
try {
  process.loadEnvFile(".env.local");
} catch {
  /* optional file */
}

// E2E is local and deterministic by default. A developer may point both sides
// at a deployed environment explicitly with E2E_BASE_URL + E2E_API_URL, but a
// production API from .env.local must never leak into the local test run.
process.env.NEXT_PUBLIC_API_URL =
  externalApi ?? localApi;

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  retries: isCI ? 1 : 0,
  // html report is what the CI failure-artifact step uploads
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    // The site and API may be overridden independently for a deployed smoke run.
    baseURL: externalSite ?? localSite,
    channel: isCI ? undefined : "chrome",
    viewport: { width: 1280, height: 900 },
    // Production intentionally returns 404 for private UI routes until the
    // unlisted staff entry point has minted this cookie. Browser regression
    // tests exercise the admin application itself, so their isolated local
    // context starts behind the gate with a test-only value. The local Next
    // server receives the same value below; deployed-site runs remain untouched.
    storageState: externalSite
      ? undefined
      : {
          cookies: [
            {
              name: "pc_admin_gate",
              value: localAdminGateSecret,
              domain: "127.0.0.1",
              path: "/",
              expires: -1,
              httpOnly: true,
              secure: false,
              sameSite: "Lax",
            },
          ],
          origins: [],
        },
  },
  webServer: externalSite ? undefined : [
    {
      // CI uses its system Python; local runs use the repository virtualenv.
      command:
        process.env.DJANGO_RUN_CMD ??
        (isCI
          ? "python manage.py runserver 127.0.0.1:8100"
          : ".venv/bin/python manage.py runserver 127.0.0.1:8100"),
      cwd: "backend",
      port: 8100,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        ...process.env,
        DJANGO_DEBUG: "1",
        DJANGO_EMAIL_PROVIDER: "console",
      },
    },
    {
      command: "npm run dev -- --port 3100",
      port: 3100,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        NEXT_PUBLIC_API_URL: localApi,
        NEXT_DIST_DIR: ".next-e2e",
        ADMIN_GATE_SECRET: localAdminGateSecret,
        // The upload component is hidden when Cloudinary is unconfigured.
        // Browser tests only exercise pre-upload validation, so non-secret
        // placeholders make that UI deterministic without making a network call.
        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: localCloudinaryCloud,
        NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: localCloudinaryPreset,
      },
    },
  ],
});
