# CI and npm releases

Maintainer procedures for validating, staging and approving releases of `@arcscord/discord-ui`.
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

Version `0.1.0` is the first stable release. The local bootstrap beta does not
need a GitHub commit or tag.

The next release candidate is **0.2.0**, prepared in the library manifest. Its
[release notes](../../packages/discord-ui/CHANGELOG.md) explain the Unicode emoji
behavior change and migration. This preparation does not create a tag, stage a
package or publish a version; the current registry state must be checked before
staging.

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
builds and stages its own verified tarball with provenance. Publication requires
a separate manual approval on npm.

## Stage from GitHub

[The staging workflow](../../.github/workflows/publish.yml) stages `@arcscord/discord-ui` on npm when a
`v*` tag is pushed. It can also be started with **Actions → Stage npm package →
Run workflow**, supplying an existing tag. The tag must match the committed
`packages/discord-ui/package.json` version and point to a commit contained in
`main`; the `0.0.0` placeholder is rejected. Stable versions use the npm `latest`
tag; prereleases such as `v0.2.0-beta.1` use `next`.

The workflow runs the full CI against the resolved release commit, then stages
the built tarball with provenance using `npm stage publish`. Staging uses the
`npm-publish` GitHub
environment. Create this environment and configure reviewers or tag restrictions
as desired before staging.

Configure an npm [trusted publisher](https://docs.npmjs.com/trusted-publishers/)
for `@arcscord/discord-ui` with organization **arcscord**, repository
**discord-ui**, workflow filename **publish.yml**, environment **npm-publish**,
and permission for **npm stage publish** only. Direct **npm publish** permission
is not needed. Authentication uses OIDC; the workflow does not use `NPM_TOKEN`.
Keep the workflow filename and environment name unchanged in the npm configuration.
The pinned npm CLI `11.15.0` supports staged publishing.

To prepare a release, update the library version in a PR and merge it into `main`.
Then tag the merged commit, for example:

```sh
git switch main
git pull --ff-only
git tag v0.2.0
git push origin v0.2.0
```

Creating a new version tag through the GitHub Release form also triggers the
workflow. If the tag already exists, use the manual Actions run instead.
Retrying a failed run or dispatching an existing tag reruns validation;
npm rejects a version that already exists as a staged or published version.
Configuration changes alone do not stage or publish anything.

After changing this workflow, merge the correction into `main` and dispatch
**Stage npm package** from `main`, supplying the existing version tag. Re-running
an old failed run uses its original workflow revision.

## Review and approve on npm

A successful workflow leaves the version staged. It does not make that version
public or update its dist-tag until a maintainer approves it. In npmjs.com, open
**Staged Packages**, inspect the package and approve it with 2FA when ready.

The CLI can also inspect staged versions with npm `11.15.0` or later:

```sh
npm stage list @arcscord/discord-ui
npm stage view <stage-id>
npm stage download <stage-id>
```

Approval is a separate maintainer action (`npm stage approve <stage-id>`), never
part of this workflow. Keep CI limited to staging. A staged package retains its
chosen `latest` or `next` tag; changing that choice requires rejecting and
re-staging it. See [npm staged publishing](https://docs.npmjs.com/staged-publishing/).
