import { expect, test } from "@playwright/test";

test("generates an avatar with live letter and color controls and resets", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/playground?example=avatar");
  const preview = page.locator(".live-panel");
  await preview.getByRole("textbox", { name: "Avatar letter", exact: true }).fill("C");
  await preview.getByLabel("Avatar background", { exact: true }).fill("#cc3355");
  await preview.getByLabel("Avatar text color", { exact: true }).fill("#ffcc00");
  await expect(preview.locator(".dui-avatar")).toHaveCount(2);
  for (const avatar of await preview.locator(".dui-avatar").all()) {
    await expect(avatar).toHaveText("C");
    await expect(avatar).toHaveCSS("background-color", "rgb(204, 51, 85)");
    await expect(avatar).toHaveCSS("color", "rgb(255, 204, 0)");
  }
  await page.getByRole("button", { name: "Reset code", exact: true }).click();
  await expect(preview.locator(".dui-avatar").first()).toHaveText("A");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});

test("uses the supplied bot image and colors channel authors including new messages", async ({ page }) => {
  await page.goto("/components?example=message");
  const bot = page.locator(".component-preview .dui-avatar img").first();
  await expect(bot).toHaveAttribute("src", "/generated/avatars/arcscord.svg");
  await expect(bot).toHaveJSProperty("naturalWidth", 64);
  await page.goto("/components?example=channel-view");
  const channel = page.locator(".dui-channel");
  await expect(channel.locator(".dui-author-name").first()).toHaveCSS("color", "rgb(87, 191, 160)");
  await expect(channel.locator(".dui-author-name").nth(1)).toHaveCSS("color", "rgb(167, 169, 255)");
  const input = channel.getByRole("textbox", { name: "Message #support", exact: true });
  await input.fill("My colored message");
  await input.press("Enter");
  await expect(channel.locator(".dui-author-name").last()).toHaveCSS("color", "rgb(228, 164, 75)");
  await expect(channel.locator(".dui-avatar").last()).toHaveText("Y");
});

test("centers fallback initials inside small reply and interaction avatars", async ({ page }, testInfo) => {
  for (const example of ["interaction", "reply-preview"]) {
    await page.goto(`/components?example=${example}`);
    const avatar = page.locator(".component-preview .dui-reply-preview .dui-avatar").first();
    const letter = avatar.locator(":scope > span");
    await expect(avatar).toHaveCSS("width", "16px");
    await expect(avatar).toHaveCSS("height", "16px");
    await expect(letter).toHaveCSS("font-size", "10px");
    const circleBox = (await avatar.boundingBox())!;
    const letterBox = (await letter.boundingBox())!;
    expect(letterBox.width).toBeLessThan(circleBox.width);
    expect(letterBox.height).toBeLessThan(circleBox.height);
    expect(Math.abs(letterBox.x + letterBox.width / 2 - circleBox.x - circleBox.width / 2)).toBeLessThan(0.5);
    expect(Math.abs(letterBox.y + letterBox.height / 2 - circleBox.y - circleBox.height / 2)).toBeLessThan(0.5);
    if (example === "interaction")
      await page.locator(".component-preview").screenshot({ path: `/tmp/interaction-avatar-${testInfo.project.name}.png` });
  }
});
