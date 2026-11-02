import { expect, test } from "@playwright/test";

test("landing arcade runs all commands, locks quiz answers and resets local state", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(message.text());
  });
  await page.goto("/");
  const arcade = page.locator(".arcade-demo");
  const input = arcade.getByRole("textbox", { name: "Message #bot-playground", exact: true });
  const send = arcade.getByRole("button", { name: "Send message", exact: true });
  async function prepare(command: string) {
    await arcade.getByRole("button", {
      name: new RegExp(`^/${command}`),
    }).click();
    await expect(input).toBeFocused();
    await input.press("Enter");
  }
  await prepare("dice");
  await arcade.getByRole("option", { name: /^faces / }).click();
  await arcade.getByRole("option", { name: "20 sides", exact: true }).click();
  await send.click();
  await expect(arcade).toContainText("A 20-sided die.");
  await expect(arcade.getByRole("heading", { name: /🎲 You rolled/ })).toHaveText(/You rolled ([1-9]|1\d|20)$/);
  await prepare("quiz");
  await send.click();
  await arcade.getByRole("button", { name: "Banana Peel", exact: true }).click();
  await expect(arcade).toContainText("Good try! The answer is Super Mushroom.");
  await expect(arcade.getByRole("button", { name: "Super Mushroom", exact: true })).toBeDisabled();
  await expect(arcade.getByRole("button", { name: "Banana Peel", exact: true })).toBeDisabled();
  await page.getByRole("combobox", { name: "Arcade theme" }).selectOption("light");
  await expect(arcade).toContainText("Good try!");
  await prepare("quiz");
  await arcade.getByRole("option", { name: /^category / }).click();
  await arcade.getByRole("option", { name: "Space", exact: true }).click();
  await send.click();
  await arcade.getByRole("button", { name: "Mars", exact: true }).click();
  await expect(arcade).toContainText("Correct!");
  await expect(arcade.getByRole("button", { name: "Mars", exact: true })).toBeDisabled();
  await prepare("8ball");
  await expect(send).toBeDisabled();
  await arcade.getByRole("option", { name: /^question / }).click();
  const question = arcade.getByRole("textbox", { name: "question", exact: true });
  await question.fill("Will this demo work?");
  await question.press("Enter");
  await expect(arcade).toContainText("“Will this demo work?”");
  for (const theme of ["ash", "dark"]) {
    await page.getByRole("combobox", { name: "Arcade theme" }).selectOption(theme);
    await expect(arcade.locator(".arcscord-discord-ui")).toHaveAttribute("data-theme", theme);
  }
  await arcade.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `/tmp/landing-arcade-${testInfo.project.name}.png` });
  await prepare("8ball");
  await arcade.getByRole("button", { name: "Reset demo" }).click();
  await expect(arcade.locator(".dui-message")).toHaveCount(1);
  await expect(input).toHaveValue("");
  await input.fill("/dice");
  await input.press("Enter");
  await send.click();
  await expect(arcade).toContainText("A 6-sided die.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});
