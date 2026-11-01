# Arcscord Discord UI website

Docusaurus app for the landing and documentation. Run from the workspace root:

```sh
pnpm dev:website
pnpm build:website
pnpm --filter @arcscord/discord-ui-website preview
pnpm test:website
```

Use the workspace's Node 26 and pnpm 12 versions. The library must be built before
starting Docusaurus; `dev:website` and `build:website` handle this.

The site uses Arcscord's palette and a locally served Inter variable font (see
`static/fonts/OFL.txt`). Discord previews use the package's compiled CSS unchanged.
The font comes from the [official Inter project](https://github.com/rsms/inter/blob/master/docs/font-files/InterVariable.woff2).
Set `site.inDevelopment` in `src/data/site.ts` to `false` to remove the dismissible
development announcement. Shared external destinations live in the same file.

Implemented: shared dark shell, responsive landing, keyboard tabs, independent
preview themes, local channel messages and thread replies, initial Markdown/MDX
documentation, `/components` and `/playground`. The explorer covers all 29 public
components and compares Light/Ash/Dark. Deep links use `?example=channel-view`
(or another ID in `src/data/component-examples.ts`).

The playground loads Docusaurus's live-code provider and JSX compiler on demand.
Its native textarea and Prism overlay support selection, paste, undo and keyboard
focus. Tab leaves the editor; Escape focuses Reset. Every playground example is
an editable React module: imports, fixture data, the theme constant and the default
component are visible. There are no injected component, hook or fixture bindings.
The local module runtime resolves explicit imports from React, the library,
its theme helpers and its stylesheet. Other module imports produce a clear error.
Copy code copies the exact editor contents, including edits and errors.
The theme toolbar edits the visible `previewTheme` constant. Image examples use
files under `static/examples`; copy them into your app's public directory when
reusing the example.
The preview is a local browser evaluation environment, with no TypeScript
diagnostics. Syntax and render errors keep the editor and last successful preview.
Reset restores the selected fixture and its local state.

The complete documentation, search, major-version snapshots and GitHub Pages
deployment remain subsequent stages. npm links point to installation status until
the package is published. The original Vite playground is unchanged.

The reference concepts are in the design chat's `website-design-plan.md`; their
Discord skins and illustrative snippets are replaced by real package components
and typed data. On mobile, the live preview precedes source code.

`pnpm-workspace.yaml` upgrades Babel's legacy semver dependency to `7.8.5` so
installation keeps `trustPolicy: no-downgrade` enabled without exceptions.
