import { expect, test } from "@playwright/test";

test("local Twemoji hydrate without CDN requests and keep emoji-only buttons accessible", async ({ page }) => {
  const errors: string[] = [];
  const remote: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(message.text());
  });
  page.on("request", (request) => {
    if (/twemoji|jsdelivr/u.test(request.url()) && new URL(request.url()).origin !== "http://127.0.0.1:4174")
      remote.push(request.url());
  });
  const response = await page.goto("/docs/guides/markdown");
  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle(/Markdown, mentions and emoji/);
  // Verify that the local image source exists in the server output before hydration.
  expect(await response!.text()).toContain("src=\"/examples/twemoji/1f44b.svg\"");
  await expect(page.locator("html")).toHaveAttribute("data-has-hydrated", "true");
  const preview = page.locator("article .arcscord-discord-ui").first();
  const images = preview.locator("img.dui-unicode-emoji");
  await expect(images).toHaveCount(2);
  for (const image of await images.all()) {
    await expect(image).toHaveAttribute("src", "/examples/twemoji/1f44b.svg");
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
  }
  const button = preview.getByRole("button", { name: "Wave hello", exact: true });
  await button.focus();
  await button.press("Enter");
  await expect(preview.getByRole("status")).toHaveText("Waves: 1");
  for (const theme of ["light", "ash", "dark"]) {
    // Exercise the unchanged theme CSS around the same loaded emoji and focus state.
    await preview.evaluate((node, name) => {
      node.setAttribute("data-theme", name);
      node.setAttribute("data-base-theme", name);
    }, theme);
    await expect(button).toBeFocused();
    expect(await preview.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
  await preview.screenshot({ path: `/tmp/discord-ui-emoji-${test.info().project.name}.png` });
});

test("missing local emoji images fall back to Unicode after hydration", async ({ page }) => {
  await page.route("**/examples/twemoji/1f44b.svg", route => route.abort());
  await page.route("**/examples/emoji.svg", route => route.abort());
  await page.goto("/docs/guides/markdown");
  const preview = page.locator("article .arcscord-discord-ui").first();
  await expect(preview.locator("img.dui-emoji")).toHaveCount(0);
  await expect(preview.locator(".dui-emoji-fallback")).toHaveText(":arc:");
  await expect(preview.locator(".dui-markdown")).toContainText("👋");
  await expect(preview.getByRole("button", { name: "Wave hello", exact: true })).toContainText("👋");
});
