import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { root, run } from "../shared/cli.mts";

const image = "discord-ui-comparison:playwright-1.64.1-amd64";
const output = join(root, ".local/comparison-docker");
const args = process.argv.slice(2);
const mounts: string[] = [];
if (args.includes("--use-built")) {
  const built = join(root, "apps/comparison/dist");
  if (!existsSync(join(built, "index.html")))
    throw new Error("Build or download apps/comparison/dist before using --use-built.");
  mounts.push("--mount", `type=bind,source=${built},target=/workspace/apps/comparison/dist,readonly`);
  for (const name of [
    "discord-ui-core",
    "discord-ui",
    "discord-ui-vue",
    "discord-ui-svelte",
  ]) {
    const directory = join(root, "packages", name, "dist");
    if (!existsSync(directory))
      throw new Error(`Build or download packages/${name}/dist before using --use-built.`);
    mounts.push("--mount", `type=bind,source=${directory},target=/workspace/packages/${name}/dist,readonly`);
  }
  if (process.env.BROWSER_BUILD_METADATA) {
    const metadata = join(root, process.env.BROWSER_BUILD_METADATA);
    mounts.push("--mount", `type=bind,source=${metadata},target=/workspace/${process.env.BROWSER_BUILD_METADATA},readonly`);
  }
}
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const dirty = Boolean(execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim());

await run("docker", [
  "build",
  "--platform",
  "linux/amd64",
  "--file",
  "scripts/comparison/Dockerfile",
  "--build-arg",
  `USE_BUILT=${args.includes("--use-built")}`,
  "--tag",
  image,
  ".",
]);
const container = execFileSync("docker", [
  "create",
  "--platform",
  "linux/amd64",
  "--init",
  "--ipc=host",
  ...mounts,
  "--env",
  `COMPARISON_SOURCE_COMMIT=${commit}`,
  "--env",
  `COMPARISON_SOURCE_DIRTY=${dirty}`,
  "--env",
  "GITHUB_RUN_ID",
  "--env",
  "GITHUB_RUN_ATTEMPT",
  "--env",
  "BROWSER_BUILD_METADATA",
  "--env",
  "BROWSER_BUILD_ARTIFACT_ID",
  "--env",
  "BROWSER_BUILD_ARTIFACT_DIGEST",
  "--env",
  "BROWSER_REPORT_MANIFEST",
  image,
  ...args.filter(value => value !== "--use-built"),
], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
}).trim();
if (!/^[a-f\d]{64}$/u.test(container))
  throw new Error("Docker did not return a container ID.");

function stop(): void {
  execFileSync("docker", ["stop", "--time", "5", container], { stdio: "inherit" });
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
try {
  // Inspect the container's exit status independently of the attach command.
  await run("docker", ["start", "--attach", container]).catch(() => undefined);
  const [status, exitCode] = execFileSync("docker", [
    "inspect",
    "--format",
    "{{.State.Status}} {{.State.ExitCode}}",
    container,
  ], { encoding: "utf8" }).trim().split(" ");
  if (status !== "exited")
    throw new Error(`Comparison container did not finish (${status}).`);
  process.exitCode = Number(exitCode);
}
finally {
  try {
    await rm(output, { recursive: true, force: true });
    await mkdir(output, { recursive: true });
    await run("docker", ["cp", `${container}:/workspace/.local/.`, output]);
  }
  finally {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
    await run("docker", ["rm", "--force", container]);
  }
}
process.stdout.write(`Comparison artifacts saved in ${output}\n`);
