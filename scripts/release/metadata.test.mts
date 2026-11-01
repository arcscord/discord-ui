import { describe, expect, it } from "vitest";
import { releaseMetadata } from "./metadata.mts";

describe("release metadata", () => {
  it("publishes stable versions to latest", () => {
    expect(releaseMetadata("v1.2.3", "1.2.3")).toEqual({
      version: "1.2.3",
      distTag: "latest",
      tarball: "arcscord-discord-ui-1.2.3.tgz",
    });
  });

  it.each(["1.0.0-beta.1", "0.1.0-rc.0", "1.0.0-0.alpha-1"])("keeps prerelease %s off latest", (version) => {
    expect(releaseMetadata(`v${version}`, version).distTag).toBe("next");
  });

  it.each([
    "main",
    "1.2.3",
    "v01.2.3",
    "v1.2",
    "v1.2.3-beta.01",
    "v1.2.3+build",
    "v1.2.3\n",
    "v1.2.3;echo bad",
  ])("rejects invalid tag %j", (tag) => {
    expect(() => releaseMetadata(tag, "1.2.3")).toThrow();
  });

  it("rejects a mismatched version and the unpublished placeholder", () => {
    expect(() => releaseMetadata("v1.2.3", "1.2.4")).toThrow();
    expect(() => releaseMetadata("v0.0.0", "0.0.0")).toThrow();
  });
});
