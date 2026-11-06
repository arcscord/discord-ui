import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const guides = [
  ["messages", "Messages and replies", "Messages"],
  ["markdown", "Markdown, mentions and emoji", "Markdown"],
  ["embeds", "Embeds", "Embeds"],
  ["media", "Media, galleries and files", "Media"],
  ["components-v2", "Components V2", "ComponentsV2"],
  ["interactions", "Buttons and select menus", "Interactions"],
  ["reactions", "Reactions", "Reactions"],
  ["channels", "Channels and message history", "Channels"],
  ["composer", "Composer and slash commands", "Composer"],
  ["threads", "Threads", "Threads"],
  ["themes", "Themes and customization", "Themes"],
  ["localization", "Localization and timestamps", "Localization"],
  ["ssr", "SSR and hydration", "SSR"],
  ["accessibility", "Accessibility", "Accessibility"],
] as const;

test("all feature guides hydrate with an exact copyable module and no page overflow", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(message.text());
  });
  for (const [slug, title, name] of guides) {
    const response = await page.goto(`/docs/guides/${slug}`);
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle(new RegExp(title));
    await expect(page.locator("article h1")).toHaveText(title);
    await expect(page.locator("html")).toHaveAttribute("data-has-hydrated", "true");
    await expect(page.locator("article .arcscord-discord-ui").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    const block = page.locator("article div[class*='codeBlockContainer']");
    await block.hover();
    await block.getByRole("button", { name: /Copy code/ }).click({ force: true });
    const source = await readFile(new URL(`../../apps/website/src/components/docs/guides/${name}.tsx`, import.meta.url), "utf8");
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(source.trimEnd());
    await expect(page.locator("article").getByRole("link", { name: "edit the full catalogue module", exact: true })).toHaveCount(["messages", "themes", "ssr"].includes(slug)
      ? 0
      : 1);
  }
  expect(errors).toEqual([]);
});

test("guides retain old topic anchors and expose dedicated documents", async ({ page }) => {
  await page.goto("/docs/guides#buttons-and-select-menus");
  const heading = page.locator("#buttons-and-select-menus");
  await expect(heading).toBeVisible();
  await page.locator("article").getByRole("link", { name: "Read the buttons and select menus guide", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/guides\/interactions$/);
  const menu = page.locator("article").getByRole("combobox", { name: "Make a selection", exact: true });
  await menu.press("ArrowDown");
  await menu.press("Enter");
  await expect(page.locator("article").getByRole("status")).toHaveText("Selected: news");
  await menu.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
});

test("documented local message sends, reactions and V2 button handlers change the preview", async ({ page }) => {
  await page.goto("/docs/guides/channels");
  const input = page.locator("article").getByRole("textbox", { name: "Message #support", exact: true });
  await input.fill("Message from the documentation");
  await input.press("Enter");
  await expect(page.locator("article .dui-message")).toContainText("Message from the documentation");
  await expect(input).toHaveValue("");
  await page.goto("/docs/guides/reactions");
  const reaction = page.locator("article").getByRole("button", { name: "👍: 3", exact: true });
  await reaction.press("Enter");
  await expect(page.locator("article").getByRole("button", { name: "👍: 4", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.goto("/docs/guides/components-v2");
  await page.locator("article").getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.locator("article").getByRole("status")).toHaveText("layout: approve");
});

test("controlled thread navigation restores focus and theme previews remain independent", async ({ page }, testInfo) => {
  await page.goto("/docs/guides/threads");
  const opener = page.locator("article").getByRole("button", { name: /Open thread Setup help/ });
  await opener.click();
  const panel = page.locator("article .dui-thread-panel");
  await expect(panel).toContainText("Start with the quick start guide.");
  await expect(panel.getByRole("button", { name: "Close thread" })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await panel.getByRole("button", { name: "Close thread" }).press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(opener).toBeFocused();
  await page.goto("/docs/guides/themes");
  const scopes = page.locator("article .arcscord-discord-ui");
  for (const theme of ["light", "ash", "dark"]) {
    await page.locator("article").getByRole("combobox", { name: "Preview theme" }).selectOption(theme);
    await expect(scopes.nth(0)).toHaveAttribute("data-theme", theme);
    await expect(scopes.nth(1)).toHaveAttribute("data-theme", "violet");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
  await page.locator("article").getByRole("combobox", { name: "Preview theme" }).selectOption("light");
  await page.screenshot({ path: `/tmp/discord-ui-guides-${testInfo.project.name}.png` });
});

test("translated spoilers, media concealment and application status updates work by keyboard", async ({ page }) => {
  await page.goto("/docs/guides/localization");
  const translated = page.locator("article").getByRole("button", { name: "Révéler le contenu" });
  await translated.press("Enter");
  await expect(page.locator("article").getByRole("button", { name: "Masquer le contenu" })).toHaveAttribute("aria-expanded", "true");
  await page.goto("/docs/guides/media");
  const scope = page.locator("article .arcscord-discord-ui");
  await expect(scope.getByRole("img", { name: "Hidden mountain landscape" })).toHaveCount(0);
  await expect(scope.getByRole("link", { name: "report.pdf", exact: true })).toHaveCount(0);
  await scope.getByRole("button", { name: "Reveal spoiler", exact: true }).first().press("Enter");
  await expect(scope.getByRole("img", { name: "Hidden mountain landscape" })).toBeVisible();
  await page.goto("/docs/guides/accessibility");
  await page.locator("article").getByRole("button", { name: "Confirm review" }).press("Enter");
  await expect(page.locator("article").getByRole("status")).toHaveText("Review confirmed locally.");
});

test("documented command arguments invoke locally and ephemeral messages follow host state", async ({ page }) => {
  await page.goto("/docs/guides/composer");
  const preview = page.locator("article .arcscord-discord-ui");
  const input = preview.getByRole("textbox", { name: "Message #support", exact: true });
  await input.fill("/welcome");
  await input.press("Enter");
  await expect(preview.getByRole("button", { name: "Send message", exact: true })).toBeDisabled();
  await preview.getByRole("option", { name: /^audience / }).click();
  await preview.getByRole("option", { name: "Members", exact: true }).click();
  await preview.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(preview.getByRole("status")).toHaveText("/welcome: members");
  await expect(input).toHaveValue("");
  await page.goto("/docs/guides/messages");
  await page.locator("article").getByRole("button", { name: "Dismiss message", exact: true }).click();
  await expect(page.locator("article .dui-message")).toHaveCount(0);
  await page.locator("article").getByRole("button", { name: "Restore preview", exact: true }).press("Enter");
  await expect(page.locator("article .dui-message")).toContainText("Your preview is ready.");
});
