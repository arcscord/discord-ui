import { expect, test } from "@playwright/test";

test("public sitemap pages expose unique SEO metadata and local sharing assets", async ({ page, request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain("Sitemap: https://ui.arcscord.dev/sitemap.xml");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const urls = [
    ...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/gu),
  ].map(match => match[1]!);
  expect(urls.length).toBeGreaterThan(40);
  expect(new Set(urls).size).toBe(urls.length);
  expect(urls).not.toContain("https://ui.arcscord.dev/search");
  expect(urls).not.toContain("https://ui.arcscord.dev/404.html");
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const url of urls) {
    expect(url).toMatch(/^https:\/\/ui\.arcscord\.dev\//u);
    const response = await request.get(new URL(url).pathname);
    expect(response.ok(), url).toBe(true);
    const metadata = await page.evaluate((html) => {
      const document = new DOMParser().parseFromString(html, "text/html");
      return {
        title: document.title,
        description: document.querySelector("meta[name=\"description\"]")?.getAttribute("content"),
        canonical: document.querySelector("link[rel=\"canonical\"]")?.getAttribute("href"),
        image: document.querySelector("meta[property=\"og:image\"]")?.getAttribute("content"),
        robots: document.querySelector("meta[name=\"robots\"]")?.getAttribute("content"),
        headings: document.querySelectorAll("h1").length,
      };
    }, await response.text());
    expect(metadata.canonical, url).toBe(url);
    expect(metadata.image, url).toBe("https://ui.arcscord.dev/img/social-card.png");
    expect(metadata.description?.length, url).toBeGreaterThan(40);
    expect(metadata.description, url).not.toMatch(/for Arcscord Discord UI\.$/u);
    expect(metadata.robots ?? "", url).not.toContain("noindex");
    expect(metadata.headings, url).toBe(1);
    expect(titles.has(metadata.title), url).toBe(false);
    expect(descriptions.has(metadata.description!), url).toBe(false);
    titles.add(metadata.title);
    descriptions.add(metadata.description!);
  }
  const image = await request.get("/img/social-card.png");
  expect(image.ok()).toBe(true);
  const png = await image.body();
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});

test("search is noindex without blocking discovery of its result pages", async ({ page }) => {
  await page.goto("/search?q=selectmenu");
  await expect(page.locator("meta[name=\"robots\"]")).toHaveAttribute("content", "noindex, follow");
  const result = page.locator(".docs-search-results a").first();
  await expect(result).toHaveAttribute("href", "/docs/api/interactive-components#selectmenu");
  await result.click();
  await expect(page).toHaveURL(/interactive-components#selectmenu$/u);
  await expect(page.locator("meta[name=\"robots\"][content*=\"noindex\"]")).toHaveCount(0);
});
