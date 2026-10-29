import { expect, test } from "@playwright/test";

test("opens at the bottom and sends local messages with Enter or the send button", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("channel");
  await expect(page.locator(".dui-channel-name")).toHaveText("exemple");
  await expect(page.locator(".dui-channel article")).toHaveCount(4);
  const history = page.getByRole("log", { name: "Messages", exact: true });
  await expect.poll(() => history.evaluate(element => element.scrollHeight - element.scrollTop - element.clientHeight)).toBeLessThanOrEqual(2);
  expect(await history.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  const input = page.getByRole("textbox", { name: "Message #exemple", exact: true });
  await input.fill("Un nouveau message local");
  await input.press("Enter");
  await expect(page.locator(".dui-channel article")).toHaveCount(5);
  await expect(page.locator(".dui-channel article").last()).toContainText("Un nouveau message local");
  await expect(input).toHaveValue("");
  await expect.poll(() => history.evaluate(element => element.scrollHeight - element.scrollTop - element.clientHeight)).toBeLessThanOrEqual(2);
  const json = page.getByRole("textbox", { name: "JSON du salon", exact: true });
  expect(JSON.parse(await json.inputValue()).messages).toHaveLength(5);
  await input.fill("Bonjour");
  await input.press("Shift+Enter");
  await input.pressSequentially("la suite");
  await expect(page.locator(".dui-channel article")).toHaveCount(5);
  await page.getByRole("button", { name: "Envoyer le message", exact: true }).click();
  expect(JSON.parse(await json.inputValue()).messages.at(-1).body.content).toBe("Bonjour\nla suite");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});

test("edits channel JSON, retains the last valid channel and resets the demo", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("channel");
  const editor = page.getByRole("textbox", { name: "JSON du salon", exact: true });
  const channel = JSON.parse(await editor.inputValue());
  channel.name = "salon-json";
  channel.messages = [];
  await editor.fill(JSON.stringify(channel));
  await expect(page.locator(".dui-channel-name")).toHaveText("salon-json");
  await expect(page.getByRole("textbox", { name: "Message #salon-json", exact: true })).toBeVisible();
  await expect(page.getByRole("log")).toContainText("Aucun message dans ce salon.");
  await editor.fill("{\"messages\":");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator(".dui-channel-name")).toHaveText("salon-json");
  await expect(page.getByRole("textbox", { name: "Message #salon-json", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Réinitialiser le salon", exact: true }).click();
  await expect(page.locator(".dui-channel article")).toHaveCount(4);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect.poll(() => page.getByRole("log").evaluate(element => element.scrollHeight - element.scrollTop - element.clientHeight)).toBeLessThanOrEqual(2);
});

const palettes = {
  light: { divider: "rgb(223, 223, 225)", input: "rgb(255, 255, 255)" },
  ash: { divider: "rgb(62, 63, 69)", input: "rgb(56, 58, 65)" },
  dark: { divider: "rgb(41, 41, 46)", input: "rgb(34, 35, 39)" },
};
for (const [theme, colors] of Object.entries(palettes)) {
  test(`keeps the ${theme} header and composer visible while history scrolls`, async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Scénario", { exact: true }).selectOption("channel");
    await page.getByLabel("Thème", { exact: true }).selectOption(theme);
    const header = page.locator(".dui-channel-header");
    const composer = page.locator(".dui-channel-composer");
    await expect(header).toHaveCSS("border-bottom-width", "1px");
    await expect(header).toHaveCSS("border-bottom-color", colors.divider);
    await expect(composer).toHaveCSS("background-color", colors.input);
    await expect(composer).toHaveCSS("border-top-color", colors.divider);
    const containerBorder = await composer.evaluate((element) => {
      const probe = document.createElement("span");
      probe.style.border = "1px solid var(--discord-ui-container-outline)";
      element.append(probe);
      const color = getComputedStyle(probe).borderTopColor;
      probe.remove();
      return color;
    });
    const input = page.getByRole("textbox", { name: "Message #exemple", exact: true });
    await input.focus();
    await expect(composer).toHaveCSS("border-top-color", containerBorder);
    await expect(composer).toHaveCSS("outline-style", "none");
    await expect(input).toHaveCSS("outline-style", "none");
    await input.blur();
    await expect(composer).toHaveCSS("border-top-color", colors.divider);
    const beforeHeader = await header.boundingBox();
    const beforeComposer = await composer.boundingBox();
    await page.getByRole("log").evaluate((element) => {
      element.scrollTop = 0;
    });
    expect((await header.boundingBox())?.y).toBe(beforeHeader?.y);
    expect((await composer.boundingBox())?.y).toBe(beforeComposer?.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}
