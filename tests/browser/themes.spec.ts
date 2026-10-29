import { expect, test } from "@playwright/test";

const palettes = {
  light: {
    surface: "#FFFFFF",
    background: "#FBFBFB",
    focus: "#EEEEEF",
    code: "#E8E8EF",
    spoiler: "#8E9097",
    quote: "#C5C6CA",
  },
  ash: {
    surface: "#393A41",
    background: "#323339",
    focus: "#3E3F46",
    code: "#343748",
    spoiler: "#7D7E86",
    quote: "#595A63",
  },
  dark: {
    surface: "#242429",
    background: "#1A1A1E",
    focus: "#29292E",
    code: "#1F202F",
    spoiler: "#666770",
    quote: "#474850",
  },
};

function rgb(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${value >> 16}, ${(value >> 8) & 255}, ${value & 255})`;
}

for (const [name, colors] of Object.entries(palettes)) {
  test(`renders the exact ${name} palette and row hover/focus`, async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Scénario", { exact: true }).selectOption("markdown");
    await page.getByLabel("Thème", { exact: true }).selectOption(name);
    const message = page.locator("article");
    await expect(message).toHaveCSS("background-color", rgb(colors.background));
    await expect(page.locator(".dui-code-block")).toHaveCSS("background-color", rgb(colors.code));
    await expect(page.locator(".dui-blockquote")).toHaveCSS("border-left-color", rgb(colors.quote));
    await expect(page.locator(".dui-revealable-text .dui-spoiler-toggle")).toHaveCSS("background-color", rgb(colors.spoiler));
    await message.hover();
    await expect(message).toHaveCSS("background-color", rgb(colors.focus));
    await page.getByRole("heading", { name: "Playground", exact: true }).hover();
    await page.getByRole("button", { name: "Afficher le spoiler" }).focus();
    await expect(message).toHaveCSS("background-color", rgb(colors.focus));
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.getByLabel("Scénario", { exact: true }).selectOption("embed");
    await expect(page.locator(".dui-embed")).toHaveCSS("background-color", rgb(colors.surface));
    await page.getByLabel("Scénario", { exact: true }).selectOption("components");
    await expect(page.locator(".dui-container").first()).toHaveCSS("background-color", rgb(colors.surface));
    await expect(page.locator(".dui-container").last()).toHaveCSS("background-color", rgb(colors.surface));
  });
}

test("supports scoped CSS overrides without changing component styles", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Scénario", { exact: true }).selectOption("markdown");
  await page.addStyleTag({ content: ".custom-preview { --discord-ui-code-background: rgb(18, 52, 86); --discord-ui-quote-border: rgb(101, 67, 33); }" });
  await page.locator(".preview-width > .arcscord-discord-ui").evaluate(element => element.classList.add("custom-preview"));
  await expect(page.locator(".dui-code-block")).toHaveCSS("background-color", "rgb(18, 52, 86)");
  await expect(page.locator(".dui-blockquote")).toHaveCSS("border-left-color", "rgb(101, 67, 33)");
});

const linkButtonPalettes = {
  light: { enabled: "#EEEEEF", disabled: "#F4F4F5" },
  ash: { enabled: "#3E3F46", disabled: "#383940" },
  dark: { enabled: "#29292E", disabled: "#2F2F34" },
};

for (const [theme, colors] of Object.entries(linkButtonPalettes)) {
  test(`renders solid enabled and disabled link buttons for ${theme}`, async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Scénario", { exact: true }).selectOption("components");
    await page.getByLabel("Thème", { exact: true }).selectOption(theme);
    const enabled = page.getByRole("link", { name: "Code source", exact: true });
    const disabled = page.getByRole("link", { name: "Bientôt disponible", exact: true });
    await expect(enabled).toHaveCSS("background-color", rgb(colors.enabled));
    await enabled.hover();
    await expect(enabled).toHaveCSS("background-color", rgb(colors.enabled));
    await expect(disabled).toHaveCSS("background-color", rgb(colors.disabled));
    await expect(disabled).toHaveCSS("opacity", "1");
    await disabled.hover();
    await expect(disabled).toHaveCSS("background-color", rgb(colors.disabled));
    await expect(disabled).toHaveAttribute("aria-disabled", "true");
    expect(await disabled.getAttribute("href")).toBeNull();
    if (theme === "light")
      await expect(enabled).toHaveCSS("color", "rgb(31, 35, 41)");
  });
}
