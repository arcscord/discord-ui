import type { RequestListener } from "node:http";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { chromium, expect } from "@playwright/test";
import { pnpm, root, run } from "../shared/cli.mts";

const name = "@arcscord/discord-ui-svelte";
const core = "@arcscord/discord-ui-core";

type ConsumerTarget = { svelte: string; framework: "vite" | "sveltekit" };

async function verifyHydration(handler: RequestListener): Promise<void> {
  const server = createServer(handler);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  try {
    const address = server.address();
    assert(address && typeof address !== "string");
    const url = `http://127.0.0.1:${address.port}`;
    const response = await fetch(url);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /<strong>(?:<!--[^>]*-->)*Packed message/u);
    assert.match(html, /data-hydrated="false"/u);
    assert.match(html, /dui-code-block/u);
    const description = html.match(/aria-describedby="([^"]+)"/u)?.[1];
    assert(description);
    assert(html.includes(`id="${description}"`));

    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error" || /hydration.*mismatch/iu.test(message.text()))
          errors.push(message.text());
      });
      await page.goto(url);
      await expect(page.locator("[data-hydrated=true]")).toBeVisible();
      const thread = page.getByRole("button", { name: /Open thread Packed thread/ });
      await expect(thread).toHaveAttribute("aria-describedby", description);
      await thread.click();
      await expect(page.getByRole("status")).toHaveText("Opened");
      const combo = page.getByRole("combobox", { name: "Packed users" });
      await combo.fill("bet");
      await combo.press("ArrowDown");
      await combo.press("Enter");
      await expect(page.getByRole("button", { name: "Remove Beta" })).toBeVisible();
      const composer = page.getByRole("textbox", { name: "Message #packed" });
      await composer.fill("Packed send");
      await composer.press("Enter");
      await expect(page.getByRole("status")).toHaveText("Sent: Packed send");
      await expect(page.locator(".arcscord-discord-ui")).toHaveCSS("--discord-ui-accent", "#7733aa");
      await expect(page.locator(".dui-select")).toHaveCSS("position", "relative");
      assert.deepEqual(errors, []);
    }
    finally {
      await browser.close();
    }
  }
  finally {
    await new Promise<void>((resolve, reject) => server.close(error => error
      ? reject(error)
      : resolve()));
  }
}

function staticHandler(directory: string): RequestListener {
  const files: Record<string, string> = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html" };
  return (request, response) => {
    const { pathname } = new URL(request.url ?? "/", "http://localhost");
    if (pathname === "/favicon.ico") {
      response.writeHead(204).end();
      return;
    }
    const asset = /^\/assets\/([\w.-]+\.(?:js|css))$/u.exec(pathname)?.[1];
    const file = pathname === "/"
      ? join(directory, "index.html")
      : asset && join(directory, "assets", asset);
    if (!file) {
      response.writeHead(404).end();
      return;
    }
    void readFile(file).then((data) => {
      response.setHeader("Content-Type", files[extname(file)] ?? "application/octet-stream");
      response.end(data);
    }, () => response.writeHead(404).end());
  };
}

async function verifyConsumer(archive: string, coreArchive: string, toolchain: Record<string, string>, target: ConsumerTarget): Promise<void> {
  const consumer = await mkdtemp(join(tmpdir(), "discord-ui-svelte-consumer-"));
  const kit = target.framework === "sveltekit";
  async function put(file: string, contents: string): Promise<void> {
    const path = join(consumer, file);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents);
  }

  try {
    await put("package.json", JSON.stringify({
      private: true,
      type: "module",
      dependencies: { [name]: `file:${archive}`, [core]: `file:${coreArchive}`, svelte: target.svelte },
      devDependencies: {
        "@sveltejs/vite-plugin-svelte": toolchain["@sveltejs/vite-plugin-svelte"],
        "svelte-check": toolchain["svelte-check"],
        "typescript": toolchain.typescript,
        "vite": toolchain.vite,
        ...(kit
          ? { "@sveltejs/kit": "3.2.0", "@sveltejs/adapter-node": "6.0.2" }
          : {}),
      },
    }));
    await put("pnpm-workspace.yaml", `packages: []\nhoist: false\noverrides:\n  ${JSON.stringify(core)}: ${JSON.stringify(`file:${coreArchive}`)}\n`);
    await put("tsconfig.json", JSON.stringify({
      ...(kit
        ? { extends: "$app/tsconfig" }
        : {}),
      compilerOptions: {
        strict: true,
        exactOptionalPropertyTypes: true,
        noEmit: true,
        target: "ES2022",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        module: "ESNext",
        moduleResolution: "Bundler",
        verbatimModuleSyntax: true,
        skipLibCheck: true,
      },
      include: ["App.svelte", "src/**/*.svelte", "readme.svelte"],
    }));
    const example = await readFile(new URL("./fixtures/SvelteConsumer.svelte", import.meta.url), "utf8");
    await put(kit ? "src/routes/+page.svelte" : "App.svelte", example);
    const readme = execFileSync("tar", ["-xOf", archive, "package/README.md"], { encoding: "utf8" });
    const readmeExample = readme.match(/^\x60{3}svelte\n([\s\S]*?)^\x60{3}/mu)?.[1];
    assert(readmeExample);
    await put("readme.svelte", readmeExample);

    await put("runtime.mjs", [
      "import assert from \"node:assert/strict\";",
      "import { createRequire } from \"node:module\";",
      "import { readFile } from \"node:fs/promises\";",
      "import { defineTheme } from \"@arcscord/discord-ui-svelte/themes\";",
      "const require = createRequire(import.meta.url);",
      "for (const peer of [\"react\", \"react-dom\", \"vue\", \"@arcscord/discord-ui\", \"@arcscord/discord-ui-vue\"])",
      "  assert.throws(() => require.resolve(peer));",
      "assert.equal(defineTheme({ name: \"packed\" }).base, \"dark\");",
      "const css = await readFile(new URL(import.meta.resolve(\"@arcscord/discord-ui-svelte/styles.css\")), \"utf8\");",
      "assert.equal(css, await readFile(new URL(import.meta.resolve(\"@arcscord/discord-ui-core/styles.css\")), \"utf8\"));",
    ].join("\n"));
    await pnpm(["install", "--no-frozen-lockfile", "--ignore-scripts"], consumer);
    await run(process.execPath, ["runtime.mjs"], consumer);

    if (kit) {
      await put("vite.config.mjs", [
        "import adapter from \"@sveltejs/adapter-node\";",
        "import { sveltekit } from \"@sveltejs/kit/vite\";",
        "export default { plugins: [sveltekit({ adapter: adapter() })] };",
      ].join("\n"));
      await put("src/app.html", "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><link rel=\"icon\" href=\"data:,\">%sveltekit.head%</head><body><div style=\"display: contents\">%sveltekit.body%</div></body></html>");
      await pnpm(["exec", "svelte-kit", "sync"], consumer);
    }
    else {
      await put("vite.config.mjs", "import { svelte } from \"@sveltejs/vite-plugin-svelte\"; export default { plugins: [svelte()] };");
      await put("index.html", "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"></head><body><div id=\"app\"><!--SSR_APP--></div><script type=\"module\" src=\"/client.ts\"></script></body></html>");
      await put("client.ts", [
        "import { hydrate } from \"svelte\";",
        "import App from \"./App.svelte\";",
        "hydrate(App, { target: document.getElementById(\"app\")!, recover: false });",
      ].join("\n"));
      await put("server.ts", [
        "import { readFile, writeFile } from \"node:fs/promises\";",
        "import { render } from \"svelte/server\";",
        "import App from \"./App.svelte\";",
        "const { body } = render(App, { idPrefix: \"packed\" });",
        "const page = await readFile(\"dist/index.html\", \"utf8\");",
        "await writeFile(\"dist/index.html\", page.replace(\"<!--SSR_APP-->\", () => body));",
      ].join("\n"));
    }

    await pnpm([
      "exec",
      "svelte-check",
      "--tsconfig",
      "./tsconfig.json",
      "--fail-on-warnings",
    ], consumer);
    await pnpm(["exec", "vite", "build"], consumer);
    if (kit) {
      const { handler } = await import(pathToFileURL(join(consumer, "build/handler.js")).href) as { handler: RequestListener };
      await verifyHydration(handler);
    }
    else {
      await pnpm([
        "exec",
        "vite",
        "build",
        "--ssr",
        "server.ts",
        "--outDir",
        "ssr",
      ], consumer);
      await run(process.execPath, ["ssr/server.js"], consumer);
      await verifyHydration(staticHandler(join(consumer, "dist")));
    }
    process.stdout.write(`${target.framework} with Svelte ${target.svelte} verified from tarballs: strict Svelte types, SSR and Chromium hydration.\n`);
  }
  finally {
    await rm(consumer, { recursive: true, force: true });
  }
}

export async function checkSveltePackage(archives: string, coreArchive: string): Promise<void> {
  const library = join(root, "packages/discord-ui-svelte");
  await pnpm(["pack", "--pack-destination", archives], library);
  const metadata = JSON.parse(await readFile(join(library, "package.json"), "utf8")) as { version: string; peerDependencies: Record<string, string> };
  assert.equal(metadata.peerDependencies.svelte, "^5.46.4");
  const archive = join(archives, `arcscord-discord-ui-svelte-${metadata.version}.tgz`);
  const entries = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" }).split("\n");
  const packed = JSON.parse(execFileSync("tar", ["-xOf", archive, "package/package.json"], { encoding: "utf8" })) as {
    dependencies: Record<string, string>;
    exports: Record<string, Record<string, string>>;
  };

  for (const conditions of Object.values(packed.exports)) {
    for (const path of Object.values(conditions))
      assert(entries.includes(`package/${path.slice(2)}`), `Missing packed export: ${path}`);
  }
  for (const file of [
    "LICENSE",
    "THIRD_PARTY_NOTICES",
    "README.md",
    "CHANGELOG.md",
    "dist/DiscordUI.svelte.d.ts",
    "dist/content/HighlightedCode.svelte.d.ts",
  ])
    assert(entries.includes(`package/${file}`), `Missing packed file: ${file}`);
  const coreManifest = JSON.parse(await readFile(join(root, "packages/discord-ui-core/package.json"), "utf8")) as { version: string };
  assert.deepEqual(packed.dependencies, { [core]: `^${coreManifest.version}` });
  assert(!entries.some(entry => entry.startsWith("package/src/") || entry.startsWith("package/tests/")));

  for (const entry of entries.filter(path => /\.(?:svelte|js)$/u.test(path))) {
    const file = entry.slice(8);
    const source = await readFile(join(library, file), "utf8");
    assert(!/from\s*["'](?:react(?:\/[^"']*)?|vue|@arcscord\/discord-ui(?:-vue)?)["'/]/u.test(source), `Unexpected framework dependency in ${file}`);
    if (file !== "dist/content/HighlightedCode.svelte")
      assert(!source.includes("@arcscord/discord-ui-core/highlight"));
    if (file !== "dist/highlight.js")
      assert(!source.includes("HighlightedCode.svelte"));
    for (const [, specifier] of source.matchAll(/\bfrom\s+["'](\.[^"']+)["']/gu)) {
      const path = resolve(dirname(join(library, file)), specifier!);
      assert(entries.includes(`package${path.slice(library.length)}`), `Missing source import ${specifier} from ${entry}`);
    }
  }

  const { devDependencies: toolchain } = JSON.parse(await readFile(join(root, "package.json"), "utf8")) as { devDependencies: Record<string, string> };
  for (const version of new Set(["5.46.4", toolchain.svelte!]))
    await verifyConsumer(archive, coreArchive, toolchain, { framework: "vite", svelte: version });
  await verifyConsumer(archive, coreArchive, toolchain, { framework: "sveltekit", svelte: toolchain.svelte! });
}
