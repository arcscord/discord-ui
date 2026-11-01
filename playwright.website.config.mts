import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/website",
  outputDir: ".local/website-results",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : "50%",
  reporter: process.env.CI
    ? [
        ["github"],
        [
          "html",
          { open: "never" },
        ],
      ]
    : "list",
  use: {
    baseURL: "http://127.0.0.1:4174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1536, height: 1024 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: "pnpm --filter @arcscord/discord-ui-website preview --port 4174",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: !process.env.CI,
  },
});
