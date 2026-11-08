import { describe, expect, it } from "vitest";
import { coreMinimumVersion, releaseMetadata, releaseTarget, verifyPublishedCoreDependency } from "./metadata.mts";

const versions = { react: "1.2.3", core: "0.2.4" };
describe("independent release metadata", () => {
  it("selects React while allowing a different core version", () => {
    expect(releaseMetadata("v1.2.3", versions)).toEqual({
      version: "1.2.3",
      distTag: "latest",
      tarball: "arcscord-discord-ui-1.2.3.tgz",
      packageName: "@arcscord/discord-ui",
      directory: "packages/discord-ui",
    });
  });
  it("selects only the core artifact", () => {
    expect(releaseMetadata("core-v0.2.4", versions)).toEqual({
      version: "0.2.4",
      distTag: "latest",
      tarball: "arcscord-discord-ui-core-0.2.4.tgz",
      packageName: "@arcscord/discord-ui-core",
      directory: "packages/discord-ui-core",
    });
  });
  it.each(["1.0.0-beta.1", "0.1.0-rc.0", "1.0.0-0.alpha-1"])("keeps prerelease %s off latest", (version) => {
    expect(releaseMetadata(`v${version}`, { ...versions, react: version }).distTag).toBe("next");
    expect(releaseMetadata(`core-v${version}`, { ...versions, core: version }).distTag).toBe("next");
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
    "core-v01.2.3",
    "vue-v1.2.3",
  ])("rejects invalid tag %j", (tag) => {
    expect(() => releaseTarget(tag)).toThrow();
  });
  it("rejects mismatches only for the targeted package", () => {
    expect(() => releaseMetadata("v1.2.4", versions)).toThrow();
    expect(() => releaseMetadata("core-v0.2.3", versions)).toThrow();
    expect(() => releaseMetadata("v0.0.0", { ...versions, react: "0.0.0" })).toThrow();
    expect(() => releaseMetadata("core-v0.0.0", { ...versions, core: "0.0.0" })).toThrow();
  });
});
describe("minimum published core dependency", () => {
  it.each([
    "^0.2.0",
    "~0.2.0",
    "0.2.0",
    "^0.2.0-beta.1",
  ])("extracts the exact minimum from %s", (range) => {
    expect(coreMinimumVersion(range)).toBe(range.replace(/^[~^]/u, ""));
  });
  it.each([
    "workspace:^",
    "*",
    "latest",
    ">=0.2.0",
    "^0.2.0 || ^0.3.0",
    "^0.2.0\n",
    "^00.2.0",
  ])("rejects ambiguous or unpublished range %j", (range) => {
    expect(() => coreMinimumVersion(range)).toThrow();
  });
});

describe("published core requirement before adapter staging", () => {
  it("does not query the registry for a core-only release", () => {
    verifyPublishedCoreDependency(undefined, () => {
      throw new Error("Unexpected lookup");
    });
  });
  it("checks the dependency minimum independently of current workspace versions", () => {
    const requested: string[] = [];
    verifyPublishedCoreDependency("^0.2.0", (version) => {
      requested.push(version);
      return "0.2.0";
    });
    expect(requested).toEqual(["0.2.0"]);
  });
  it("blocks unavailable, unapproved or mismatched core versions", () => {
    for (const lookup of [
      () => undefined,
      () => "0.2.1",
      () => {
        throw new Error("Registry 404");
      },
    ])
      expect(() => verifyPublishedCoreDependency("^0.2.0", lookup)).toThrow("Publish and approve @arcscord/discord-ui-core@0.2.0");
  });
});
