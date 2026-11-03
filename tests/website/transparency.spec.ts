import type { Locator, Page } from "@playwright/test";
import { Buffer } from "node:buffer";
import { expect, test } from "@playwright/test";

const source = `import React from "react";
import { Avatar, Container, DiscordUI, Embed, Media, MediaGallery, Message, Thumbnail } from "@arcscord/discord-ui";
import "@arcscord/discord-ui/styles.css";
const previewTheme = "dark";
const svg = "/examples/transparency-probe.svg";
const png = "/examples/transparency-probe.png";
const author = { id: "transparent", displayName: "Transparent", avatarUrl: svg, avatarFallback: { background: "#00ff00", letter: "T" } };
const media = { id: "probe", url: svg, alt: "Transparent SVG", width: 40, height: 40 };
export default function Preview() {
  return <DiscordUI theme={previewTheme} allowRemoteMedia={false}>
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      <div data-probe="svg-avatar"><Avatar author={author} /></div>
      <div data-probe="png-avatar"><Avatar author={{ ...author, avatarUrl: png }} /></div>
      <div data-probe="png-media"><Media media={{ ...media, url: png, alt: "Transparent PNG" }} /></div>
      <div data-probe="thumbnail"><Thumbnail media={media} /></div>
      <div data-probe="embed"><Embed embed={{ id: "embed", title: "Transparent embed", image: media }} /></div>
      <div data-probe="container" style={{ width: 128, maxWidth: "100%" }}><Container><MediaGallery items={[media]} /></Container></div>
      <div data-probe="interaction"><Message message={{ id: "response", author, timestamp: "2026-11-01T10:00:00Z", ephemeral: true,
        reply: { kind: "interaction", author, commandName: "preview" }, body: { kind: "text", content: "Transparency check" } }} /></div>
      <div data-probe="failed"><Avatar author={{ ...author, avatarUrl: "/examples/broken-probe.png" }} /></div>
      <div data-probe="blocked"><Avatar author={{ ...author, avatarUrl: "https://example.com/blocked-probe.png" }} /></div>
      <div data-probe="blocked-media"><Media media={{ ...media, url: "https://example.com/blocked-probe.png" }} /></div>
    </div>
  </DiscordUI>;
}`;

async function checkCompositing(page: Page, image: Locator) {
  await image.scrollIntoViewIfNeeded();
  await expect(image).toHaveJSProperty("complete", true);
  expect(await image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const screenshot = (await image.screenshot()).toString("base64");
  const background = await image.evaluate((element) => {
    let current: Element | null = element;
    while (current) {
      const color = getComputedStyle(current).backgroundColor;
      if (color !== "rgba(0, 0, 0, 0)" && color !== "transparent")
        return color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
      current = current.parentElement;
    }
    throw new Error("No opaque backdrop found");
  });
  const pixels = await page.evaluate(async (encoded) => {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Screenshot could not be decoded"));
      image.src = `data:image/png;base64,${encoded}`;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    function sample(x: number, y: number) {
      return Array.from(context.getImageData(Math.floor(x * canvas.width), Math.floor(y * canvas.height), 1, 1).data).slice(0, 3);
    }
    return {
      transparent: sample(0.25, 0.5),
      halfRed: sample(0.5, 0.5),
    };
  }, screenshot);
  expect(pixels.transparent).toEqual(background);
  const expected = [(background[0]! + 255) / 2, background[1]! / 2, background[2]! / 2];
  pixels.halfRed.forEach((channel, index) => expect(Math.abs(channel - expected[index]!)).toBeLessThanOrEqual(1));
}

test("PNG and SVG alpha composite against actual theme, embed, container and ephemeral surfaces", async ({ page }, testInfo) => {
  const errors: string[] = [];
  const blockedRequests: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("blocked-probe"))
      blockedRequests.push(request.url());
  });
  await page.route("**/examples/transparency-probe.svg", route => route.fulfill({
    contentType: "image/svg+xml",
    body: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\"><rect x=\"12\" y=\"12\" width=\"8\" height=\"8\" fill=\"red\" fill-opacity=\"0.5\"/></svg>",
  }));
  await page.route("**/examples/broken-probe.png", route => route.fulfill({ contentType: "image/png", body: "Invalid image" }));
  await page.goto("/playground?example=message");
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "rgba(255, 0, 0, 0.5)";
    context.fillRect(12, 12, 8, 8);
    return canvas.toDataURL("image/png").split(",")[1]!;
  });
  await page.route("**/examples/transparency-probe.png", route => route.fulfill({
    contentType: "image/png",
    body: Buffer.from(png, "base64"),
  }));
  await page.getByRole("textbox", { name: "React JSX editor" }).fill(source);
  const preview = page.locator(".live-panel");
  for (const theme of ["Light", "Ash", "Dark"]) {
    await page.getByRole("button", { name: theme, exact: true }).click();
    await expect(preview.locator(".arcscord-discord-ui")).toHaveAttribute("data-theme", theme.toLowerCase());
    for (const probe of [
      "svg-avatar",
      "png-avatar",
      "png-media",
      "thumbnail",
      "embed",
      "container",
    ])
      await checkCompositing(page, preview.locator(`[data-probe="${probe}"] img`).first());
    for (const avatar of await preview.locator("[data-probe=\"interaction\"] .dui-avatar img").all())
      await checkCompositing(page, avatar);
    for (const probe of ["failed", "blocked"]) {
      const avatar = preview.locator(`[data-probe="${probe}"] .dui-avatar`);
      await expect(avatar).toHaveText("T");
      await expect(avatar).toHaveCSS("background-color", "rgb(0, 255, 0)");
      await expect(avatar.locator("img")).toHaveCount(0);
    }
    await expect(preview.locator("[data-probe=\"blocked-media\"] .dui-media-error")).toBeVisible();
  }
  await preview.screenshot({ path: `/tmp/transparency-${testInfo.project.name}.png` });
  expect(blockedRequests).toEqual([]);
  expect(errors).toEqual([]);
});
