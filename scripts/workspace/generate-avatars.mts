import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = new URL("../../", import.meta.url);
const avatars = JSON.parse(await readFile(new URL("fixtures/avatars.json", root), "utf8")) as Record<string, { letter: string; color: string }>;
const destinations = { playground: "apps/playground/public/generated/avatars/", website: "apps/website/static/generated/avatars/" };
const target = process.argv[2];
if (target && target !== "playground" && target !== "website")
  throw new Error("Expected playground or website");
const targets = target === "playground" || target === "website"
  ? [destinations[target]]
  : Object.values(destinations);
for (const target of targets) {
  const directory = new URL(target, root);
  await mkdir(directory, { recursive: true });
  for (const [name, { letter, color }] of Object.entries(avatars)) {
    if (!/^[a-z\d-]+$/u.test(name) || !/^[A-Z]$/u.test(letter) || !/^#[a-f\d]{6}$/iu.test(color))
      throw new Error(`Invalid avatar definition: ${name}`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="${color}"/><text x="32" y="33" fill="#fff" font-family="Arial,Helvetica,sans-serif" font-size="32" font-weight="600" text-anchor="middle" dominant-baseline="middle">${letter}</text></svg>\n`;
    await writeFile(new URL(`${name}.svg`, directory), svg);
  }
  // Remove retired identities from the generated assets as well.
  for (const filename of await readdir(directory)) {
    if (filename.endsWith(".svg") && !Object.hasOwn(avatars, filename.slice(0, -4)))
      await rm(new URL(filename, directory));
  }
}
process.stdout.write(`Generated ${Object.keys(avatars).length} fixed avatars in ${targets.map(target => fileURLToPath(new URL(target, root))).join(", ")}\n`);
