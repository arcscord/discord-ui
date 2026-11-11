# Using @arcscord/discord-ui-vue

Read the [integration guide](./docs/agent-guide.md) and installed
[declarations](./dist/index.d.ts) before integrating this package.

- Use Vue 3.5+ in the Vue 3 line and public package imports; React is unnecessary.
- Import `@arcscord/discord-ui-vue/styles.css` once and wrap previews in `DiscordUI`.
- Models are serializable display data with string IDs, not send-payload validators.
- Slots customize composition; typed events report intent. The host owns persistence.
- Keep explicit timestamps/reference time, locale/time zone and initial SSR data equal.
- Preserve `allowRemoteMedia: false` and the shared URL handling when configured.
- Highlighting stays optional through `./highlight`; themes use `./themes`.
- Validate in the consumer; do not infer Nuxt or cross-browser compatibility.
