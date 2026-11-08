import { execFileSync } from "node:child_process";
import process from "node:process";
import { verifyPublishedCoreDependency } from "./metadata.mts";

const archive = process.argv[2];
if (!archive || process.argv.length !== 3)
  throw new Error("Usage: node scripts/release/check-dependencies.mts <tarball>.");
const manifest = JSON.parse(execFileSync("tar", ["-xOf", archive, "package/package.json"], { encoding: "utf8" })) as {
  dependencies?: Record<string, string>;
};
const dependency = manifest.dependencies?.["@arcscord/discord-ui-core"];
// A staged core is insufficient: it must already be public for adapter consumers.
verifyPublishedCoreDependency(dependency, (minimum) => {
  return JSON.parse(execFileSync("npm", [
    "view",
    `@arcscord/discord-ui-core@${minimum}`,
    "version",
    "--json",
    "--registry=https://registry.npmjs.org",
  ], { encoding: "utf8" })) as unknown;
});
process.stdout.write("Verified published core dependency requirements.\n");
