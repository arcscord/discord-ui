import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

function browserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || /hydration.mismatch/iu.test(message.text()))
      errors.push(message.text());
  });
  return errors;
}

test("discovers the four native examples and copies the source that runs", async ({ page, context }) => {
  const errors = browserErrors(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/docs/svelte");
  for (const id of [
    "message",
    "interactions",
    "conversation",
    "themes-and-media",
  ])
    await expect(page.locator(`[data-svelte-demo="${id}"] .arcscord-discord-ui`)).toBeVisible();

  const demo = page.getByRole("region", { name: "Svelte example: message" });
  await expect(demo.getByText("North Ridge Trail", { exact: true })).toBeVisible();
  await expect(demo.getByRole("img", { name: "Mountain ridge at dusk" })).toBeVisible();
  await expect(demo.locator(".dui-code-block .hljs-keyword")).toHaveText("const");
  await demo.getByRole("button", { name: "Reveal spoiler" }).press("Enter");
  await expect(demo.getByRole("button", { name: "Hide spoiler" })).toBeFocused();

  const source = await readFile(new URL("../../apps/website/src/examples/svelte/message.svelte", import.meta.url), "utf8");
  const block = demo.locator(".theme-code-block");
  await block.getByRole("button", { name: "Copy code" }).click({ force: true });
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(source.trimEnd());

  await page.getByRole("link", { name: "Svelte API reference", exact: true }).last().click();
  await expect(page.getByRole("heading", { name: "Svelte API reference", exact: true })).toBeVisible();
  await expect(page.locator("h2#threadpanel")).toContainText("ThreadPanel");
  expect(errors).toEqual([]);
});

test("reports selection context and reacts to controlled application updates", async ({ page }) => {
  const errors = browserErrors(page);
  await page.goto("/docs/svelte#components-v2-and-interactions");
  const demo = page.getByRole("region", { name: "Svelte example: interactions" });
  const combo = demo.getByRole("combobox", { name: "Choose topics" });
  await expect(combo).toHaveText("Choose topics");
  await combo.press("ArrowDown");
  await expect(demo.getByRole("option", { name: "Maps" })).toHaveAttribute("aria-selected", "false");
  await combo.press("Enter");
  await expect(demo.getByText("Topics in trail-poll: maps")).toBeVisible();
  await combo.press("Escape");
  await expect(combo).toBeFocused();
  await expect(demo.getByRole("listbox")).toHaveCount(0);

  await combo.click();
  await demo.getByRole("option", { name: "Gear" }).click();
  await expect(combo).toContainText("Maps, Gear");
  await demo.getByRole("button", { name: "Submit vote" }).click();
  await expect(demo.getByText("Vote submitted for trail-poll")).toBeVisible();
  await expect(demo.getByRole("listbox")).toHaveCount(0);
  await demo.getByRole("button", { name: "👍: 1" }).click();
  await expect(demo.getByRole("button", { name: "👍: 2" })).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

test("sends messages, preserves history position and restores thread and composer focus", async ({ page }) => {
  const errors = browserErrors(page);
  await page.goto("/docs/svelte#channels-slash-commands-and-threads");
  const demo = page.getByRole("region", { name: "Svelte example: conversation" });
  const history = demo.getByRole("log", { name: "Messages", exact: true });
  const composer = demo.getByRole("textbox", { name: "Message #trail", exact: true });
  const threadButton = demo.getByRole("button", { name: /Open thread Route planning/ });
  await expect.poll(() => history.evaluate(el => el.scrollHeight - el.scrollTop - el.clientHeight)).toBeLessThan(4);
  await history.evaluate(el => el.scrollTop = 0);
  await expect.poll(() => history.evaluate(el => el.scrollTop)).toBe(0);
  await composer.fill("First local message");
  await composer.press("Enter");
  await expect(history.getByText("First local message")).toHaveCount(1);
  await expect.poll(() => history.evaluate(el => el.scrollTop)).toBe(0);

  await threadButton.press("Enter");
  const panel = demo.getByRole("complementary", { name: "Thread : Route planning" });
  const close = panel.getByRole("button", { name: "Close thread" });
  await expect(close).toBeFocused();
  const reply = panel.getByRole("textbox", { name: "Message #Route planning" });
  await reply.fill("Local thread reply");
  await reply.press("Enter");
  await expect(panel.getByText("Local thread reply", { exact: true })).toBeVisible();
  await reply.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(threadButton).toBeFocused();

  await composer.fill("/ec");
  await expect(demo.getByRole("option", { name: /echo/ })).toBeVisible();
  await composer.press("Enter");
  const options = demo.getByRole("button", { name: "Options" });
  await expect(options).toBeFocused();
  await options.press("Enter");
  const text = demo.getByRole("textbox", { name: "text", exact: true });
  await expect(text).toBeFocused();
  await text.fill("Lookout");
  await options.click();
  const priority = demo.getByRole("combobox", { name: "priority" });
  await expect(priority).toBeFocused();
  await priority.fill("hi");
  await priority.press("Enter");
  await demo.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(demo.getByText("Command: echo / Lookout / high")).toBeVisible();
  await expect(composer).toBeFocused();
  await expect.poll(() => demo.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThan(4);
  expect(errors).toEqual([]);
});

test("switches all three themes and applies a reactive media policy", async ({ page }) => {
  let requests = 0;
  await page.route("https://ui.arcscord.dev/examples/landscape.svg", async (route) => {
    requests++;
    await route.fulfill({
      contentType: "image/svg+xml",
      path: new URL("../../apps/website/static/examples/landscape.svg", import.meta.url).pathname,
    });
  });
  await page.goto("/docs/svelte#themes-and-media-policy");
  const demo = page.getByRole("region", { name: "Svelte example: themes-and-media" });
  const wrapper = demo.locator(".arcscord-discord-ui").first();
  await expect(demo.getByRole("img", { name: "Média indisponible: Remote mountain illustration" })).toBeVisible();
  expect(requests).toBe(0);
  for (const base of ["light", "dark", "ash"]) {
    await demo.getByLabel("Base theme").selectOption(base);
    await expect(wrapper).toHaveAttribute("data-theme", "ridge");
    await expect(wrapper).toHaveAttribute("data-base-theme", base);
  }
  await demo.getByLabel("Allow remote media").check();
  await expect(demo.locator("img[alt='Remote mountain illustration']")).toBeVisible();
  await expect.poll(() => requests).toBe(1);
  await demo.getByLabel("Allow remote media").uncheck();
  await expect(demo.getByRole("img", { name: "Média indisponible: Remote mountain illustration" })).toBeVisible();
  await expect(demo.locator("img[alt='Remote mountain illustration']")).toHaveCount(0);
});
