import type { MessageView, SlashCommandInvocation, ThemeName } from "@arcscord/discord-ui";
import { ChannelComposer, ChannelView, DiscordUI, Message } from "@arcscord/discord-ui";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useIsBrowser from "@docusaurus/useIsBrowser";
import CodeBlock from "@theme/CodeBlock";
import { useEffect, useRef, useState } from "react";
import { arcadeChannel, arcadeCommands, createAnnouncement, createTranscript, demoBot, demoTime, demoUser } from "../data/landing-demos";

function DemoTheme({ value, onChange, label }: { value: ThemeName; onChange: (theme: ThemeName) => void; label: string }) {
  return (
    <label className="demo-theme">
      <span>{label}</span>
      <select aria-label={`${label} theme`} value={value} onChange={event => onChange(event.target.value as ThemeName)}>
        <option value="dark">Dark</option>
        <option value="ash">Ash</option>
        <option value="light">Light</option>
      </select>
    </label>
  );
}

// Links use explicit HTTP(S) URLs, as required by the public display models.
// Start from the configured origin for SSR, then use the local preview origin.
function useDemoOrigin() {
  const { siteConfig } = useDocusaurusContext();
  const isBrowser = useIsBrowser();
  return isBrowser ? window.location.origin : siteConfig.url;
}

export function HeroDemo() {
  const announcement = createAnnouncement(useDemoOrigin());
  const [theme, setTheme] = useState<ThemeName>("dark");
  const source = `import { DiscordUI, Message } from "@arcscord/discord-ui";
import "@arcscord/discord-ui/styles.css";

export default function Announcement() {
  return (
    <DiscordUI theme="${theme}" locale="en-US" timeZone="UTC">
      <Message message={message} />
    </DiscordUI>
  );
}

// Message data. Copy /examples/landscape.svg into your public folder.
const message = ${JSON.stringify(announcement, null, 2)};`;
  return (
    <div className="example-frame hero-demo">
      <div className="example-grid">
        <div className="example-code">
          <div className="example-bar">
            announcement.jsx
            <span>Components V2</span>
          </div>
          <div className="example-source"><CodeBlock language="jsx">{source}</CodeBlock></div>
        </div>
        <div className="example-output">
          <div className="example-bar">
            <span>One message. Many possibilities.</span>
            <DemoTheme value={theme} onChange={setTheme} label="Announcement" />
          </div>
          <DiscordUI theme={theme} locale="en-US" timeZone="UTC" className="message-preview"><Message message={announcement} /></DiscordUI>
          <div className="example-caption">
            <span>Rendered with the real React components.</span>
            <Link to="/components?example=message-components">Explore Components V2 →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TranscriptDemo() {
  const transcript = createTranscript(useDemoOrigin());
  const [theme, setTheme] = useState<ThemeName>("dark");
  return (
    <div className="example-frame transcript-demo">
      <div className="example-bar">
        <span className="demo-status">● Resolved ticket · 6 messages</span>
        <DemoTheme value={theme} onChange={setTheme} label="Transcript" />
      </div>
      <DiscordUI theme={theme} locale="en-US" timeZone="UTC" referenceTime={demoTime}><ChannelView channel={transcript} height={640} composer={false} autoScroll={false} showDateSeparators={false} /></DiscordUI>
      <div className="example-caption">
        <span>A saved conversation. Open “Permission check” to see the thread.</span>
        <Link to="/playground?example=channel-view">Explore channels in the playground →</Link>
      </div>
    </div>
  );
}

const quizzes = {
  gaming: {
    question: "Which item lets Mario survive an extra hit?",
    answers: ["Super Mushroom", "Banana Peel", "Portal Gun"],
    correct: 0,
    explanation: "The Super Mushroom turns Mario into Super Mario.",
  },
  space: {
    question: "Which planet is known as the Red Planet?",
    answers: ["Venus", "Mars", "Neptune"],
    correct: 1,
    explanation: "Iron oxide on Mars gives its surface a reddish colour.",
  },
};
const fortunes = [
  "Signs point to yes.",
  "Ask again after one more commit.",
  "The stars say: give it a try.",
  "Outlook uncertain. Snacks may help.",
];

function ArcadeSession() {
  const [messages, setMessages] = useState(arcadeChannel.messages);
  const [draft, setDraft] = useState("");
  const [composerVersion, setComposerVersion] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const serialRef = useRef(0);
  // A shortcut replaces any unfinished command and returns focus to the composer.
  useEffect(() => {
    if (composerVersion > 0)
      rootRef.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus();
  }, [composerVersion]);
  function invoke({ command, arguments: args }: SlashCommandInvocation) {
    const id = `play-${++serialRef.current}`;
    const user: MessageView = {
      id: `${id}-user`,
      author: demoUser,
      timestamp: demoTime,
      body: { kind: "text", content: `/${command.name}${Object.entries(args).map(([name, value]) => ` ${name}:${value}`).join("")}` },
    };
    let response: MessageView;
    if (command.name === "quiz") {
      const category = args.category === "space"
        ? "space"
        : "gaming";
      const quiz = quizzes[category];
      response = {
        id,
        author: demoBot,
        timestamp: demoTime,
        body: {
          kind: "components-v2",
          components: [
            {
              id: `${id}-card`,
              kind: "container",
              accentColor: "#a7a9ff",
              components: [
                { id: `${id}-question`, kind: "text-display", content: `## Quick quiz · ${category}\n${quiz.question}` },
                {
                  id: `${id}-answers`,
                  kind: "action-row",
                  buttons: quiz.answers.map((label, index) => ({
                    id: `${id}:${category}:${index}`,
                    kind: "button",
                    label,
                    style: "secondary",
                  })),
                },
              ],
            },
          ],
        },
      };
    }
    else if (command.name === "dice") {
      const faces = ["6", "12", "20"].includes(args.faces ?? "")
        ? Number(args.faces)
        : 6;
      response = {
        id,
        author: demoBot,
        timestamp: demoTime,
        body: { kind: "markdown", content: `## 🎲 You rolled ${Math.floor(Math.random() * faces) + 1}\nA ${faces}-sided die. Another round?` },
      };
    }
    else {
      response = {
        id,
        author: demoBot,
        timestamp: demoTime,
        body: { kind: "text", content: `🎱 “${args.question}”\n${fortunes[Math.floor(Math.random() * fortunes.length)]}` },
      };
    }
    setMessages(current => [...current, user, response]);
  }
  function answer(buttonId: string) {
    const [messageId, category, chosen] = buttonId.split(":");
    if (category !== "gaming" && category !== "space")
      return;
    const quiz = quizzes[category];
    setMessages(current => current.map((message): MessageView => {
      if (message.id !== messageId || message.body.kind !== "components-v2")
        return message;
      // Disable every answer after the first choice, including rapid repeated clicks.
      const card = message.body.components[0];
      if (card?.kind !== "container" || card.components.some(child => child.id === `${messageId}-result`))
        return message;
      return {
        id: message.id,
        author: message.author,
        timestamp: message.timestamp,
        body: {
          kind: "components-v2",
          components: [
            {
              ...card,
              components: [
                ...card.components.map(child => child.kind === "action-row" && child.buttons
                  ? {
                      ...child,
                      buttons: child.buttons.map((button, index) => ({
                        ...button,
                        disabled: true,
                        style: index === quiz.correct
                          ? "success" as const
                          : index === Number(chosen)
                            ? "danger" as const
                            : "secondary" as const,
                      })),
                    }
                  : child),
                { id: `${messageId}-result`, kind: "text-display", content: `${Number(chosen) === quiz.correct
                  ? "**Correct! 🎉**"
                  : `**Good try! The answer is ${quiz.answers[quiz.correct]}.**`}\n${quiz.explanation}` },
              ],
            },
          ],
        },
      };
    }));
  }
  return (
    <div ref={rootRef}>
      <div className="command-shortcuts" aria-label="Command shortcuts">
        <span>Try a command</span>
        {arcadeCommands.map(command => (
          <button
            className="command-shortcut"
            key={command.name}
            type="button"
            onClick={() => {
              setDraft(`/${command.name}`);
              setComposerVersion(version => version + 1);
            }}
          >
            {`/${command.name}`}
            <span>
              {command.name === "dice"
                ? "Roll a die"
                : command.name === "quiz"
                  ? "Test your knowledge"
                  : "Ask a question"}
            </span>
          </button>
        ))}
      </div>
      <ChannelView channel={{ ...arcadeChannel, messages }} height={520} showDateSeparators={false} onButtonClick={answer} composer={<ChannelComposer key={composerVersion} channelName="bot-playground" value={draft} onValueChange={setDraft} commands={arcadeCommands} onSlashCommand={invoke} />} />
    </div>
  );
}

export function SlashCommandDemo() {
  const [theme, setTheme] = useState<ThemeName>("dark");
  const [session, setSession] = useState(0);
  return (
    <div className="example-frame arcade-demo">
      <div className="example-bar">
        <span>Type / to start playing</span>
        <div className="demo-tools">
          <button className="demo-reset" type="button" onClick={() => setSession(value => value + 1)}>Reset demo</button>
          <DemoTheme value={theme} onChange={setTheme} label="Arcade" />
        </div>
      </div>
      <DiscordUI theme={theme} locale="en-US" timeZone="UTC"><ArcadeSession key={session} /></DiscordUI>
      <div className="example-caption">
        <span>Simulated in your browser. No Discord connection required.</span>
        <Link to="/playground?example=slash-commands">Explore the command API →</Link>
      </div>
    </div>
  );
}
