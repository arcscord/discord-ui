import { expect, test } from "@playwright/test";

test("edits valid JSON and synchronizes the preview and content editor", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "JSON du message", exact: true });
  const message = JSON.parse(await editor.inputValue());
  message.author.displayName = "JSON Author";
  message.body = { kind: "markdown", content: "**Message édité en JSON**" };
  const draft = JSON.stringify(message);
  await editor.fill(draft);
  await expect(page.locator("article")).toContainText("JSON Author");
  await expect(page.locator("article strong")).toHaveText("Message édité en JSON");
  await expect(page.getByLabel("Contenu", { exact: true })).toHaveValue("**Message édité en JSON**");
  await expect(editor).toHaveValue(draft);
  await page.getByRole("button", { name: "Formater", exact: true }).click();
  await expect(editor).toHaveValue(JSON.stringify(message, null, 2));
  await page.getByLabel("Contenu", { exact: true }).fill("Texte synchronisé");
  expect(JSON.parse(await editor.inputValue()).body.content).toBe("Texte synchronisé");
  expect(errors).toEqual([]);
});

test("preserves an invalid draft and the last valid preview until recovery or reset", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByRole("textbox", { name: "JSON du message", exact: true });
  const valid = await editor.inputValue();
  await editor.fill("{\"body\":");
  await expect(editor).toHaveAttribute("aria-invalid", "true");
  await expect(editor).toHaveValue("{\"body\":");
  await expect(page.getByRole("alert")).toContainText("JSON invalide");
  await expect(page.locator("article")).toContainText("Bienvenue dans le playground");
  await expect(page.getByRole("button", { name: "Formater", exact: true })).toBeDisabled();
  await expect(page.getByLabel("Contenu", { exact: true })).toBeDisabled();
  await editor.fill(valid);
  await expect(editor).toHaveAttribute("aria-invalid", "false");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await editor.fill("{}");
  await expect(page.getByRole("alert")).toContainText("$.id");
  await expect(page.locator("article")).toContainText("Bienvenue dans le playground");
  await page.getByRole("button", { name: "Réinitialiser le message" }).click();
  await expect(editor).toHaveValue(valid);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("edits nested V2 elements and rejects malformed accessories without crashing", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("components");
  const editor = page.getByRole("textbox", { name: "JSON du message", exact: true });
  const message = JSON.parse(await editor.inputValue());
  message.body.components[0].components[0].content = "# V2 modifié depuis le JSON";
  await editor.fill(JSON.stringify(message, null, 2));
  await expect(page.locator("article").getByRole("heading", { name: "V2 modifié depuis le JSON" })).toBeVisible();
  message.body.components[0].components[1].accessory.media = null;
  await editor.fill(JSON.stringify(message, null, 2));
  await expect(page.getByRole("alert")).toContainText("accessory.media");
  await expect(page.locator("article").getByRole("heading", { name: "V2 modifié depuis le JSON" })).toBeVisible();
  await page.getByRole("button", { name: "Copier le JSON" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await editor.inputValue());
  await page.getByRole("button", { name: "Réinitialiser le message" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator("article").getByRole("heading", { name: "Components V2", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});
