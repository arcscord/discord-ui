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
  await expect(arcade.locator(".dui-interaction-command").first()).toHaveText("/dice");
  await expect(arcade.locator(".dui-message")).toHaveCount(2);
  await expect(arcade.locator(".dui-message-header").filter({ hasText: "You" })).toHaveCount(0);
  await expect(arcade.getByRole("heading", { name: /🎲 You rolled/ })).toHaveText(/You rolled ([1-9]|1\d|20)$/);
  await prepare("quiz");
  await send.click();
  await arcade.getByRole("button", { name: "Banana Peel", exact: true }).click();
  await expect(arcade).toContainText("Good try! The answer is Super Mushroom.");
  await expect(arcade.locator(".dui-interaction-command").last()).toHaveText("/quiz");
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
  await expect(arcade).toContainText("Only you can see this");
  const ephemeralColors = {
    light: ["rgb(243, 243, 251)", "rgb(234, 235, 249)"],
    ash: ["rgb(52, 53, 67)", "rgb(53, 56, 76)"],
    dark: ["rgb(30, 30, 41)", "rgb(32, 33, 51)"],
  } as const;
  for (const theme of ["light", "ash", "dark"] as const) {
    await page.getByRole("combobox", { name: "Arcade theme" }).selectOption(theme);
    await expect(arcade.locator(".arcscord-discord-ui")).toHaveAttribute("data-theme", theme);
    await expect(arcade.locator(".dui-interaction-command").last()).toHaveText("/8ball");
    await expect(arcade.getByRole("button", { name: "Dismiss message", exact: true })).toBeVisible();
    const ephemeral = arcade.locator(".dui-message[data-ephemeral=\"true\"]");
    await page.getByRole("combobox", { name: "Arcade theme" }).hover();
    await expect(ephemeral).toHaveCSS("background-color", ephemeralColors[theme][0]);
    await expect(ephemeral).toHaveCSS("border-left-color", "rgb(88, 101, 242)");
    await expect(ephemeral).toHaveCSS("border-left-width", "2px");
    await ephemeral.hover();
    await expect(ephemeral).toHaveCSS("background-color", ephemeralColors[theme][1]);
    const dismissControl = ephemeral.getByRole("button", { name: "Dismiss message", exact: true });
    await dismissControl.focus();
    await page.getByRole("combobox", { name: "Arcade theme" }).hover();
    await expect(ephemeral).toHaveCSS("background-color", ephemeralColors[theme][1]);
    await dismissControl.blur();
    await arcade.screenshot({ path: `/tmp/landing-arcade-${theme}-${testInfo.project.name}.png` });
  }
  await arcade.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `/tmp/landing-arcade-${testInfo.project.name}.png` });
  const dismiss = arcade.getByRole("button", { name: "Dismiss message", exact: true });
  await dismiss.focus();
  await expect(dismiss).toBeFocused();
  await dismiss.press("Enter");
  await expect(arcade).not.toContainText("Only you can see this");
  await expect(arcade).not.toContainText("Will this demo work?");
  await expect(arcade.locator(".dui-message")).toHaveCount(4);
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
