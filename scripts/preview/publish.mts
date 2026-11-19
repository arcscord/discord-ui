import { appendFile, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { downloadArtifact, verifyBuild } from "./artifact.mts";
import { prepareStaticSite } from "./static-policy.mts";

const identity = JSON.parse(process.env.EXPECTED_IDENTITY!);
const root = resolve(process.env.RUNNER_TEMP!, `preview-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}`);
await downloadArtifact(String(identity.artifactId), identity.artifactDigest, `${root}/build`);
const testedCheckoutSha = await verifyBuild(`${root}/build`, identity);
await downloadArtifact(String(identity.reportId), identity.reportDigest, `${root}/report`);
const report = JSON.parse(await readFile(`${root}/report/comparison-docker/browser-report-manifest.json`, "utf8"));
if (report.status !== "passed" || report.execution?.runId !== String(identity.runId)
  || report.execution?.runAttempt !== String(identity.runAttempt)
  || report.buildArtifact?.id !== String(identity.artifactId)
  || `sha256:${report.buildArtifact?.digest?.replace(/^sha256:/u, "")}` !== identity.artifactDigest
  || report.build?.testedCheckoutSha !== testedCheckoutSha || !report.tests?.length
  || report.errors?.length) {
  throw new Error("Comparison report is not associated with the approved successful build.");
}
await prepareStaticSite(`${root}/build/apps/comparison/dist`, `${root}/site`);
const metadata = {
  ...identity,
  testedCheckoutSha,
  testCount: report.tests.length,
  ciUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${identity.runId}/attempts/${identity.runAttempt}`,
};
await writeFile(`${root}/site/preview-metadata.json`, `${JSON.stringify(metadata, null, 2)}\n`);
await writeFile(`${root}/site/report.html`, "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><title>Comparison CI evidence</title><h1>Comparison CI evidence</h1><p>Full diagnostics are retained in the linked GitHub Actions run.</p><pre id=\"evidence\"></pre><script>fetch(\"./preview-metadata.json\").then(r=>r.json()).then(data=>{document.getElementById(\"evidence\").textContent=JSON.stringify(data,null,2);const a=document.createElement(\"a\");a.href=data.ciUrl;a.textContent=\"CI run and diagnostic artifacts\";document.body.append(a)})</script></html>");
await appendFile(process.env.GITHUB_OUTPUT!, `site=${root}/site\ntested_sha=${testedCheckoutSha}\n`);
await writeFile(`${root}/metadata.json`, JSON.stringify(metadata));
