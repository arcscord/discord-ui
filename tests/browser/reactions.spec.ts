import { expect, test } from "@playwright/test";

test("toggles reactions with mouse and keyboard, preserves JSON and loads Twemoji", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  // Use a local image response so interaction QA is independent of CDN connectivity.
  await page.route("https://cdn.jsdelivr.net/**", route => route.fulfill({ contentType: "image/svg+xml", body: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"22\" height=\"22\"><circle cx=\"11\" cy=\"11\" r=\"10\" fill=\"#ffcc4d\"/></svg>" }));
  await page.goto("/");
  await expect(page).toHaveTitle("Discord UI — Playground");
  await page.getByLabel("Scénario", { exact: true }).selectOption("reactions");
  const like = page.getByRole("button", { name: "👍: 12", exact: true });
  await expect(like).toHaveAttribute("aria-pressed", "false");
  await expect(like.locator("img")).toHaveJSProperty("naturalWidth", 22);
  await like.click();
  const selected = page.getByRole("button", { name: "👍: 13", exact: true });
  await expect(selected).toHaveAttribute("aria-pressed", "true");
  const json = JSON.parse(await page.getByLabel("JSON du message", { exact: true }).inputValue());
  expect(json.reactions[0]).toMatchObject({ count: 13, me: true });
  await selected.press("Space");
  await expect(like).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "arc: 2", exact: true }).click();
  await expect(page.getByRole("button", { name: "arc: 3", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

test("wraps long highlighted code and inline code without internal scrollbars", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("markdown");
  const long = "veryLongToken".repeat(70);
  await page.getByLabel("Contenu", { exact: true }).fill(`\`\`\`ts\nconst value = "${long}";\n\`\`\`\n\`${long}\``);
  await page.locator("#width").fill("320");
  const pre = page.locator("article pre");
  await expect(pre.locator(".hljs-string")).toContainText(long);
  await expect(pre).toHaveCSS("white-space", "pre-wrap");
  expect(await pre.evaluate(element => ({ horizontal: element.scrollWidth > element.clientWidth, vertical: element.scrollHeight > element.clientHeight }))).toEqual({ horizontal: false, vertical: false });
  expect(await page.locator("article").evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("retains Unicode characters if an emoji image fails", async ({ page }) => {
  await page.route("https://cdn.jsdelivr.net/**", route => route.abort());
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("reactions");
  await expect(page.locator(".dui-markdown")).toContainText("🎉");
  await expect(page.getByRole("button", { name: "👍: 12", exact: true })).toContainText("👍");
  await expect(page.locator(".dui-unicode-emoji")).toHaveCount(0);
});

test("routes reaction changes through the channel and open thread", async ({ page }) => {
  await page.route("https://cdn.jsdelivr.net/**", route => route.abort());
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("channel");
  await page.getByRole("button", { name: "👍: 4", exact: true }).click();
  await expect(page.getByRole("button", { name: "👍: 5", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.locator(".dui-thread-preview").click();
  const panel = page.locator(".dui-thread-panel");
  await panel.getByRole("button", { name: "❤️: 2", exact: true }).click();
  await expect(panel.getByRole("button", { name: "❤️: 3", exact: true })).toHaveAttribute("aria-pressed", "true");
  await panel.getByRole("button", { name: "👍: 5", exact: true }).click();
  await expect(panel.getByRole("button", { name: "👍: 4", exact: true })).toHaveAttribute("aria-pressed", "false");
  const channel = JSON.parse(await page.getByLabel("JSON du salon", { exact: true }).inputValue());
  expect(channel.threads[0].messages[0].reactions[0]).toMatchObject({ count: 3, me: true });
  expect(channel.messages[2].reactions[0]).toMatchObject({ count: 4, me: false });
});
