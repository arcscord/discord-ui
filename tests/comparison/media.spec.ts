import { expect, test } from "@playwright/test";
import { frameworks } from "../../fixtures/comparison/scenarios";

for (const framework of frameworks) {
  test(`${framework} plays real local video and audio with keyboard controls`, async ({ page }) => {
    const requests: string[] = [];
    const errors: string[] = [];
    page.on("request", request => requests.push(request.url()));
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`/previews/${framework}/?scenario=media&theme=dark&media=block`);
    const capture = page.locator("#capture");
    const video = capture.locator("video").first();
    await expect(video).toHaveAttribute("preload", "none");
    await expect(video).toHaveJSProperty("paused", true);
    await expect(video).toHaveAttribute("poster", "/examples/trail-poster.png");
    const player = capture.locator(".dui-player-video").first();
    await expect(player).toHaveAttribute("data-started", "false");
    await expect(player.locator(".dui-player-controls")).toBeHidden();
    await player.hover();
    const videoDownload = player.locator(".dui-player-download");
    await expect(videoDownload).toHaveAttribute("href", "http://127.0.0.1:4177/examples/trail.webm");
    await expect(videoDownload).toHaveCSS("opacity", "1");
    await player.getByRole("button", { name: "Play", exact: true }).press("Enter");
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
    await player.getByRole("button", { name: "Pause", exact: true }).click();
    await expect(video).toHaveJSProperty("paused", true);
    const seek = player.getByRole("slider", { name: "Playback position", exact: true });
    await seek.focus();
    await seek.press("Home");
    await seek.press("ArrowRight");
    await expect.poll(() => video.evaluate(element => (element as HTMLMediaElement).currentTime)).toBeGreaterThan(0);
    await player.getByRole("button", { name: "Mute", exact: true }).focus();
    const volume = player.getByRole("slider", { name: "Volume", exact: true });
    await volume.focus();
    await volume.press("ArrowDown");
    await expect.poll(() => video.evaluate(element => (element as HTMLMediaElement).volume)).toBeLessThan(1);
    const fullscreen = player.getByRole("button", { name: "Fullscreen", exact: true });
    if (await fullscreen.count()) {
      await fullscreen.click();
      await expect.poll(() => player.evaluate(element => document.fullscreenElement === element)).toBe(true);
      await player.getByRole("button", { name: "Exit fullscreen", exact: true }).click();
      await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
    }
    const voice = capture.locator(".dui-player-voice");
    const audio = voice.locator("audio");
    await expect(voice.locator(".dui-player-download")).toHaveCount(0);
    await expect(voice.locator(".dui-player-title")).toHaveCount(0);
    await expect(voice.locator(".dui-player-time")).not.toContainText("/");
    await expect(voice.locator(".dui-player-timeline .dui-waveform")).toBeVisible();
    await expect(voice.getByRole("slider", { name: "Playback position", exact: true })).toBeVisible();
    await expect(voice.locator(".dui-waveform-bar")).toHaveCount(256);
    const waveformFits = await voice.locator(".dui-waveform").evaluate((waveform) => {
      const bounds = waveform.getBoundingClientRect();
      const lastBar = waveform.lastElementChild!.getBoundingClientRect();
      return lastBar.right <= bounds.right && lastBar.left >= bounds.left;
    });
    expect(waveformFits).toBe(true);
    await voice.getByRole("button", { name: "Play", exact: true }).click();
    await expect.poll(() => audio.evaluate(element => (element as HTMLMediaElement).currentTime)).toBeGreaterThan(0);
    await voice.getByRole("button", { name: "Pause", exact: true }).click();
    await voice.getByRole("button", { name: "Playback speed", exact: true }).click();
    await expect(audio).toHaveJSProperty("playbackRate", 1.5);
    await expect(voice.getByRole("button", { name: "Playback speed", exact: true })).toHaveText("1.5X");
    await expect(voice.getByRole("button", { name: "Playback speed", exact: true })).toHaveAttribute("aria-description", "1.5×");
    await voice.getByRole("button", { name: "Mute", exact: true }).click();
    await expect(audio).toHaveJSProperty("muted", true);
    await expect(capture.getByRole("img", { name: "Arcscord sticker", exact: true })).toBeVisible();
    await expect(capture.getByText(/Sticker format not supported/)).toBeVisible();
    expect(requests.filter(url => url.startsWith("https://example.com/"))).toEqual([]);
    expect(errors).toEqual([]);
  });
}

for (const framework of frameworks) {
  test(`${framework} reports rejected playback without an unhandled error`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("Playback refused", "NotAllowedError"));
    });
    await page.goto(`/previews/${framework}/?scenario=media&theme=dark&media=block`);
    const player = page.locator(".dui-player-video").first();
    await player.getByRole("button", { name: "Play", exact: true }).click();
    await expect(player.getByRole("status")).toContainText("Media unavailable");
    await expect(player.getByRole("button", { name: "Play", exact: true })).toBeEnabled();
    expect(errors).toEqual([]);
  });
}

for (const framework of frameworks) {
  test(`${framework} pauses pending playback without reporting an error`, async ({ page }) => {
    await page.addInitScript(() => {
      const originalPlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        void originalPlay.call(this).catch(() => {});
        return new Promise<void>((_resolve, reject) => {
          this.addEventListener("pause", () => reject(new DOMException("Playback interrupted", "AbortError")), { once: true });
        });
      };
    });
    await page.goto(`/previews/${framework}/?scenario=media&theme=dark&media=block`);
    const player = page.locator(".dui-player-video").first();
    await player.getByRole("button", { name: "Play", exact: true }).click();
    await player.getByRole("button", { name: "Pause", exact: true }).click();
    await expect(player.locator("video")).toHaveJSProperty("paused", true);
    await expect(player.getByRole("button", { name: "Play", exact: true })).toBeVisible();
    await expect(player.getByRole("status")).toHaveCount(0);
  });
}

for (const framework of frameworks) {
  test(`${framework} offers replay after the real video ends`, async ({ page }) => {
    await page.goto(`/previews/${framework}/?scenario=media&theme=dark&media=block`);
    const player = page.locator(".dui-player-video").first();
    const video = player.locator("video");
    await player.getByRole("button", { name: "Play", exact: true }).click();
    await expect.poll(() => video.evaluate(element => (element as HTMLMediaElement).currentTime)).toBeGreaterThan(0);
    await video.evaluate((element) => {
      const media = element as HTMLMediaElement;
      media.currentTime = Math.max(0, media.duration - 0.1);
    });
    await expect(video).toHaveJSProperty("ended", true);
    await expect(player.getByRole("button", { name: "Replay", exact: true })).toBeVisible();
    await expect(player.getByRole("status")).toHaveCount(0);
    await player.getByRole("slider", { name: "Playback position", exact: true }).press("Home");
    await expect(player.getByRole("button", { name: "Play", exact: true })).toBeVisible();
    await expect(video).toHaveJSProperty("ended", false);
  });

  test(`${framework} defers requests until play and reports a failed source`, async ({ page }) => {
    const requests: string[] = [];
    const errors: string[] = [];
    page.on("request", request => requests.push(request.url()));
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/examples/trail.webm", route => route.abort());
    await page.goto(`/previews/${framework}/?scenario=media&theme=dark&media=block`);
    const player = page.locator(".dui-player-video").first();
    await expect(player.getByRole("button", { name: "Play", exact: true })).toBeVisible();
    expect(requests.filter(url => url.includes("trail.webm"))).toEqual([]);
    await player.getByRole("button", { name: "Play", exact: true }).click();
    const fallback = page.getByRole("status").filter({ hasText: "Media unavailable: Trail preview" });
    await expect(fallback).toBeVisible();
    await expect(fallback.getByRole("link", { name: "Download Trail preview", exact: true })).toHaveAttribute("href", "http://127.0.0.1:4177/examples/trail.webm");
    await expect(page.locator("video")).toHaveCount(0);
    expect(requests.filter(url => url.includes("trail.webm"))).toHaveLength(1);
    expect(errors).toEqual([]);
  });

  test(`${framework} preserves allowed attachment downloads after media errors`, async ({ page }) => {
    await page.goto(`/previews/${framework}/?scenario=media&theme=dark&media=block`);
    await expect(page.locator(".dui-player-audio").first().locator(".dui-player-download")).toHaveAttribute("href", "http://127.0.0.1:4177/examples/trail.wav");
    await page.locator("video").first().dispatchEvent("error");
    await page.locator(".dui-player-audio").first().locator("audio").dispatchEvent("error");
    await page.locator(".dui-player-voice audio").dispatchEvent("error");

    const videoFallback = page.getByRole("status").filter({ hasText: "Media unavailable: Trail preview" });
    const videoDownload = videoFallback.getByRole("link", { name: "Download Trail preview", exact: true });
    await expect(videoDownload).toHaveAttribute("href", "http://127.0.0.1:4177/examples/trail.webm");
    await expect(videoDownload).toHaveAttribute("download", "");
    await videoDownload.focus();
    await expect(videoDownload).toBeFocused();

    const audioFallback = page.getByRole("status").filter({ hasText: "Media unavailable: trail.wav" });
    await expect(audioFallback.getByRole("link", { name: "Download trail.wav", exact: true })).toHaveAttribute("href", "http://127.0.0.1:4177/examples/trail.wav");
    for (const name of ["Trail voice note", "Remote video", "Remote audio"]) {
      const fallback = page.getByRole("status").filter({ hasText: `Media unavailable: ${name}` });
      await expect(fallback).toBeVisible();
      await expect(fallback.getByRole("link")).toHaveCount(0);
    }
    await expect(page.locator("video, audio")).toHaveCount(0);
  });
}

for (const framework of frameworks) {
  test(`${framework} exposes vertical volume on hover and keyboard focus in every theme`, async ({ page }) => {
    for (const theme of ["light", "ash", "dark"]) {
      await page.goto(`/previews/${framework}/?scenario=media&theme=${theme}&media=block`);
      const player = page.locator(".dui-player-audio").first();
      const audio = player.locator("audio");
      await player.hover();
      const download = player.locator(".dui-player-download");
      await expect(download).toBeVisible();
      await expect(download).toHaveCSS("opacity", "1");
      await expect(download).toHaveAttribute("href", "http://127.0.0.1:4177/examples/trail.wav");
      await download.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(download).toBeFocused();
      await player.locator(".dui-player-title").click();
      const control = player.locator(".dui-player-volume-control");
      const speaker = control.getByRole("button", { name: "Mute", exact: true });
      const popup = control.locator(".dui-player-volume-popover");
      await expect(control).toHaveAttribute("data-open", "false");
      await speaker.hover();
      await expect(control).toHaveAttribute("data-open", "true");
      const volume = popup.getByRole("slider", { name: "Volume", exact: true });
      const bounds = await volume.boundingBox();
      expect(bounds!.height).toBeGreaterThan(bounds!.width);
      await page.mouse.move(0, 0);
      await expect(control).toHaveAttribute("data-open", "false");
      await speaker.focus();
      await expect(control).toHaveAttribute("data-open", "true");
      await volume.focus();
      await volume.press("ArrowDown");
      await expect.poll(() => audio.evaluate(element => (element as HTMLMediaElement).volume)).toBeLessThan(1);
      await volume.press("Escape");
      await expect(control).toHaveAttribute("data-open", "false");
      await expect(speaker).toBeFocused();
      await speaker.hover();
      await expect(control).toHaveAttribute("data-open", "true");
      await player.locator(".dui-player-time").click();
      await expect(control).toHaveAttribute("data-open", "false");
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
  });
}

for (const framework of frameworks) {
  test(`${framework} keeps buffering feedback over the video frame`, async ({ page }) => {
    await page.goto(`/previews/${framework}/?scenario=media&theme=dark&media=block`);
    const player = page.locator(".dui-player-video").first();
    await player.getByRole("button", { name: "Play", exact: true }).click();
    const video = player.locator("video");
    await expect.poll(() => video.evaluate(element => (element as HTMLMediaElement).currentTime)).toBeGreaterThan(0);
    await video.dispatchEvent("waiting");
    await expect(player.getByRole("status")).toHaveText("Loading media");
    const inside = await player.evaluate((element) => {
      const frame = element.querySelector("video")!.getBoundingClientRect();
      const controls = element.querySelector(".dui-player-controls")!.getBoundingClientRect();
      const status = element.querySelector("[role=status]")!.getBoundingClientRect();
      return controls.bottom <= frame.bottom + 1 && status.top >= frame.top && status.bottom <= frame.bottom;
    });
    expect(inside).toBe(true);
  });
}
