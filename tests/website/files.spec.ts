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
