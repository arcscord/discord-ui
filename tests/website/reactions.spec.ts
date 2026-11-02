import { expect, test } from "@playwright/test";

test("reactions work in a full editable playground example", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/playground?example=reactions");
  const preview = page.getByRole("region", { name: "Live preview" });
  await expect(preview.getByRole("heading", { name: "A release worth celebrating 🎉" })).toBeVisible();
  await expect(preview.locator(".dui-embed")).toContainText("What's new");
  await expect(preview.getByAltText("Illustrated mountains beneath a blue sky")).toBeVisible();
  await preview.getByRole("button", { name: "arc: 2", exact: true }).click();
  await expect(preview.getByRole("button", { name: "arc: 3", exact: true })).toHaveAttribute("aria-pressed", "true");
  await preview.getByRole("button", { name: "👀: 4", exact: true }).click();
  await expect(preview.getByRole("button", { name: "👀: 3", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Reset code", exact: true }).click();
  await expect(preview.getByRole("button", { name: "arc: 2", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(preview.getByRole("button", { name: "👀: 4", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(preview.getByRole("button", { name: "🔥: 12", exact: true })).toHaveCSS("background-color", "rgb(238, 238, 239)");
  const selected = preview.getByRole("button", { name: "👀: 4", exact: true });
  await expect(selected).toHaveCSS("background-color", "rgb(230, 234, 255)");
  await expect(selected).toHaveCSS("border-color", "rgb(88, 101, 242)");
  await selected.click();
  await expect(preview.getByRole("button", { name: "👀: 3", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Light", exact: true }).hover();
  await expect(preview.getByRole("button", { name: "👀: 3", exact: true })).toHaveCSS("background-color", "rgb(238, 238, 239)");
  await preview.getByRole("button", { name: "👀: 3", exact: true }).click();
  await page.getByRole("button", { name: "Light", exact: true }).hover();
  await expect(selected).toHaveCSS("background-color", "rgb(230, 234, 255)");
  await preview.screenshot({ path: `/tmp/reactions-light-${page.viewportSize()?.width}.png` });
  const code = await page.getByRole("textbox", { name: "React JSX editor" }).inputValue();
  expect(code).toContain("\"reactions\": [");
  expect(code).toContain("onReactionToggle={toggleReaction}");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});

test("support channel reactions work in the catalogue and editable React, including thread replies", async ({ page }) => {
  for (const url of ["/components?example=channel-view", "/playground?example=channel-view"]) {
    await page.goto(url);
    const channel = page.locator(".dui-channel");
    await channel.getByRole("button", { name: "👍: 3", exact: true }).click();
    await expect(channel.getByRole("button", { name: "👍: 4", exact: true })).toHaveAttribute("aria-pressed", "true");
    await channel.getByRole("button", { name: /Open thread.*Setup help/ }).click();
    const panel = page.locator(".dui-thread-panel");
    await panel.getByRole("button", { name: "❤️: 2", exact: true }).click();
    await expect(panel.getByRole("button", { name: "❤️: 3", exact: true })).toHaveAttribute("aria-pressed", "true");
  }
});
