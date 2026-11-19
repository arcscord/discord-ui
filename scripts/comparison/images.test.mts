import { Buffer } from "node:buffer";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { compareImages } from "./images.mts";

function image(width: number, height: number, color: number): Buffer {
  const png = new PNG({ width, height });
  for (let index = 0; index < png.data.length; index += 4) {
    png.data[index] = color;
    png.data[index + 1] = color;
    png.data[index + 2] = color;
    png.data[index + 3] = 255;
  }
  return PNG.sync.write(png);
}

describe("comparison image differences", () => {
  it("accepts identical images and detects differences between variants", () => {
    const original = image(8, 8, 255);
    expect(compareImages(original, original).changedPixels).toBe(0);
    const changed = compareImages(original, image(8, 8, 0));
    expect(changed.dimensionsEqual).toBe(true);
    expect(changed.changedPixels).toBe(64);
    expect(PNG.sync.read(changed.diff)).toMatchObject({ width: 8, height: 8 });
  });
  it("reports dimension differences, including identical overlapping pixels", () => {
    const result = compareImages(image(8, 8, 255), image(9, 8, 255));
    expect(result.dimensionsEqual).toBe(false);
    expect(result.left).toEqual({ width: 8, height: 8 });
    expect(result.right).toEqual({ width: 9, height: 8 });
    expect(result.totalPixels).toBe(72);
    expect(result.changedPixels).toBeGreaterThan(0);
  });
  it("rejects corrupt PNG input", () => {
    expect(() => compareImages(Buffer.from("invalid"), image(1, 1, 0))).toThrow();
  });
});
