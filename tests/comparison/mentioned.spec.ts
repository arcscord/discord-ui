import { expect, test } from "@playwright/test";
import { frameworks } from "../../fixtures/comparison/scenarios";

const colors = [
  { theme: "light", background: "rgb(251, 244, 235)", border: "rgb(148, 83, 1)" },
  { theme: "ash", background: "rgb(50, 51, 57)", border: "rgb(253, 181, 41)" },
  { theme: "dark", background: "rgb(44, 37, 32)", border: "rgb(233, 152, 0)" },
];

for (const framework of frameworks) {
  test(`${framework} retains mentioned colors through hover and focus in every theme`, async ({ page }) => {
    for (const { theme, background, border } of colors) {
      await page.goto(`/previews/${framework}/?scenario=media&theme=${theme}&media=block`);
      const message = page.locator(".dui-message[data-mentioned=true]");
      await expect(message).toHaveCount(1);
      await expect(message).toHaveAttribute("data-mentioned", "true");
      await expect(message).not.toHaveAttribute("data-ephemeral");
      await expect(message.locator(".dui-ephemeral-notice, .dui-ephemeral-dismiss")).toHaveCount(0);
      await expect(message).toHaveCSS("background-color", background);
      await expect(message).toHaveCSS("border-left-color", border);
      await expect(message).toHaveCSS("border-left-width", "2px");
      await message.hover();
      await expect(message).toHaveCSS("background-color", background);
      await expect(message).toHaveCSS("border-left-color", border);
      const file = message.getByRole("link", { name: "route.txt", exact: true });
      await file.focus();
      await expect(file).toBeFocused();
      await expect(message).toHaveCSS("background-color", background);
      await expect(message).toHaveCSS("border-left-color", border);
      await expect(message.locator("video")).toHaveCount(1);
      await expect(message.locator("audio")).toHaveCount(2);
      await expect(message.getByRole("img", { name: "Arcscord sticker", exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
  });
}
