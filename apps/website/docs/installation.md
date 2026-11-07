---
title: Installation
description: Install Arcscord Discord UI, import its stylesheet, and check React requirements and available entry points.
---

# Installation

## Current package status

Version **0.1.0** is available on npm. Install it in your React application:

```sh
pnpm add @arcscord/discord-ui@0.1.0
```

The package declares **React `^19.0.0`** as its peer dependency. Your application
provides React and its renderer. This declaration is not evidence that every React
version or framework has been tested.

## Use the package in this monorepo

Add this entry to the consuming workspace application's `package.json`:

```json
{
  "dependencies": {
    "@arcscord/discord-ui": "workspace:*"
  }
}
```

From the repository root, install workspace dependencies and build the library:

```sh
pnpm install
pnpm build:lib
```

Repository development uses **Node 26** (`>=26.0.0 <27`) and **pnpm 12.16.1**,
as declared in the root manifest. These are workspace toolchain requirements.
Rebuild the library after changing its source: the website consumes built exports.

## Test a local release tarball

After building and packing the library from the repository root:

```sh
pnpm build:lib
pnpm --filter @arcscord/discord-ui pack --pack-destination "$PWD/.local/package"
```

In a separate React 19 application, install the generated archive using its absolute path:

```sh
pnpm add /absolute/path/to/arcscord-discord-ui-0.1.0.tgz
```

## Import components and compiled CSS

```tsx
import { DiscordUI, Message } from "@arcscord/discord-ui";
import React from "react";
import "@arcscord/discord-ui/styles.css";
```

Import the stylesheet once at your application's CSS entry point. It is
precompiled and scoped to the library wrapper and classes. **No Tailwind setup,
global reset or remote font is required.** Wrap message primitives in `DiscordUI`
to apply scoped styles and display options.

## Public entry points

| Import | Purpose |
| --- | --- |
| `@arcscord/discord-ui` | Components, serializable models, props and theme helpers |
| `@arcscord/discord-ui/styles.css` | Compiled library stylesheet |
| `@arcscord/discord-ui/themes` | Theme helpers and theme types |
| `@arcscord/discord-ui/highlight` | Optional `renderHighlightedCode` renderer |

Syntax highlighting is opt-in through the separate entry point. A basic message
needs only the root entry and stylesheet.

## AI coding agents

The installed package includes `AGENTS.md`, `docs/agent-guide.md` and the
TypeScript declarations in `dist/`. The instructions and integration guide can be
read offline and correspond to the installed version. No additional download or
installation script is needed.

Agents do not necessarily discover instructions inside dependencies automatically.
Add this block to your application's `AGENTS.md` or equivalent instruction file:

```md
<!-- BEGIN:arcscord-discord-ui -->
Before working with @arcscord/discord-ui, read
node_modules/@arcscord/discord-ui/AGENTS.md and follow its links to the local
integration guide and declarations for the installed version.
<!-- END:arcscord-discord-ui -->
```

In a monorepo, resolve the path from the workspace application that declares the
dependency. If your package manager does not expose `node_modules`, use its
package resolution tools to locate the installed package. Installation does not
modify your project's instruction files. Read these files directly; they are
documentation, not JavaScript exports.

Continue to [Quick start](./quick-start.mdx) for a complete module with data and a
rendered preview. If the preview has no styling, check the
[styling checklist](./troubleshooting.md#styling-and-media).
