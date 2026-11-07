# Using @arcscord/discord-ui

These instructions are for agents integrating the installed library into an
application. They are not instructions for contributing to the library repository.

Before changing an integration, read the [local integration guide](./docs/agent-guide.md)
and the relevant declarations shipped in [dist/index.d.mts](./dist/index.d.mts).
These files describe the installed version. Follow declaration imports into other
local `.d.mts` files when necessary; do not invent props from another UI library
or from Discord API payloads.

- Import components and models from `@arcscord/discord-ui`; import the compiled
  stylesheet once from `@arcscord/discord-ui/styles.css`.
- Use React 19 and ESM. Wrap message primitives in `DiscordUI` for styling and
  display options. No Tailwind setup, global reset or remote font is needed.
- Supply serializable display models with string IDs and explicit timestamps.
  The application owns Discord API calls, persistence and resolved entity data.
- Keep classic messages and Components V2 separate. Use `edited?: boolean` for
  the edited marker; replies and threads have different contracts.
- Keep server and initial client data, locale, time zone and reference time equal.
  Do not introduce an implicit clock to construct a preview.
- Use Light/Ash/Dark presets and semantic theme tokens. Import theme helpers from
  `@arcscord/discord-ui/themes` when configuring themes outside client components.
- Syntax highlighting is optional: use `@arcscord/discord-ui/highlight` only when
  needed. Preserve `allowRemoteMedia={false}` when the application uses it.
- Callbacks report user intent. Controlled selections and thread navigation need
  updates in the application; a callback alone does not persist data.
- Validate with the consuming application's TypeScript, rendering and interaction
  checks. SSR rendering alone does not establish framework hydration compatibility.

Installation makes these files available in the package. Agents do not necessarily
discover dependency instructions automatically. See the [README](./README.md#ai-coding-agents)
for a block to add to the consuming project's instructions.
