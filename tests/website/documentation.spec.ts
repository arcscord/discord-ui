import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const documents = [
  ["introduction", "Discord interfaces, composed with React"],
  ["installation", "Installation"],
  ["quick-start", "Render your first message"],
  ["choosing-components", "Choosing your components"],
  ["concepts", "Core concepts"],
  ["public-api", "Interaction state"],
  ["guides", "Guide directory"],
  ["api-reference", "API reference directory"],
  ["recipes", "Recipe directory"],
  ["troubleshooting", "Troubleshooting"],
  ["project", "Project"],
  ["project/compatibility", "Compatibility and limitations"],
  ["project/migrations", "Changelog and migration policy"],
  ["project/maintaining-docs", "Maintaining documentation"],
  ["project/documentation-quality", "Documentation quality criteria"],
] as const;

test("documentation destinations load directly without hydration errors or overflow", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(message.text());
  });
  for (const [route, heading] of documents) {
    const response = await page.goto(`/docs/${route}`);
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle(/Arcscord Discord UI/);
    await expect(page.locator("article h1")).toHaveText(heading);
    // Wait for the interactive Docusaurus shell to hydrate.
    await expect(page.locator("html")).toHaveAttribute("data-has-hydrated", "true");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    const anchors = await page.locator(`a[href^="/docs/${route}#"]`).evaluateAll(links => links.map(link => new URL((link as HTMLAnchorElement).href).hash.slice(1)));
    for (const anchor of anchors)
      await expect(page.locator(`[id="${anchor}"]`)).toHaveCount(1);
    if (route === "project/documentation-quality")
      await page.screenshot({ path: `/tmp/discord-ui-quality-${testInfo.project.name}.png` });
    if (route === "quick-start")
      await page.screenshot({ path: `/tmp/discord-ui-docs-${testInfo.project.name}.png` });
  }
  expect(errors).toEqual([]);
});

test("getting started follows installation, working quick start and component choice", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/docs/introduction");
  for (const route of ["installation", "quick-start", "choosing-components"]) {
    await page.locator(".pagination-nav__link--next").click();
    await expect(page).toHaveURL(new RegExp(`/docs/${route}$`));
    if (route === "quick-start") {
      const message = page.locator("article .dui-message");
      await expect(message).toContainText("Hello from React!");
      const spoiler = message.getByRole("button", { name: "Reveal spoiler" });
      await spoiler.focus();
      await spoiler.press("Enter");
      await expect(message.getByRole("button", { name: "Hide spoiler" })).toHaveAttribute("aria-expanded", "true");
      const codeBlock = page.locator("article div[class*='codeBlockContainer']");
      await codeBlock.hover();
      await codeBlock.getByRole("button", { name: /Copy code/ }).click({ force: true });
      const source = await readFile(new URL("../../apps/website/src/components/docs/FirstMessage.tsx", import.meta.url), "utf8");
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(source.trimEnd());
    }
  }
  await page.locator("article").getByRole("link", { name: "Channel", exact: true }).click();
  await expect(page).toHaveURL(/\/components\?example=channel-view$/);
  await expect(page.getByRole("textbox", { name: "Message #support", exact: true })).toBeVisible();
});
