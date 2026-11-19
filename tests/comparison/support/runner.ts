import type { FrameLocator, Page, TestInfo } from "@playwright/test";
import type { Buffer } from "node:buffer";
import type { NativeEvent, Snapshot } from "../../../apps/comparison/src/previews/protocol";
import type { Framework, ScenarioId } from "../../../fixtures/comparison/scenarios";
import type { VariantGroups } from "../../../scripts/comparison/groups.mts";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { release } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { expect } from "@playwright/test";
import { frameworkNames } from "../../../apps/comparison/src/previews/protocol";
import { frameworks, referenceTime } from "../../../fixtures/comparison/scenarios";
import { classifyVariants } from "../../../scripts/comparison/groups.mts";
import { compareImages } from "../../../scripts/comparison/images.mts";

export type MatrixCase = { scenario: ScenarioId; theme: "light" | "ash" | "dark"; width: number; locale?: "en-US" | "fr-FR"; customTheme?: boolean };
type Action = (document: FrameLocator, framework: Framework) => Promise<void>;
export type ComparisonRunner = {
  load: () => Promise<void>;
  runFramework: (framework: Framework, journey: () => Promise<void>) => Promise<void>;
  checkpoint: (name: string, expectedState: Snapshot, expectedEvents: NativeEvent[], action?: Action) => Promise<void>;
  finish: () => Promise<void>;
};
type Observation = { state: Snapshot; events: { event: NativeEvent; state: Snapshot }[]; accessibility: string; descriptions: unknown; focus: unknown; relationships: unknown; viewport: unknown; scroll: unknown };
type PairComparison = { pair: [Framework, Framework]; visualEqual: boolean; behaviorEqual: boolean; equal: boolean } & ReturnType<typeof compareImages>;
type Checkpoint = { name: string; expectedState: Snapshot; expectedEvents: NativeEvent[]; captures: Capture[]; failures: { framework: Framework; error: string }[] };
type GroupResult = VariantGroups<Framework> | { status: "incomplete"; groups: Framework[][]; outliers: Framework[]; missing: Framework[] };
type Capture = { framework: Framework; image: Buffer; observation: Observation };
const root = fileURLToPath(new URL("../../../", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { devDependencies: Record<string, string> };
const gitCommit = process.env.COMPARISON_SOURCE_COMMIT ?? (existsSync(join(root, ".git"))
  ? execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim()
  : null);
const dirty = process.env.COMPARISON_SOURCE_DIRTY !== undefined
  ? process.env.COMPARISON_SOURCE_DIRTY === "true"
  : existsSync(join(root, ".git"))
    ? Boolean(execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim())
    : null;
const pairIndices = [
  [0, 1],
  [0, 2],
  [1, 2],
] as const;

function description(result: GroupResult): string {
  if (result.status === "incomplete")
    return `Incomplete — missing ${result.missing.map(value => frameworkNames[value]).join(", ")}`;
  if (result.status === "identical")
    return `${frameworks.length} identical`;
  if (result.status === "all-different")
    return "All different";
  if (result.status === "mixed")
    return "Mixed pairwise similarities";
  return result.groups.map(group => `${group.map(value => frameworkNames[value]).join(" + ")}${group.length > 1
    ? " identical"
    : " different"}`).join(" · ");
}

function buildDigest(directory: string): string {
  const hash = createHash("sha256");
  function visit(path: string): void {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const target = join(path, entry.name);
      if (entry.isDirectory()) {
        visit(target);
      }
      else {
        hash.update(target.slice(directory.length));
        hash.update(readFileSync(target));
      }
    }
  }
  visit(directory);
  return hash.digest("hex");
}
const assetDigest = buildDigest(join(root, "apps/comparison/dist"));

export function createRunner(page: Page, info: TestInfo, matrix: MatrixCase): ComparisonRunner {
  const startedAt = Date.now();
  const errors: string[] = [];
  let currentCheckpoint = "loading";
  const frameworkFailures: { framework: Framework; error: string }[] = [];
  let currentFramework: Framework = "react";
  const checkpoints = new Map<string, Checkpoint>();
  const frame = (framework: Framework): FrameLocator => page.frameLocator(`#${framework}-viewport`);
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(message.text());
  });
  async function selectFramework(framework: Framework): Promise<void> {
    if (matrix.width === 1280) {
      const returning = page.getByRole("button", { name: "Return to three previews", exact: true });
      if (await returning.count())
        await returning.click();
      await page.getByRole("button", { name: `Expand ${frameworkNames[framework]}`, exact: true }).click();
    }
    for (const renderer of frameworks)
      await expect(page.locator(`[data-framework="${renderer}"]`)).toHaveAttribute("data-status", "ready");
  }
  function reproduction(framework: Framework): string {
    return new URL(`/?${new URLSearchParams({
      scenario: matrix.scenario,
      theme: matrix.theme,
      locale: matrix.locale ?? "en-US",
      customTheme: String(matrix.customTheme ?? false),
      media: "block",
      focus: matrix.width === 1280
        ? framework
        : "all",
      width: String(matrix.width),
      checkpoint: currentCheckpoint,
      framework,
    })}`, String(info.project.use.baseURL)).href;
  }
  async function capture(framework: Framework): Promise<Capture> {
    const document = frame(framework);
    await expect(document.locator("html")).toHaveAttribute("data-status", "ready");
    await document.locator("html").evaluate(async () => {
      await window.document.fonts.ready;
      await Promise.all(Array.from(window.document.images, (image) => {
        image.loading = "eager";
        return image.decode().catch(() => undefined);
      }));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const observation = await document.locator("html").evaluate(() => {
      const state = JSON.parse(window.document.querySelector("#state")!.textContent!) as Snapshot;
      const lines = window.document.querySelector("#events")!.textContent!.trim();
      const events = lines
        ? lines.split("\n").map(line => JSON.parse(line) as { event: NativeEvent; state: Snapshot })
        : [];
      function identity(element: Element | null): unknown {
        if (!element)
          return null;
        return {
          tag: element.tagName,
          role: element.getAttribute("role"),
          label: element.getAttribute("aria-label"),
          value: element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
            ? element.value
            : undefined,
        };
      }
      // Reference graphs retain label/control relationships while omitting native ID spellings.
      const relationships = Array.from(window.document.querySelectorAll("[aria-labelledby], [aria-describedby], [aria-activedescendant], [aria-controls]")).flatMap((element) => {
        return [
          "aria-labelledby",
          "aria-describedby",
          "aria-activedescendant",
          "aria-controls",
        ].filter(attribute => element.hasAttribute(attribute)).map((attribute) => {
          const targets = element.getAttribute(attribute)!.split(/\s+/u).map(id => window.document.getElementById(id));
          if (targets.some(target => !target) && (attribute !== "aria-controls" || element.getAttribute("aria-expanded") === "true"))
            throw new Error(`Broken ${attribute} reference`);
          return {
            element: identity(element),
            attribute,
            targets: targets.map(identity),
          };
        });
      });
      return {
        state,
        events,
        focus: identity(window.document.activeElement),
        relationships,
        viewport: { width: innerWidth, height: innerHeight },
        scroll: Array.from(window.document.querySelectorAll(".dui-channel-history")).map(element => ({ top: element.scrollTop, height: element.clientHeight, extent: element.scrollHeight })),
      };
    });
    const accessibility = await document.locator("#capture").ariaSnapshot();
    // Chromium computes descriptions using rendered accessible text, including flex boundaries.
    const session = await page.context().newCDPSession(page);
    let descriptions: unknown;
    try {
      const { frameTree } = await session.send("Page.getFrameTree");
      const nativeFrame = frameTree.childFrames?.find((item: { frame: { url: string } }) => item.frame.url.includes(`/previews/${framework}/`));
      if (!nativeFrame)
        throw new Error(`Missing ${framework} accessibility frame`);
      const { nodes } = await session.send("Accessibility.getFullAXTree", { frameId: nativeFrame.frame.id }) as { nodes: { ignored: boolean; role?: { value: string }; name?: { value: string }; description?: { value: string } }[] };
      descriptions = nodes.filter(node => !node.ignored && node.description).map(node => ({ role: node.role?.value, name: node.name?.value, description: node.description?.value }));
    }
    finally { await session.detach(); }
    // Snap only the outer test frame to CSS pixels to avoid fractional-clip extra rows.
    await page.locator(`#${framework}-viewport`).evaluate((element) => {
      const iframe = element as HTMLElement;
      iframe.style.transform = "";
      const bounds = iframe.getBoundingClientRect();
      iframe.style.transform = `translate(${Math.round(bounds.x) - bounds.x}px, ${Math.round(bounds.y) - bounds.y}px)`;
    });
    const image = await document.locator("#capture").screenshot({ animations: "disabled", caret: "hide", scale: "css" });
    return {
      framework,
      observation: { ...observation, accessibility, descriptions },
      image,
    };
  }
  async function attachImages(name: string, captures: Capture[], pairs: PairComparison[]): Promise<void> {
    for (const item of captures) {
      const path = info.outputPath(`${name}-${item.framework}.png`);
      writeFileSync(path, item.image);
      await info.attach(`${name}-${item.framework}`, { path, contentType: "image/png" });
    }
    for (const comparison of pairs) {
      const title = `${name}-${comparison.pair.join("-")}-diff`;
      const path = info.outputPath(`${title}.png`);
      writeFileSync(path, comparison.diff);
      await info.attach(title, { path, contentType: "image/png" });
    }
  }
  async function checkpoint(name: string, expectedState: Snapshot, expectedEvents: NativeEvent[], action?: Action): Promise<void> {
    currentCheckpoint = name;
    const entry = checkpoints.get(name) ?? {
      name,
      expectedState,
      expectedEvents,
      captures: [],
      failures: [],
    };
    checkpoints.set(name, entry);
    const framework = currentFramework;
    let actionError: unknown;
    try {
      await action?.(frame(framework), framework);
    }
    catch (error) {
      actionError = error;
    }
    try {
      const item = await capture(framework);
      entry.captures.push(item);
      const expectationsMatch = isDeepStrictEqual(item.observation.state, expectedState)
        && isDeepStrictEqual(item.observation.events.map(value => value.event), expectedEvents)
        && isDeepStrictEqual(item.observation.viewport, { width: matrix.width, height: 844 });
      if (!expectationsMatch)
        entry.failures.push({ framework, error: "Expected state, events or viewport differ." });
      expect.soft(item.observation.state, `${framework} expected state at ${name}`).toEqual(expectedState);
      expect.soft(item.observation.events.map(value => value.event), `${framework} native event order/payloads at ${name}`).toEqual(expectedEvents);
      expect.soft(item.observation.viewport).toEqual({ width: matrix.width, height: 844 });
    }
    catch (error) {
      entry.failures.push({
        framework,
        error: String(error),
      });
      throw error;
    }
    if (actionError) {
      entry.failures.push({
        framework,
        error: String(actionError),
      });
      throw actionError;
    }
  }
  return {
    async load(): Promise<void> {
      // Vue event timestamps require a progressing clock for event propagation.
      await page.clock.install({
        time: new Date(referenceTime),
      });
      await page.goto(`/?${new URLSearchParams({
        scenario: matrix.scenario,
        theme: matrix.theme,
        locale: matrix.locale ?? "en-US",
        media: "block",
        width: String(matrix.width),
        customTheme: String(matrix.customTheme ?? false),
      })}`);
      for (const renderer of frameworks) {
        await expect(page.locator(`[data-framework="${renderer}"]`)).toHaveAttribute("data-status", "ready");
        await expect(frame(renderer).locator("html")).toHaveAttribute("lang", matrix.locale ?? "en-US");
        await expect(frame(renderer).locator(".arcscord-discord-ui")).toHaveAttribute("data-theme", matrix.customTheme ? "comparison-custom" : matrix.theme);
        if (matrix.customTheme)
          await expect(frame(renderer).locator(".arcscord-discord-ui")).toHaveCSS("--discord-ui-accent", "#a45de3");
      }
    },
    async runFramework(framework, journey): Promise<void> {
      currentFramework = framework;
      try {
        await selectFramework(framework);
        await journey();
      }
      catch (error) {
        frameworkFailures.push({
          framework,
          error: String(error),
        });
        expect.soft(error, `${framework} journey failed`).toBeUndefined();
      }
    },
    checkpoint,
    async finish(): Promise<void> {
      const reports = [];
      const allPairs: PairComparison[][] = [];
      const summaries = [
        "# Variant uniformity",
        "",
        `Scenario ${matrix.scenario} · ${matrix.theme} · ${matrix.width} px`,
        "",
        "| Checkpoint | Visual | Behavior/accessibility | Combined | Expected behavior |",
        "| --- | --- | --- | --- | --- |",
      ];
      const missing = new Set<Framework>();
      for (const entry of checkpoints.values()) {
        currentCheckpoint = entry.name;
        const captures = frameworks.map(framework => entry.captures.find(item => item.framework === framework));
        const absent = frameworks.filter((_, index) => !captures[index]);
        absent.forEach(framework => missing.add(framework));
        const pairs: PairComparison[] = [];
        for (const [left, right] of pairIndices) {
          const first = captures[left];
          const second = captures[right];
          if (!first || !second)
            continue;
          const comparison = compareImages(first.image, second.image);
          const visualEqual = comparison.dimensionsEqual && comparison.changedPixels === 0;
          const behaviorEqual = isDeepStrictEqual(first.observation, second.observation);
          pairs.push({
            pair: [first.framework, second.framework],
            ...comparison,
            visualEqual,
            behaviorEqual,
            equal: visualEqual && behaviorEqual,
          });
          expect.soft(comparison.dimensionsEqual, `${entry.name} image dimensions`).toBe(true);
          expect.soft(comparison.left).toEqual({ width: matrix.width, height: 844 });
          expect.soft(comparison.changedPixels, `${entry.name} ${first.framework}/${second.framework} changed pixels`).toBe(0);
          expect.soft(first.observation, `${entry.name} ${first.framework}/${second.framework} behavior/accessibility`).toEqual(second.observation);
        }
        allPairs.push(pairs);
        function classify(field: "visualEqual" | "behaviorEqual" | "equal"): GroupResult {
          return absent.length
            ? {
                status: "incomplete",
                groups: [],
                outliers: [],
                missing: absent,
              }
            : classifyVariants(frameworks, pairs.map(pair => ({ pair: pair.pair, equal: pair[field] })));
        }
        const result = {
          visual: classify("visualEqual"),
          behavior: classify("behaviorEqual"),
          combined: classify("equal"),
        };
        const failed = absent.length > 0 || entry.failures.length > 0 || pairs.some(pair => !pair.equal);
        if (failed)
          await attachImages(entry.name, entry.captures, pairs);
        summaries.push(`| ${entry.name} | ${description(result.visual)} | ${description(result.behavior)} | ${description(result.combined)} | ${entry.failures.length
          ? "Failed"
          : absent.length ? "Incomplete" : "Passed"} |`);
        reports.push({
          checkpoint: entry.name,
          result,
          expectedState: entry.expectedState,
          expectedEvents: entry.expectedEvents,
          failures: entry.failures,
          observations: entry.captures.map(({ framework, observation }) => ({
            framework,
            url: reproduction(framework),
            ...observation,
          })),
          differences: pairs.map(({ diff: _diff, ...metrics }) => metrics),
        });
      }
      function aggregate(field: "visualEqual" | "behaviorEqual" | "equal"): GroupResult {
        if (missing.size || !allPairs.length) {
          return {
            status: "incomplete",
            groups: [],
            outliers: [],
            missing: allPairs.length
              ? [...missing]
              : [...frameworks],
          };
        }
        return classifyVariants(frameworks, pairIndices.map(([left, right]) => ({
          pair: [frameworks[left], frameworks[right]],
          equal: allPairs.every(pairs => pairs.find(pair => pair.pair[0] === frameworks[left] && pair.pair[1] === frameworks[right])?.[field] === true),
        })));
      }
      const result = {
        visual: aggregate("visualEqual"),
        behavior: aggregate("behaviorEqual"),
        combined: aggregate("equal"),
      };
      info.annotations.push({
        type: "uniformity",
        description: description(result.combined),
      });
      summaries.splice(4, 0, `Overall — ${description(result.combined)}`, "");
      const summaryPath = info.outputPath("comparison-summary.md");
      writeFileSync(summaryPath, `${summaries.join("\n")}\n`);
      await info.attach("variant-uniformity", { path: summaryPath, contentType: "text/markdown" });
      const path = info.outputPath("comparison-evidence.json");
      writeFileSync(path, JSON.stringify({
        schemaVersion: 2,
        durationMs: Date.now() - startedAt,
        result,
        matrix,
        gitCommit,
        dirty,
        assetDigest,
        environment: process.env.COMPARISON_CONTAINER_ENV ?? "native",
        platform: process.platform,
        architecture: process.arch,
        osRelease: release(),
        nodeVersion: process.version,
        browser: page.context().browser()?.version(),
        deviceScaleFactor: 1,
        locale: matrix.locale ?? "en-US",
        timeZone: "UTC",
        referenceTime,
        rendererVersions: Object.fromEntries([
          "react",
          "react-dom",
          "vue",
          "svelte",
          "@playwright/test",
          "pixelmatch",
          "pngjs",
        ].map(name => [name, manifest.devDependencies[name]])),
        packageVersions: Object.fromEntries([
          "discord-ui",
          "discord-ui-vue",
          "discord-ui-svelte",
          "discord-ui-core",
        ].map(name => [name, (JSON.parse(readFileSync(join(root, "packages", name, "package.json"), "utf8")) as { version: string }).version])),
        runId: process.env.GITHUB_RUN_ID ?? null,
        attempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
        retry: info.retry,
        errors,
        frameworkFailures,
        checkpoints: reports,
      }, null, 2));
      await info.attach("comparison-evidence", { path, contentType: "application/json" });
      expect.soft(errors, "Native runtime/console errors").toEqual([]);
    },
  };
}
