import { expect, test } from "@playwright/test";

test("landing hydrates, keyboard tabs and independent preview themes work", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(message.text());
  });
  await page.goto("/");
  await expect(page).toHaveTitle(/Discord messages. Without screenshots/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Discord messages.Without screenshots.");
  await page.getByRole("tab", { name: "Welcome bot", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Release notes" })).toBeFocused();
  await expect(page.locator(".message-preview").first()).toContainText("What's new");
  await page.getByRole("combobox", { name: "Bot examples theme" }).selectOption("light");
  await expect(page.locator(".message-preview").first()).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("tab", { name: "Components V2", exact: true }).click();
  await expect(page.locator(".message-preview").last().getByRole("link", { name: "Read the guide" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  expect(await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check("16px Inter");
  })).toBe(true);
  expect(errors).toEqual([]);
});

test("channel sending, thread replies, Escape and restored focus", async ({ page }) => {
  await page.goto("/");
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
  await expect(page.locator(".theme-doc-toc-desktop, .pagination-nav a, .theme-edit-this-page")).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("In development — preparing our first release.")).toHaveCount(0);
});
