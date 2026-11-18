# Framework comparison

Standalone Vite application for manual exploration of native React, Vue and Svelte
Discord UI fixtures. Shared serializable inputs and expected checkpoints live in
`fixtures/comparison/` at the repository root. Each iframe imports its public
framework package and compiled CSS.

## Development

Use the root Node and pnpm versions. Run from the repository root.

```sh
pnpm dev:comparison
```

Open [localhost:4175](http://127.0.0.1:4175/). Vite watches the comparison interface,
native framework sources and shared scenario modules. Rebuild the libraries with
`pnpm build:lib` after changing package sources. Restart the dev command after
changing avatar definitions or the shared font.

Three 390 × 844 viewports share scenario, theme, locale and media settings. Manual
interactions stay independent. Expansion resizes the existing iframe to 1280 px
and preserves its state. The URL stores configuration. Reset clears local state
and callback logs. Diagnostics retain the last 50 native events per preview.

Native fixtures load directly at `/previews/react/`, `/previews/vue/` and
`/previews/svelte/`, accepting scenario, theme, locale and media query parameters.

## Independent build

```sh
pnpm build:comparison
pnpm --filter @arcscord/discord-ui-comparison preview
pnpm test:comparison
```

The deployable directory is **`apps/comparison/dist`**. It contains the comparison
interface, three native fixture documents and their local assets. The build uses
the libraries and sources in this repository. Prepared fonts and avatar assets
are ignored. The font and its license share their canonical source with the
documentation under `apps/website/static/fonts/`.

The initial catalogue covers classic messages, Components V2 and a channel with
a thread. Events and state describe local simulations. The differential runner
compares all three native renderers at explicit checkpoints.

## Automated comparison

```sh
pnpm test:comparison
pnpm exec playwright show-report .local/comparison-report
```

The dedicated `differential` project runs 3 scenarios × 3 themes × 2 inner widths,
covering 18 cases. The host viewport is 1536 × 1024 at scale 1; the native
viewports are explicitly 390 × 844 or 1280 × 844. Existing exploration tests also
exercise the narrow host viewport. The production preview server uses port 4177.

One complete native journey runs per framework, preserving native focus between
checkpoints. Captures from matching checkpoints are compared React/Vue,
React/Svelte and Vue/Svelte. Each framework also receives independent assertions
for expected state, exact callback parameters/order/count, keyboard focus,
accessible roles/names/descriptions and reading position.

| Scenario | Checkpoints |
| --- | --- |
| Classic | Initial, spoiler revealed, spoiler hidden, reaction enabled, reaction disabled |
| Components V2 | Initial, menu open, Maps selected, menu closed, Wave callback |
| Channel | Initial, 20 messages added, reading position preserved on send, thread open, reply sent, thread closed with focus restored |

A complete pass captures 96 checkpoints × 3 renderers and performs 288 pairwise
image comparisons. There are zero allowed changed pixels after pixelmatch's
0.1 color threshold and anti-alias detection. Dimensions must match exactly.
Captures wait for applied configuration, fonts, decoded images and animation
frames. Animations and carets are disabled only during screenshots. The outer
iframe is aligned to whole CSS pixels to avoid fractional screenshot clipping.

Fixtures provide fixed dates, reference time, locale and UTC. A controlled browser
clock progresses normally so Vue's event-timestamp safeguards work. Generated ID
spellings are omitted from comparison while reference integrity and label/control
relationships are checked. Playwright ARIA snapshots and Chromium's computed
accessible descriptions preserve meaningful text and whitespace.

### Evidence and failure investigation

The HTML report is written to `.local/comparison-report`. CI uses its configured
report directory. Every differential test writes `comparison-summary.md` and `comparison-evidence.json` in
its output directory, including expected and observed state/events, accessibility,
focus, scroll geometry, pixel metrics, a configuration/checkpoint URL, renderer
and browser versions, source commit, dirty-worktree flag, built-asset digest and
run/retry metadata.

Failures also attach all available native captures, pairwise PNG differences and
a trace. Partial captures following an action failure are identified separately.
A reproduction link selects the scenario, theme, framework and width; the named
checkpoint is reached by following the scenario journey. The manual page directs
users to the Playwright report for automated results.

### Uniformity results

Each checkpoint and each complete scenario classifies the variants by matching
groups. Visual, behavior/accessibility and combined results are reported separately.
Examples include `3 identical`, `React + Svelte identical · Vue different` and
`All different`. Non-transitive pixel similarities are reported as mixed pairwise
similarities. Missing captures produce an incomplete result. A failed journey does
not prevent the remaining variants from being exercised.

Comparison is performed within the current run. A shared visual evolution passes
when all variants remain uniform and the independent behavior assertions pass.
Screenshots, differences, traces and reports are ignored generated artifacts under
`.local/`. The repository stores fixture inputs and test expectations.

### Uniform Linux environment

```sh
pnpm test:comparison:docker
pnpm exec playwright show-report .local/comparison-docker/comparison-report
```

Start a Docker-compatible engine first. The command builds the application and
runs all exploration and differential tests inside Playwright 1.64.1 on Ubuntu
Noble, pinned by image digest and explicitly using Linux/amd64 on every host.
The image fixes Chromium, system fonts and Node 26. pnpm is pinned to 12.16.1.
This aligns local macOS and Linux runs with CI despite host rendering differences.
The container receives a source copy with local dependencies, credentials and
outputs excluded. Reports are copied back even after test failures.

Playwright filters can be forwarded, for example
`pnpm test:comparison:docker --project=differential --grep 'classic ash 390$'`.
CI adds `--use-built` to mount the downloaded comparison build read-only, ensuring
that the published browser-build artifact is the one exercised by the tests.
Local `pnpm test:comparison` remains available for faster native-browser feedback.

Update the Dockerfile digest, pnpm pin and image label together when updating the
workspace toolchain. Keep the Playwright image version equal to `@playwright/test`.
The Docker runner checks Node and Playwright compatibility during image creation.

The channel journey exposed a React/Vue history-following defect. Those renderers
now preserve the reading position when a message arrives while the user is reading
earlier messages, matching the expected behavior and Svelte.

### Calibration evidence

On 2026-11-18, all 32 exploration/differential tests passed on native macOS arm64
and in the pinned Linux/amd64 container. Both runs classified all 18 differential
cases as three identical variants, with zero changed pixels across 288 pairwise
comparisons and the same tested application digest.

Temporary changes verified the reporting and failure paths.

| Temporary change | Observed result |
| --- | --- |
| Vue-only opacity change | React and Svelte identical, Vue divergent; test fails |
| Shared opacity change | Three identical variants; test passes |
| Different opacity in every variant | All different; test fails |
| Incorrect React callback message ID | Behavior comparison identifies React; expected payload assertion fails |
| React thread closure focuses history | React differs; expected opener-focus assertion fails |

Visual grouping checks ran inside Docker. Callback and focus mutations ran on
native Chromium and retained captures from all three variants. All temporary
changes were restored after these checks. Calibration reports stay in ignored
local output directories.

## Cloudflare Pages build contract

For a future repository-root Pages build, use `pnpm build:comparison` and select
`apps/comparison/dist` as the output directory. The app uses root-relative URLs
and expects its own origin. The same directory can be uploaded as a tested static
artifact by the future PR publisher.

CI builds and tests the comparison independently of the website browser suite,
and includes its output in the browser-build artifact. Publication configuration
and deployment credentials belong to the future preview-delivery workflow.
