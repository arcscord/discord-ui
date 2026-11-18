import { expect, test } from "@playwright/test";

test("keeps the comparison app outside the public website", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator(".navbar a[href=\"/compare\"]")).toHaveCount(0);
  await expect(page.locator("main")).toBeVisible();
  const legacyFixture = await request.get("/generated/comparison/react/index.html");
  expect(legacyFixture.status()).toBe(404);
});
