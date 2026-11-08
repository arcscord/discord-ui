import { execFileSync } from "node:child_process";
import { appendFile, readFile } from "node:fs/promises";
import process from "node:process";
import { releaseMetadata, releasePackages } from "./metadata.mts";

const tag = process.env.RELEASE_TAG ?? "";
const versions = {} as Record<keyof typeof releasePackages, string>;
for (const target of ["core", "react"] as const) {
  const manifest = JSON.parse(await readFile(new URL(`../../${releasePackages[target].directory}/package.json`, import.meta.url), "utf8")) as { version: string };
  versions[target] = manifest.version;
}
const release = releaseMetadata(tag, versions);
execFileSync("git", [
  "merge-base",
  "--is-ancestor",
  "HEAD",
  "origin/main",
], { stdio: "inherit" });
const sha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, Object.entries({ ...release, sha })
    .map(([key, value]) => `${key}=${value}\n`).join(""));
}
process.stdout.write(`Release ${release.packageName}@${release.version} from ${sha} to npm tag ${release.distTag}.\n`);
