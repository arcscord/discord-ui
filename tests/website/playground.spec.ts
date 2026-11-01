import { expect, test } from "@playwright/test";

test("explorer filters components, compares themes and opens the selected example", async ({ page }) => {
  await page.goto("/components");
  if ((page.viewportSize()?.width ?? 0) <= 640)
    await page.getByRole("button", { name: /Browse components/ }).click();
  await page.getByRole("searchbox", { name: "Find a component" }).fill("Embed");
  await page.getByRole("button", { name: "Embed", exact: true }).click();
  await expect(page).toHaveURL(/example=embed/);
  await page.getByRole("checkbox", { name: "Compare all themes" }).check();
  await expect(page.getByText("Showing Light, Ash and Dark")).toBeVisible();
  await expect(page.getByRole("button", { name: "Light", exact: true })).toHaveCount(0);
  for (const theme of ["light", "ash", "dark"]) {
    await expect(page.getByRole("region", { name: `${theme} preview` }).locator(".dui-embed")).toBeVisible();
  }
  await page.getByRole("link", { name: "Open in playground" }).click();
  await expect(page).toHaveURL(/playground\?example=embed/);
  await expect(page.getByRole("combobox", { name: "Example", exact: true })).toHaveValue("embed");
  await expect(page.locator(".live-panel .dui-embed")).toBeVisible();
});

test("drafts survive switching, navigation and reload, and reset can be undone", async ({ page }) => {
  await page.goto("/playground?example=message-content");
  const editor = page.getByRole("textbox", { name: "React JSX editor" });
  const initial = await editor.inputValue();
  const edited = `${initial}\n// My unfinished example`;
  await editor.fill(edited);
  await page.getByRole("combobox", { name: "Example", exact: true }).selectOption("embed");
  await expect(page.getByRole("combobox", { name: "Example", exact: true })).toBeFocused();
  await page.goBack();
  await expect(editor).toHaveValue(edited);
  await page.reload();
  await expect(editor).toHaveValue(edited);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(editor).toHaveValue(initial);
  await page.reload();
  await page.getByRole("button", { name: "Undo reset", exact: true }).click();
  await expect(editor).toHaveValue(edited);
  await expect(page.getByRole("button", { name: "Reset", exact: true })).toBeFocused();
  await expect(page.getByRole("button", { name: "Undo reset", exact: true })).toHaveCount(0);
});

test("editing and switching examples still work when browser storage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw new Error("Storage blocked");
      },
    });
  });
  await page.goto("/playground?example=message-content");
  const editor = page.getByRole("textbox", { name: "React JSX editor" });
  const edited = `${await editor.inputValue()}\n// In-memory draft`;
  await editor.fill(edited);
  const examples = page.getByRole("combobox", { name: "Example", exact: true });
  await examples.selectOption("embed");
  await examples.selectOption("message-content");
  await expect(editor).toHaveValue(edited);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("width reports the rendered preview and follows viewport changes", async ({ page }) => {
  await page.goto("/playground?example=message");
  await page.getByRole("slider", { name: "Width", exact: true }).fill("1000");
  const output = page.getByRole("status", { name: "Actual preview width" });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(async () => {
      const actual = Math.round(await page.locator(".preview-width").evaluate(element => element.getBoundingClientRect().width));
      await expect(output).toHaveText(`${actual} px`);
      expect(actual).toBeLessThan(1000);
    }).toPass();
    await expect(page.locator("#width-hint")).toHaveText("Target 1000 px · fitted to panel");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
  await page.getByRole("slider", { name: "Width", exact: true }).fill("320");
  await expect(output).toHaveText("320 px");
  await expect(page.locator("#width-hint")).toHaveText("Actual preview width");
});

test("mobile catalogue collapses after selection and restores keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/components");
  const browse = page.getByRole("button", { name: /Browse components/ });
  await expect(browse).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("searchbox")).toBeHidden();
  const preview = page.locator(".component-preview");
  expect((await preview.boundingBox())!.y).toBeLessThan(600);
  await browse.click();
  await page.getByRole("searchbox").fill("Embed");
  await page.getByRole("button", { name: "Embed", exact: true }).click();
  await expect(browse).toHaveAttribute("aria-expanded", "false");
  await expect(browse).toBeFocused();
  await expect(browse).toContainText("Embed");
  await expect(page.locator(".component-preview .dui-embed")).toBeVisible();
  await browse.click();
  await page.getByRole("searchbox").press("Escape");
  await expect(browse).toBeFocused();
  await expect(browse).toHaveAttribute("aria-expanded", "false");
  await page.setViewportSize({ width: 1440, height: 844 });
  await expect(page.getByRole("searchbox")).toBeVisible();
});

test("JSX edits render, errors retain the last preview, and Reset recovers", async ({ page }) => {
  await page.goto("/playground?example=message-content");
  const editor = page.getByRole("textbox", { name: "React JSX editor" });
  await expect(page.locator(".compile-status")).toContainText("Example loaded");
  const source = (content: string): string => `import React from "react";
import { DiscordUI, MessageContent } from "@arcscord/discord-ui";
import "@arcscord/discord-ui/styles.css";
export default function Preview() { return <DiscordUI><MessageContent content="${content}" /></DiscordUI>; }`;
  await editor.fill(source("Edited from JSX"));
  await expect(page.locator(".live-panel")).toContainText("Edited from JSX");
  await editor.fill("import React from \"react\"; export default function Preview() { return <");
  await expect(page.getByRole("alert")).toContainText("Could not render this edit");
  await expect(page.locator(".live-panel")).toContainText("Edited from JSX");
  await expect(editor).toHaveValue("import React from \"react\"; export default function Preview() { return <");
  await editor.fill(source("Recovered"));
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".live-panel")).toContainText("Recovered");
  await editor.fill("export default function Preview() { throw new Error(\"Example render failed\"); }");
  await expect(page.getByRole("alert")).toContainText("Example render failed");
  await expect(page.locator(".live-panel")).toContainText("Recovered");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator(".live-panel")).toContainText("A new line, a new thought.");
  await editor.focus();
  await editor.press("Escape");
  await expect(page.getByRole("button", { name: "Reset", exact: true })).toBeFocused();
});

test("live channel state, preview theme and width controls work independently", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/playground?example=channel-view");
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(page.locator(".playground-discord > .arcscord-discord-ui")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const composer = page.getByRole("textbox", { name: "Message #support", exact: true });
  await composer.fill("Sent from editable React");
  await composer.press("Enter");
  await expect(page.locator(".live-panel")).toContainText("Sent from editable React");
  await page.getByRole("button", { name: /Open thread.*Setup help/ }).click();
  const reply = page.locator(".dui-thread-panel").getByRole("textbox");
  await reply.fill("A live thread reply");
  await reply.press("Enter");
  await expect(page.locator(".dui-thread-panel")).toContainText("A live thread reply");
  await reply.press("Escape");
  await expect(page.getByRole("button", { name: /Open thread.*Setup help/ })).toBeFocused();
  await page.getByRole("slider", { name: "Width" }).fill("320");
  await expect(page.locator(".preview-width")).toHaveCSS("width", "320px");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});

test("copy exports the edited JSX, dependencies and selected theme", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => { sessionStorage.setItem("copied-example", text); },
      },
    });
  });
  await page.goto("/playground?example=message");
  const editor = page.getByRole("textbox", { name: "React JSX editor" });
  await editor.fill((await editor.inputValue()).replace("Arcscord", "Copied edit"));
  await page.getByRole("button", { name: "Ash", exact: true }).click();
  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect(page.getByText("Copied the code shown in the editor.")).toBeVisible();
  const code = await page.evaluate(() => sessionStorage.getItem("copied-example"));
  expect(code).toContain("import { DiscordUI, Message } from \"@arcscord/discord-ui\"");
  expect(code).toContain("const welcome =");
  expect(code).toContain("Copied edit");
  expect(code).toContain("const previewTheme = \"ash\"");
  expect(code).toBe(await editor.inputValue());
});

test("message data and imports are editable in the displayed module", async ({ page }) => {
  await page.goto("/playground?example=message-list");
  const editor = page.getByRole("textbox", { name: "React JSX editor" });
  const code = await editor.inputValue();
  expect(code).toContain("import React");
  expect(code).toContain("const initialChannel =");
  expect(code).toContain("\"messages\": [");
  const edited = code.replace("I'm having trouble getting the bot to respond. Any ideas?", "Edited message data");
  await editor.fill(edited);
  await expect(page.locator(".live-panel")).toContainText("Edited message data");
  await editor.fill(edited.replace("DiscordUI, MessageList", "DiscordUI, MessageList as Timeline").replace("<MessageList", "<Timeline"));
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".live-panel")).toContainText("Edited message data");
});
