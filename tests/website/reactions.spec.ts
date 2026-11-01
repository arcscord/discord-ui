import { expect, test } from "@playwright/test";

test("landing examples have interactive reactions and open a full playground example", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  const hero = page.locator(".landing-hero");
  await hero.getByRole("button", { name: "👋: 8", exact: true }).click();
  await expect(hero.getByRole("button", { name: "👋: 9", exact: true })).toHaveAttribute("aria-pressed", "true");
  await hero.getByRole("tab", { name: "Release notes", exact: true }).click();
  await hero.getByRole("button", { name: "🔥: 12", exact: true }).press("Space");
  await expect(hero.getByRole("button", { name: "🔥: 13", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(hero.locator(".example-source")).toContainText("onReactionToggle={toggleReaction}");
  await hero.getByRole("link", { name: "Open in playground" }).click();
  await expect(page).toHaveURL(/playground\?example=reactions/);
  const preview = page.getByRole("region", { name: "Live preview" });
  await expect(preview.getByRole("heading", { name: "A release worth celebrating 🎉" })).toBeVisible();
  await expect(preview.locator(".dui-embed")).toContainText("What's new");
  await expect(preview.getByAltText("Illustrated mountains beneath a blue sky")).toBeVisible();
  await preview.getByRole("button", { name: "arc: 2", exact: true }).click();
  await expect(preview.getByRole("button", { name: "arc: 3", exact: true })).toHaveAttribute("aria-pressed", "true");
  await preview.getByRole("button", { name: "👀: 4", exact: true }).click();
  await expect(preview.getByRole("button", { name: "👀: 3", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(preview.getByRole("button", { name: "arc: 2", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(preview.getByRole("button", { name: "👀: 4", exact: true })).toHaveAttribute("aria-pressed", "true");
  const code = await page.getByRole("textbox", { name: "React JSX editor" }).inputValue();
  expect(code).toContain("\"reactions\": [");
  expect(code).toContain("onReactionToggle={toggleReaction}");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});

test("support channel reactions work on the landing and in editable React, including thread replies", async ({ page }) => {
  for (const url of ["/", "/playground?example=channel-view"]) {
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
