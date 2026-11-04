---
title: Installation
description: Install Arcscord Discord UI from a local package, import its stylesheet, and check React requirements and available entry points.
---

# Installation

## Current package status

The repository declares `@arcscord/discord-ui` version `0.0.0` and currently
documents workspace consumption pending its first npm release. Public registry
installation instructions will follow a verified release.

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

Continue to [Quick start](./quick-start.mdx) for a complete module with data and a
rendered preview. If the preview has no styling, check the
[styling checklist](./troubleshooting.md#styling-and-media).
