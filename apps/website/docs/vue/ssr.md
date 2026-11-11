---
title: Vue SSR and hydration
---

# Vue SSR and hydration

Render with `createSSRApp` and `renderToString` from `@vue/server-renderer`, then
hydrate the same component and initial data with `createSSRApp(...).mount(...)`
in the browser. Keep `vue` and `@vue/server-renderer` on the same version.

```ts
import { renderToString } from "@vue/server-renderer";
// Server: App imports the Vue package and supplies explicit display data.
import { createSSRApp } from "vue";
import App from "./App.vue";

const app = createSSRApp(App);
app.config.idPrefix = "conversation-";
const html = await renderToString(app);
```

```ts
// Client: hydrate the container containing the server's HTML.
import { createSSRApp } from "vue";
import App from "./App.vue";
import "@arcscord/discord-ui-vue/styles.css";

const app = createSSRApp(App);
app.config.idPrefix = "conversation-";
app.mount("#app");
```

Use identical models, timestamps, `referenceTime`, locale, time zone and theme on
both sides. Each SSR request needs its own application and state. For multiple
Vue roots on a page, use distinct stable `idPrefix` values, equal on each root's
server/client pair.

The package performs DOM work after mounting and cleans up observers and event
listeners when unmounted. Spoiled media stays unmounted until reveal. Unicode
emoji fall back to text if loading fails, including failures before hydration.
`allowRemoteMedia: false` remains enforced by the shared URL policy.

The browser acceptance fixture renders the shared message, menu and channel data
on the server, then hydrates it and tests updates, keyboard interactions, commands
and thread navigation on desktop and narrow Chromium viewports. It is a local
simulation, not a real Discord integration or a Nuxt compatibility guarantee.
The documentation's Vue demos mount on the client inside Docusaurus; they are
separate from the SSR/hydration fixture.
