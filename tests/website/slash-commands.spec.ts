import { expect, test } from "@playwright/test";

test("website playground exposes and runs the slash command example", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/playground");
  await page.getByRole("combobox", { name: "Example", exact: true }).selectOption("slash-commands");
  await expect(page).toHaveURL(/example=slash-commands/);
  const preview = page.getByRole("region", { name: "Live preview" });
  await expect(preview).toContainText("Type / below");
  const input = preview.getByRole("textbox", { name: /^Message #/ });
  await input.fill("/config");
  await input.press("Enter");
  await preview.getByRole("listbox").getByRole("option", { name: /^word / }).click();
  await preview.getByRole("textbox", { name: "word", exact: true }).fill("hello");
  await preview.getByRole("textbox", { name: "word", exact: true }).press("Tab");
  await preview.getByRole("listbox").getByRole("option", { name: /^channel / }).click();
  await preview.getByRole("listbox").getByRole("option", { name: "#support", exact: true }).click();
  await page.screenshot({ path: `/tmp/website-slash-${testInfo.project.name}.png` });
  await preview.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(preview.getByRole("status", { name: "Command result" })).toHaveText(JSON.stringify({
    command: "config autoreact",
    arguments: { word: "hello", channel: "support" },
  }));
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("mouse and keyboard share one highlight for commands, arguments and choices", async ({ page }) => {
  await page.goto("/playground?example=slash-commands");
  const preview = page.getByRole("region", { name: "Live preview" });
  const input = preview.getByRole("textbox", { name: /^Message #/ });
  const options = preview.getByRole("listbox").getByRole("option");
  async function expectSingleHighlight(index: number) {
    await expect(options.nth(index)).toHaveAttribute("aria-selected", "true");
    await expect(preview.getByRole("listbox").getByRole("option", { selected: true })).toHaveCount(1);
    const highlighted = await options.evaluateAll(elements => elements.map(element => getComputedStyle(element).backgroundColor).filter(color => color !== "rgba(0, 0, 0, 0)" && color !== "transparent"));
    expect(highlighted).toHaveLength(1);
  }
  await input.fill("/");
  await options.nth(1).hover();
  await expectSingleHighlight(1);
  // Keep the pointer still over the second row while keyboard selection moves.
  await input.press("ArrowUp");
  await expectSingleHighlight(0);
  await input.press("ArrowDown");
  await input.press("Enter");
  await options.nth(2).hover();
  await expectSingleHighlight(2);
  await page.keyboard.press("ArrowUp");
  await expectSingleHighlight(1);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await options.nth(1).hover();
  await expectSingleHighlight(1);
  await page.keyboard.press("ArrowUp");
  await expectSingleHighlight(0);
  await page.keyboard.press("Enter");
  await expect(preview.getByRole("combobox", { name: "channel", exact: true })).toHaveValue("#general");
});

test("removes started arguments with Backspace and keeps option hints unboxed", async ({ page }, testInfo) => {
  await page.goto("/playground?example=slash-commands");
  const preview = page.getByRole("region", { name: "Live preview" });
  const input = preview.getByRole("textbox", { name: /^Message #/ });
  await input.fill("/config");
  await input.press("Enter");
  const more = preview.getByRole("button", { name: "Options", exact: true });
  await expect(more).toBeFocused();
  await expect(more).toHaveText("+3 options");
  await expect(more).toHaveCSS("outline-style", "none");
  await expect(more).toHaveCSS("border-top-width", "0px");
  await preview.getByRole("listbox").getByRole("option", { name: /^word / }).click();
  const word = preview.getByRole("textbox", { name: "word", exact: true });
  await word.fill("abc");
  await word.press("Backspace");
  await expect(word).toHaveValue("ab");
  await word.fill("");
  await word.press("Backspace");
  await expect(word).toHaveCount(0);
  await expect(more).toBeFocused();
  await expect(more).toHaveText("+3 options");
  await preview.getByRole("listbox").getByRole("option", { name: /^word / }).click();
  await word.fill("Préparer l’installation");
  await word.press("Tab");
  await preview.getByRole("listbox").getByRole("option", { name: /^emoji / }).click();
  const emoji = preview.getByRole("textbox", { name: "emoji", exact: true });
  await emoji.fill("VPS");
  const tokens = preview.locator(".dui-slash-token");
  await expect(tokens).toHaveCount(2);
  for (const token of await tokens.all()) {
    await expect(token).toHaveCSS("height", "28px");
    const field = token.locator("input");
    expect(await field.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  }
  await page.screenshot({ path: `/tmp/website-slash-chips-${testInfo.project.name}.png` });
  await emoji.press("Tab");
  await expect(more).toBeFocused();
  await more.press("Backspace");
  await expect(emoji).toBeFocused();
  await expect(emoji).toHaveValue("VPS");
  await emoji.fill("");
  await emoji.press("Backspace");
  await expect(emoji).toHaveCount(0);
  await expect(word).toBeFocused();
  await preview.getByRole("button", { name: "Remove argument", exact: true }).click();
  await expect(word).toHaveCount(0);
  await expect(more).toHaveText("+3 options");
  await more.press("Backspace");
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("/");
  await expect(preview.locator(".dui-slash-editor")).toHaveCount(0);
  // Commands without arguments can also be removed from their initial focus.
  await input.fill("/bot-info");
  await input.press("Enter");
  await page.keyboard.press("Backspace");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("/");
  await expect(preview.getByRole("status", { name: "Command result" })).toHaveText("No command submitted yet.");
});
