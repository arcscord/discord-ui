export function releaseMetadata(tag: string, packageVersion: string): { version: string; distTag: string; tarball: string } {
  // SemVer without build metadata: npm cannot distinguish versions by build metadata.
  const numeric = "(?:0|[1-9]\\d*)";
  const identifier = "(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)";
  const semver = new RegExp(`^v(${numeric}\\.${numeric}\\.${numeric}(?:-${identifier}(?:\\.${identifier})*)?)$`);
  const version = semver.exec(tag)?.[1];
  if (!version || tag !== `v${version}`)
    throw new Error("Expected a version tag such as v1.2.3 or v1.2.3-beta.1.");
  if (version === "0.0.0" || version !== packageVersion)
    throw new Error(`Tag ${tag} must match a releasable packages/discord-ui/package.json version (${packageVersion}).`);
  return {
    version,
    distTag: version.includes("-")
      ? "next"
      : "latest",
    tarball: `arcscord-discord-ui-${version}.tgz`,
  };
}
