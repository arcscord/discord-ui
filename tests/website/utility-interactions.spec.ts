import { expect, test } from "@playwright/test";

test("transcript utility callbacks preserve target identity and restore focus", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/playground?example=recipe-transcript-interactions");
  const preview = page.locator(".live-panel");
  const message = preview.locator(".dui-message").first();
  const status = preview.getByRole("status");
  const author = message.locator(".dui-message-header .dui-author-name").first();
  await author.focus();
  await page.keyboard.press("Enter");
  await expect(status).toContainText("\"kind\":\"user\"");
  await expect(status).toContainText("\"id\":\"123456789012345678\"");
  await expect(status).toContainText("\"defaultPrevented\":false");
  await expect(preview.getByRole("button", { name: "Close information" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(author).toBeFocused();
  await expect(preview.getByRole("region", { name: "Entity information" })).toHaveCount(0);
  await message.locator(".dui-message-avatar .dui-avatar").first().click();
  await expect(status).toContainText("\"kind\":\"user\"");
  await preview.getByRole("button", { name: "Close information" }).click();
  for (const [index, kind, id] of [
    [0, "user", "123456789012345678"],
    [1, "channel", "234567890123456789"],
    [2, "role", "345678901234567890"],
    [3, "command", "456789012345678901"],
  ] as const) {
    const mention = message.locator(".dui-mention").nth(index);
    await mention.click();
    await expect(status).toContainText(`"kind":"${kind}"`);
    await expect(status).toContainText(`"id":"${id}"`);
    await preview.getByRole("button", { name: "Close information" }).click();
    await mention.click({ button: "right" });
    await expect(status).toContainText(`"kind":"${kind}-context"`);
    await expect(status).toContainText("\"defaultPrevented\":false");
    await expect(preview.getByRole("button", { name: "Select entity" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(mention).toBeFocused();
  }
  await message.locator(".dui-reply-preview .dui-author-name").first().click();
  await expect(status).toContainText("\"kind\":\"user\"");
  await page.keyboard.press("Escape");
  await message.locator(".dui-embed .dui-mention").first().click();
  await expect(status).toContainText("\"kind\":\"user\"");
  await page.keyboard.press("Escape");
  await author.click({ button: "right" });
  await expect(status).toContainText("\"kind\":\"user-context\"");
  await page.keyboard.press("Escape");
  await message.locator(".dui-message-body").first().click({
    button: "right",
    position: { x: 3, y: 3 },
  });
  await expect(status).toContainText("\"kind\":\"message-context\"");
  await preview.getByRole("button", { name: "Select entity" }).click();
  await expect(status).toHaveText("Selected transcript-question");
  for (const theme of ["Light", "Ash", "Dark"]) {
    await page.getByRole("button", { name: theme, exact: true }).click();
    await author.click();
    await expect(preview.getByRole("region", { name: "Entity information" })).toBeVisible();
    await page.keyboard.press("Escape");
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});
