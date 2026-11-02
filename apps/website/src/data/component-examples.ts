import { selectMenuExamples, selectMenuForWebsite } from "../../../../fixtures/select-menus";
import { scenarioExamples } from "./scenarios";

export type ComponentExample = {
  id: string;
  title: string;
  component?: string;
  family: string;
  description: string;
  code: string;
  layout?: "compact" | "message" | "conversation";
  interactive?: boolean;
};

export const channelCode = `function SupportChannel() {
  const [channel, setChannel] = useState(initialChannel);

  function toggleReaction(messageId, reactionId) {
    function update(message) {
      return message.id === messageId
        ? { ...message, reactions: message.reactions?.map(reaction => reaction.id === reactionId
          ? { ...reaction, me: !reaction.me, count: reaction.count + (reaction.me ? -1 : 1) }
          : reaction) }
        : message;
    }
    setChannel(current => ({
      ...current,
      messages: current.messages.map(update),
      threads: current.threads.map(thread => ({ ...thread, messages: thread.messages.map(update) })),
    }));
  }

  function send(content) {
    const message = {
      id: crypto.randomUUID(),
      author: { id: "you", displayName: "You", color: "#e4a44b", avatarFallback: { background: "#98601d", letter: "Y" } },
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
      author: { id: "you", displayName: "You", color: "#e4a44b", avatarFallback: { background: "#98601d", letter: "Y" } },
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
    onSend={send} onThreadSend={reply} onReactionToggle={toggleReaction} />;
}`;

function selectMenuCode(example: typeof selectMenuExamples[number]): string {
  const menu = selectMenuForWebsite(example.menu);
  return `function SelectExample() {
  const menu = ${JSON.stringify(menu, null, 2)};
  const defaults = menu.kind === "string-select"
    ? menu.options.filter(option => option.default).map(option => option.value)
    : (menu.defaultValues ?? []).map(value => value.id);
  const [values, setValues] = useState(defaults);
  const [single, setSingle] = useState([]);

  return <div style={{ display: "grid", gap: 16 }}>
    <h3>${example.title}</h3>
    <p>${example.description}</p>
    <p>Multiple selection: {menu.minValues}–{menu.maxValues} values.</p>
    <SelectMenu menu={menu} values={values} onChange={setValues} />
    <p role="status" aria-label="Selected values">{JSON.stringify(values)}</p>
    <h4>Single selection</h4>
    <SelectMenu menu={{ ...menu, id: menu.id + "-single", placeholder: "Choose one option", minValues: 1, maxValues: 1 }} values={single} onChange={setSingle} />
    <p role="status" aria-label="Single selected value">{JSON.stringify(single)}</p>
    <h4>Disabled state</h4>
    <SelectMenu menu={{ ...menu, id: menu.id + "-disabled", placeholder: "Disabled selection", disabled: true }} values={defaults} />
    <div><Button label="Reset selections" style="secondary" onClick={() => { setValues(defaults); setSingle([]); }} /></div>
  </div>;
}`;
}

export const componentExamples: ComponentExample[] = ([
  ...scenarioExamples,
  {
    id: "interaction",
    title: "Interaction response",
    component: "ReplyPreview",
    family: "Messages",
    layout: "message",
    description: "Show the invoking user and command above the application's response, without a separate user message.",
    code: `() => <Message message={{
      id: "command-response", author: demoBot, timestamp: demoTime,
      reply: { kind: "interaction", author: demoUser, commandName: "welcome preview" },
      body: { kind: "markdown", content: "## Preview ready\\nYour welcome message is ready to review." },
    }} />`,
  },
  {
    id: "ephemeral",
    title: "Ephemeral message",
    component: "Message",
    family: "Messages",
    layout: "message",
    interactive: true,
    description: "Dismiss and restore a private response. Compare its background, border and keyboard focus across Light, Ash and Dark.",
    code: `function EphemeralExample() {
  const [visible, setVisible] = useState(true);
  const restore = useRef(null);
  useEffect(() => {
    if (!visible)
      restore.current?.querySelector("button")?.focus();
  }, [visible]);
  return <div>
    {visible ? <Message message={{
      id: "private-preview", author: demoBot, timestamp: demoTime,
      reply: { kind: "interaction", author: demoUser, commandName: "welcome preview" },
      ephemeral: true,
      body: { kind: "text", content: "Your preview is visible only to you." },
    }} onEphemeralDismiss={() => setVisible(false)} /> : <p role="status">Private response dismissed.</p>}
    <div ref={restore}><Button label="Restore message" style="secondary" disabled={visible} onClick={() => setVisible(true)} /></div>
  </div>;
}`,
  },
  ...selectMenuExamples.map(example => ({
    id: example.id,
    title: example.title,
    component: "SelectMenu",
    family: "Select menus",
    description: example.description,
    code: selectMenuCode(example),
  })),
  {
    id: "reactions",
    title: "Reactions",
    family: "Messages",
    description: "Try a complete message with Markdown, media, an embed and interactive Unicode and custom emoji reactions.",
    code: `function ReactionExample() {
  const [message, setMessage] = useState({
    ...release,
    body: { kind: "markdown", content: "## A release worth celebrating 🎉\\nTry a reaction below. **Rich content**, an embed and custom emoji work together.\\n\\n||A little surprise for the community.||" },
    media: [{ id: "landscape", url: "/examples/landscape.svg", alt: "Illustrated mountains beneath a blue sky", width: 600, height: 320 }],
  });

  function toggleReaction(messageId, reactionId) {
    setMessage(current => ({
      ...current,
      reactions: current.reactions.map(reaction => reaction.id === reactionId
        ? { ...reaction, me: !reaction.me, count: reaction.count + (reaction.me ? -1 : 1) }
        : reaction),
    }));
  }

  return <>
    <Message message={message} onReactionToggle={toggleReaction} />
    <p>Read-only reactions</p>
    <Reactions reactions={release.reactions} />
  </>;
}`,
  },
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
    description: "Generate an avatar with a letter and background color, or display your own image.",
    code: `function AvatarGenerator() {
  const [letter, setLetter] = useState("A");
  const [background, setBackground] = useState("#337c96");
  const [color, setColor] = useState("#ffffff");
  const author = { id: "custom-avatar", displayName: "Inès", avatarFallback: { letter, background, color } };
  return <div style={{ display: "grid", gap: 16 }}>
    <label>Letter <input aria-label="Avatar letter" value={letter} onChange={event => setLetter(event.target.value)} /></label>
    <label>Background <input aria-label="Avatar background" type="color" value={background} onChange={event => setBackground(event.target.value)} /></label>
    <label>Text color <input aria-label="Avatar text color" type="color" value={color} onChange={event => setColor(event.target.value)} /></label>
    <Avatar author={author} />
    <Message message={{ id: "avatar-preview", author, timestamp: "2026-11-01T10:24:00Z", body: { kind: "text", content: "Your generated avatar, inside a message." } }} />
  </div>;
}`,
  },
  {
    id: "author",
    title: "Author",
    family: "Messages",
    description: "Display an author name and app badge.",
    code: "() => <Author author={welcome.author} />",
  },
  {
    id: "reply-preview",
    title: "ReplyPreview",
    family: "Messages",
    description: "Compare a resolved message reply and an unavailable original. Interaction responses have their own example.",
    code: `() => <div style={{ display: "grid", gap: 12 }}>
      <Message message={{ ...welcome, id: "resolved-reply", reactions: [],
        reply: { messageId: "question", author: demoUser, content: "Can you share the guide?" },
        body: { kind: "text", content: "The guide is ready to read." },
      }} />
      <Message message={{ ...welcome, id: "unavailable-reply", reactions: [],
        reply: { messageId: "deleted", unavailable: true },
        body: { kind: "text", content: "The original question is no longer available." },
      }} />
    </div>`,
  },
  {
    id: "attachments",
    title: "Classic attachments",
    component: "Message",
    family: "Messages",
    layout: "message",
    description: "Attach a downloadable file to a classic message. File components inside Components V2 have a separate example.",
    code: `() => <Message message={{ ...welcome, reactions: [],
      body: { kind: "text", content: "Here is the community guide." },
      attachments: [{ id: "guide", kind: "file", name: "guide.pdf", url: "https://example.com/guide.pdf", size: "24 KB" }],
    }} />`,
  },
  {
    id: "message-header",
    title: "MessageHeader",
    family: "Messages",
    description: "Combine an author and deterministic timestamp.",
    code: "() => <MessageHeader author={welcome.author} timestamp={welcome.timestamp} edited />",
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
  <div><Mention name="Inès" /> in <Mention name="support" kind="channel" />
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
    description: "Arrange message buttons or a select menu in an action row.",
    code: "() => <ActionRow><LinkButton label=\"Arcscord\" url=\"https://arcscord.dev\" /><LinkButton label=\"GitHub\" url=\"https://github.com/arcscord/discord-ui\" /></ActionRow>",
  },
  {
    id: "button",
    title: "Button",
    family: "Components V2",
    description: "Primary, secondary, success, danger and premium actions with disabled states.",
    code: `function Buttons() {
  const [clicked, setClicked] = useState("");
  return <><ActionRow>{["primary", "secondary", "success", "danger"].map(style => <Button key={style} style={style} label={style} onClick={() => setClicked(style)} />)}<Button label="Disabled" disabled /></ActionRow><p role="status">{clicked}</p></>;
}`,
  },
  {
    id: "select-menu",
    title: "SelectMenu",
    family: "Components V2",
    description: "Text, user, role, mentionable and channel menus with local or controlled selection.",
    code: `function SelectExample() {
  const [values, setValues] = useState([]);
  return <><SelectMenu menu={{ id: "choices", kind: "string-select", placeholder: "Choose test values", minValues: 0, maxValues: 2, options: [
    { value: "alpha", label: "Alpha", description: "First typed value" },
    { value: "beta", label: "Beta", description: "Second typed value" },
    { value: "gamma", label: "Gamma", description: "Third typed value" },
  ] }} values={values} onChange={setValues} /><p role="status">{values.join(", ")}</p></>;
}`,
  },
  {
    id: "file",
    title: "File",
    family: "Components V2",
    description: "Display an attached file with its size, safe link and optional spoiler.",
    code: "() => <File file={{ id: \"guide\", kind: \"file\", name: \"guide.pdf\", size: \"2.4 MB\", url: \"https://example.com/guide.pdf\" }} />",
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
    id: "slash-commands",
    title: "Slash commands",
    component: "ChannelComposer",
    family: "Conversations",
    description: "Type / to choose a command, add inline arguments, and try free text or fixed choices.",
    code: `function SlashCommandsExample() {
  const [channel, setChannel] = useState({ ...initialChannel, messages: [] });
  const commands = [
    { name: "bot-info", description: "Show community information", application: "Community Bot" },
    {
      name: "config autoreact",
      description: "View reactions or create a simple automatic reaction",
      application: "Community Bot",
      arguments: [
        { name: "word", description: "Word or phrase to react to in every channel", required: true },
        { name: "emoji", description: "Emoji for the quick reaction" },
        { name: "channel", description: "Limit the quick reaction to this channel", choices: [
          { name: "#general", value: "general" },
          { name: "#support", value: "support" },
        ] },
      ],
    },
  ];
  return <>
    <p>Type / below, choose config autoreact, then add word, emoji or channel.</p>
    <ChannelView channel={channel} height={450}
      commands={commands}
      onSlashCommand={({ command, arguments: values }) => setChannel(current => ({ ...current, messages: [...current.messages, {
        id: "command-" + (current.messages.length + 1), author: demoBot, timestamp: demoTime,
        reply: { kind: "interaction", author: demoUser, commandName: command.name },
        body: { kind: "text", content: command.name === "bot-info"
          ? "Community Bot is ready to help."
          : "Reaction preview: " + (values.emoji || "✨") + " for “" + values.word + "” in " + (values.channel ? "#" + values.channel : "all channels") },
      }] }))} />
    <p role="status" aria-label="Command result">{channel.messages.length ? "Command response added to the channel." : "No command submitted yet."}</p>
  </>;
}`,
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
          author: { id: "you", displayName: "You", color: "#e4a44b", avatarFallback: { background: "#98601d", letter: "Y" } },
          timestamp: new Date().toISOString(),
          body: { kind: "text", content },
        }],
      }))} />
  </div>;
}`,
  },
] satisfies ComponentExample[]).sort((a, b) => {
  const families = [
    "Scenarios",
    "Messages",
    "Rich content",
    "Components V2",
    "Select menus",
    "Conversations",
    "Foundation",
  ];
  return families.indexOf(a.family) - families.indexOf(b.family);
});

export function getExample(id: string | null | undefined): ComponentExample {
  return componentExamples.find(example => example.id === id) ?? componentExamples.find(example => example.id === "announcement")!;
}

export { playgroundUrl } from "./example-links";

export function exampleLayout(example: ComponentExample): "compact" | "message" | "conversation" {
  if (example.layout)
    return example.layout;
  if ([
    "channel-view",
    "message-list",
    "thread-panel",
    "thread-preview",
    "slash-commands",
  ].includes(example.id)) {
    return "conversation";
  }
  if ([
    "message",
    "reactions",
    "reply-preview",
    "message-components",
    "markdown",
    "media",
    "media-gallery",
    "embed",
  ].includes(example.id) || example.family === "Select menus") {
    return "message";
  }
  return "compact";
}
