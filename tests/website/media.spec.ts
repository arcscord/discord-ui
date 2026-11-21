import { expect, test } from "@playwright/test";

test("video plays local media and exposes keyboard controls in every theme", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/components?example=video");
  const preview = page.locator(".component-preview");
  const video = preview.locator("video");
  const player = preview.locator(".dui-player-video");
  await expect(video).toHaveAttribute("poster", "/examples/trail-poster.png");
  await expect(player).toHaveAttribute("data-started", "false");
  await expect(player.locator(".dui-player-controls")).toBeHidden();
  await player.hover();
  const videoDownload = player.locator(".dui-player-download");
  await expect(videoDownload).toHaveCSS("opacity", "1");
  await expect(videoDownload).toHaveAttribute("href", "http://127.0.0.1:4174/examples/trail.webm");
  await videoDownload.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(videoDownload).toBeFocused();
  for (const theme of ["Light", "Ash", "Dark"]) {
    await page.getByRole("button", { name: theme, exact: true }).click();
    await expect(video).toHaveAttribute("preload", "none");
    await expect(video).toHaveJSProperty("paused", true);
    const play = preview.getByRole("button", { name: "Play", exact: true });
    await play.focus();
    await play.press("Enter");
    await expect.poll(() => video.evaluate(element => (element as HTMLMediaElement).currentTime)).toBeGreaterThan(0);
    await expect(player).toHaveAttribute("data-started", "true");
    await expect(player.locator(".dui-player-controls")).toBeVisible();
    const overlay = await player.locator(".dui-player-controls").evaluate((element) => {
      const controls = element.getBoundingClientRect();
      const media = element.closest(".dui-player")!.querySelector("video")!.getBoundingClientRect();
      const color = getComputedStyle(element).backgroundColor;
      const alpha = Number(/(?:,|\/)\s*([\d.]+)\)$/.exec(color)?.[1]);
      return { inside: controls.top >= media.top && controls.bottom <= media.bottom + 1, alpha };
    });
    expect(overlay.inside).toBe(true);
    expect(overlay.alpha).toBeGreaterThan(0);
    expect(overlay.alpha).toBeLessThan(1);
    await preview.getByRole("button", { name: "Pause", exact: true }).click();
    await expect(video).toHaveJSProperty("paused", true);
    const seek = preview.getByRole("slider", { name: "Playback position", exact: true });
    await seek.focus();
    await seek.press("Home");
    await seek.press("ArrowRight");
    await expect.poll(() => video.evaluate(element => (element as HTMLMediaElement).currentTime)).toBeGreaterThan(0);
    const volumeControl = preview.locator(".dui-player-volume-control");
    const speaker = volumeControl.getByRole("button", { name: "Mute", exact: true });
    const volumePopup = volumeControl.locator(".dui-player-volume-popover");
    await speaker.hover();
    await expect(volumeControl).toHaveAttribute("data-open", "true");
    await expect(volumePopup).toBeVisible();
    const rail = volumePopup.getByRole("slider", { name: "Volume", exact: true });
    const railBounds = await rail.boundingBox();
    expect(railBounds!.height).toBeGreaterThan(railBounds!.width);
    await page.mouse.move(0, 0);
    await expect(volumeControl).toHaveAttribute("data-open", "false");
    await speaker.focus();
    await expect(volumeControl).toHaveAttribute("data-open", "true");
    await rail.focus();
    const previousVolume = await video.evaluate(element => element.volume);
    await rail.press("ArrowDown");
    await expect.poll(() => video.evaluate(element => element.volume)).toBeLessThan(previousVolume);
    await rail.press("Escape");
    await expect(volumeControl).toHaveAttribute("data-open", "false");
    await expect(speaker).toBeFocused();
    await speaker.hover();
    await expect(volumeControl).toHaveAttribute("data-open", "true");
    await preview.locator(".dui-player-time").click();
    await expect(volumeControl).toHaveAttribute("data-open", "false");
    await preview.getByRole("button", { name: "Mute", exact: true }).click();
    await expect(video).toHaveJSProperty("muted", true);
    await preview.getByRole("button", { name: "Unmute", exact: true }).click();
    await expect(video).toHaveJSProperty("muted", false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
  expect(errors).toEqual([]);
});

test("audio files and voice notes play with distinct presentation and vocal speed", async ({ page }) => {
  await page.goto("/components?example=audio");
  const preview = page.locator(".component-preview");
  await expect(preview.locator(".dui-player-title").first()).toContainText("trail.wav");
  await expect(preview.locator(".dui-player-file-icon")).toBeVisible();
  await expect(preview.locator(".dui-player-size")).toContainText("47 KB");
  await expect(preview.locator(".dui-waveform")).toBeVisible();
  const file = preview.locator(".dui-player-audio").first();
  await file.hover();
  const download = file.locator(".dui-player-download");
  await expect(download).toBeVisible();
  await expect(download).toHaveCSS("opacity", "1");
  await expect(download).toHaveAttribute("href", "http://127.0.0.1:4174/examples/trail.wav");
  await download.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(download).toBeFocused();

  const audio = preview.locator("audio").last();
  const voice = preview.locator(".dui-player-voice");
  await expect(voice.locator(".dui-player-download")).toHaveCount(0);
  await expect(voice.locator(".dui-player-title")).toHaveCount(0);
  await expect(voice.locator(".dui-player-time")).not.toContainText("/");
  await expect(voice.locator(".dui-player-timeline .dui-waveform")).toBeVisible();
  await expect(voice.getByRole("slider", { name: "Playback position", exact: true })).toBeVisible();
  await voice.getByRole("button", { name: "Play", exact: true }).click();
  await expect.poll(() => audio.evaluate(element => (element as HTMLMediaElement).currentTime)).toBeGreaterThan(0);
  await voice.getByRole("button", { name: "Pause", exact: true }).click();
  const speed = voice.getByRole("button", { name: "Playback speed", exact: true });
  await speed.click();
  await expect(audio).toHaveJSProperty("playbackRate", 1.5);
  await expect(speed).toHaveText("1.5X");
  await speed.click();
  await expect(audio).toHaveJSProperty("playbackRate", 2);
  await expect(speed).toHaveText("2X");
  await speed.click();
  await expect(audio).toHaveJSProperty("playbackRate", 1);
  await expect(speed).toHaveText("1X");
});

test("spoilers defer video mounting and remote policies block sources and posters", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto("/playground?example=video");
  const editor = page.getByRole("textbox", { name: "React JSX editor" });
  const original = await editor.inputValue();
  await editor.fill(original.replace("\"kind\": \"video\",", "\"kind\": \"video\", \"spoiler\": true,"));
  const preview = page.locator(".live-panel");
  await expect(preview.locator("video")).toHaveCount(0);
  await preview.getByRole("button", { name: "Reveal spoiler", exact: true }).press("Enter");
  await expect(preview.locator("video")).toHaveCount(1);
  await expect(preview.locator("video")).toHaveJSProperty("paused", true);
  await preview.getByRole("button", { name: "Play", exact: true }).click();
  await expect.poll(() => preview.locator("video").evaluate(element => (element as HTMLMediaElement).currentTime)).toBeGreaterThan(0);
  await editor.fill(original.replace("/examples/trail.webm", "/examples/trail.webm?version=2"));
  await expect(preview.locator("video")).toHaveAttribute("src", "/examples/trail.webm?version=2");
  await expect(preview.locator("video")).toHaveJSProperty("paused", true);
  await expect(preview.locator(".dui-player-video")).toHaveAttribute("data-started", "false");
  await expect(preview.locator(".dui-player-controls")).toBeHidden();
  await expect(preview.locator(".dui-player-seek")).toHaveValue("0");
  await editor.fill(original
    .replace("locale=\"en-US\"", "locale=\"en-US\" allowRemoteMedia={false}")
    .replace("\"url\": \"/examples/trail.webm\",", "\"url\": \"https://example.invalid/blocked.webm\",")
    .replace("\"posterUrl\": \"/examples/trail-poster.png\",", "\"posterUrl\": \"https://example.invalid/poster.png\","));
  await expect(preview.getByText(/Media unavailable/)).toBeVisible();
  await expect(preview.locator("video[src]")).toHaveCount(0);
  expect(requests.filter(url => url.includes("example.invalid"))).toEqual([]);
});

test("stickers render named local images and an explicit Lottie fallback", async ({ page }) => {
  await page.goto("/playground?example=sticker");
  const preview = page.locator(".live-panel");
  await expect(preview.getByRole("img", { name: "Arcscord sticker", exact: true })).toBeVisible();
  const editor = page.getByRole("textbox", { name: "React JSX editor" });
  await editor.fill((await editor.inputValue()).replace("\"format\": \"png\"", "\"format\": \"lottie\""));
  await expect(preview.getByText(/Sticker format not supported/)).toBeVisible();
  await expect(preview.locator("img")).toHaveCount(0);
});

test("video without a supplied poster decodes a first-frame preview before playback", async ({ page }) => {
  await page.goto("/playground?example=video");
  const editor = page.getByRole("textbox", { name: "React JSX editor" });
  await editor.fill((await editor.inputValue()).replace("\"posterUrl\": \"/examples/trail-poster.png\",", ""));
  const preview = page.locator(".live-panel");
  const video = preview.locator("video");
  await expect(video).toHaveAttribute("preload", "metadata");
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2);
  const frame = await video.evaluate((element) => {
    const media = element as HTMLVideoElement;
    const canvas = document.createElement("canvas");
    canvas.width = media.videoWidth;
    canvas.height = media.videoHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(media, 0, 0);
    return { width: canvas.width, height: canvas.height, alpha: context.getImageData(0, 0, 1, 1).data[3] };
  });
  expect(frame).toMatchObject({ width: 240, height: 135 });
  expect(frame.alpha).toBeGreaterThanOrEqual(250);
  await expect(preview.locator(".dui-player-video")).toHaveAttribute("data-started", "false");
  await expect(video).toHaveJSProperty("paused", true);
});

test("the editable media conversation renders all supported message media", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/playground?example=media-conversation");
  const preview = page.locator(".live-panel");
  await expect(preview.locator(".dui-message")).toHaveCount(6);
  await expect(preview.locator("video")).toHaveAttribute("poster", "/examples/trail-poster.png");
  await expect(preview.locator("audio")).toHaveCount(2);
  await expect(preview.locator(".dui-player-voice .dui-waveform")).toBeVisible();
  await expect(preview.getByRole("img", { name: "Arcscord sticker", exact: true })).toBeVisible();
  await expect(preview.getByRole("img", { name: "Illustrated mountains beneath a blue sky", exact: true })).toBeVisible();
  await expect(preview.getByRole("link", { name: "trip-notes.txt", exact: true })).toBeVisible();
  const editor = page.getByRole("textbox", { name: "React JSX editor" });
  const source = await editor.inputValue();
  expect(source).toContain("const mediaConversation =");
  expect(source).toContain("MessageList");
  await editor.fill(source.replace("Ready!", "Ready for the media demo!"));
  await expect(preview.getByText("Ready for the media demo!", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});
