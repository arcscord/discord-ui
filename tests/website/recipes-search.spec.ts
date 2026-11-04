import { expect, test } from "@playwright/test";

const recipes = [
  ["transcript", "recipe-transcript", "Read-only transcript"],
  ["interactive-preview", "recipe-interactive-preview", "Interactive message preview"],
  ["controlled-selections", "recipe-controlled-selections", "Controlled selections"],
  ["local-channel", "recipe-local-channel", "Channel with local messages"],
  ["channel-threads", "recipe-channel-threads", "Channel with threads"],
  ["local-commands", "recipe-local-commands", "Local slash-command demo"],
  ["theme-labels", "recipe-theme-labels", "Custom theme and translated labels"],
] as const;

test("all recipes expose the same working module as the playground with no hydration errors", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(message.text());
  });
  for (const [slug, id, title] of recipes) {
    expect((await page.goto(`/docs/recipes/${slug}`))?.ok()).toBe(true);
    await expect(page.locator("article h1")).toHaveText(title);
    await expect(page.locator("html")).toHaveAttribute("data-has-hydrated", "true");
    const example = page.locator("article .reference-example");
    await expect(example.locator("details")).toHaveAttribute("open", "");
    await expect(example.locator(".component-sample")).toBeVisible();
    for (const theme of ["light", "ash", "dark"]) {
      await example.getByRole("button", { name: theme[0]!.toUpperCase() + theme.slice(1), exact: true }).click();
      await expect(example.locator(".component-sample > .arcscord-discord-ui")).toHaveAttribute("data-theme", theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), slug).toBe(false);
    }
    const block = example.locator("div[class*='codeBlockContainer']");
    await block.hover();
    await block.getByRole("button", { name: /Copy code/ }).click({ force: true });
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    await expect(example.getByRole("link", { name: "Open in playground", exact: true })).toHaveAttribute("href", `/playground?example=${id}&theme=dark`);
    await example.getByRole("link", { name: "Open in playground", exact: true }).click();
    await expect.poll(async () => (await page.getByRole("textbox", { name: "React JSX editor" }).inputValue()).trimEnd()).toBe(copied);
  }
  expect(errors).toEqual([]);
});

test("recipe selections remain isolated across messages and approval updates the snapshot", async ({ page }) => {
  await page.goto("/docs/recipes/controlled-selections");
  const preview = page.locator("article .component-sample");
  const alpha = preview.getByRole("combobox", { name: "Topics for alpha" });
  await alpha.press("ArrowDown");
  await alpha.press("Enter");
  await alpha.press("Escape");
  await expect(preview.getByRole("status")).toHaveText("{\"alpha\":{\"topics\":[\"news\"]},\"beta\":{\"topics\":[]}}");
  const beta = preview.getByRole("combobox", { name: "Topics for beta" });
  await beta.click();
  await preview.getByRole("option", { name: "Events", exact: true }).click();
  await beta.press("Escape");
  await expect(preview.getByRole("status")).toHaveText("{\"alpha\":{\"topics\":[\"news\"]},\"beta\":{\"topics\":[\"events\"]}}");
  await preview.getByRole("button", { name: "Clear both selections" }).click();
  await expect(preview.getByRole("status")).toHaveText("{\"alpha\":{\"topics\":[]},\"beta\":{\"topics\":[]}}");
  await page.goto("/docs/recipes/interactive-preview");
  const interactive = page.locator("article .component-sample");
  await interactive.getByRole("button", { name: "Approve", exact: true }).press("Enter");
  await expect(interactive.getByRole("status")).toHaveText("Review approved locally");
  await expect(interactive.getByRole("button", { name: "Approve", exact: true })).toBeDisabled();
  await interactive.getByRole("button", { name: "👍: 2", exact: true }).press("Enter");
  await expect(interactive.getByRole("button", { name: "👍: 3", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("local channel and thread recipes append messages and synchronize thread summaries", async ({ page }) => {
  await page.goto("/docs/recipes/transcript");
  await expect(page.locator("article .component-sample").getByRole("textbox")).toHaveCount(0);
  await expect(page.locator("article .component-sample").getByRole("link", { name: "welcome-config.json", exact: true })).toBeVisible();
  await page.goto("/docs/recipes/local-channel");
  const input = page.locator("article .component-sample").getByRole("textbox", { name: "Message #local-help", exact: true });
  await input.fill("A local recipe message");
  await input.press("Enter");
  await expect(page.locator("article .dui-message").last()).toContainText("A local recipe message");
  await expect(input).toHaveValue("");
  await page.goto("/docs/recipes/channel-threads");
  const opener = page.locator("article .component-sample").getByRole("button", { name: /Open thread Setup checklist/ });
  await opener.click();
  const panel = page.locator("article .dui-thread-panel");
  await panel.getByRole("textbox").fill("Step complete");
  await panel.getByRole("textbox").press("Enter");
  await expect(panel).toContainText("Step complete");
  await panel.getByRole("button", { name: "Close thread" }).press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(opener).toContainText("2 messages");
  await expect(opener).toContainText("Step complete");
});

test("local command responses and translated theme labels are functional", async ({ page }) => {
  await page.goto("/docs/recipes/local-commands");
  const preview = page.locator("article .component-sample");
  const input = preview.getByRole("textbox", { name: "Message #commands", exact: true });
  await input.fill("/greet");
  await input.press("Enter");
  await preview.getByRole("option", { name: /^name / }).click();
  await preview.getByRole("textbox", { name: "name", exact: true }).fill("Sam");
  await preview.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(preview.locator(".dui-message")).toContainText("Hello, Sam! This response is local.");
  await expect(preview.locator(".dui-interaction-command")).toHaveText("/greet");
  await page.goto("/docs/recipes/theme-labels");
  const translated = page.locator("article .component-sample");
  await expect(translated).toContainText("(modifié)");
  await translated.getByRole("button", { name: "Révéler le contenu", exact: true }).press("Enter");
  await expect(translated.getByRole("button", { name: "Masquer le contenu", exact: true })).toHaveAttribute("aria-expanded", "true");
  await translated.getByRole("button", { name: "Masquer le message", exact: true }).click();
  await expect(translated.locator(".dui-message")).toHaveCount(0);
  await translated.getByRole("button", { name: "Restaurer le message", exact: true }).press("Enter");
  await expect(translated.locator(".dui-message")).toBeVisible();
});

test("local search handles deep links, keyboard navigation, empty and missing queries", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(message.text());
  });
  await page.goto("/search?q=SelectMenu");
  await expect(page).toHaveTitle(/Search documentation/);
  const input = page.getByRole("searchbox", { name: "Search the documentation" });
  await expect(input).toHaveValue("SelectMenu");
  const result = page.locator(".docs-search-results a").first();
  await expect(result).toHaveAttribute("href", "/docs/api/interactive-components#selectmenu");
  await input.fill("controlled selections");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=controlled%20selections$/);
  await expect(page.locator(".docs-search-results a[href^='/docs/recipes/controlled-selections']").first()).toBeVisible();
  await page.screenshot({ path: `/tmp/discord-ui-search-${testInfo.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await input.fill("nothingmatchesqzxv");
  await expect(page.getByRole("status")).toContainText("No results");
  await input.fill("");
  await expect(page.getByRole("status")).toContainText("Enter a term");
  await input.fill("SelectMenu");
  await result.focus();
  await result.press("Enter");
  await expect(page).toHaveURL(/\/docs\/api\/interactive-components#selectmenu$/);
  await expect(page.locator("#selectmenu")).toBeVisible();
  expect(errors).toEqual([]);
});

test("search reaches recipes and project policy sections and old directory fragments remain valid", async ({ page }) => {
  for (const query of ["thread replies", "compatibility limitations", "migration policy"]) {
    await page.goto(`/search?q=${encodeURIComponent(query)}`);
    const link = page.locator(".docs-search-results a").first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
    const fragment = href!.split("#")[1];
    if (fragment)
      await expect(page.locator(`[id="${fragment}"]`)).toHaveCount(1);
    else await expect(page.locator("article h1")).toBeVisible();
  }
  await page.goto("/docs/recipes#controlled-selections");
  await expect(page.locator("#controlled-selections")).toBeVisible();
  await page.goto("/docs/project#compatibility-and-limitations");
  await expect(page.locator("#compatibility-and-limitations")).toBeVisible();
});
