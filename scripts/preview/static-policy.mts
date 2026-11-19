import { constants } from "node:fs";
import { lstat, mkdir, mkdtemp, open, readdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

export const staticSiteLimits = Object.freeze({ files: 20_000, totalBytes: 200_000_000, fileBytes: 25 * 1024 * 1024 });

const forbiddenNames = new Set([
  "_worker.js",
  "functions",
  "_routes.json",
  "_redirects",
  "_headers",
  "node_modules",
]);
const trustedHeaders = "/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n";

function validateName(name: string): void {
  if (!/^[\w-][\w.-]*$/iu.test(name) || name.endsWith(".") || forbiddenNames.has(name.toLowerCase()))
    throw new Error(`Unsafe static artifact path: ${name}`);
}

/** Validate untrusted build output before atomically publishing a fresh static directory. */
export async function prepareStaticSite(sourceDir: string, targetDir: string): Promise<void> {
  const source = resolve(sourceDir);
  const target = resolve(targetDir);
  const relationship = relative(source, target);
  const reverseRelationship = relative(target, source);
  if (relationship.split(sep)[0] !== ".." || reverseRelationship.split(sep)[0] !== "..")
    throw new Error("Source and target directories must be separate");
  if (!(await lstat(source)).isDirectory())
    throw new Error("Static artifact root must be a directory");
  try {
    await lstat(target);
    throw new Error("Static target must not exist");
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT")
      throw error;
  }

  const files: { path: string; size: number }[] = [];
  let entries = 0;
  let totalBytes = 0;
  async function inspect(directory: string, prefix: string): Promise<void> {
    for (const name of await readdir(directory)) {
      validateName(name);
      if (++entries > staticSiteLimits.files)
        throw new Error("Static artifact has too many entries");
      const path = prefix
        ? `${prefix}/${name}`
        : name;
      const stat = await lstat(join(directory, name));
      if (stat.isSymbolicLink())
        throw new Error(`Static artifact contains a symbolic link: ${path}`);
      if (stat.isDirectory()) {
        await inspect(join(directory, name), path);
      }
      else if (stat.isFile()) {
        totalBytes += stat.size;
        if (stat.size > staticSiteLimits.fileBytes || totalBytes > staticSiteLimits.totalBytes)
          throw new Error("Static artifact exceeds size limits");
        files.push({ path, size: stat.size });
      }
      else {
        throw new Error(`Unsupported static artifact entry: ${path}`);
      }
    }
  }
  await inspect(source, "");
  if (!files.some(file => file.path === "index.html"))
    throw new Error("Static artifact requires index.html");
  for (const required of ["previews/react/index.html", "previews/vue/index.html", "previews/svelte/index.html"]) {
    if (!files.some(file => file.path === required))
      throw new Error(`Static artifact requires ${required}`);
  }

  await mkdir(dirname(target), { recursive: true });
  const staging = await mkdtemp(join(dirname(target), ".static-preview-"));
  try {
    for (const file of files) {
      const input = await open(join(source, file.path), constants.O_RDONLY | constants.O_NOFOLLOW);
      try {
        const stat = await input.stat();
        if (!stat.isFile() || stat.size !== file.size)
          throw new Error(`Static artifact changed during preparation: ${file.path}`);
        const contents = await input.readFile();
        if (contents.length !== file.size)
          throw new Error(`Static artifact changed during preparation: ${file.path}`);
        const destination = join(staging, file.path);
        await mkdir(dirname(destination), { recursive: true });
        await writeFile(destination, contents, { flag: "wx" });
      }
      finally {
        await input.close();
      }
    }
    await writeFile(join(staging, "_headers"), trustedHeaders, { flag: "wx" });
    await rename(staging, target);
  }
  finally {
    await rm(staging, { recursive: true, force: true });
  }
}
