import { expect, it } from "vitest";
import { linkUrl, mediaUrl } from "../src/index";

it("rejects executable and protocol-relative URLs while allowing local fixture images", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "//example.com/image.png",
    "/\\example.com/a",
    "/\n/image.png",
  ]) expect(mediaUrl(url)).toBeUndefined();
  expect(mediaUrl("/landscape.svg")).toBe("/landscape.svg");
  expect(mediaUrl("https://example.com/a.png", false)).toBeUndefined();
  expect(linkUrl("https://arcscord.dev")).toBe("https://arcscord.dev");
});

it("allows configured remote origins and paths while leaving other images blocked", () => {
  const allowlist = [
    "https://cdn.discordapp.com/emojis/",
    "https://example.com/single.png",
    "https://assets.example.com",
  ];
  for (const url of [
    "https://cdn.discordapp.com/emojis/123.gif?size=48",
    "https://example.com/single.png?v=2",
    "https://assets.example.com/image.png",
    "/local.svg",
  ]) expect(mediaUrl(url, false, allowlist)).toBe(url);
  for (const url of [
    "https://cdn.discordapp.com/avatars/123.png",
    "https://cdn.discordapp.com/emojis-other/123.gif",
    "https://cdn.discordapp.com/emojis/../avatars/123.png",
    "https://cdn.discordapp.com.evil.example/emojis/123.gif",
    "https://cdn.discordapp.com@evil.example/emojis/123.gif",
    "https:cdn.discordapp.com/emojis/123.gif",
    "https://cdn.discordapp.com:8443/emojis/123.gif",
    "http://cdn.discordapp.com/emojis/123.gif",
    "//cdn.discordapp.com/emojis/123.gif",
    "https://example.com/single.png/extra",
    "https://example.com/other.png",
    "javascript:alert(1)",
  ]) expect(mediaUrl(url, false, allowlist)).toBeUndefined();
  expect(mediaUrl("https://other.example/image.png", true, allowlist)).toBe("https://other.example/image.png");
});

it("ignores malformed allowlist entries", () => {
  const source = "https://cdn.discordapp.com/emojis/123.png";
  expect(mediaUrl(source, false, [
    "*.discordapp.com",
    "//cdn.discordapp.com",
    "https:cdn.discordapp.com",
    "https://user@cdn.discordapp.com",
    "https://cdn.discordapp.com/?query",
    "https://cdn.discordapp.com/#fragment",
  ])).toBeUndefined();
});
