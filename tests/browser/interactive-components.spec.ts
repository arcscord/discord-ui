import { expect, test } from "@playwright/test";

test("message controls support multiple selection, keyboard, entities and callbacks", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/Discord/u);
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(message.text());
  });
  await page.getByLabel("Scénario", { exact: true }).selectOption("interactive");
  await expect(page.getByRole("heading", { name: "Interactive components", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Primary", exact: true }).click();
  await expect(page.getByRole("status", { name: "Dernière interaction" })).toHaveText("Button: primary");
  const select = page.getByRole("combobox", { name: "Choose test values" });
  await select.click();
  await expect(page.getByRole("option", { name: "Alpha First typed value" })).toBeVisible();
  await page.locator(".dui-container").screenshot({ path: `/tmp/discord-select-${test.info().project.name}.png` });
  await page.getByRole("option", { name: "Alpha First typed value" }).click();
  await page.getByRole("option", { name: "Beta Second typed value" }).click();
  await expect(page.getByRole("option", { name: "Gamma Third typed value" })).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("option", { name: "Gamma Third typed value" }).click({ force: true });
  await expect(select).toHaveText("Alpha, Beta");
  await page.getByRole("option", { name: "Alpha First typed value" }).click();
  await expect(select).toHaveText("Beta");
  await select.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  const users = page.getByRole("combobox", { name: "Select a user", exact: true });
  await users.fill("helper_bot");
  await users.press("ArrowDown");
  await users.press("Enter");
  await expect(users.locator("..")).toContainText("Helper Bot");
  await expect(page.getByRole("status", { name: "Dernière interaction" })).toHaveText("users: helper-bot");
  await users.click();
  await page.locator(".dui-container").screenshot({ path: `/tmp/discord-users-${test.info().project.name}.png` });
  await page.getByRole("heading", { name: "Interactive components", exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  for (const [name, option] of [
    ["Select roles", "Administrators"],
    ["Select users or roles", "Moderators"],
    ["Select a channel", "general"],
  ]) {
    const menu = page.getByRole("combobox", { name, exact: true });
    await menu.click();
    await page.getByRole("option", { name: option, exact: true }).click();
    await menu.press("Escape");
  }
  await expect(page.getByRole("combobox", { name: "Disabled menu" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Disabled", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: /Premium ·/u }).click();
  await expect(page.getByRole("status", { name: "Dernière interaction" })).toHaveText("Premium: demo-sku");
  await expect(page.getByRole("link", { name: "guide.pdf", exact: true })).toHaveAttribute("href", "https://example.com/guide.pdf");
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

for (const kind of [
  "string-select",
  "user-select",
  "role-select",
  "mentionable-select",
  "channel-select",
]) {
  test(`JSON playground includes a dedicated ${kind} scenario`, async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Scénario", { exact: true }).selectOption(kind);
    const menus = page.locator("article").getByRole("combobox");
    await expect(menus).toHaveCount(3);
    await expect(menus.nth(2)).toBeDisabled();
    await menus.first().click();
    await expect(page.locator("article").getByRole("option")).toHaveCount(6);
    await menus.first().press("Escape");
    await menus.nth(1).click();
    await page.locator("article").getByRole("option").nth(1).click();
    await expect(menus.nth(1)).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("status", { name: "Dernière interaction" })).not.toBeEmpty();
  });
}

test("entity menus search real metadata, use chips, and keep rows specific to their type", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("user-select");
  const user = page.getByRole("combobox", { name: "Choose reviewers" });
  await user.fill("ines");
  await expect(user).toHaveCSS("outline-style", "none");
  const option = page.locator("article").getByRole("option");
  await expect(option).toHaveCount(1);
  await expect(option).toContainText("Inès");
  await expect(page.locator(".dui-select-options .dui-select-description")).toHaveCount(0);
  await option.click();
  await expect(user.locator("..").locator(".dui-select-chip")).toHaveCount(2);
  await page.getByRole("button", { name: "Remove Inès" }).click();
  await expect(user.locator("..").locator(".dui-select-chip")).toHaveCount(1);
  await user.fill("no-such-user");
  await expect(page.getByRole("note")).toHaveText("No results found");
  await user.press("Escape");
  await user.click();
  await expect(page.locator(".dui-select-options:popover-open")).toBeVisible();
  await expect(page.locator(".dui-select-options img").first()).toHaveAttribute("src", "/generated/avatars/chris.svg");
  const controlBounds = (await user.locator("..").boundingBox())!;
  const menuBounds = (await page.locator(".dui-select-options").boundingBox())!;
  const top = Math.min(controlBounds.y, menuBounds.y);
  await page.screenshot({
    path: `/tmp/discord-real-users-${test.info().project.name}.png`,
    clip: {
      x: controlBounds.x,
      y: top,
      width: controlBounds.width,
      height: Math.max(controlBounds.y + controlBounds.height, menuBounds.y + menuBounds.height) - top,
    },
  });
  await user.press("Escape");
  await page.getByLabel("Scénario", { exact: true }).selectOption("channel-select");
  await page.getByRole("combobox", { name: "Choose destination channels" }).click();
  await expect(page.locator(".dui-select-options .dui-select-channel-icon")).toHaveCount(6);
  await expect(page.locator(".dui-select-options .dui-select-channel-lock")).toHaveCount(2);
  await expect(page.locator(".dui-select-options .dui-select-description")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("string options align emoji with both text lines and open within the viewport", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("string-select");
  const menu = page.getByRole("combobox", { name: "Choose notification topics" });
  await menu.click();
  const list = page.getByRole("listbox", { name: "Choose notification topics" });
  await expect(list.locator(".dui-select-description")).toHaveCount(6);
  await expect(list.locator(".dui-select-emoji")).toHaveCount(6);
  const bounds = await list.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await expect(list.locator(".dui-select-option").first()).toHaveCSS("align-items", "center");
  await expect(menu).toHaveCSS("height", "40px");
  await expect(list.locator(".dui-select-option").first()).toHaveCSS("height", "56px");
  if (test.info().project.name === "desktop")
    await expect(menu).toHaveCSS("width", "400px");
  await list.screenshot({ path: `/tmp/discord-real-strings-${test.info().project.name}.png` });
  await menu.press("Escape");
  const editor = page.getByRole("textbox", { name: "JSON du message", exact: true });
  const document = JSON.parse(await editor.inputValue());
  const options = document.body.components[0].components.find((component: { id: string }) => component.id === "multiple").select.options;
  for (const option of options) {
    delete option.description;
    delete option.emoji;
  }
  await editor.fill(JSON.stringify(document));
  await expect(page.getByRole("alert")).toHaveCount(0);
  await menu.click();
  await expect(list.locator(".dui-select-option").first()).toHaveCSS("height", "40px");
  await expect(list.locator(".dui-select-description")).toHaveCount(0);
});
