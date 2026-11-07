# CI and npm releases

Maintainer procedures for validating changes and publishing `@arcscord/discord-ui`.
Commands run from the repository root. For local setup, see
[Contributing](../../CONTRIBUTING.md).

## Continuous integration

Pull requests, pushes to `main` and manual runs execute separate lint, unit test,
build/typecheck/package and browser jobs. The library and Docusaurus
site are built together; browser jobs reuse those artifacts and test Chromium at
desktop and narrow viewport widths. The independent unit test job builds the
library before testing website examples, which import its public package exports.
The package check installs the tarball in an isolated consumer and checks
ESM imports, SSR, declarations and CSS. JUnit results, HTML browser reports,
failure screenshots and traces are retained for seven days.

Actions are pinned to commit SHAs, dependency installs use the frozen lockfile and
pnpm store cache, and jobs have timeouts. Superseded PR runs are cancelled.
Configure `CI / Required` as a required status check in the `main` ruleset; it
fails if any constituent job fails, is cancelled or is skipped. CodeQL scans
JavaScript/TypeScript on `main`, PRs targeting `main` and weekly. Use its advanced
setup rather than enabling a second default CodeQL setup.

Dependency review rejects critical vulnerabilities in changed runtime dependencies
on PRs. The [Dependabot configuration](../../.github/dependabot.yml) allows
production security updates only, grouped together, with `chore` commit prefixes
and `dependencies`/`security` labels. Routine version-update PRs are disabled.
Enable Dependabot alerts and security updates in the repository settings.

## Current stable release: 0.1.0

Version `0.1.0` is the first stable release. The manifest, package README and
website documentation describe this version. The local bootstrap beta does not
need a GitHub commit or tag.

Inspect the published stable package independently of the workspace:

```sh
npm view @arcscord/discord-ui@0.1.0 version dist dist-tags --json
mkdir -p .local/npm-review
npm pack @arcscord/discord-ui@0.1.0 --ignore-scripts --pack-destination "$PWD/.local/npm-review"
tar -tzf .local/npm-review/arcscord-discord-ui-0.1.0.tgz
```

Review README, LICENSE, THIRD_PARTY_NOTICES, package documentation, ESM entry
points, declarations, source maps and compiled CSS. Sources, tests, workspace
configuration and credentials must not be included. The packaged `AGENTS.md`
is consumer documentation, separate from the ignored root contributor instructions.
Test the registry version in a separate React 19 application with
`pnpm add @arcscord/discord-ui@0.1.0`.

The stable npm dist-tag is `latest`; `next` is reserved for prereleases. Verify
`npm view @arcscord/discord-ui dist-tags --json` when checking registry state.
Keep local archives in ignored `.local/` directories. Published npm versions
are immutable; fixes require a new version.

## Validate a release

Run from the repository root with the version to release in the library manifest:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm exec playwright test -c playwright.website.config.mts
pnpm docs:check
pnpm --filter @arcscord/discord-ui pack --pack-destination "$PWD/.local/package"
```

`pnpm check` builds the website; browser tests reuse that build. Merge the
validated version into `main` before creating its matching `v*` tag. The workflow
builds and publishes its own verified tarball with provenance.

## Publish from GitHub

[The publication workflow](../../.github/workflows/publish.yml) publishes `@arcscord/discord-ui` to npm when a
`v*` tag is pushed. It can also be started with **Actions → Publish npm package →
Run workflow**, supplying an existing tag. The tag must match the committed
`packages/discord-ui/package.json` version and point to a commit contained in
`main`; the `0.0.0` placeholder is rejected. Stable versions use the npm `latest`
tag; prereleases such as `v0.2.0-beta.1` use `next`.

The workflow runs the full CI against the resolved release commit, then publishes
the built tarball with provenance. Publication uses the `npm-publish` GitHub
environment. Create this environment and configure reviewers or tag restrictions
as desired before publishing.

Configure an npm [trusted publisher](https://docs.npmjs.com/trusted-publishers/)
for `@arcscord/discord-ui` with organization **arcscord**, repository
**discord-ui**, workflow filename **publish.yml**, environment **npm-publish**,
and permission to publish directly. Subsequent releases authenticate through OIDC.
For the first publication of a package that does not yet have a trusted publisher,
the workflow also accepts an environment secret named `NPM_TOKEN`: use a granular
token with permission to publish under `@arcscord` and bypass 2FA. After that first
release, configure the trusted publisher and remove the token.

To prepare a release, update the library version in a PR and merge it into `main`.
Then tag the merged commit, for example:

```sh
git switch main
git pull --ff-only
git tag v0.1.0
git push origin v0.1.0
```

Creating a new version tag through the GitHub Release form also triggers the
workflow. If the tag already exists, use the manual Actions run instead.
Retrying a failed run or dispatching an existing tag reruns validation;
npm rejects a version that has already been published. Configuration changes alone
do not publish anything.
