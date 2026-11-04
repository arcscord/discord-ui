import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

// Reuse the unmodified Arcscord wordmark in a Discord UI-specific composition.
const root = fileURLToPath(new URL("../../", import.meta.url));
const assets = path.join(root, "apps/website/static");
const logo = await readFile(path.join(assets, "img/brand-wordmark.webp"));
const font = await readFile(path.join(assets, "fonts/inter.woff2"));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
    @font-face { font-family: Inter; src: url(data:font/woff2;base64,${font.toString("base64")}) format("woff2"); }
    * { box-sizing: border-box; }
    body { margin: 0; width: 1200px; height: 630px; padding: 64px 76px; color: #f1f2ff; font-family: Inter, sans-serif; background: radial-gradient(ellipse at 100% 0%, #30245c 0%, transparent 58%), #101020; border-top: 6px solid #227bd3; }
    img { display: block; width: 360px; height: 96px; object-fit: contain; object-position: left center; }
    h1 { margin: 36px 0 18px; font-size: 76px; line-height: 1.05; letter-spacing: -3px; font-weight: 650; }
    p { margin: 0; color: #bfc5db; font-size: 29px; line-height: 1.5; }
    footer { margin-top: 48px; color: #a7a9ff; font-size: 22px; }
  </style></head><body>
    <img alt="Arcscord" src="data:image/webp;base64,${logo.toString("base64")}">
    <h1>Discord UI</h1>
    <p>React components for Discord messages.<br>Markdown · Components V2 · Channels · Threads</p>
    <footer>ui.arcscord.dev</footer>
  </body></html>`);
  await page.evaluate("document.fonts.ready");
  await page.locator("img").evaluate(image => image.decode());
  await page.screenshot({
    path: path.join(assets, "img/social-card.png"),
  });
}
finally {
  await browser.close();
}
