import { expect, test } from "@playwright/test";

test("file cards have a document icon, outlined download action and keyboard focus in all themes", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/components?example=file");
  const preview = page.locator(".component-preview");
  for (const theme of ["Light", "Ash", "Dark"]) {
    await page.getByRole("button", { name: theme, exact: true }).click();
    await expect(preview.locator("svg.dui-file-icon")).toBeVisible();
    const download = preview.getByRole("link", { name: "Download guide.pdf", exact: true });
    await expect(download).toHaveText("");
    await expect(download).toHaveAttribute("title", "Download guide.pdf");
    await expect(download).toHaveAttribute("download", "guide.pdf");
    await expect(download).toHaveCSS("border-top-width", "1px");
    await expect(download).toHaveCSS("border-top-style", "solid");
    await preview.getByRole("link", { name: "guide.pdf", exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(download).toBeFocused();
    await expect(download).toHaveCSS("outline-style", "solid");
    await expect(download).toHaveCSS("outline-width", "2px");
    await preview.screenshot({ path: `/tmp/file-card-${theme.toLowerCase()}-${testInfo.project.name}.png` });
  }
  await page.goto("/playground?example=attachments");
  const editor = page.getByRole("textbox", { name: "React JSX editor" });
  await editor.fill((await editor.inputValue()).replaceAll("guide.pdf", "community-onboarding-and-accessibility-guide-2026.pdf"));
  await expect(page.locator(".live-panel .dui-file-details")).toContainText("community-onboarding-and-accessibility-guide-2026.pdf");
  await expect(page.locator(".live-panel .dui-file-download")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});

test("the local transcript attachment downloads through its outlined action", async ({ page }) => {
  await page.goto("/playground?example=transcript");
  const downloadLink = page.locator(".live-panel").getByRole("link", { name: "Download welcome-config.json", exact: true });
  await expect(downloadLink).toHaveAttribute("href", "http://127.0.0.1:4174/examples/welcome-config.json");
  const downloading = page.waitForEvent("download");
  await downloadLink.focus();
  await downloadLink.press("Enter");
  const download = await downloading;
  expect(download.suggestedFilename()).toBe("welcome-config.json");
  expect(await download.failure()).toBeNull();
});

test("file spoilers retain card dimensions and reveal safe links by keyboard in all themes", async ({ page }, testInfo) => {
  await page.goto("/playground?example=file");
  const editor = page.getByRole("textbox", { name: "React JSX editor" });
  await editor.fill((await editor.inputValue()).replace("size: \"2.4 MB\"", "size: \"2.4 MB\", spoiler: true"));
  const preview = page.locator(".live-panel");
  for (const theme of ["Light", "Ash", "Dark"]) {
    await page.getByRole("button", { name: theme, exact: true }).click();
    await expect(preview.locator(".arcscord-discord-ui")).toHaveAttribute("data-theme", theme.toLowerCase());
    const reveal = preview.getByRole("button", { name: "Reveal spoiler", exact: true });
    await expect(reveal).toBeVisible();
    await expect(preview.getByRole("link")).toHaveCount(0);
    const hidden = await preview.locator(".dui-file-spoiler").boundingBox();
    expect(hidden).not.toBeNull();
    expect(hidden!.width).toBeLessThanOrEqual(432);
    expect(hidden!.height).toBeLessThan(100);
    await preview.screenshot({ path: `/tmp/file-spoiler-hidden-${theme.toLowerCase()}-${testInfo.project.name}.png` });
    await reveal.focus();
    await reveal.press("Enter");
    const shown = await preview.locator(".dui-file-spoiler").boundingBox();
    expect(shown!.width).toBeCloseTo(hidden!.width, 0);
    expect(shown!.height).toBeCloseTo(hidden!.height, 0);
    await expect(preview.getByRole("link", { name: "Download guide.pdf", exact: true })).toBeVisible();
    await preview.screenshot({ path: `/tmp/file-spoiler-${theme.toLowerCase()}-${testInfo.project.name}.png` });
    await preview.getByRole("button", { name: "Hide spoiler", exact: true }).press("Enter");
    await expect(reveal).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
});
