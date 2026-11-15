# Vue integration guide

Use named imports from `@arcscord/discord-ui-vue` and its compiled CSS entry.
Vue is a peer and the core is a compatible runtime dependency. No React runtime or
React types are required. To test a Vue tarball with a local Core build, point a
`pnpm-workspace.yaml` override at the matching Core tarball.

| React pattern | Vue contract |
| --- | --- |
| `children` | Default slot |
| Content props such as `header`, `footer`, `accessory`, `emoji` | Named slots |
| Composer `value` and `onValueChange` | `v-model` (`modelValue`, `update:modelValue`) |
| Standalone select `values` and `onChange` | `v-model:values` |
| Controlled `activeThreadId` | `v-model:active-thread-id` |
| `onButtonClick`, `onSelectChange`, `onReactionToggle` | `@button-click`, `@select-change`, `@reaction-toggle` |
| Sending and commands | `@send`, `@thread-send`, `@slash-command` |
| `Button.style` | `Button.variant`; `style` stays a Vue style attribute |

Business events keep their core argument shapes. `select-change` emits component
ID, selected values and message context. `reaction-toggle` emits message/reaction
IDs on Message/ChannelView and the reaction ID on standalone Reactions (`toggle`).
Do not bind both an intent event and its v-model update to the same persistence
operation: models update controlled values; thread-open/close report navigation.

An omitted selection prop uses local state and menu defaults. `[]` remains an
explicit controlled empty selection. A missing key in a message selection map
retains local state. Omitted activeThreadId permits local navigation; null means
controlled closed. Changing a menu/channel/thread identity resets its local state.
Event listeners govern read-only affordances as in the React implementation.

`DiscordUI` supplies reactive display configuration. Named slots replace renderer
content and accept Vue nodes. `renderCode` accepts a function returning Vue nodes;
use `renderHighlightedCode` from the optional entry when desired. Never inject
message strings as HTML. With `allowRemoteMedia: false`, supply
`remoteMediaAllowlist` for exceptions such as `["https://cdn.discordapp.com/emojis/"]`
when your data includes resolved Discord emoji images.

For SSR, use createSSRApp on both server/client with the same initial data and
idPrefix. Allocate state per request. The package starts observers and DOM listeners
after mounting and removes them on unmount. Vue SSR and hydration tests do not
establish Nuxt or real Discord compatibility.
