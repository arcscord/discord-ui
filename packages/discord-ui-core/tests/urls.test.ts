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
