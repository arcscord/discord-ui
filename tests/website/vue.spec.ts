import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

async function fixture(page: import("@playwright/test").Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || /hydration.*mismatch/iu.test(message.text()))
      errors.push(message.text());
  });
  const response = await page.goto("/generated/vue-ssr/index.html");
  expect(response?.ok()).toBe(true);
  expect(await response!.text()).toContain("Vue SSR and hydration fixture");
  expect(await response!.text()).toContain("dui-channel-history");
  await expect(page.locator("html")).toHaveAttribute("data-vue-hydrated", "true");
  return errors;
}

test("Vue shared fixtures hydrate, update themes and preserve controlled message context", async ({ page }, info) => {
  const errors = await fixture(page);
  const controlled = page.getByRole("region", { name: "Controlled message", exact: true });
  // Sections have accessible names and serve as independently scoped fixtures.
  await controlled.getByRole("button", { name: "Wave", exact: true }).click();
  await expect(controlled.getByRole("status")).toContainText("1 waves; controlled:wave");
  await controlled.getByRole("button", { name: "👋: 1", exact: true }).click();
  await expect(controlled.getByRole("button", { name: "👋: 2", exact: true })).toHaveAttribute("aria-pressed", "true");
  const select = controlled.getByRole("combobox");
  await select.focus();
  await select.press("ArrowDown");
  await select.press("Enter");
  await expect(controlled.getByRole("status")).toContainText("controlled:pick:a");
  await expect(select).toContainText("Alpha");
  const first = page.getByRole("region", { name: "All shared fixtures", exact: true });
  await expect(first.locator(".dui-message")).toHaveCount(8);
  for (const theme of ["light", "ash", "dark"]) {
    await page.getByRole("navigation", { name: "Fixture controls" }).getByRole("button", { name: theme, exact: true }).click();
    await expect(page.locator(".arcscord-discord-ui").first()).toHaveAttribute("data-theme", theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await controlled.screenshot({ path: `/tmp/discord-ui-vue-${info.project.name}-${theme}.png` });
  }
  expect(errors).toEqual([]);
});

test("Vue menus support all kinds, constraints, identity reset, focus dismissal and disabled updates", async ({ page }) => {
  const errors = await fixture(page);
  for (const kind of [
    "string-select",
    "user-select",
    "role-select",
    "mentionable-select",
    "channel-select",
  ]) {
    const region = page.locator(`[data-menu-kind="${kind}"]`);
    const combo = region.getByRole("combobox");
    await combo.focus();
    await combo.press("ArrowDown");
    await expect(region.getByRole("listbox")).toBeVisible();
    await combo.press("Escape");
    await expect(region.getByRole("listbox")).toHaveCount(0);
    await expect(combo).toBeFocused();
  }
  const topics = page.locator("[data-menu-kind=\"string-select\"]");
  await topics.getByRole("combobox").click();
  for (let count = 0; count < 2; count++)
    await topics.locator("[role=\"option\"][aria-selected=\"false\"]").first().click();
  const maximum = await topics.locator("output").textContent();
  expect(JSON.parse(maximum!)).toHaveLength(3);
  await topics.locator("[role=\"option\"][aria-disabled=\"true\"]").first().click({ force: true });
  await expect(topics.locator("output")).toHaveText(maximum!);
  await topics.getByRole("combobox").press("Escape");
  const users = page.locator("[data-menu-kind=\"user-select\"]");
  await users.getByRole("combobox").fill("ines");
  await expect(users.getByRole("listbox").getByRole("option")).toHaveCount(1);
  await users.getByRole("listbox").getByRole("option").click();
  await expect(users.locator("output")).toContainText("ines");
  await users.getByRole("combobox").focus();
  await users.getByRole("combobox").press("Backspace");
  await expect(users.locator("output")).not.toContainText("ines");
  await page.getByRole("navigation").getByRole("button", { name: "Toggle disabled" }).click();
  for (const combo of await page.getByRole("region", { name: "All menu kinds", exact: true }).getByRole("combobox").all()) await expect(combo).toBeDisabled();
  const identity = page.getByRole("region", { name: "Selection identity", exact: true });
  await expect(identity.getByRole("combobox")).toContainText("Alpha");
  await identity.getByRole("button", { name: "Remove Alpha", exact: true }).click();
  await expect(identity.getByRole("combobox")).not.toContainText("Alpha");
  await identity.getByRole("button", { name: "Replace menu", exact: true }).click();
  await expect(identity.getByRole("combobox")).toContainText("Alpha");
  await identity.getByRole("combobox").click();
  await identity.getByRole("button", { name: "Replace menu", exact: true }).focus();
  await expect(identity.getByRole("listbox")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("Vue channel sends, controlled threads, Escape focus and slash arguments work after hydration", async ({ page }) => {
  const errors = await fixture(page);
  const channel = page.getByRole("region", { name: "Controlled conversation", exact: true });
  const input = channel.getByRole("textbox", { name: "Message #exemple", exact: true });
  await input.fill("Hello Vue channel");
  await input.press("Enter");
  await expect(channel.locator(".dui-message-text").filter({ hasText: "Hello Vue channel" })).toBeVisible();
  await expect(input).toHaveValue("");
  const opener = channel.getByRole("button", { name: /Open thread paysage/u });
  await opener.click();
  const thread = channel.locator(".dui-thread-panel");
  await expect(thread).toBeVisible();
  await expect(thread.getByRole("button", { name: "Close thread" })).toBeFocused();
  const reply = thread.getByRole("textbox", { name: "Message #paysage", exact: true });
  await reply.fill("Hello Vue thread");
  await reply.press("Enter");
  await expect(thread).toContainText("Hello Vue thread");
  await reply.press("Escape");
  await expect(thread).toHaveCount(0);
  await expect(opener).toBeFocused();
  await input.fill("/echo");
  await input.press("Enter");
  await channel.getByRole("option", { name: "text Text to echo" }).click();
  await channel.getByRole("textbox", { name: "text", exact: true }).fill("Typed argument");
  await channel.getByRole("button", { name: "Options", exact: true }).click();
  await channel.getByRole("option", { name: "Loud", exact: true }).click();
  await channel.getByRole("textbox", { name: "text", exact: true }).press("Enter");
  await expect(channel.getByRole("status")).toContainText("echo:{\"text\":\"Typed argument\",\"mode\":\"loud\"}");
  const standalone = page.getByRole("region", { name: "Standalone composer", exact: true });
  await expect(standalone).toContainText("Leading");
  await expect(standalone).toContainText("Trailing");
  expect(errors).toEqual([]);
});

test("Vue keeps the reading position on updates with the same messages", async ({ page }) => {
  await fixture(page);
  const channel = page.getByRole("region", { name: "Controlled conversation", exact: true });
  const history = channel.getByRole("log", { name: "Messages", exact: true }).first();
  await expect.poll(() => history.evaluate(node => node.scrollTop)).toBeGreaterThan(30);
  const position = await history.evaluate(async (node) => {
    node.scrollTop = 30;
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    return node.scrollTop;
  });
  expect(position).toBe(30);

  await page.getByRole("button", { name: "Toggle disabled", exact: true }).click();
  const menus = page.getByRole("region", { name: "All menu kinds", exact: true });
  await expect(menus.getByRole("combobox").first()).toBeDisabled();
  await expect.poll(() => history.evaluate(node => node.scrollTop)).toBe(position);
});

test("Vue docs mount real examples and preserve their public SFC source", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/docs/vue");
  await expect(page).toHaveTitle(/Vue/);
  const demo = page.locator("[data-vue-demo=\"interactions\"]");
  await demo.getByRole("button", { name: "Wave", exact: true }).click();
  await expect(demo.getByRole("status").filter({ hasText: "Waves:" })).toContainText("Waves: 1");
  const conversation = page.locator("[data-vue-demo=\"conversation\"]");
  await conversation.getByRole("button", { name: /Open thread Discussion/ }).click();
  await expect(conversation.locator(".dui-thread-panel")).toBeVisible();
  await expect(page.locator("article").first()).toContainText("v-model:values=\"selections\"");
  const source = page.locator("article code").filter({ hasText: "const selections = ref<string[]>([])" });
  await expect(source).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("Vue examples are discoverable and the media allowlist toggles a local image", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/playground");
  await expect(page.getByRole("link", { name: "browse interactive Vue examples" })).toHaveAttribute("href", "/docs/vue#examples");
  await page.goto("/components");
  await page.getByRole("link", { name: "Browse Vue examples" }).click();
  await page.getByRole("link", { name: "Media and emoji", exact: true }).click();

  const preview = page.locator("[data-vue-demo=\"media-policy\"]");
  const image = preview.getByRole("img", { name: ":arc:", exact: true });
  const toggle = preview.getByRole("checkbox", { name: "Enable the image allowlist" });
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
  await expect(preview.locator(".dui-avatar")).toHaveText("B");
  await toggle.uncheck();
  await expect(image).toHaveCount(0);
  await expect(preview.locator(".dui-emoji-fallback")).toHaveText(":arc:");
  await toggle.check();
  await expect(image).toBeVisible();
  const block = page.locator("article div[class*='codeBlockContainer']").filter({
    has: page.getByText("media-policy.vue", { exact: true }),
  });
  await block.hover();
  await block.getByRole("button", { name: /Copy code/ }).click({ force: true });
  const source = await readFile(new URL("../../apps/website/src/examples/vue/media-policy.vue", import.meta.url), "utf8");
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(source.trimEnd());
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("Vue themes example changes the inherited preset and locale", async ({ page }) => {
  await page.goto("/docs/vue/themes");
  const preview = page.locator("[data-vue-demo=\"themes-and-localization\"]");
  const root = preview.locator(".arcscord-discord-ui");
  await expect(root).toHaveAttribute("data-base-theme", "ash");
  await preview.getByLabel("Base theme").selectOption("light");
  await expect(root).toHaveAttribute("data-base-theme", "light");
  await preview.getByLabel("Base theme").selectOption("dark");
  await expect(root).toHaveAttribute("data-base-theme", "dark");
  await preview.getByLabel("Locale").selectOption("fr-CH");
  await expect(preview.getByText("(modifié)", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("Vue local emoji recover failures before hydration and spoilers reveal locally", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", (message) => {
    if (/hydration.*mismatch/iu.test(message.text()))
      errors.push(message.text());
  });
  await page.route("**/examples/twemoji/1f44b.svg", route => route.abort());
  await page.goto("/generated/vue-ssr/index.html");
  await expect(page.locator("html")).toHaveAttribute("data-vue-hydrated", "true");
  const emoji = page.getByRole("region", { name: "Local emoji", exact: true });
  await expect(emoji.locator("img")).toHaveCount(0);
  await expect(emoji).toContainText("👋");
  const spoilers = page.getByRole("region", { name: "All shared fixtures", exact: true }).getByRole("button", { name: "Reveal spoiler", exact: true });
  await spoilers.first().click();
  await expect(page.getByRole("button", { name: "Hide spoiler", exact: true }).first()).toHaveAttribute("aria-expanded", "true");
  expect(errors).toEqual([]);
});
