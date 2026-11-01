import { expect, test } from "@playwright/test";

test("catalog exposes the new interactive controls and file primitive", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/components?example=select-menu");
  const menu = page.getByRole("combobox", { name: "Choose test values" });
  await menu.click();
  await page.getByRole("option", { name: "Alpha First typed value" }).click();
  await expect(menu).toHaveText("Alpha");
  await menu.press("Escape");
  if ((page.viewportSize()?.width ?? 0) <= 640)
    await page.getByRole("button", { name: /Browse components/ }).click();
  await page.getByRole("button", { name: "Button", exact: true }).click();
  await page.getByRole("button", { name: "success", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("success");
  if ((page.viewportSize()?.width ?? 0) <= 640)
    await page.getByRole("button", { name: /Browse components/ }).click();
  await page.getByRole("button", { name: "File", exact: true }).click();
  await expect(page.getByRole("link", { name: "guide.pdf", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const [kind, placeholder, firstLabel, nextLabel, defaultValue, nextValue] of [
  [
    "string-select",
    "Choose notification topics",
    "Releases",
    "Events",
    "releases",
    "events",
  ],
  [
    "user-select",
    "Choose reviewers",
    "Chris",
    "Inès",
    "chris",
    "ines",
  ],
  [
    "role-select",
    "Choose roles to notify",
    "Members",
    "Moderators",
    "members",
    "moderators",
  ],
  [
    "mentionable-select",
    "Choose people or roles",
    "Moderators",
    "Inès",
    "role-moderators",
    "ines",
  ],
  [
    "channel-select",
    "Choose destination channels",
    "general",
    "support",
    "general",
    "support",
  ],
]) {
  test(`playground has a complete ${kind} example`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`/playground?example=${kind}`);
    await expect(page.getByRole("combobox", { name: "Example", exact: true })).toHaveValue(kind);
    const preview = page.locator(".live-panel");
    const menu = preview.getByRole("combobox", { name: placeholder, exact: true });
    await expect(menu.locator("..")).toContainText(firstLabel);
    await menu.click();
    await expect(preview.getByRole("option")).toHaveCount(6);
    await preview.getByRole("option").filter({ hasText: nextLabel }).click();
    await expect(preview.getByRole("status", { name: "Selected values", exact: true })).toHaveText(JSON.stringify([defaultValue, nextValue]));
    await menu.press("Escape");
    const single = preview.getByRole("combobox", { name: "Choose one option" });
    await single.click();
    await preview.getByRole("option").filter({ hasText: nextLabel }).click();
    await expect(single.locator("..")).toContainText(nextLabel);
    await expect(single).toHaveAttribute("aria-expanded", "false");
    await expect(preview.getByRole("combobox", { name: "Disabled selection" })).toBeDisabled();
    await preview.getByRole("button", { name: "Reset selections" }).click();
    await expect(menu.locator("..")).toContainText(firstLabel);
    if (kind === "string-select")
      await expect(single).toHaveText("Choose one option");
    else await expect(single).toHaveValue("");
    if (kind === "user-select") {
      await menu.click();
      await preview.screenshot({ path: `/tmp/select-example-${test.info().project.name}.png` });
    }
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
