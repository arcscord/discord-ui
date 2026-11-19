import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { expect, it } from "vitest";

it.each([
  [
    {
      can_admins_bypass: false,
      protection_rules: [
        {
          type: "required_reviewers",
          reviewers: [
            { id: 1 },
          ],
        },
      ],
    },
    true,
  ],
  [
    {
      can_admins_bypass: true,
      protection_rules: [
        {
          type: "required_reviewers",
          reviewers: [
            { id: 1 },
          ],
        },
      ],
    },
    false,
  ],
  [
    { can_admins_bypass: false, protection_rules: [] },
    false,
  ],
  [
    {
      can_admins_bypass: false,
      protection_rules: [
        { type: "required_reviewers", reviewers: [] },
      ],
    },
    false,
  ],
])("requires active reviewer protection before publishing %j", (environment, succeeds) => {
  const directory = mkdtempSync(join(tmpdir(), "preview-protection-"));
  try {
    const bootstrap = join(directory, "fetch.mjs");
    writeFileSync(bootstrap, `globalThis.fetch = async () => new Response(${JSON.stringify(JSON.stringify(environment))}, {status: 200});`);
    const result = spawnSync(process.execPath, [
      "--import",
      bootstrap,
      resolve("scripts/preview/protection.mts"),
    ], {
      encoding: "utf8",
      env: {
        ...process.env,
        GH_TOKEN: "fixture",
        GITHUB_API_URL: "https://api.github.com",
        GITHUB_REPOSITORY: "owner/repo",
      },
    });
    expect(result.status === 0).toBe(succeeds);
  }
  finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
