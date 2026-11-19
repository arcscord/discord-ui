import { Buffer } from "node:buffer";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

export async function downloadArtifact(id: string, digest: string, destination: string): Promise<void> {
  if (!/^\d+$/u.test(id) || !/^sha256:[a-f\d]{64}$/u.test(digest))
    throw new Error("Invalid artifact identity.");
  const response = await fetch(`${process.env.GITHUB_API_URL}/repos/${process.env.GITHUB_REPOSITORY}/actions/artifacts/${id}/zip`, {
    headers: { authorization: `Bearer ${process.env.GH_TOKEN}`, accept: "application/vnd.github+json" },
  });
  if (!response.ok || !response.body)
    throw new Error(`Artifact download failed (${response.status}).`);
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > 600 * 1024 * 1024)
      throw new Error("Artifact archive exceeds download limit.");
    chunks.push(chunk);
  }
  const archive = Buffer.concat(chunks);
  if (`sha256:${createHash("sha256").update(archive).digest("hex")}` !== digest)
    throw new Error("Artifact archive digest mismatch.");
  await mkdir(resolve(destination, ".."), { recursive: true });
  await writeFile(`${destination}.zip`, archive);
  execFileSync("python3", ["scripts/preview/extract.py", `${destination}.zip`, destination]);
}

export async function verifyBuild(root: string, identity: {
  runId: string;
  runAttempt: string;
  headSha: string;
  prNumber: number;
  headRepository: string;
}): Promise<string> {
  const metadata = JSON.parse(await readFile(resolve(root, ".local/browser-build/metadata.json"), "utf8"));
  if (metadata.schemaVersion !== 1 || metadata.repository !== process.env.GITHUB_REPOSITORY
    || metadata.repositoryId !== process.env.GITHUB_REPOSITORY_ID || metadata.workflow !== "CI"
    || metadata.event !== "pull_request" || String(metadata.runId) !== String(identity.runId)
    || !Number.isInteger(Number(metadata.runAttempt)) || Number(metadata.runAttempt) < 1 || Number(metadata.runAttempt) > Number(identity.runAttempt)
    || metadata.sourcePullRequest?.headSha !== identity.headSha
    || metadata.sourcePullRequest?.number !== identity.prNumber
    || metadata.sourcePullRequest?.repository !== identity.headRepository
    || !/^[a-f\d]{40}$/u.test(metadata.testedCheckoutSha)
    || metadata.eventSha !== metadata.testedCheckoutSha) {
    throw new Error("Build metadata does not match the approved CI revision.");
  }
  return metadata.testedCheckoutSha as string;
}
