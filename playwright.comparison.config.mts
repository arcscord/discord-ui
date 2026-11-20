import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/comparison",
  outputDir: ".local/comparison-results",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : "50%",
  reporter: process.env.CI
    ? [
        ["line"],
        ["github"],
        ["./scripts/comparison/ci-reporter.mts"],
        [
          "html",
          { open: "never" },
        ],
      ]
    : [
        ["list"],
        [
          "html",
          { open: "never", outputFolder: ".local/comparison-report" },
        ],
      ],
  use: {
    baseURL: "http://127.0.0.1:4177",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      testIgnore: "**/differential.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1536, height: 1024 },
      },
    },
    {
      name: "mobile",
      testIgnore: "**/differential.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "differential",
      testMatch: "**/differential.spec.ts",
      timeout: 90_000,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1536, height: 1024 },
        deviceScaleFactor: 1,
        locale: "en-US",
        timezoneId: "UTC",
        colorScheme: "dark",
        reducedMotion: "reduce",
      },
    },
  ],
  webServer: {
    command: "pnpm --filter @arcscord/discord-ui-comparison preview --port 4177",
    url: "http://127.0.0.1:4177",
    reuseExistingServer: false,
  },
});
