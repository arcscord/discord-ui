import { expect, test } from "@playwright/test";

test("edits a message, switches theme and resets without runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("Discord UI — Playground");
  await expect(page.getByRole("heading", { name: "Playground", exact: true })).toBeVisible();
  await page.getByLabel("Contenu", { exact: true }).fill("Bonjour depuis le navigateur");
  await expect(page.locator("article")).toContainText("Bonjour depuis le navigateur");
  await page.getByLabel("Thème", { exact: true }).selectOption("light");
  await expect(page.locator("article")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Réinitialiser le message" }).click();
  await expect(page.locator("article")).toContainText("Bienvenue dans le playground");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
