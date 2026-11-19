import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const frameworks = ["react", "vue", "svelte"] as const;
const names = { react: "React", vue: "Vue", svelte: "Svelte" };

async function ready(page: Page): Promise<void> {
  for (const framework of frameworks)
    await expect(page.locator(`[data-framework="${framework}"]`)).toHaveAttribute("data-status", "ready");
}

function fixture(page: Page, framework: typeof frameworks[number]) {
  return page.frameLocator(`#${framework}-viewport`);
}

function panel(page: Page, framework: typeof frameworks[number]) {
  return page.getByRole("region", { name: `${names[framework]} preview`, exact: true });
}

test("loads identical classic fixtures, local events, themes and locale without document overflow", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(message.text());
  });
  await page.goto("/");
  await expect(page).toHaveTitle(/Framework comparison/);
  await expect(page.getByRole("heading", { name: "Framework comparison", exact: true })).toBeVisible();
  await ready(page);
  for (const framework of frameworks) {
    const frame = fixture(page, framework);
    await expect(frame.getByText("Trail notes", { exact: true })).toBeVisible();
    await expect(frame.getByText("(edited)", { exact: true })).toBeVisible();
    await expect(page.locator(`#${framework}-viewport`)).toHaveJSProperty("clientWidth", 390);
    await expect(page.locator(`#${framework}-viewport`)).toHaveJSProperty("clientHeight", 844);
    const spoiler = frame.getByRole("button", { name: "Reveal spoiler", exact: true });
    await spoiler.press("Enter");
    await expect(frame.getByRole("button", { name: "Hide spoiler", exact: true })).toBeFocused();
    await frame.getByRole("button", { name: "Hide spoiler", exact: true }).press("Enter");
  }
  await fixture(page, "react").getByRole("button", { name: "👋: 1", exact: true }).click();
  await expect(fixture(page, "react").getByRole("button", { name: "👋: 2", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(fixture(page, "vue").getByRole("button", { name: "👋: 1", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(panel(page, "react").getByLabel("React native events")).toContainText("\"args\":[\"classic\",\"wave\"]");
  for (const theme of ["light", "ash", "dark"]) {
    await page.getByRole("combobox", { name: "Theme", exact: true }).selectOption(theme);
    await ready(page);
    for (const framework of frameworks)
      await expect(fixture(page, framework).locator(".arcscord-discord-ui")).toHaveAttribute("data-theme", theme);
    await page.locator(".comparison-scroll").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/discord-ui-compare-${info.project.name}-${theme}.png` });
  }
  await page.getByRole("combobox", { name: "Locale", exact: true }).selectOption("fr-FR");
  await ready(page);
  for (const framework of frameworks)
    await expect(fixture(page, framework).getByText("(modifié)", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset all previews" }).click();
  await ready(page);
  for (const framework of frameworks) {
    await expect(fixture(page, framework).getByRole("button", { name: "👋: 1", exact: true })).toHaveAttribute("aria-pressed", "false");
    await expect(panel(page, framework).getByLabel(`${names[framework]} native events`)).toHaveText("No events");
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const region = page.getByRole("region", { name: "Framework previews", exact: true });
  await region.focus();
  await expect(region).toBeFocused();
  await region.press("ArrowRight");
  if (info.project.name === "mobile")
    await expect.poll(() => region.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("keeps native selection and document identity through expansion and reloads URL settings", async ({ page }) => {
  await page.goto("/?scenario=interactions&theme=light&locale=en-US");
  await ready(page);
  for (const framework of frameworks) {
    const frame = fixture(page, framework);
    await expect(frame.getByRole("button", { name: "Unavailable", exact: true })).toBeDisabled();
    const combo = frame.getByRole("combobox", { name: "Choose topics" });
    await combo.press("ArrowDown");
    await combo.press("Enter");
    await combo.press("Escape");
    await expect(combo).toBeFocused();
    await expect(combo).toContainText("Maps");
    await frame.getByRole("button", { name: "Wave", exact: true }).click();
    await expect(panel(page, framework).getByLabel(`${names[framework]} observable state`)).toContainText("\"waves\": 1");
    await expect(panel(page, framework).getByLabel(`${names[framework]} native events`)).toContainText("\"messageId\":\"poll\"");
    await frame.locator("body").evaluate(el => el.dataset.identity = "preserved");
    await page.getByRole("button", { name: `Expand ${names[framework]}`, exact: true }).press("Enter");
    await expect(page.locator(`#${framework}-viewport`)).toHaveJSProperty("clientWidth", 1280);
    await ready(page);
    await expect(frame.locator("body")).toHaveAttribute("data-identity", "preserved");
    await expect(frame.getByRole("combobox", { name: "Choose topics" })).toContainText("Maps");
    await expect(panel(page, framework).getByLabel(`${names[framework]} observable state`)).toContainText("\"waves\": 1");
    await page.getByRole("button", { name: "Return to three previews", exact: true }).press("Enter");
    await expect(page.getByRole("button", { name: `Expand ${names[framework]}`, exact: true })).toBeFocused();
    await expect(page.locator(`#${framework}-viewport`)).toHaveJSProperty("clientWidth", 390);
  }
  await page.getByRole("combobox", { name: "Theme", exact: true }).selectOption("dark");
  await page.getByRole("combobox", { name: "Locale", exact: true }).selectOption("fr-FR");
  await page.getByLabel("Allow remote media", { exact: true }).check();
  await page.getByRole("button", { name: "Expand Vue", exact: true }).click();
  await page.reload();
  await ready(page);
  await expect(page.getByRole("combobox", { name: "Scenario", exact: true })).toHaveValue("interactions");
  await expect(page.getByRole("combobox", { name: "Theme", exact: true })).toHaveValue("dark");
  await expect(page.getByRole("combobox", { name: "Locale", exact: true })).toHaveValue("fr-FR");
  await expect(page.getByLabel("Allow remote media", { exact: true })).toBeChecked();
  await expect(page.locator("#vue-viewport")).toHaveJSProperty("clientWidth", 1280);
  await page.getByRole("button", { name: "Return to three previews", exact: true }).click();
  await page.getByRole("button", { name: "Reset all previews" }).click();
  await ready(page);
  for (const framework of frameworks)
    await expect(fixture(page, framework).getByRole("combobox", { name: "Choose topics" })).toHaveText("Choose topics");
});

test("sends channel messages and thread replies and remounts cleanly on scenario changes", async ({ page }) => {
  await page.goto("/?scenario=channel");
  await ready(page);
  for (const framework of frameworks) {
    const frame = fixture(page, framework);
    const composer = frame.getByRole("textbox", { name: "Message #trail", exact: true });
    await composer.fill("Local channel note");
    await composer.press("Enter");
    await expect(frame.getByText("Local channel note", { exact: true })).toBeVisible();
    const opener = frame.getByRole("button", { name: /Open thread Route planning/ });
    await opener.press("Enter");
    const close = frame.getByRole("button", { name: "Close thread", exact: true });
    await expect(close).toBeFocused();
    const reply = frame.getByRole("textbox", { name: "Message #Route planning", exact: true });
    await reply.fill("Local thread note");
    await reply.press("Enter");
    await expect(frame.getByRole("complementary", { name: "Thread : Route planning" }).getByText("Local thread note", { exact: true })).toBeVisible();
    await reply.press("Escape");
    await expect(close).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect(panel(page, framework).getByLabel(`${names[framework]} observable state`)).toContainText("\"replyCount\": 1");
  }
  for (const scenario of [
    "classic",
    "interactions",
    "channel",
    "classic",
    "channel",
  ]) {
    await page.getByRole("combobox", { name: "Scenario", exact: true }).selectOption(scenario);
    await ready(page);
    for (const framework of frameworks)
      await expect(panel(page, framework).getByLabel(`${names[framework]} native events`)).toHaveText("No events");
  }
  for (const framework of frameworks) {
    await expect(fixture(page, framework).getByText("Local channel note", { exact: true })).toHaveCount(0);
    await expect(panel(page, framework).getByLabel(`${names[framework]} observable state`)).toContainText("\"messageCount\": 1");
  }
});

test("falls back clearly, filters the catalogue and ignores invalid frame messages", async ({ page }) => {
  await page.goto("/?scenario=missing&theme=unknown&locale=none&focus=invalid&width=42&media=bad");
  await ready(page);
  await expect(page.getByText(/Unknown configuration value/)).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Scenario", exact: true })).toHaveValue("classic");
  await page.getByRole("searchbox", { name: "Search scenarios" }).fill("V2");
  await expect(page.getByRole("combobox", { name: "Scenario", exact: true }).getByRole("option")).toHaveCount(2);
  await fixture(page, "react").locator("body").evaluate(() => {
    const base = { protocol: "discord-ui-comparison-v1", framework: "react", revision: 9999 };
    window.parent.postMessage({ ...base, type: "error", error: "Stale error" }, window.location.origin);
    window.parent.postMessage({
      ...base,
      revision: 1,
      type: "applied",
      state: "Invalid state",
    }, window.location.origin);
  });
  await page.evaluate(() => window.postMessage({
    protocol: "discord-ui-comparison-v1",
    framework: "react",
    revision: 1,
    type: "error",
    error: "Wrong source",
  }, window.location.origin));
  await expect(panel(page, "react")).toHaveAttribute("data-status", "ready");
  await fixture(page, "react").locator("body").evaluate(() => window.dispatchEvent(new ErrorEvent("error", { message: "Fixture runtime failure" })));
  await expect(panel(page, "react").getByRole("alert")).toHaveText("Fixture runtime failure");
  await expect(panel(page, "react")).toHaveAttribute("data-status", "error");
  await page.getByRole("button", { name: "Reset all previews" }).click();
  await ready(page);
});

for (const framework of frameworks) {
  test(`${framework} fixture loads directly with native settings`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`/previews/${framework}/?scenario=interactions&theme=light&locale=fr-FR&media=block`);
    await expect(page.locator("html")).toHaveAttribute("data-status", "ready");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr-FR");
    await expect(page.locator(".arcscord-discord-ui")).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: "Wave", exact: true }).click();
    await expect(page.locator("#state")).toContainText("\"waves\": 1");
    expect(errors).toEqual([]);
  });
}

test("restores explicit inner widths and custom theme settings from shareable URLs", async ({ page }) => {
  await page.goto("/?scenario=classic&width=481&customTheme=true&locale=fr-FR");
  await ready(page);
  await expect(page.getByRole("combobox", { name: "Inner viewport width", exact: true })).toHaveValue("481");
  await expect(page.getByLabel("Custom theme overrides", { exact: true })).toBeChecked();
  for (const framework of frameworks)
    await expect(page.locator(`#${framework}-viewport`)).toHaveJSProperty("clientWidth", 481);
  await page.getByRole("combobox", { name: "Inner viewport width", exact: true }).selectOption("641");
  await page.getByRole("combobox", { name: "Theme", exact: true }).selectOption("dark");
  await page.reload();
  await ready(page);
  await expect(page.getByRole("combobox", { name: "Inner viewport width", exact: true })).toHaveValue("641");
  await expect(page.getByLabel("Custom theme overrides", { exact: true })).toBeChecked();
  for (const framework of frameworks) {
    await expect(page.locator(`#${framework}-viewport`)).toHaveJSProperty("clientWidth", 641);
    await expect(fixture(page, framework).getByText("(modifié)", { exact: true })).toBeVisible();
  }
});
