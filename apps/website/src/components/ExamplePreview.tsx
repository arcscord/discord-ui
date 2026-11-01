import type { MessageView, ThemeName } from "@arcscord/discord-ui";
import type { KeyboardEvent } from "react";
import { DiscordUI, Message } from "@arcscord/discord-ui";
import Link from "@docusaurus/Link";
import CodeBlock from "@theme/CodeBlock";
import { useId, useRef, useState } from "react";
import { playgroundUrl } from "../data/component-examples";
import { messageSource } from "../data/examples";

function InteractiveMessage({ message }: { message: MessageView }) {
  const [current, setCurrent] = useState(message);
  return (
    <Message
      message={current}
      onReactionToggle={(_messageId, reactionId) => {
        setCurrent(previous => ({
          ...previous,
          reactions: previous.reactions?.map(reaction => reaction.id === reactionId
            ? { ...reaction, me: !reaction.me, count: reaction.count + (reaction.me
                ? -1
                : 1) }
            : reaction) ?? [],
        }));
      }}
    />
  );
}

type Example = { label: string; file: string; message: MessageView };
const entities = {
  users: {
    "123456789012345678": { name: "Alex" },
  },
};

export function ExamplePreview({ examples, label }: { examples: Example[]; label: string }) {
  const [selected, setSelected] = useState(0);
  const [theme, setTheme] = useState<ThemeName>("dark");
  const id = useId();
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const example = examples[selected]!;
  const playgroundId = example.message.reactions?.length
    ? "reactions"
    : example.message.body.kind === "components-v2"
      ? "message-components"
      : example.message.embeds?.length
        ? "embed"
        : example.message.id === "markdown"
          ? "markdown"
          : "message";
  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight")
      next = (index + 1) % examples.length;
    else if (event.key === "ArrowLeft")
      next = (index + examples.length - 1) % examples.length;
    else if (event.key === "Home")
      next = 0;
    else if (event.key === "End")
      next = examples.length - 1;
    else return;
    event.preventDefault();
    setSelected(next);
    tabsRef.current[next]?.focus();
  }
  return (
    <div className="example-frame">
      <div className="example-tabs" role="tablist" aria-label={label}>
        {examples.map((item, index) => (
          <button
            key={item.label}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel`}
            aria-selected={selected === index}
            tabIndex={selected === index
              ? 0
              : -1}
            ref={(node) => { tabsRef.current[index] = node; }}
            onKeyDown={event => moveTab(event, index)}
            onClick={() => setSelected(index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="example-grid" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${selected}`}>
        <div className="example-code">
          <div className="example-bar">{example.file}</div>
          <div className="example-source"><CodeBlock language="tsx" showLineNumbers>{messageSource(example.message, theme)}</CodeBlock></div>
        </div>
        <div className="example-output">
          <div className="example-bar">
            <span>Live preview</span>
            <label>
              <span className="sr-only">
                {label}
                {" "}
                theme
              </span>
              <select value={theme} onChange={event => setTheme(event.target.value as ThemeName)}>
                <option value="dark">Dark</option>
                <option value="ash">Ash</option>
                <option value="light">Light</option>
              </select>
            </label>
          </div>
          <DiscordUI theme={theme} entities={entities} locale="en-US" timeZone="UTC" className="message-preview"><InteractiveMessage key={example.message.id} message={example.message} /></DiscordUI>
          <div className="example-caption">
            <span>React components. Real interactions.</span>
            <Link to={playgroundUrl(playgroundId)}>Open in playground</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
