import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const pages = [
  ["entry-points", "Public entry points"],
  ["display-components", "Display components"],
  ["interactive-components", "Interactive components"],
  ["conversation-components", "Conversation components"],
  ["models", "Serializable models"],
  ["callbacks", "Interaction callbacks"],
  ["themes", "Theme helpers and tokens"],
  ["highlight", "Optional syntax highlighting"],
] as const;

test("every public API destination and symbol anchor loads without overflow or hydration errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(message.text());
  });
  const map = await readFile(new URL("../../apps/website/documentation-api-map.md", import.meta.url), "utf8");
  for (const [slug, title] of pages) {
    const response = await page.goto(`/docs/api/${slug}`);
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle(new RegExp(title));
    await expect(page.locator("article h1")).toHaveText(title);
    await expect(page.locator("html")).toHaveAttribute("data-has-hydrated", "true");
    const anchors = [
      ...map.matchAll(new RegExp(`/docs/api/${slug}#([a-z0-9]+)`, "g")),
    ].map(match => match[1]!);
    for (const anchor of anchors)
      await expect(page.locator(`article [id="${anchor}"]`)).toHaveCount(1);
    const table = page.locator("article .api-reference-page table").first();
    if (await table.count()) {
      expect(await table.locator("td").first().evaluate(cell => cell.getBoundingClientRect().width)).toBeGreaterThanOrEqual(140);
      if ((page.viewportSize()?.width ?? 0) < 640)
        expect(await table.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), slug).toBe(false);
  }
  await page.goto("/docs/playground");
  await expect(page.locator("article h1")).toHaveText("Using the playground");
  await expect(page.locator("article")).toContainText("not a secure sandbox");
  expect(errors).toEqual([]);
});

test("reference uses canonical code, keeps themes aligned and opens the matching editable module", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/components?example=button");
  await page.getByRole("button", { name: "Light", exact: true }).click();
  const catalogueBlock = page.locator(".explorer-content div[class*='codeBlockContainer']");
  await catalogueBlock.hover();
  await catalogueBlock.getByRole("button", { name: /Copy code/ }).click({ force: true });
  const catalogueCode = await page.evaluate(() => navigator.clipboard.readText());
  await page.getByRole("navigation", { name: "Example documentation" }).getByRole("link", { name: "API reference", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/api\/interactive-components#button$/);
  const example = page.getByRole("region", { name: "Button canonical example", exact: true });
  await example.locator("summary").press("Enter");
  await example.getByRole("button", { name: "Light", exact: true }).click();
  await expect(example.locator(".arcscord-discord-ui")).toHaveAttribute("data-theme", "light");
  await expect(example.locator("pre")).toContainText("const previewTheme = \"light\"");
  await example.getByRole("button", { name: "success", exact: true }).click();
  await expect(example.getByRole("status")).toHaveText("success");
  const block = example.locator("div[class*='codeBlockContainer']");
  await block.hover();
  await block.getByRole("button", { name: /Copy code/ }).click({ force: true });
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(catalogueCode!.trimEnd());
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await example.locator("summary").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `/tmp/discord-ui-api-${testInfo.project.name}.png` });
  await example.getByRole("link", { name: "Open in playground", exact: true }).click();
  await expect(page).toHaveURL(/\/playground\?example=button&theme=light$/);
  const editor = page.getByRole("textbox", { name: "React JSX editor" });
  await expect.poll(async () => (await editor.inputValue()).trimEnd()).toBe(catalogueCode.trimEnd());
});

test("playground documentation links preserve edited drafts and point to the selected component", async ({ page }) => {
  await page.goto("/playground?example=select-menu");
  const editor = page.getByRole("textbox", { name: "React JSX editor" });
  const changed = `${await editor.inputValue()}\n// A documentation navigation draft`;
  await editor.fill(changed);
  const links = page.getByRole("navigation", { name: "Example documentation" });
  await expect(links.getByRole("link", { name: "Usage guide", exact: true })).toHaveAttribute("href", "/docs/guides/interactions");
  await links.getByRole("link", { name: "API reference", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/api\/interactive-components#selectmenu$/);
  await page.goBack();
  await expect(editor).toHaveValue(changed);
  await page.getByRole("navigation", { name: "Example documentation" }).getByRole("link", { name: "Playground help", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/playground$/);
});

test("guide links resolve concrete component references and the optional highlighter renders", async ({ page }) => {
  await page.goto("/docs/guides/interactions");
  await page.locator("article").getByRole("link", { name: "Message", exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/api\/display-components#message$/);
  await expect(page.locator("#message")).toHaveText("Message");
  await page.goto("/docs/api/highlight");
  await expect(page.locator("article .arcscord-discord-ui .hljs-keyword")).toContainText("const");
  await expect(page.locator("article")).toContainText("not supported as a runtime playground import");
});
