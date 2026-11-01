export type ComponentExample = {
  id: string;
  title: string;
  family: string;
  description: string;
  code: string;
};

export const channelCode = `function SupportChannel() {
  const [channel, setChannel] = useState(initialChannel);

  function send(content) {
    const message = {
      id: crypto.randomUUID(),
      author: { id: "you", displayName: "You" },
      timestamp: new Date().toISOString(),
      body: { kind: "text", content },
    };
    setChannel(current => ({
      ...current,
      messages: [...current.messages, message],
    }));
  }

  function reply(threadId, content) {
    const message = {
      id: crypto.randomUUID(),
      author: { id: "you", displayName: "You" },
      timestamp: new Date().toISOString(),
      body: { kind: "text", content },
    };
    setChannel(current => ({
      ...current,
      threads: current.threads.map(thread =>
        thread.id === threadId
          ? { ...thread, messages: [...thread.messages, message] }
          : thread),
      messages: current.messages.map(item =>
        item.thread?.id === threadId
          ? { ...item, thread: { ...item.thread,
              messageCount: item.thread.messageCount + 1,
              lastMessage: { author: message.author,
                content, timestamp: message.timestamp } } }
          : item),
    }));
  }

  return <ChannelView channel={channel} height={560}
    showDateSeparators={false}
    onSend={send} onThreadSend={reply} />;
}`;

export const componentExamples: ComponentExample[] = [
  {
    id: "discord-ui",
    title: "DiscordUI",
    family: "Foundation",
    description: "Scope theme, language, dates and entities to a part of your interface.",
    code: "() => <Message message={welcome} />",
  },
  {
    id: "message",
    title: "Message",
    family: "Messages",
    description: "Render an author, timestamp and rich message body from serializable data.",
    code: "() => <Message message={welcome} />",
  },
  {
    id: "message-frame",
    title: "MessageFrame",
    family: "Messages",
    description: "Compose the avatar, header, body and footer yourself.",
    code: `() => (
  <MessageFrame
    avatar={<Avatar author={welcome.author} />}
    header={<MessageHeader author={welcome.author} timestamp={welcome.timestamp} />}
    footer={<small>Composed with React primitives.</small>}
  >
    <MessageContent content="Every part has its place." />
  </MessageFrame>
)`,
  },
  {
    id: "avatar",
    title: "Avatar",
    family: "Messages",
    description: "Display a supplied avatar, with initials when an image is unavailable.",
    code: "() => <Avatar author={welcome.author} />",
  },
  {
    id: "author",
    title: "Author",
    family: "Messages",
    description: "Display an author name and app badge.",
    code: "() => <Author author={welcome.author} />",
  },
  {
    id: "message-header",
    title: "MessageHeader",
    family: "Messages",
    description: "Combine an author and deterministic timestamp.",
    code: "() => <MessageHeader author={welcome.author} timestamp={welcome.timestamp} />",
  },
  {
    id: "message-timestamp",
    title: "MessageTimestamp",
    family: "Messages",
    description: "Format an explicit ISO timestamp using the provider's locale and time zone.",
    code: "() => <MessageTimestamp timestamp={welcome.timestamp} />",
  },
  {
    id: "message-content",
    title: "MessageContent",
    family: "Messages",
    description: "Render literal message text, preserving line breaks.",
    code: "() => <MessageContent content={\"Hello from React.\\nA new line, a new thought.\"} />",
  },
  {
    id: "markdown",
    title: "Markdown",
    family: "Rich content",
    description: "Render Discord formatting, code, mentions and keyboard-accessible spoilers.",
    code: "() => <Markdown content={markdown.body.content} />",
  },
  {
    id: "mention",
    title: "Mention",
    family: "Rich content",
    description: "Show user, role, channel or command mentions.",
    code: `() => (
  <div><Mention name="Alex" /> in <Mention name="support" kind="channel" />
    with <Mention name="Moderators" kind="role" color="#a7a9ff" /></div>
)`,
  },
  {
    id: "emoji",
    title: "Emoji",
    family: "Rich content",
    description: "Render a custom emoji image or its readable name fallback.",
    code: "() => <Emoji name=\"arc\" image=\"/examples/emoji.svg\" />",
  },
  {
    id: "spoiler",
    title: "Spoiler",
    family: "Rich content",
    description: "Reveal and hide content with a button that works with the keyboard.",
    code: "() => <div>A little surprise: <Spoiler>You found it!</Spoiler></div>",
  },
  {
    id: "media",
    title: "Media",
    family: "Rich content",
    description: "Display an image with alternative text and a loading fallback.",
    code: "() => <Media media={demoMedia} />",
  },
  {
    id: "media-gallery",
    title: "MediaGallery",
    family: "Rich content",
    description: "Lay out multiple images, including spoiler media.",
    code: "() => <MediaGallery items={[demoMedia, { ...demoMedia, id: \"hidden\", spoiler: true }]} />",
  },
  {
    id: "embed",
    title: "Embed",
    family: "Rich content",
    description: "Display a rich embed with a title, fields and footer.",
    code: "() => <Embed embed={release.embeds[0]} />",
  },
  {
    id: "message-components",
    title: "MessageComponents",
    family: "Components V2",
    description: "Render the supported Components V2 display model.",
    code: "() => <MessageComponents components={ticket.body.components} />",
  },
  {
    id: "container",
    title: "Container",
    family: "Components V2",
    description: "Group content on a shared surface with an optional accent.",
    code: "() => <Container accentColor=\"#a7a9ff\"><TextDisplay content=\"## A space for your next idea.\nCompose text, media and actions.\" /></Container>",
  },
  {
    id: "section",
    title: "Section",
    family: "Components V2",
    description: "Pair text with a thumbnail or link-button accessory.",
    code: "() => <Section accessory={<Thumbnail media={demoMedia} />}><TextDisplay content=\"## Release notes\nA small update with room for detail.\" /></Section>",
  },
  {
    id: "text-display",
    title: "TextDisplay",
    family: "Components V2",
    description: "Render a block of Discord Markdown inside a composed layout.",
    code: "() => <TextDisplay content=\"## Built with React\n**Your content**, your layout.\" />",
  },
  {
    id: "thumbnail",
    title: "Thumbnail",
    family: "Components V2",
    description: "Fit an image into a section's accessory area.",
    code: "() => <Thumbnail media={demoMedia} />",
  },
  {
    id: "separator",
    title: "Separator",
    family: "Components V2",
    description: "Separate related content with a divider and configurable spacing.",
    code: "() => <Container><TextDisplay content=\"First thought.\" /><Separator spacing=\"large\" /><TextDisplay content=\"Next thought.\" /></Container>",
  },
  {
    id: "action-row",
    title: "ActionRow",
    family: "Components V2",
    description: "Arrange supported link buttons in a row.",
    code: "() => <ActionRow><LinkButton label=\"Arcscord\" url=\"https://arcscord.dev\" /><LinkButton label=\"GitHub\" url=\"https://github.com/arcscord/discord-ui\" /></ActionRow>",
  },
  {
    id: "link-button",
    title: "LinkButton",
    family: "Components V2",
    description: "Navigate to a safe HTTP(S) destination, with a disabled state.",
    code: "() => <ActionRow><LinkButton label=\"Read the guide\" url=\"https://ui.arcscord.dev/docs/introduction\" /><LinkButton label=\"Coming soon\" url=\"https://arcscord.dev\" disabled /></ActionRow>",
  },
  {
    id: "channel-view",
    title: "ChannelView",
    family: "Conversations",
    description: "Compose a channel with local sending and interactive threads.",
    code: channelCode,
  },
  {
    id: "channel-header",
    title: "ChannelHeader",
    family: "Conversations",
    description: "Give a channel its name, topic and optional actions.",
    code: "() => <ChannelHeader name=\"support\" topic=\"A little help goes a long way.\" />",
  },
  {
    id: "channel-composer",
    title: "ChannelComposer",
    family: "Conversations",
    description: "Control a draft and handle Enter to submit, or Shift+Enter for a new line.",
    code: `function ComposerExample() {
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState("");
  return <>
    <ChannelComposer channelName="support" value={draft}
      onValueChange={setDraft}
      onSend={content => { setSent(content); setDraft(""); }} />
    <p aria-live="polite">{sent ? "Last sent: " + sent : "Try sending a message."}</p>
  </>;
}`,
  },
  {
    id: "message-list",
    title: "MessageList",
    family: "Conversations",
    description: "Render an ordered history with optional date separators.",
    code: "() => <MessageList messages={initialChannel.messages} showDateSeparators={false} />",
  },
  {
    id: "thread-preview",
    title: "ThreadPreview",
    family: "Conversations",
    description: "Summarize a thread and open it from the parent message.",
    code: `function ThreadExample() {
  const [open, setOpen] = useState(false);
  const opener = useRef(null);
  function close() {
    setOpen(false);
    opener.current?.querySelector("button")?.focus();
  }
  return <>
    <div ref={opener}>
      <ThreadPreview thread={initialChannel.messages[2].thread}
        active={open} onOpen={() => setOpen(true)} />
    </div>
    {open ? <div style={{ height: 520, display: "flex" }}>
      <ThreadPanel thread={initialChannel.threads[0]} onClose={close} />
    </div> : null}
  </>;
}`,
  },
  {
    id: "thread-panel",
    title: "ThreadPanel",
    family: "Conversations",
    description: "Render a focused conversation with controlled local replies.",
    code: `function ThreadExample() {
  const [thread, setThread] = useState(initialChannel.threads[0]);
  return <div style={{ height: 520, display: "flex" }}>
    <ThreadPanel thread={thread}
      onSend={content => setThread(current => ({
        ...current,
        messages: [...current.messages, {
          id: crypto.randomUUID(),
          author: { id: "you", displayName: "You" },
          timestamp: new Date().toISOString(),
          body: { kind: "text", content },
        }],
      }))} />
  </div>;
}`,
  },
];

export function getExample(id: string | null | undefined): ComponentExample {
  return componentExamples.find(example => example.id === id) ?? componentExamples.find(example => example.id === "channel-view")!;
}

export function playgroundUrl(id: string): string {
  return `/playground?example=${encodeURIComponent(id)}`;
}
