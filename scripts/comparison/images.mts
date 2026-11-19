import type { Buffer } from "node:buffer";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export const pixelThreshold = 0.1;

/** Keep size differences visible by padding to a common transparent canvas. */
export function compareImages(leftBuffer: Buffer, rightBuffer: Buffer): {
  left: { width: number; height: number };
  right: { width: number; height: number };
  dimensionsEqual: boolean;
  changedPixels: number;
  totalPixels: number;
  ratio: number;
  threshold: number;
  diff: Buffer;
} {
  const left = PNG.sync.read(leftBuffer);
  const right = PNG.sync.read(rightBuffer);
  const width = Math.max(left.width, right.width);
  const height = Math.max(left.height, right.height);
  const leftCanvas = new PNG({ width, height });
  const rightCanvas = new PNG({ width, height });
  PNG.bitblt(left, leftCanvas, 0, 0, left.width, left.height, 0, 0);
  PNG.bitblt(right, rightCanvas, 0, 0, right.width, right.height, 0, 0);
  const diff = new PNG({ width, height });
  const changedPixels = pixelmatch(leftCanvas.data, rightCanvas.data, diff.data, width, height, { threshold: pixelThreshold });
  return {
    left: { width: left.width, height: left.height },
    right: { width: right.width, height: right.height },
    dimensionsEqual: left.width === right.width && left.height === right.height,
    changedPixels,
    totalPixels: width * height,
    ratio: changedPixels / (width * height),
    threshold: pixelThreshold,
    diff: PNG.sync.write(diff),
  };
}
