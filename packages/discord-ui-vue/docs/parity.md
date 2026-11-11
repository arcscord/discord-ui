# React / Vue parity matrix

Generated from both public entry points. Components are exercised through the shared
SSR fixtures, Vue docs examples and the browser hydration scenarios. This records
local simulation coverage; it is not Nuxt or live Discord certification.

| React export | Vue export | Public Vue types | Validation |
| --- | --- | --- | --- |
| Author | Author | AuthorProps, AuthorSlots, AuthorEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| Avatar | Avatar | AvatarProps, AvatarSlots, AvatarEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| ChannelComposer | ChannelComposer | ChannelComposerProps, ChannelComposerSlots, ChannelComposerEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| ChannelHeader | ChannelHeader | ChannelHeaderProps, ChannelHeaderSlots, ChannelHeaderEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| ChannelView | ChannelView | ChannelViewProps, ChannelViewSlots, ChannelViewEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| MessageList | MessageList | MessageListProps, MessageListSlots, MessageListEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| MessageComponents | MessageComponents | MessageComponentsProps, MessageComponentsSlots, MessageComponentsEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| ActionRow | ActionRow | ActionRowProps, ActionRowSlots, ActionRowEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| Button | Button | ButtonProps, ButtonSlots, ButtonEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| Container | Container | ContainerProps, ContainerSlots, ContainerEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| File | File | FileProps, FileSlots, FileEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| LinkButton | LinkButton | LinkButtonProps, LinkButtonSlots, LinkButtonEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| Section | Section | SectionProps, SectionSlots, SectionEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| Separator | Separator | SeparatorProps, SeparatorSlots, SeparatorEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| TextDisplay | TextDisplay | TextDisplayProps, TextDisplaySlots, TextDisplayEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| Thumbnail | Thumbnail | ThumbnailProps, ThumbnailSlots, ThumbnailEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| SelectMenu | SelectMenu | SelectMenuProps, SelectMenuSlots, SelectMenuEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| Emoji | Emoji | EmojiProps, EmojiSlots, EmojiEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| Markdown | Markdown | MarkdownProps, MarkdownSlots, MarkdownEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| Mention | Mention | MentionProps, MentionSlots, MentionEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| Spoiler | Spoiler | SpoilerProps, SpoilerSlots, SpoilerEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| DiscordUI | DiscordUI | DiscordUIProps, DiscordUISlots, DiscordUIEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| Embed | Embed | EmbedProps, EmbedSlots, EmbedEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| Media | Media | MediaProps, MediaSlots, MediaEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| MediaGallery | MediaGallery | MediaGalleryProps, MediaGallerySlots, MediaGalleryEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| Message | Message | MessageProps, MessageSlots, MessageEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| MessageContent | MessageContent | MessageContentProps, MessageContentSlots, MessageContentEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| MessageFrame | MessageFrame | MessageFrameProps, MessageFrameSlots, MessageFrameEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| MessageHeader | MessageHeader | MessageHeaderProps, MessageHeaderSlots, MessageHeaderEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| MessageTimestamp | MessageTimestamp | MessageTimestampProps, MessageTimestampSlots, MessageTimestampEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| Reactions | Reactions | ReactionsProps, ReactionsSlots, ReactionsEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| ReplyPreview | ReplyPreview | ReplyPreviewProps, ReplyPreviewSlots, ReplyPreviewEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| ThreadPanel | ThreadPanel | ThreadPanelProps, ThreadPanelSlots, ThreadPanelEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |
| ThreadPreview | ThreadPreview | ThreadPreviewProps, ThreadPreviewSlots, ThreadPreviewEmits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |

Shared scenarios: classic/V2 messages, Markdown, embeds/files/media, unavailable media,
replies, reactions, all five select kinds, controlled selections/context, local identity
reset, composition, slash arguments, controlled/local threads, focus, themes and SSR
hydration. Packed SFC consumers are checked with minimum/development Vue without React.
