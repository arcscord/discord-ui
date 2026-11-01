import { expect, test } from "@playwright/test";

test("renders replies, edits and classic files and reveals spoiler attachments", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("Discord UI — Playground");
  await page.getByLabel("Scénario", { exact: true }).selectOption("channel");
  const message = page.locator("article").filter({
    has: page.locator(".dui-reply-preview"),
  });
  await expect(message.locator(".dui-reply-content")).toHaveText("Voici une image de démonstration :");
  await expect(message.locator(".dui-message-edited time")).toHaveAttribute("datetime", "2026-10-29T18:04:00.000Z");
  await expect(message.getByRole("link", { name: "guide.pdf", exact: true })).toHaveAttribute("href", "https://example.com/guide.pdf");
  expect(await message.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await message.screenshot({ path: `/tmp/discord-ui-message-details-${testInfo.project.name}.png` });
  const editor = page.getByLabel("JSON du salon", { exact: true });
  const channel = JSON.parse(await editor.inputValue());
  channel.messages[3].reply = { messageId: "deleted", unavailable: true };
  channel.messages[3].attachments[0].spoiler = true;
  await editor.fill(JSON.stringify(channel, null, 2));
  await expect(message.locator(".dui-reply-content")).toHaveText("Message original indisponible");
  await expect(message.getByRole("link", { name: "guide.pdf", exact: true })).toHaveCount(0);
  const spoiler = message.getByRole("button", { name: "Afficher le spoiler" });
  await spoiler.focus();
  await spoiler.press("Enter");
  await expect(message.getByRole("link", { name: "guide.pdf", exact: true })).toBeVisible();
  await expect(message.getByRole("button", { name: "Masquer le spoiler" })).toBeVisible();
  expect(errors).toEqual([]);
});
