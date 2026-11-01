import { execFileSync } from "node:child_process";
import { appendFile, readFile } from "node:fs/promises";
import process from "node:process";
import { releaseMetadata } from "./metadata.mts";

const tag = process.env.RELEASE_TAG ?? "";
const metadata = JSON.parse(await readFile(new URL("../../packages/discord-ui/package.json", import.meta.url), "utf8")) as { version: string };
const release = releaseMetadata(tag, metadata.version);
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
process.stdout.write(`Release ${release.version} from ${sha} to npm tag ${release.distTag}.\n`);
