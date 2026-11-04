import { expect, test } from "@playwright/test";

for (const route of ["/components?example=channel-view", "/playground?example=channel-view"]) {
  test(`embedded conversation scrolls internally and hands off to the page at its boundary: ${route}`, async ({ page }) => {
    await page.goto(route);
    const composer = page.getByRole("textbox", { name: "Message #support", exact: true });
    for (let index = 0; index < 8; index++) {
      await composer.fill(`Scroll example ${index}: a message to explore in this conversation.`);
      await composer.press("Enter");
    }
    const history = page.locator(".dui-channel-main > .dui-channel-history");
    await history.evaluate((element) => {
      element.scrollIntoView({ block: "center" });
      element.scrollTop = 0;
    });
    await history.hover();
    const pagePosition = await page.evaluate(() => window.scrollY);
    expect(pagePosition).toBeGreaterThan(0);
    await page.mouse.wheel(0, 100);
    await expect.poll(() => history.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(pagePosition);
    await history.evaluate(element => element.scrollTop = 0);
    await page.mouse.wheel(0, -240);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(pagePosition);
  });
}

test("landing has three distinct demos with independent themes and a read-only transcript", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(message.text());
  });
  await page.goto("/");
  await expect(page).toHaveTitle(/Discord messages. Without screenshots/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Discord messages.Without screenshots.");
  await expect(page.getByRole("tab")).toHaveCount(0);
  await expect(page.locator(".hero-demo .dui-message")).toHaveCount(1);
  for (const theme of ["light", "ash", "dark"]) {
    await page.getByRole("combobox", { name: "Announcement theme" }).selectOption(theme);
    await page.getByRole("combobox", { name: "Transcript theme" }).selectOption(theme);
    await expect(page.locator(".hero-demo .arcscord-discord-ui")).toHaveAttribute("data-theme", theme);
    await expect(page.locator(".transcript-demo .arcscord-discord-ui")).toHaveAttribute("data-theme", theme);
    await expect(page.locator(".arcade-demo .arcscord-discord-ui")).toHaveAttribute("data-theme", "dark");
  }
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const transcript = page.locator(".transcript-demo");
  await expect(transcript.getByRole("textbox")).toHaveCount(0);
  await expect(transcript.locator(".dui-message")).toHaveCount(6);
  const attachment = transcript.getByRole("link", { name: "welcome-config.json", exact: true });
  await expect(attachment).toBeVisible();
  const response = await page.request.get("/examples/welcome-config.json");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toHaveProperty("enabled", true);
  const opener = transcript.getByRole("button", { name: /Open thread.*Permission check/ });
  await opener.click();
  const thread = transcript.locator(".dui-thread-panel");
  await expect(thread).toContainText("Send Messages was disabled. Fixed!");
  await expect(thread.getByRole("textbox")).toHaveCount(0);
  await thread.getByRole("button", { name: "Close thread" }).press("Escape");
  await expect(thread).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `/tmp/landing-${testInfo.project.name}.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test("channel sending, thread replies, Escape and restored focus", async ({ page }) => {
  await page.goto("/components?example=channel-view");
  const channelInput = page.getByRole("textbox", { name: "Message #support", exact: true });
  await channelInput.fill("A local channel message");
  await channelInput.press("Enter");
  await expect(page.locator(".dui-channel-main")).toContainText("A local channel message");
  const opener = page.getByRole("button", { name: /Setup help/ });
  await opener.click();
  const thread = page.locator(".dui-thread-panel");
  await expect(thread).toBeVisible();
  const reply = thread.getByRole("textbox");
  await reply.fill("A local thread reply");
  await reply.press("Enter");
  await expect(thread).toContainText("A local thread reply");
  await reply.press("Escape");
  await expect(thread).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(opener).toContainText("4 messages");
});

test("announcement dismissal, documentation MDX and mobile navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByText("In development — preparing our first release.")).toHaveCount(0);
  if ((page.viewportSize()?.width ?? 0) < 997) {
    await page.getByRole("button", { name: /Toggle navigation bar/ }).click();
    await page.locator(".navbar-sidebar").getByRole("link", { name: "Docs", exact: true }).click();
  }
  else {
    await page.locator(".navbar").getByRole("link", { name: "Docs", exact: true }).click();
  }
  await expect(page).toHaveURL(/\/docs\/introduction$/);
  await expect(page.locator(".theme-doc-markdown .dui-message")).toBeVisible();
  await expect(page.locator(".theme-edit-this-page")).toHaveCount(0);
  await expect(page.locator(".pagination-nav a")).toHaveCount(1);
  await expect(page.locator(".pagination-nav a")).toContainText("Installation");
  await page.reload();
  await expect(page.getByText("In development — preparing our first release.")).toHaveCount(0);
});
