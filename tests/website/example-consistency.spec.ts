import { expect, test } from "@playwright/test";

test("homepage links open their exact scenario with the selected theme", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const [demo, label, id, content] of [
    [
      "hero-demo",
      "Announcement",
      "announcement",
      "Your next adventure starts here.",
    ],
    [
      "transcript-demo",
      "Transcript",
      "transcript",
      "ticket-1042",
    ],
    [
      "arcade-demo",
      "Arcade",
      "arcade",
      "Ready to play?",
    ],
  ]) {
    await page.goto("/");
    await page.getByRole("combobox", { name: `${label} theme` }).selectOption("light");
    if (id === "announcement")
      await expect(page.locator(".hero-demo .dui-button-link")).toHaveAttribute("href", "http://127.0.0.1:4174/playground?example=announcement&theme=light");
    if (id === "transcript")
      await expect(page.locator(".transcript-demo").getByRole("link", { name: "welcome-config.json", exact: true })).toHaveAttribute("href", "http://127.0.0.1:4174/examples/welcome-config.json");
    const link = page.locator(`.${demo} .example-caption a`);
    await expect(link).toHaveAttribute("href", `/playground?example=${id}&theme=light`);
    await link.click();
    await expect(page.getByRole("combobox", { name: "Example", exact: true })).toHaveValue(id!);
    await expect(page.locator(".live-panel")).toContainText(content!);
    await expect(page.locator(".playground-discord > .arcscord-discord-ui")).toHaveAttribute("data-theme", "light");
    await expect(page.getByRole("alert")).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test("catalogue and editor expose the same replies, reactions, avatar and commands", async ({ page }) => {
  for (const [id, locator] of [
    ["reply-preview", ".dui-reply-preview"],
    ["interaction", ".dui-interaction-command"],
    ["ephemeral", ".dui-ephemeral-notice"],
    ["reactions", ".dui-embed"],
    ["avatar", "input[aria-label=\"Avatar letter\"]"],
    ["slash-commands", ".dui-channel-input"],
  ]) {
    await page.goto(`/components?example=${id}`);
    await expect(page.locator(`.component-preview ${locator}`).first()).toBeVisible();
    await page.getByRole("link", { name: "Open in playground" }).click();
    await expect(page.locator(`.live-panel ${locator}`).first()).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
  }
});

test("ephemeral examples dismiss, restore and return keyboard focus in every theme", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const route of ["/components", "/playground"]) {
    await page.goto(`${route}?example=ephemeral`);
    const preview = page.locator(route === "/components"
      ? ".component-preview"
      : ".live-panel");
    for (const theme of ["Light", "Ash", "Dark"]) {
      await page.getByRole("button", { name: theme, exact: true }).click();
      await expect(preview.locator(".arcscord-discord-ui")).toHaveAttribute("data-theme", theme.toLowerCase());
      await expect(preview.locator(".dui-ephemeral-notice")).toBeVisible();
      await preview.getByRole("button", { name: "Dismiss message", exact: true }).press("Enter");
      await expect(preview.locator(".dui-message")).toHaveCount(0);
      const restore = preview.getByRole("button", { name: "Restore message", exact: true });
      await expect(restore).toBeFocused();
      await restore.press("Enter");
      await expect(preview.locator(".dui-ephemeral-notice")).toBeVisible();
    }
  }
  await expect(page.locator(".compile-status")).toContainText("Example loaded");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `/tmp/playground-ephemeral-${testInfo.project.name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});

test("restarting local state keeps edited code while reset code can be undone", async ({ page }) => {
  await page.goto("/playground?example=reactions&theme=light");
  const editor = page.getByRole("textbox", { name: "React JSX editor" });
  const edited = `${await editor.inputValue()}\n// Keep this local edit`;
  await editor.fill(edited);
  const preview = page.locator(".live-panel");
  await expect(page.locator(".compile-status")).toContainText("Example loaded");
  await preview.getByRole("button", { name: "arc: 2", exact: true }).click();
  await expect(preview.getByRole("button", { name: "arc: 3", exact: true })).toHaveAttribute("aria-pressed", "true");
  await preview.getByRole("button", { name: "Restart demo", exact: true }).click();
  await expect(preview.getByRole("button", { name: "arc: 2", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(editor).toHaveValue(edited);
  await page.getByRole("button", { name: "Reset code", exact: true }).click();
  expect(await editor.inputValue()).not.toContain("Keep this local edit");
  await expect(preview.locator(".arcscord-discord-ui")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Undo reset", exact: true }).click();
  await expect(editor).toHaveValue(edited);
  await expect(page.getByText("This example has been updated. Your saved code is kept.")).toHaveCount(0);
});

test("legacy drafts survive new examples, incoming themes, update and undo", async ({ page }) => {
  const legacy = "import React from \"react\";\nimport { DiscordUI, MessageContent } from \"@arcscord/discord-ui\";\nconst previewTheme = \"ash\";\nexport default function Preview() { return <DiscordUI theme={previewTheme}><MessageContent content=\"My saved draft\" /></DiscordUI>; }";
  await page.addInitScript((code) => {
    if (!sessionStorage.getItem("legacy-seeded")) {
      sessionStorage.setItem("discord-ui:playground-draft:v1:message-content", JSON.stringify({ code }));
      sessionStorage.setItem("legacy-seeded", "yes");
    }
  }, legacy);
  await page.goto("/playground?example=message-content&theme=light");
  const editor = page.getByRole("textbox", { name: "React JSX editor" });
  await expect(editor).toHaveValue(legacy);
  await expect(page.locator(".live-panel")).toContainText("My saved draft");
  await expect(page.locator(".live-panel .arcscord-discord-ui")).toHaveAttribute("data-theme", "ash");
  await page.getByRole("button", { name: "Load updated example", exact: true }).click();
  await expect(page.locator(".live-panel")).toContainText("A new line, a new thought.");
  await page.reload();
  await page.getByRole("button", { name: "Undo reset", exact: true }).click();
  await expect(editor).toHaveValue(legacy);
  await expect(page.getByText("This example has been updated. Your saved code is kept.")).toBeVisible();
});
