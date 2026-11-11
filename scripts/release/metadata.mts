export const releasePackages = {
  react: { name: "@arcscord/discord-ui", directory: "packages/discord-ui", prefix: "v" },
  vue: { name: "@arcscord/discord-ui-vue", directory: "packages/discord-ui-vue", prefix: "vue-v" },
  core: { name: "@arcscord/discord-ui-core", directory: "packages/discord-ui-core", prefix: "core-v" },
} as const;
export type ReleasePackage = keyof typeof releasePackages;

// SemVer without build metadata: npm cannot distinguish versions by build metadata.
const numeric = "(?:0|[1-9]\\d*)";
const identifier = "(?:0|[1-9]\\d*|\\d*[a-z-][0-9a-z-]*)";
const versionPattern = `${numeric}\\.${numeric}\\.${numeric}(?:-${identifier}(?:\\.${identifier})*)?`;

export function releaseTarget(tag: string): ReleasePackage {
  for (const target of ["core", "react", "vue"] as const) {
    const { prefix } = releasePackages[target];
    const match = new RegExp(`^${prefix}(${versionPattern})$`, "i").exec(tag);
    if (match && tag === `${prefix}${match[1]}`)
      return target;
  }
  throw new Error("Expected a version tag such as v1.2.3 core-v0.2.0-beta.1 or vue-v0.1.0.");
}

export function releaseMetadata(tag: string, versions: Record<ReleasePackage, string>): {
  version: string;
  distTag: string;
  tarball: string;
  packageName: string;
  directory: string;
} {
  const target = releaseTarget(tag);
  const { prefix, name, directory } = releasePackages[target];
  const version = tag.slice(prefix.length);
  if (version === "0.0.0" || version !== versions[target])
    throw new Error(`Tag ${tag} must match a releasable ${directory}/package.json version (${versions[target]}).`);
  return {
    version,
    distTag: version.includes("-")
      ? "next"
      : "latest",
    tarball: `${name.slice(1).replace("/", "-")}-${version}.tgz`,
    packageName: name,
    directory,
  };
}

/** Packed adapter dependencies must name the oldest supported core explicitly. */
export function coreMinimumVersion(range: string): string {
  const match = new RegExp(`^[\\^~]?(${versionPattern})$`, "i").exec(range);
  if (!match || range !== `${range.startsWith("^") || range.startsWith("~")
    ? range[0]
    : ""}${match[1]}`) {
    throw new Error(`Expected an explicit core version or caret/tilde range, received ${range}.`);
  }
  return match[1]!;
}

/** A compatible range must have its minimum published, not just a newer version. */
export function verifyPublishedCoreDependency(range: string | undefined, lookup: (version: string) => unknown): void {
  if (!range)
    return;
  const minimum = coreMinimumVersion(range);
  const message = `Publish and approve @arcscord/discord-ui-core@${minimum} before staging this adapter.`;
  let published: unknown;
  try {
    published = lookup(minimum);
  }
  catch (cause) {
    throw new Error(message, { cause });
  }
  if (published !== minimum)
    throw new Error(message);
}
