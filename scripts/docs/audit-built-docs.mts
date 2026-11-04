import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

function decodeAttribute(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    quot: "\"",
    apos: "'",
    lt: "<",
    gt: ">",
  };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/giu, (match, entity: string) => {
    if (entity.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(entity[1]?.toLowerCase() === "x"
        ? 2
        : 1), entity[1]?.toLowerCase() === "x"
        ? 16
        : 10));
    }
    return named[entity.toLowerCase()] ?? match;
  });
}

async function htmlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map(entry => entry.isDirectory()
    ? htmlFiles(path.join(directory, entry.name))
    : Promise.resolve(entry.name.endsWith(".html")
        ? [
            path.join(directory, entry.name),
          ]
        : [])));
  return groups.flat();
}

/** Audit the final HTML, including links created by React components rather than Markdown. */
export async function auditBuiltDocs(buildDir: string, exampleIds: ReadonlySet<string>): Promise<{ pages: number; links: number; assets: number; examples: number }> {
  const root = path.resolve(buildDir);
  const files = await htmlFiles(root);
  if (!files.length)
    throw new Error("No production HTML found; run pnpm build:website first.");
  const pages = await Promise.all(files.map(async file => ({ file, html: await readFile(file, "utf8") })));
  const ids = new Map(pages.map(page => [
    page.file,
    new Set([
      ...page.html.matchAll(/\bid="([^"]*)"/gu),
    ].map(match => decodeAttribute(match[1]!))),
  ]));
  const failures: string[] = [];
  const origin = "https://documentation.invalid";
  const resolved = new Map<string, Promise<string | undefined>>();
  let links = 0;
  let assets = 0;
  let examples = 0;
  function targetFor(pathname: string): Promise<string | undefined> {
    if (!resolved.has(pathname)) {
      resolved.set(pathname, (async () => {
        const relative = decodeURIComponent(pathname).replace(/^\//u, "");
        for (const candidate of [
          relative,
          `${relative}.html`,
          path.join(relative, "index.html"),
        ]) {
          const target = path.resolve(root, candidate);
          if (!target.startsWith(root + path.sep))
            continue;
          if ((await stat(target).catch(() => undefined))?.isFile())
            return target;
        }
        return undefined;
      })());
    }
    return resolved.get(pathname)!;
  }
  await Promise.all(pages.map(async ({ file, html }) => {
    const route = `/${path.relative(root, file).split(path.sep).join("/").replace(/(?:^|\/)index\.html$/u, "/").replace(/\.html$/u, "").replace(/^\//u, "")}`;
    const references = [
      ...[
        ...html.matchAll(/<a\b[^>]+\bhref="([^"]*)"/gu),
      ].map(match => ({
        value: decodeAttribute(match[1]!),
        asset: false,
      })),
      ...[
        ...html.matchAll(/<(?:img|script|link)\b[^>]+\b(?:src|href)="([^"]*)"/gu),
      ].map(match => ({
        value: decodeAttribute(match[1]!),
        asset: true,
      })),
    ];
    await Promise.all(references.map(async (reference) => {
      const url = new URL(reference.value, origin + route);
      if (url.origin !== origin)
        return; // External availability is outside this local acceptance gate.
      const label = `${route} → ${reference.value}`;
      const target = await targetFor(url.pathname);
      if (reference.asset)
        assets++;
      else links++;
      if (!target) {
        failures.push(`Missing target: ${label}`);
        return;
      }
      if (!reference.asset && url.hash && ids.has(target) && !ids.get(target)!.has(decodeURIComponent(url.hash.slice(1))))
        failures.push(`Missing fragment: ${label}`);
      const example = url.searchParams.get("example");
      if (!reference.asset && ["/playground", "/components"].includes(url.pathname) && example !== null) {
        examples++;
        if (!exampleIds.has(example))
          failures.push(`Unknown example: ${label}`);
        const theme = url.searchParams.get("theme");
        if (theme !== null && !["light", "ash", "dark"].includes(theme))
          failures.push(`Unknown preview theme: ${label}`);
      }
    }));
  }));
  if (failures.length)
    throw new Error(`Broken production documentation targets:\n${failures.sort().join("\n")}`);
  return {
    pages: pages.length,
    links,
    assets,
    examples,
  };
}
