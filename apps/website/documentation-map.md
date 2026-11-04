# Documentation coverage map

Scope: navigation, getting started, contracts and feature guides (steps 1–10).
Every feature guide has a typed standalone module rendered beside its exact source,
behavior notes and links to the existing catalogue/playground. The API reference now includes signatures, props/model field tables, authored
behavior/default notes and validated examples. Seven complete recipes and local search are implemented. Compatibility, migration
and maintenance policies retain a single current documentation tree until multiple
released major versions are maintained.

| Area | Destination | Example / validation | Status |
| --- | --- | --- | --- |
| Introduction | `docs/introduction.mdx` | Real Message preview; production browser checks | Implemented |
| Installation | `docs/installation.md` | Root/package manifests and public imports | Implemented |
| Quick start | `docs/quick-start.mdx` | Shared typed FirstMessage module; spoiler and copy browser checks | Implemented |
| Component choice | `docs/choosing-components.md` | Catalogue links and source prop contracts | Implemented |
| Core concepts | `docs/concepts.md`, preserved `docs/public-api.md` | Models and interaction source | Implemented; model/props and interaction behavior reviewed |
| Messages and replies | `docs/guides/messages.mdx` | `message` catalogue/playground | Implemented; typed module, SSR and browser checks |
| Markdown, mentions and emoji | `docs/guides/markdown.mdx` | `markdown` catalogue/playground | Implemented; typed module, SSR and browser checks |
| Embeds | `docs/guides/embeds.mdx` | `embed` catalogue/playground | Implemented; typed module, SSR and browser checks |
| Media, galleries and files | `docs/guides/media.mdx` | `media-gallery` catalogue/playground | Implemented; typed module, SSR and browser checks |
| Components V2 | `docs/guides/components-v2.mdx` | `message-components` catalogue/playground | Implemented; typed module, SSR and browser checks |
| Buttons and select menus | `docs/guides/interactions.mdx` | `select-menu` catalogue/playground | Implemented; typed module, SSR and browser checks |
| Reactions | `docs/guides/reactions.mdx` | `reactions` catalogue/playground | Implemented; typed module, SSR and browser checks |
| Channels and message history | `docs/guides/channels.mdx` | `channel-view` catalogue/playground | Implemented; typed module, SSR and browser checks |
| Composer and slash commands | `docs/guides/composer.mdx` | `slash-commands` catalogue/playground | Implemented; typed module, SSR and browser checks |
| Threads | `docs/guides/threads.mdx` | `thread-panel` catalogue/playground | Implemented; typed module, SSR and browser checks |
| Themes and customization | `docs/guides/themes.mdx` | `discord-ui` catalogue/playground | Implemented; typed module, SSR and browser checks |
| Localization and timestamps | `docs/guides/localization.mdx` | `message-timestamp` catalogue/playground | Implemented; typed module, SSR and browser checks |
| SSR and hydration | `docs/guides/ssr.mdx` | `message` catalogue/playground | Implemented; typed module, SSR and browser checks |
| Accessibility | `docs/guides/accessibility.mdx` | `button` catalogue/playground | Implemented; typed module, SSR and browser checks |
| Display components | `docs/api-reference.md#display-components` | `DisplayOptions`, `UILabels`, `Author`, `AuthorProps`, `Avatar`, `AvatarProps`, `Emoji`, `EmojiProps`, `Markdown`, `MarkdownProps`, `Mention`, `MentionProps`, `DiscordUI`, `DiscordUIProps`, `Embed`, `EmbedProps`, `Media`, `MediaProps`, `MediaGallery`, `MediaGalleryProps`, `Message`, `MessageProps`, `MessageContent`, `MessageContentProps`, `MessageFrame`, `MessageFrameProps`, `MessageHeader`, `MessageHeaderProps`, `MessageTimestamp`, `MessageTimestampProps`, `ReplyPreview`, `ReplyPreviewProps` | Implemented; signatures, fields, authored notes and validated examples |
| Interactive components | `docs/api-reference.md#interactive-components` | `MessageComponents`, `MessageComponentsProps`, `ActionRow`, `Button`, `Container`, `File`, `LinkButton`, `Section`, `Separator`, `TextDisplay`, `Thumbnail`, `ActionRowProps`, `ButtonProps`, `ContainerProps`, `FileProps`, `LinkButtonProps`, `SectionProps`, `SeparatorProps`, `TextDisplayProps`, `ThumbnailProps`, `SelectMenu`, `SelectMenuProps`, `Spoiler`, `SpoilerProps`, `Reactions`, `ReactionsProps` | Implemented; signatures, fields, authored notes and validated examples |
| Conversation components | `docs/api-reference.md#conversation-components` | `ChannelComposer`, `ChannelComposerProps`, `ChannelHeader`, `ChannelHeaderProps`, `ChannelView`, `ChannelViewProps`, `MessageList`, `MessageListProps`, `ThreadPanel`, `ThreadPanelProps`, `ThreadPreview`, `ThreadPreviewProps` | Implemented; signatures, fields, authored notes and validated examples |
| Serializable models | `docs/api-reference.md#serializable-models` | `ChannelViewModel`, `ActionRowView`, `ButtonView`, `ChannelSelectMenuView`, `ChannelSelectOptionView`, `ComponentsV2Body`, `ContainerChild`, `ContainerView`, `FileView`, `GalleryView`, `LinkButtonView`, `MentionableSelectMenuView`, `MessageButtonView`, `MessageComponent`, `PremiumButtonView`, `RoleSelectMenuView`, `RoleSelectOptionView`, `SectionView`, `SelectChannelType`, `SelectDefaultValue`, `SelectMenuView`, `SelectOptionView`, `SeparatorView`, `StringSelectMenuView`, `StringSelectOptionView`, `TextDisplayView`, `ThumbnailView`, `UserSelectMenuView`, `UserSelectOptionView`, `EmbedView`, `EntityView`, `MarkdownMessageBody`, `MediaView`, `MessageEntities`, `ChannelEntityView`, `ChannelType`, `RoleView`, `UserView`, `AvatarFallback`, `InteractionReplyView`, `MessageAuthor`, `MessageContentView`, `MessageMetadata`, `MessageReplyView`, `MessageView`, `ReplyView`, `TextMessageBody`, `ReactionView`, `SlashCommand`, `SlashCommandArgument`, `SlashCommandInvocation`, `ThreadMessageView`, `ThreadSummaryView`, `ThreadView` | Implemented; signatures, fields, authored notes and validated examples |
| Interaction callbacks | `docs/api-reference.md#interaction-callbacks` | `ComponentHandlers`, `ComponentInteractionContext`, `SelectValues`, `SelectValuesByMessage`, `ReactionToggleHandler`, `SlashCommandHandler` | Implemented; signatures, fields, authored notes and validated examples |
| Theme helpers and tokens | `docs/api-reference.md#theme-helpers-and-tokens` | `defineTheme`, `themes`, `themeTokenProperties`, `DiscordTheme`, `ThemeInput`, `ThemeName`, `ThemeOverrides`, `ThemeTokens` | Implemented; signatures, fields, authored notes and validated examples |
| Optional highlighter | `docs/api-reference.md#optional-syntax-highlighting` | `renderHighlightedCode` in `src/highlight.tsx` | Implemented; separate-entry module, typecheck and SSR validation |
| Recipes | `docs/recipes.md`, `docs/recipes/` | Seven complete canonical JSX modules | Implemented; source parity, SSR and browser interactions |
| Troubleshooting | `docs/troubleshooting.md` | Styling, state, SSR, playground checklists | Implemented; symptom/cause/action guidance linked to tested scenarios |
| Project | `docs/project.md`, `docs/project/` | Declared versus tested compatibility, migration/version policy and maintenance | Implemented; local evidence boundaries and URL continuity |

The `/themes` entry additionally exports `resolveTheme` and `themeStyle`;
both are listed in the theme reference directory.

When exports change, reconcile `packages/discord-ui/src/index.ts`, `src/themes.ts`
and `src/highlight.tsx` against the reference directory. The stylesheet is the
fourth entry point and is covered by Installation. Keep `/docs/public-api` stable;
it retains the existing interaction-state guide. No redirects are required.

## Guide validation

- Source modules: `src/components/docs/guides/*.tsx`, using public imports only.
- Module semantics: website typecheck; deterministic SSR regression checks.
- Delivery: production build checks document links and fragments.
- Browser: direct routes, copy/source parity, keyboard controls, local sends,
  controlled thread navigation, theme changes and narrow-layout overflow checks.
- These are local previews and fixture checks, not live Discord integration.

## Public API and linked examples

`documentation-api-map.md` is the exhaustive export → entry → section → validation
matrix. Run `pnpm docs:api` to regenerate API pages; `pnpm docs:api:check` checks them
without writing. Every guide links its actual imported components to the reference
and offers a richer canonical module; catalogue and playground headers link back.
`docs/playground.md` covers imports, draft/reset recovery, copying and assets.

## Recipes, search and maintenance

- Recipes: transcript, interactive preview, per-message controlled selections,
  local channel, channel threads, slash responses, custom theme/labels.
- Canonical modules: `src/data/recipe-examples.ts`; generated previews stay ignored.
- Search: `plugins/documentation-search.ts`, `search-sections.ts` and the `/search`
  route component. Public document routes come from Docusaurus metadata; section
  extraction and ranking have focused tests.
- Project pages: compatibility evidence boundaries, actual-release migration and
  versioning policy, validation commands and source/URL maintenance.
- No fabricated historical versions, published release or remote CI/deployment
  results are asserted by these local documentation changes.

## Final delivery and acceptance

The six delivery batches and completion criteria are published in
`docs/project/documentation-quality.md`. `documentation-completion.md` records local
verification and remaining evidence boundaries. `pnpm docs:check` verifies API
freshness plus all production internal links, fragments, local assets and example
deep links after a build. Full unit/browser suites complete the final acceptance.
