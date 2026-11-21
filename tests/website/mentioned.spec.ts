import { expect, test } from "@playwright/test";

const colors = [
  { theme: "Light", background: "rgb(251, 244, 235)", border: "rgb(148, 83, 1)" },
  { theme: "Ash", background: "rgb(50, 51, 57)", border: "rgb(253, 181, 41)" },
  { theme: "Dark", background: "rgb(44, 37, 32)", border: "rgb(233, 152, 0)" },
];

test("mentioned messages retain their highlight through hover and keyboard focus in every theme", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/playground?example=media-conversation");
  const preview = page.locator(".live-panel");
  const message = preview.locator(".dui-message[data-mentioned=true]");
  await expect(message).toHaveCount(1);
  await expect(message).toHaveAttribute("data-mentioned", "true");
  await expect(message.locator(".dui-message-header")).toContainText("Sam");
  await expect(message.locator(".dui-mention")).toContainText("Inès");
  await expect(message).not.toHaveAttribute("data-ephemeral");
  await expect(message.locator(".dui-ephemeral-notice, .dui-ephemeral-dismiss")).toHaveCount(0);
  await expect(message.getByRole("button", { name: "Hide", exact: true })).toHaveCount(0);
  for (const { theme, background, border } of colors) {
    await page.getByRole("button", { name: theme, exact: true }).click();
    await expect(message).toHaveCSS("background-color", background);
    await expect(message).toHaveCSS("border-left-color", border);
    await expect(message).toHaveCSS("border-left-width", "2px");
    await message.hover();
    await expect(message).toHaveCSS("background-color", background);
    await expect(message).toHaveCSS("border-left-color", border);
    await message.getByRole("link", { name: "Open trail guide", exact: true }).focus();
    await expect(message.getByRole("link", { name: "Open trail guide", exact: true })).toBeFocused();
    await expect(message).toHaveCSS("background-color", background);
    await expect(message).toHaveCSS("border-left-color", border);
    await message.screenshot({
      path: info.outputPath(`mentioned-${theme.toLowerCase()}.png`),
    });
    await expect(preview.locator(".dui-message")).toHaveCount(6);
    await expect(preview.locator("video")).toHaveCount(1);
    await expect(preview.locator("audio")).toHaveCount(2);
    await expect(preview.getByRole("img", { name: "Arcscord sticker", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
  expect(errors).toEqual([]);
});
