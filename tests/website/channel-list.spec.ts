import { expect, test } from "@playwright/test";

test("channel icons support custom types, accessible names and keyboard navigation in each theme", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(message.text());
  });
  await page.goto("/playground?example=channel-list");
  await expect(page).toHaveTitle(/Playground/);
  await expect(page.locator(".live-panel .dui-channel-list")).toBeVisible();
  await page.getByRole("textbox", { name: "React JSX editor" }).fill(`
import React, { useState } from "react";
import { ChannelList, DiscordUI } from "@arcscord/discord-ui";
import "@arcscord/discord-ui/styles.css";
const previewTheme = "dark";
const SupportIcon = () => <svg viewBox="0 0 24 24" data-custom-icon="support"><title>Hidden icon title</title><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" /></svg>;
const categories = [{ id: "channels", name: "Salons", channels: [
  { id: "general", name: "general", channelType: 0 },
  { id: "stage", name: "stage", channelType: 13 },
  { id: "media", name: "media", channelType: 16 },
  { id: "support", name: "support", channelType: "support", locked: true },
  { id: "other", name: "other", channelType: "other" }
] }];
export default function Preview() {
  const [active, setActive] = useState("general");
  return <DiscordUI theme={previewTheme} icons={{ channelTypes: { support: SupportIcon } }} labels={{ channel: "Salon", channelTypes: { support: "Support personnalisé" } }}>
    <ChannelList label="Salons" categories={categories} activeChannelId={active} onChannelClick={setActive} />
    <output role="status">{active}</output>
  </DiscordUI>;
}
`);
  const preview = page.locator(".live-panel");
  const channels = preview.getByRole("navigation", { name: "Salons" });
  const support = channels.getByRole("button", { name: "support (Support personnalisé)", exact: true });
  await expect(support.locator("[data-custom-icon='support']")).toBeVisible();
  await expect(support.locator(".dui-select-channel-lock")).toBeVisible();
  await expect(channels.getByRole("button", { name: "stage (Stage channel)", exact: true })).toBeVisible();
  await expect(channels.getByRole("button", { name: "media (Media channel)", exact: true })).toBeVisible();
  await expect(channels.getByRole("button", { name: "other (Salon)", exact: true })).toBeVisible();
  for (const theme of ["Light", "Ash", "Dark"]) {
    await page.getByRole("button", { name: theme, exact: true }).click();
    await support.focus();
    await page.keyboard.press("Enter");
    await expect(support).toHaveAttribute("aria-current", "page");
    await expect(preview.getByRole("status")).toHaveText("support");
    expect(await channels.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(false);
    await channels.screenshot({
      path: testInfo.outputPath(`channel-icons-${theme.toLowerCase()}.png`),
    });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});
