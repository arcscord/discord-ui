import { expect, test } from "@playwright/test";

for (const platform of ["MacIntel", "Win32", "Linux x86_64"]) {
  test(`search uses the ${platform} shortcut and restores focus`, async ({ page }, testInfo) => {
    await page.addInitScript((platform) => {
      Object.defineProperty(navigator, "platform", {
        get: () => platform,
      });
      Object.defineProperty(navigator, "maxTouchPoints", {
        get: () => 0,
      });
    }, platform);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/docs/introduction");
    const trigger = page.getByRole("button", { name: "Search documentation", exact: true });
    await expect(trigger).toBeVisible();
    const dialog = page.getByRole("dialog", { name: "Search documentation" });
    const modifier = platform === "MacIntel"
      ? "Meta"
      : "Control";
    if (testInfo.project.name === "desktop") {
      await expect(trigger.locator("kbd")).toHaveText(platform === "MacIntel"
        ? "⌘ K"
        : "Ctrl K");
    }
    else {
      await expect(trigger.locator("kbd")).toBeHidden();
    }
    await trigger.focus();
    await page.keyboard.press(`${modifier === "Meta"
      ? "Control"
      : "Meta"}+k`);
    await expect(dialog).not.toBeVisible();
    await page.keyboard.press(`${modifier}+k`);
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole("searchbox");
    await expect(input).toBeFocused();
    await input.fill("selectmenu");
    const results = dialog.locator(".quick-search-results a");
    await expect(results.first()).toHaveAttribute("href", "/docs/api/interactive-components#selectmenu");
    await page.keyboard.press("ArrowDown");
    await expect(results.first()).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(results.nth(1)).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(results.first()).toBeFocused();
    await page.screenshot({ path: `/tmp/discord-ui-quick-search-${platform.replaceAll(" ", "-")}-${testInfo.project.name}.png` });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    await trigger.click();
    await expect(input).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await trigger.click();
    await input.fill("SelectMenu");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/docs\/api\/interactive-components#selectmenu$/u);
    await expect(dialog).not.toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("popup closes outside, traps focus and links to full search", async ({ page }) => {
  await page.goto("/playground");
  await page.getByRole("button", { name: "Search documentation", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Search documentation" });
  const input = dialog.getByRole("searchbox");
  await input.fill("nonexistentzzzzzz");
  await expect(dialog.getByRole("status")).toContainText("No results");
  await input.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("link", { name: "Open full search" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  await page.mouse.click(2, 2);
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Search documentation", exact: true }).click();
  await input.fill("controlled selections");
  await dialog.getByRole("link", { name: "Open full search" }).click();
  await expect(page).toHaveURL(/\/search\?q=controlled%20selections$/u);
  await expect(page.getByRole("searchbox", { name: "Search the documentation" })).toHaveValue("controlled selections");
  await expect(dialog).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("touch mobile has no shortcut but can open and close search", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
  });
  const page = await context.newPage();
  await page.goto("/docs/introduction");
  const trigger = page.getByRole("button", { name: "Search documentation", exact: true });
  await expect(trigger).toBeVisible();
  const triggerBounds = (await trigger.boundingBox())!;
  expect(triggerBounds.width).toBeGreaterThanOrEqual(44);
  expect(triggerBounds.height).toBeGreaterThanOrEqual(44);
  await expect(trigger.locator("kbd")).toHaveCount(0);
  await page.keyboard.press("Meta+k");
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Search documentation" });
  await expect(dialog).not.toBeVisible();
  await trigger.tap();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("searchbox").fill("threads");
  await expect(dialog.locator(".quick-search-results a").first()).toBeVisible();
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await expect(dialog.locator(".search-shortcut")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Close search" }).tap();
  await expect(dialog).not.toBeVisible();
  await context.close();
});

test("offline search offers a styled retry and recovers without reloading", async ({ page, context }, testInfo) => {
  await page.goto("/docs/introduction");
  await page.waitForFunction(() => document.documentElement.dataset.hasHydrated === "true");
  await context.setOffline(true);
  await page.getByRole("button", { name: "Search documentation", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Search documentation" });
  await expect(dialog.getByRole("status")).toContainText("Search could not load");
  const retry = dialog.getByRole("button", { name: "Retry", exact: true });
  await expect(retry).toBeVisible();
  await expect(retry).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const close = dialog.getByRole("button", { name: "Close search" });
  const buttonBounds = await close.boundingBox();
  const iconBounds = await close.locator("svg").boundingBox();
  expect(buttonBounds).not.toBeNull();
  expect(iconBounds).not.toBeNull();
  expect(Math.abs(buttonBounds!.x + buttonBounds!.width / 2 - iconBounds!.x - iconBounds!.width / 2)).toBeLessThan(1);
  expect(Math.abs(buttonBounds!.y + buttonBounds!.height / 2 - iconBounds!.y - iconBounds!.height / 2)).toBeLessThan(1);
  await page.screenshot({ path: `/tmp/discord-ui-search-offline-${testInfo.project.name}.png` });
  await context.setOffline(false);
  await retry.click();
  await dialog.getByRole("searchbox").fill("SelectMenu");
  await expect(dialog.locator(".quick-search-results a").first()).toHaveAttribute("href", "/docs/api/interactive-components#selectmenu");
  await expect(retry).not.toBeVisible();
});
