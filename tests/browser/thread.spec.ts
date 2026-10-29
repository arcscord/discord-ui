import { expect, test } from "@playwright/test";

test("opens a thread, sends a local reply and restores focus on close", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("channel");
  const opener = page.getByRole("button", { name: "Ouvrir le fil paysage, 1 Message", exact: true });
  await expect(opener).toBeVisible();
  await expect(page.locator(".dui-thread-snippet")).toHaveCSS("text-overflow", "ellipsis");
  await opener.focus();
  await opener.press("Enter");
  const panel = page.getByRole("complementary", { name: "Fil : paysage", exact: true });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: "Fermer le fil", exact: true })).toBeFocused();
  await expect(panel.locator("article")).toHaveCount(2);
  await expect(panel.locator(".dui-thread-preview")).toHaveCount(0);
  await expect.poll(() => panel.getByRole("log").evaluate(element => element.scrollHeight - element.scrollTop - element.clientHeight)).toBeLessThanOrEqual(2);
  const input = panel.getByRole("textbox", { name: "Message #paysage", exact: true });
  await input.fill("Une réponse dans le fil");
  await input.press("Enter");
  await expect(panel.locator("article")).toHaveCount(3);
  await expect(panel.locator("article").last()).toContainText("Une réponse dans le fil");
  await expect(input).toHaveValue("");
  const data = JSON.parse(await page.getByRole("textbox", { name: "JSON du salon", exact: true }).inputValue());
  expect(data.threads[0].messages).toHaveLength(2);
  expect(data.messages.find((message: { id: string }) => message.id === "channel-3").thread.messageCount).toBe(2);
  await input.press("Escape");
  await expect(panel).toHaveCount(0);
  const updated = page.getByRole("button", { name: "Ouvrir le fil paysage, 2 Messages", exact: true });
  await expect(updated).toBeFocused();
  await expect(updated).toContainText("Une réponse dans le fil");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});

for (const theme of ["light", "ash", "dark"]) {
  test(`shares the ${theme} container surface and border`, async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Scénario", { exact: true }).selectOption("channel");
    await page.getByLabel("Thème", { exact: true }).selectOption(theme);
    const card = page.locator(".dui-thread-preview");
    const expected = await card.evaluate((element) => {
      const probe = document.createElement("div");
      probe.style.background = "var(--discord-ui-container-surface)";
      probe.style.border = "1px solid var(--discord-ui-container-outline)";
      element.append(probe);
      const style = getComputedStyle(probe);
      const result = { background: style.backgroundColor, border: style.borderTopColor };
      probe.remove();
      return result;
    });
    await expect(card).toHaveCSS("background-color", expected.background);
    await expect(card).toHaveCSS("border-top-color", expected.border);
    await card.hover();
    await expect(card).toHaveCSS("background-color", expected.background);
    await expect(card).toHaveCSS("border-top-color", expected.border);
  });
}

test("edits summary metadata in JSON and keeps unavailable threads read-only", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("channel");
  const editor = page.getByRole("textbox", { name: "JSON du salon", exact: true });
  const data = JSON.parse(await editor.inputValue());
  data.threads = [];
  const parent = data.messages.find((message: { id: string }) => message.id === "channel-3");
  parent.thread.messageCount = 0;
  delete parent.thread.lastMessage;
  await editor.fill(JSON.stringify(data));
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".dui-thread-preview")).toContainText("Aucun message récent dans ce fil.");
  await expect(page.getByRole("button", { name: /Ouvrir le fil/u })).toHaveCount(0);
  parent.thread.messageCount = -1;
  await editor.fill(JSON.stringify(data));
  await expect(page.getByRole("alert")).toContainText("messageCount");
  await expect(page.locator(".dui-thread-preview")).toContainText("Aucun message récent dans ce fil.");
});

test("keeps JSON editing focused when removing an open thread", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("channel");
  await page.getByRole("button", { name: "Ouvrir le fil paysage, 1 Message", exact: true }).click();
  await expect(page.locator(".dui-thread-panel")).toBeVisible();
  const editor = page.getByRole("textbox", { name: "JSON du salon", exact: true });
  const data = JSON.parse(await editor.inputValue());
  data.threads = [];
  await editor.fill(JSON.stringify(data));
  await expect(page.locator(".dui-thread-panel")).toHaveCount(0);
  await expect(editor).toBeFocused();
});
