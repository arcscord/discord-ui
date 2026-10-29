import { expect, test } from "@playwright/test";

test("renders the V2 example with AutoThreads container and button styles", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("components");
  await expect(page.locator("article").getByRole("heading", { name: "Components V2", exact: true })).toBeVisible();
  await expect(page.getByAltText("Symbole du projet")).toBeVisible();
  await expect(page.locator(".dui-thumbnail")).toHaveCSS("width", "85px");
  await expect(page.getByRole("link", { name: "Documentation", exact: true })).toHaveAttribute("href", "https://arcscord.dev");
  const disabled = page.getByRole("link", { name: "Bientôt disponible", exact: true });
  await expect(disabled).toHaveAttribute("aria-disabled", "true");
  expect(await disabled.getAttribute("href")).toBeNull();
  await expect(page.getByRole("link", { name: "Code source", exact: true })).toHaveCSS("height", "32px");
  await expect(page.locator(".dui-container").first()).toHaveClass(/dui-container-accented/u);
  await expect(page.locator(".dui-container").last()).not.toHaveClass(/dui-container-accented/u);
  await expect(page.getByAltText("Image V2 sous spoiler")).toHaveCount(0);
  const hiddenMedia = page.locator(".dui-media-gallery-item").nth(1);
  const before = await hiddenMedia.boundingBox();
  await page.getByRole("button", { name: "Afficher le spoiler" }).click();
  await expect(page.getByAltText("Image V2 sous spoiler")).toBeVisible();
  const after = await hiddenMedia.boundingBox();
  expect(Math.abs((before?.height ?? 0) - (after?.height ?? 0))).toBeLessThan(1);
  await page.getByLabel("Thème", { exact: true }).selectOption("light");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
