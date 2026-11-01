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

test("renders rich content and keyboard accessible spoilers", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("markdown");
  await expect(page.locator("article")).toContainText("@Inès");
  await expect(page.locator("article .hljs-keyword").first()).toBeVisible();
  const spoiler = page.getByRole("button", { name: "Afficher le spoiler" });
  await spoiler.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("article")).toContainText("Le contenu du spoiler est révélé.");
  await expect(page.getByRole("button", { name: "Masquer le spoiler" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".dui-revealable-text > .dui-spoiler-content")).toBeHidden();
  await page.getByLabel("Scénario", { exact: true }).selectOption("media");
  await expect(page.getByAltText("Paysage synthétique de montagnes")).toBeVisible();
  await expect(page.getByAltText("Paysage masqué")).toHaveCount(0);
  await page.getByRole("button", { name: "Afficher le spoiler" }).click();
  await expect(page.getByAltText("Paysage masqué")).toBeVisible();
  await page.getByRole("button", { name: "Réinitialiser le message" }).click();
  await expect(page.getByAltText("Paysage masqué")).toHaveCount(0);
  await page.getByLabel("Scénario", { exact: true }).selectOption("embed");
  await expect(page.locator("article").getByText("Construire une interface Discord", { exact: true })).toBeVisible();
  await expect(page.getByAltText("Montagnes dans un embed")).toBeVisible();
  await page.getByLabel("Thème", { exact: true }).selectOption("light");
  await expect(page.locator("article")).toHaveCSS("background-color", "rgb(251, 251, 251)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("shows image failure fallback and copies the selected message data", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route("**/landscape.svg", route => route.abort());
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("media");
  await expect(page.getByRole("img", { name: "Média indisponible: Paysage synthétique de montagnes" })).toBeVisible();
  await page.getByRole("button", { name: "Copier le JSON" }).click();
  await expect(page.getByRole("status")).toHaveText("Données copiées");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(JSON.parse(copied).id).toBe("message-media");
});

test("inherits custom theme tokens from its display scope", async ({ page }) => {
  await page.goto("/");
  await page.locator(".preview-width > .arcscord-discord-ui").evaluate((element) => {
    (element as HTMLElement).style.setProperty("--discord-ui-background", "rgb(20, 40, 60)");
  });
  await expect(page.locator("article")).toHaveCSS("background-color", "rgb(20, 40, 60)");
});

test("keeps text spoilers at their natural width and code block spacing compact", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("markdown");
  const mask = page.locator(".dui-revealable-text");
  const before = await mask.boundingBox();
  await page.getByRole("button", { name: "Afficher le spoiler" }).click();
  const after = await mask.boundingBox();
  expect(before?.width).toBeGreaterThan(150);
  expect(Math.abs((before?.width ?? 0) - (after?.width ?? 0))).toBeLessThan(1);
  const pre = await page.locator("article pre").boundingBox();
  const timestamp = await page.locator(".dui-inline-timestamp").boundingBox();
  expect((timestamp?.y ?? 0) - (pre!.y + pre!.height)).toBeLessThan(16);
  await expect(page.locator("article pre .hljs-keyword")).toHaveCSS("color", "rgb(244, 112, 103)");
});
