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

The catalogue covers twelve scenario families. Events and state describe local
simulations. The differential runner compares all three native renderers at
explicit checkpoints.

## Automated comparison

```sh
pnpm test:comparison
pnpm exec playwright show-report .local/comparison-report
```

The dedicated `differential` project runs 12 scenarios × 3 themes × 2 inner widths,
covering 72 base cases and 216 native renders before interaction checkpoints.
Additional cases exercise embeds at 480/481 px, thread layout at 640/641 px,
French spoiler labels and inherited custom-theme overrides. The host viewport is
1536 × 1024 at scale 1. Native base viewports are explicitly 390 × 844 or
1280 × 844. Existing exploration tests also exercise the narrow host viewport.
The production preview server uses port 4177.

The manual interface's **Inner viewport width** control selects 390, 480, 481,
640, 641 or 1280 px independently of the host viewport. Width, locale and custom
theme settings survive URL reloads. Expand still selects one 1280 px preview.

One complete native journey runs per framework, preserving native focus between
checkpoints. Captures from matching checkpoints are compared React/Vue,
React/Svelte and Vue/Svelte. Each framework also receives independent assertions
for expected state, exact callback parameters/order/count, keyboard focus,
accessible roles/names/descriptions and reading position.

### Coverage

All families use the same independent expected-state and callback assertions in
[`differential.spec.ts`](../../tests/comparison/differential.spec.ts). Every
checkpoint also compares pixels, accessible state, focus and ID relationships.

| Family / scenario | Independent assertions | Supported checkpoints |
| --- | --- | --- |
| Classic messages / `classic` | Edited marker, author metadata, unavailable reply, ephemeral dismissal, spoiler reveal/hide and controlled reaction | `initial`, `spoiler-visible`, `spoiler-hidden`, `reaction-on`, `reaction-off`, `ephemeral-dismissed` |
| Markdown / `markdown` | Whitespace, nested emphasis, quote/list, mentions, timestamp, links and opt-in code highlighting | `formatted` |
| Embeds / `embeds` | Inline fields, long text, local thumbnail, overflow and 480/481 px layout boundary | `fields-and-wrapping` |
| Media and files / `media` | Local gallery, blocked image, allowlisted absolute URL, failed decode, attachment metadata and fallback labels | `media-policy` |
| Spoilers / `spoilers` | Pointer reveal, keyboard hide/reveal, focus and French labels | `hidden`, `pointer-reveal`, `keyboard-hide`, `keyboard-reveal` |
| Components V2 / `interactions` | Container, section/accessory, separator, action rows, controlled multi-select and button context | `initial`, `menu-open`, `selected`, `menu-closed`, `wave`, `section-accessory` |
| Buttons / `buttons` | Disabled, link and premium variants, exact callback message/component context | `variants`, `action-context`, `premium-context` |
| Select menus / `selects` | Five kinds, keyboard, filtering, Escape, min/max and host disabling | `{string,user,role,mention,channel}-{open,selected}`, `selection-maximum`, `disabled-update` |
| Selection ownership / `selection-ownership` | Defaults, controlled empty values, external values and identity changes | `default`, `local-selection`, `empty`, `external`, `defaults`, `identity` |
| Reactions / `reactions` | Count, pressed state, pointer/keyboard toggling and host updates | `off`, `on`, `off-again`, `host-update` |
| Channel composer / `channel` | Empty/whitespace, Enter/Shift+Enter, composition guard, send and reading position | `initial`, `composer-empty`, `composer-newline`, `composer-composition`, `history-full`, `history-preserved`, `thread-open`, `thread-reply`, `thread-closed` |
| Threads and commands / `threads-commands` | Focus return, 640/641 px layout, arguments, filtered choices and submission | `thread-open`, `focus-return`, `command-list`, `command-arguments`, `command-submit` |

The composition check dispatches a keyboard event with `isComposing` set. This
checks the component guard with a synthetic browser event.
The media fixture uses local assets. Its allowlisted image uses an absolute
same-origin URL, while the blocked URL remains outside the allowlist. The asset
generator writes an undecodable image served with HTTP 200 to exercise the
fallback deterministically in manual previews and browser tests.

There are zero allowed changed pixels after pixelmatch's
0.1 color threshold and anti-alias detection. Dimensions must match exactly.
Captures wait for applied configuration, fonts, decoded images and animation
frames. The comparison host eagerly loads fixture images so offscreen previews
can acknowledge configuration before expansion. Animations and carets are disabled only during screenshots. The outer
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

The expanded command journey also exposed different argument-description markup
in Svelte. All adapters now preserve the descriptions through `aria-description`.
React and Vue render the command name as one text node, matching Svelte's glyph
positioning. The comparison host uses the same text-node convention for ownership
controls.

The channel journey exposed a React/Vue history-following defect. Those renderers
now preserve the reading position when a message arrives while the user is reading
earlier messages, matching the expected behavior and Svelte.

### Initial calibration evidence

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

### Catalogue expansion evidence

On 2026-11-18, the expanded suite passed against the same application build in
both environments. All 78 differential cases classified all three variants as
identical, with zero changed pixels, zero runtime/console errors and no retries.
Each run exercised 370 checkpoints, 1,110 native captures and 1,110 pairwise
comparisons. The 72-case base matrix contributes 216 initial native renders;
the six targeted variations add 18 more.

| Environment | Exploration + differential tests | Browser-suite duration | Results + HTML report size |
| --- | --- | --- | --- |
| Native macOS arm64 | 94 passed | 3.8 minutes | 17.0 MiB |
| Pinned Linux/amd64 Docker on the same ARM host | 94 passed | 9.7 minutes | 17.3 MiB |

Durations exclude image creation and measure local hardware, including amd64
emulation for Docker. The container run used `--use-built`; both evidence sets
record the same asset digest. The complete suite fits the current 20-minute
browser-job timeout in this local measurement. CI runtime still needs its own
measurement. The differential spec remains serial within its file; measured
runtime provides the starting point for future batching.

`pnpm lint`, `pnpm typecheck`, `pnpm docs:check`, `pnpm build:comparison` and all
303 unit tests also passed. Browser checks use Chromium at explicit viewport
sizes, fixed timestamps and locally simulated interactions. Captures, reports,
decode-failure assets and generated avatar/font output remain ignored.

## Cloudflare Pages build contract

For a future repository-root Pages build, use `pnpm build:comparison` and select
`apps/comparison/dist` as the output directory. The app uses root-relative URLs
and expects its own origin. The same directory can be uploaded as a tested static
artifact by the future PR publisher.

CI builds and tests the comparison independently of the website browser suite,
and includes its output in the browser-build artifact. Publication configuration
and deployment credentials belong to the future preview-delivery workflow.
