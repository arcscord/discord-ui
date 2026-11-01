import type { ThemeName } from "@arcscord/discord-ui";
import { ActionRow, Author, Avatar, ChannelComposer, ChannelHeader, Container, Embed, Emoji, LinkButton, Markdown, Media, MediaGallery, Mention, Message, MessageComponents, MessageContent, MessageFrame, MessageHeader, MessageList, MessageTimestamp, Reactions, Section, Separator, Spoiler, TextDisplay, ThreadPanel, ThreadPreview, Thumbnail } from "@arcscord/discord-ui";
import { useRef, useState } from "react";
import { initialChannel, markdown, release, ticket, welcome } from "../data/examples";
import { demoMedia } from "../data/live-scope";
import { ConversationDemo } from "./ConversationDemo";

export function ComponentSample({ id, theme }: { id: string; theme: ThemeName }) {
  const [reactions, setReactions] = useState([
    {
      id: "like",
      emoji: { name: "👍" },
      count: 12,
      me: false,
    },
    {
      id: "heart",
      emoji: { name: "❤️" },
      count: 3,
      me: true,
    },
  ]);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState("");
  const [thread, setThread] = useState(initialChannel.threads![0]!);
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLDivElement>(null);
  switch (id) {
    case "reactions": return (
      <Reactions
        reactions={reactions}
        onToggle={id => setReactions(current => current.map(reaction => reaction.id === id
          ? { ...reaction, me: !reaction.me, count: reaction.count + (reaction.me
              ? -1
              : 1) }
          : reaction))}
      />
    );
    case "discord-ui": case "message": return <Message message={welcome} />;
    case "message-frame": return <MessageFrame avatar={<Avatar author={welcome.author} />} header={<MessageHeader author={welcome.author} timestamp={welcome.timestamp} />} footer={<small>Composed with React primitives.</small>}><MessageContent content="Every part has its place." /></MessageFrame>;
    case "avatar": return (
      <Avatar author={{
        id: "alex",
        displayName: "Alex",
        avatarFallback: { background: "#337c96", letter: "A" },
      }}
      />
    );
    case "author": return <Author author={welcome.author} />;
    case "message-header": return <MessageHeader author={welcome.author} timestamp={welcome.timestamp} />;
    case "message-timestamp": return <MessageTimestamp timestamp={welcome.timestamp} />;
    case "message-content": return <MessageContent content={"Hello from React.\nA new line, a new thought."} />;
    case "markdown": return (
      <Markdown content={markdown.body.kind === "markdown"
        ? markdown.body.content
        : ""}
      />
    );
    case "mention": return (
      <div>
        <Mention name="Alex" />
        {" "}
        in
        {" "}
        <Mention name="support" kind="channel" />
        {" "}
        with
        {" "}
        <Mention name="Moderators" kind="role" color="#a7a9ff" />
      </div>
    );
    case "emoji": return <Emoji name="arc" image="/examples/emoji.svg" />;
    case "spoiler": return (
      <div>
        A little surprise:
        <Spoiler>You found it!</Spoiler>
      </div>
    );
    case "media": return <Media media={demoMedia} />;
    case "media-gallery": return (
      <MediaGallery items={[
        demoMedia,
        { ...demoMedia, id: "hidden", spoiler: true },
      ]}
      />
    );
    case "embed": return <Embed embed={release.embeds![0]!} />;
    case "message-components": return (
      <MessageComponents components={ticket.body.kind === "components-v2"
        ? ticket.body.components
        : []}
      />
    );
    case "container": return <Container accentColor="#a7a9ff"><TextDisplay content={"## A space for your next idea.\nCompose text, media and actions."} /></Container>;
    case "section": return <Section accessory={<Thumbnail media={demoMedia} />}><TextDisplay content={"## Release notes\nA small update with room for detail."} /></Section>;
    case "text-display": return <TextDisplay content={"## Built with React\n**Your content**, your layout."} />;
    case "thumbnail": return <Thumbnail media={demoMedia} />;
    case "separator": return (
      <Container>
        <TextDisplay content="First thought." />
        <Separator spacing="large" />
        <TextDisplay content="Next thought." />
      </Container>
    );
    case "action-row": return (
      <ActionRow>
        <LinkButton label="Arcscord" url="https://arcscord.dev" />
        <LinkButton label="GitHub" url="https://github.com/arcscord/discord-ui" />
      </ActionRow>
    );
    case "link-button": return (
      <ActionRow>
        <LinkButton label="Read the guide" url="https://ui.arcscord.dev/docs/introduction" />
        <LinkButton label="Coming soon" url="https://arcscord.dev" disabled />
      </ActionRow>
    );
    case "channel-view": return <ConversationDemo theme={theme} />;
    case "channel-header": return <ChannelHeader name="support" topic="A little help goes a long way." />;
    case "channel-composer": return (
      <>
        <ChannelComposer
          channelName="support"
          value={draft}
          onValueChange={setDraft}
          onSend={(content) => {
            setSent(content);
            setDraft("");
          }}
        />
        <p aria-live="polite">
          {sent
            ? `Last sent: ${sent}`
            : "Try sending a message."}
        </p>
      </>
    );
    case "message-list": return <MessageList messages={initialChannel.messages} showDateSeparators={false} />;
    case "thread-preview": return (
      <>
        <div ref={openerRef}><ThreadPreview thread={initialChannel.messages[2]!.thread!} active={open} onOpen={() => setOpen(true)} /></div>
        {open
          ? (
              <div className="standalone-thread">
                <ThreadPanel
                  thread={thread}
                  onClose={() => {
                    setOpen(false);
                    openerRef.current?.querySelector("button")?.focus();
                  }}
                />
              </div>
            )
          : null}
      </>
    );
    case "thread-panel": return (
      <div className="standalone-thread">
        <ThreadPanel
          thread={thread}
          onSend={(content) => {
            const message = {
              id: crypto.randomUUID(),
              author: { id: "you", displayName: "You" },
              timestamp: new Date().toISOString(),
              body: { kind: "text" as const, content },
            };
            setThread(current => ({
              ...current,
              messages: [...current.messages, message],
            }));
          }}
        />
      </div>
    );
    default: return null;
  }
}
