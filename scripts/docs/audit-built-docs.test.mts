import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { auditBuiltDocs } from "./audit-built-docs.mts";

it("checks rendered fragments, escaped example query parameters and local assets", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "discord-ui-docs-audit-"));
  try {
    await mkdir(path.join(directory, "docs"));
    await writeFile(path.join(directory, "index.html"), "<a href=\"/docs/example#stable\">Guide</a><a href=\"/playground?example=message&amp;theme=light\">Example</a><img src=\"/asset.svg\"><a href=\"https://external.invalid\">External</a>");
    await writeFile(path.join(directory, "docs/example.html"), "<h2 id=\"stable\">Stable</h2><a href=\"/#top\">Top</a>");
    await writeFile(path.join(directory, "index.html"), "<div id=\"top\"></div><a href=\"/docs/example#stable\">Guide</a><a href=\"/playground?example=message&amp;theme=light\">Example</a><img src=\"/asset.svg\"><a href=\"https://external.invalid\">External</a>");
    await writeFile(path.join(directory, "playground.html"), "<main>Playground</main>");
    await writeFile(path.join(directory, "asset.svg"), "<svg></svg>");
    await expect(auditBuiltDocs(directory, new Set(["message"]))).resolves.toEqual({
      pages: 3,
      links: 3,
      assets: 1,
      examples: 1,
    });
    await writeFile(path.join(directory, "docs/example.html"), "<h2 id=\"renamed\">Renamed</h2>");
    await expect(auditBuiltDocs(directory, new Set(["message"]))).rejects.toThrow("Missing fragment");
    await writeFile(path.join(directory, "docs/example.html"), "<h2 id=\"stable\">Stable</h2>");
    await expect(auditBuiltDocs(directory, new Set())).rejects.toThrow("Unknown example");
    await rm(path.join(directory, "asset.svg"));
    await expect(auditBuiltDocs(directory, new Set(["message"]))).rejects.toThrow("Missing target");
  }
  finally {
    await rm(directory, { recursive: true, force: true });
  }
});
