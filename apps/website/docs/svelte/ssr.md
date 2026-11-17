---
title: Svelte SSR and hydration
---

# Svelte SSR and hydration

With SvelteKit, import the package and its stylesheet in your route or layout.
Use the default SSR and hydration behavior and pass identical initial data on
server and client. For instance, resolve the preview data in the route's load
function and pass it to the components.

With a standalone Vite app, use `svelte/server` to render and `hydrate` from
`svelte` to attach interactivity. Compile the same app in both builds.

```ts
// Server
import { render } from "svelte/server";
import App from "./App.svelte";

const { body } = render(App, { idPrefix: "conversation" });
// Serve body inside the element with id="app".
```

```ts
// Client
import { hydrate } from "svelte";
import App from "./App.svelte";
import "@arcscord/discord-ui-svelte/styles.css";

const target = document.getElementById("app")!;
hydrate(App, { target });
```

Keep the model, theme, media policy, locale, time zone and `referenceTime`
consistent. For multiple independent roots on the same page, use a distinct
server-side prefix for each root. Svelte restores the IDs from the server HTML
during hydration. The package performs focus, scrolling and image recovery
after the browser has attached.

The compatibility checks install the tarball in Vite 8 and SvelteKit 3 with
`adapter-node`. They validate server HTML and Chromium hydration with synthetic
data. The documentation examples mount in the browser inside Docusaurus.
