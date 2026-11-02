import { expect, test } from "@playwright/test";

test("filters commands, accepts free text and fixed choices, then submits a structured invocation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(message.text());
  });
  await page.goto("/");
  await expect(page).toHaveTitle(/Discord/);
  await page.getByLabel("Scénario", { exact: true }).selectOption("channel");
  const input = page.getByRole("textbox", { name: "Message #exemple", exact: true });
  await input.fill("/");
  await expect(page.getByRole("listbox").getByRole("option")).toHaveCount(5);
  await expect(page.getByRole("listbox")).toContainText("Show recent global quota changes");
  await input.fill("/config autothreads");
  await expect(page.getByRole("listbox").getByRole("option")).toHaveCount(1);
  await input.press("Enter");
  await page.getByRole("listbox").getByRole("option", { name: /^name / }).click();
  const name = page.getByRole("textbox", { name: "name", exact: true });
  await expect(name).toBeFocused();
  const send = page.getByRole("button", { name: "Envoyer le message", exact: true });
  await expect(send).toBeDisabled();
  await name.fill("Support technique");
  await expect(send).toBeDisabled();
  await name.press("Tab");
  await page.getByRole("listbox").getByRole("option", { name: /^mode / }).click();
  await page.getByRole("listbox").getByRole("option", { name: "With a keyword", exact: true }).click();
  await name.press("Enter");
  await expect(page.getByRole("status", { name: "Dernière interaction" })).toHaveText(JSON.stringify({
    command: "config autothreads",
    arguments: { name: "Support technique", mode: "keyword" },
  }));
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await expect(page.locator(".dui-channel article")).toHaveCount(4);
  expect(errors).toEqual([]);
});

test("supports keyboard selection, cancellation, no-argument commands and normal messages", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("channel");
  const input = page.getByRole("textbox", { name: "Message #exemple", exact: true });
  await input.fill("/");
  await input.press("ArrowDown");
  await expect(page.getByRole("listbox").getByRole("option", { selected: true })).toContainText("admin-config show");
  await input.press("Tab");
  await expect(page.getByRole("button", { name: "Envoyer le message", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status", { name: "Dernière interaction" })).toContainText("\"command\":\"admin-config show\"");
  await input.fill("/config autothreads");
  await page.getByRole("listbox").getByRole("option").click();
  await page.getByRole("button", { name: "Options", exact: true }).press("Escape");
  await expect(input).toBeFocused();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await input.fill("/bot");
  await input.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await input.fill("Bonjour");
  await input.press("Enter");
  await expect(page.locator(".dui-channel article").last()).toContainText("Bonjour");
});

test("renders slash suggestions and fields without horizontal overflow", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("channel");
  const input = page.getByRole("textbox", { name: "Message #exemple", exact: true });
  await input.fill("/");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.locator(".dui-channel-composer").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `/tmp/slash-${testInfo.project.name}-list.png` });
  await page.getByRole("listbox").getByRole("option").last().click();
  await page.getByRole("listbox").getByRole("option", { name: /^mode / }).click();
  await expect(page.getByRole("combobox", { name: "mode", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({ path: `/tmp/slash-${testInfo.project.name}-fields.png` });
});

test("dedicated slash example matches the inline option flow and rejects invalid fixed values", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("slash");
  await expect(page.locator(".scenario-note")).toContainText("config autoreact");
  const input = page.getByRole("textbox", { name: "Message #exemple", exact: true });
  await input.fill("/config autoreact");
  await input.press("Enter");
  await expect(page.getByRole("button", { name: "Options", exact: true })).toHaveText("+3 options");
  await page.locator(".dui-channel-composer").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `/tmp/slash-discord-${testInfo.project.name}-options.png` });
  await page.getByRole("listbox").getByRole("option", { name: /^word / }).click();
  const word = page.getByRole("textbox", { name: "word", exact: true });
  await expect(word).toBeFocused();
  await expect(page.locator(".dui-slash-heading")).toContainText("Word or phrase to react to in every channel");
  await word.fill("kk");
  await page.screenshot({ path: `/tmp/slash-discord-${testInfo.project.name}-word.png` });
  await word.press("Tab");
  await expect(page.getByRole("listbox").getByRole("option")).toHaveCount(2);
  await page.getByRole("listbox").getByRole("option", { name: /^channel / }).click();
  const channel = page.getByRole("combobox", { name: "channel", exact: true });
  await channel.fill("inexistant");
  await expect(page.getByRole("button", { name: "Envoyer le message", exact: true })).toBeDisabled();
  await channel.fill("supp");
  await channel.press("Enter");
  await expect(channel).toHaveValue("#support");
  await channel.focus();
  await page.getByRole("button", { name: "Retirer l’argument", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(channel).toHaveCount(0);
  await page.getByRole("listbox").getByRole("option", { name: /^emoji / }).click();
  await page.getByRole("textbox", { name: "emoji", exact: true }).fill("👍");
  await page.getByRole("button", { name: "Envoyer le message", exact: true }).click();
  await expect(page.getByRole("status", { name: "Dernière interaction" })).toHaveText(JSON.stringify({
    command: "config autoreact",
    arguments: { word: "kk", emoji: "👍" },
  }));
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
