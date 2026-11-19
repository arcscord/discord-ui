import { mkdir, mkdtemp, readdir, readFile, rm, symlink, truncate, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prepareStaticSite, staticSiteLimits } from "./static-policy.mts";

let root: string;
let source: string;
let target: string;
async function fixture(path: string, contents = "fixture"): Promise<void> {
  await mkdir(dirname(join(source, path)), { recursive: true });
  await writeFile(join(source, path), contents);
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "static-policy-test-"));
  source = join(root, "source");
  target = join(root, "target");
  for (const path of [
    "index.html",
    "previews/react/index.html",
    "previews/vue/index.html",
    "previews/svelte/index.html",
  ])
    await fixture(path);
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("trusted static preview preparation", () => {
  it("copies static resources and adds trusted response headers", async () => {
    for (const path of [
      "assets/app.js",
      "assets/data.json",
      "fonts/font.woff2",
      "generated/avatars/alice.svg",
    ])
      await fixture(path);
    await prepareStaticSite(source, target);
    expect(await readFile(join(target, "assets/app.js"), "utf8")).toBe("fixture");
    expect(await readFile(join(target, "generated/avatars/alice.svg"), "utf8")).toBe("fixture");
    expect(await readFile(join(target, "_headers"), "utf8")).toBe("/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n");
  });

  it.each([
    "_worker.js",
    "nested/_worker.js",
    "functions/function.js",
    "_routes.json",
    "_redirects",
    "_headers",
    ".git/config",
    ".hidden",
    "node_modules/module.js",
    "assets/../_headers",
    "assets/back\\slash.js",
    "assets/percent%2f.js",
    "assets/trailing.",
    "_WORKER.JS",
  ])("rejects unsafe path %s before publishing", async (path) => {
    await fixture(path);
    await expect(prepareStaticSite(source, target)).rejects.toThrow("Unsafe static artifact path");
    expect(await readdir(root)).toEqual(["source"]);
  });

  it("rejects a worker directory", async () => {
    await mkdir(join(source, "_worker.js"));
    await expect(prepareStaticSite(source, target)).rejects.toThrow("Unsafe static artifact path");
  });

  it.each(["file", "directory"])("rejects %s symbolic links", async (kind) => {
    await symlink(kind === "file"
      ? join(source, "index.html")
      : source, join(source, "linked"));
    await expect(prepareStaticSite(source, target)).rejects.toThrow("symbolic link");
    expect(await readdir(root)).toEqual(["source"]);
  });

  it("rejects a symbolic link source root", async () => {
    const link = join(root, "link");
    await symlink(source, link);
    await expect(prepareStaticSite(link, target)).rejects.toThrow("root must be a directory");
  });

  it.each([
    "index.html",
    "previews/react/index.html",
    "previews/vue/index.html",
    "previews/svelte/index.html",
  ])("requires %s", async (path) => {
    await rm(join(source, path));
    await expect(prepareStaticSite(source, target)).rejects.toThrow(`requires ${path}`);
    expect(await readdir(root)).toEqual(["source"]);
  });

  it("rejects oversized individual files", async () => {
    await fixture("large.js");
    await truncate(join(source, "large.js"), staticSiteLimits.fileBytes + 1);
    await expect(prepareStaticSite(source, target)).rejects.toThrow("size limits");
  });

  it("rejects oversized aggregate content", async () => {
    for (let index = 0; index < 8; index++) {
      await fixture(`${index}.js`);
      await truncate(join(source, `${index}.js`), staticSiteLimits.fileBytes);
    }
    await expect(prepareStaticSite(source, target)).rejects.toThrow("size limits");
  });

  it("rejects excessive directory entries", async () => {
    for (let batch = 0; batch < staticSiteLimits.files; batch += 100) {
      await Promise.all(Array.from({ length: 100 }, (_, index) => mkdir(join(source, `entry-${batch + index}`))));
    }
    await expect(prepareStaticSite(source, target)).rejects.toThrow("too many entries");
    expect(await readdir(root)).toEqual(["source"]);
  });

  it("requires a fresh target", async () => {
    await mkdir(target);
    await writeFile(join(target, "existing"), "keep");
    await expect(prepareStaticSite(source, target)).rejects.toThrow("must not exist");
    expect(await readFile(join(target, "existing"), "utf8")).toBe("keep");
  });

  it("rejects overlapping source and target paths", async () => {
    await expect(prepareStaticSite(source, join(source, "output"))).rejects.toThrow("must be separate");
    await expect(prepareStaticSite(source, source)).rejects.toThrow("must be separate");
    await expect(prepareStaticSite(source, root)).rejects.toThrow("must be separate");
  });
});
