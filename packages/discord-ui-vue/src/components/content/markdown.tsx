import type { MarkdownBlock, MarkdownNode } from "@arcscord/discord-ui-core/markdown";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import type { VNodeChild } from "vue";
import { formatDiscordTimestamp, linkUrl } from "@arcscord/discord-ui-core";
import { parseMarkdown } from "@arcscord/discord-ui-core/markdown";
import { Fragment } from "vue";
import { defineRenderer } from "../../rendering";
import { Emoji } from "./emoji";
import { Mention } from "./mention";
import { Spoiler } from "./spoiler";
import { UnicodeEmoji } from "./unicode-emoji";

function string(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}
type MarkdownPropsInput = {
  content: string;
  referenceTime?: string | undefined;
};
export type MarkdownProps = MarkdownPropsInput;
export type MarkdownSlots = Record<string, never>;
export const Markdown = defineRenderer<MarkdownProps, MarkdownPropsInput, MarkdownSlots>("Markdown", ["content", "referenceTime"], [], (input, display) => {
  return () => {
    const { content, referenceTime } = input(true);
    const options = display;
    function children(value: unknown, key: string): VNodeChild {
      return Array.isArray(value)
        ? value.map((node: MarkdownNode, index) => render(node, `${key}-${index}`))
        : string(value);
    }
    function render(node: MarkdownNode, key: string): VNodeChild {
      const body = () => children(node.content, key);
      switch (node.type) {
        case "text": return <UnicodeEmoji key={key} content={string(node.content)} />;
        case "br":
        case "newline": return <br key={key} />;
        case "strong": return <strong key={key}>{body()}</strong>;
        case "em": return <em key={key}>{body()}</em>;
        case "underline": return <u key={key}>{body()}</u>;
        case "strikethrough": return <s key={key}>{body()}</s>;
        case "inlineCode": return <code key={key} class="dui-inline-code">{string(node.content)}</code>;
        case "codeBlock": return (
          <pre key={key} class="dui-code-block">
            {options.renderCode
              ? options.renderCode(string(node.content), string(node.lang))
              : <code>{string(node.content)}</code>}
          </pre>
        );
        case "spoiler": return <Spoiler key={key}>{body()}</Spoiler>;
        case "blockQuote": return <blockquote key={key} class="dui-blockquote">{body()}</blockquote>;
        case "heading": return <div key={key} role="heading" aria-level={Math.max(1, Math.min(3, Number(node.level) || 1))} class={`dui-heading dui-heading-${Math.max(1, Math.min(3, Number(node.level) || 1))}`}>{body()}</div>;
        case "subtext": return <small key={key} class="dui-subtext">{body()}</small>;
        case "url":
        case "autolink":
        case "link": {
          const url = linkUrl(string(node.target ?? node.content));
          const label = Array.isArray(node.content)
            ? body()
            : <UnicodeEmoji content={string(node.content ?? node.target)} />;
          return url
            ? <a key={key} href={url} target="_blank" rel="noreferrer noopener">{label}</a>
            : <Fragment key={key}>{label}</Fragment>;
        }
        case "user":
        case "channel":
        case "role": {
          const id = string(node.id);
          const kind = node.type;
          const entity = kind === "user"
            ? options.entities.users?.[id]
            : kind === "channel"
              ? options.entities.channels?.[id]
              : options.entities.roles?.[id];
          return <Mention key={key} kind={kind} name={entity?.name ?? id} color={entity?.color} />;
        }
        case "everyone":
        case "here": return <Mention key={key} name={node.type} />;
        case "emoji": {
          const entity = options.entities.emojis?.[string(node.id)];
          return <Emoji key={key} name={entity?.name ?? string(node.name)} image={entity?.image} />;
        }
        case "twemoji": return <UnicodeEmoji key={key} content={string(node.name)} />;
        case "slashCommand": return <Mention key={key} kind="command" name={options.entities.commands?.[string(node.id)]?.name ?? string(node.fullName ?? node.name)} />;
        case "timestamp": {
          const timestamp = formatDiscordTimestamp(string(node.timestamp), string(node.format), { ...options, referenceTime: referenceTime ?? options.referenceTime ?? "1970-01-01T00:00:00Z" });
          return timestamp
            ? <time key={key} class="dui-inline-timestamp" datetime={timestamp.dateTime}>{timestamp.label}</time>
            : <span key={key}>{options.labels.invalidTimestamp}</span>;
        }
        default: return <Fragment key={key}>{body()}</Fragment>;
      }
    }
    function inline(nodes: MarkdownNode[], key: string): VNodeChild {
      return nodes.map((node, index) => render(node, `${key}-${index}`));
    }
    function block(node: MarkdownBlock): VNodeChild {
      if (node.kind === "text")
        return <Fragment key={`text-${node.line}`}>{inline(node.children, `text-${node.line}`)}</Fragment>;
      const items = node.items.map(item => <li key={item.line}>{inline(item.children, `item-${item.line}`)}</li>);
      return node.ordered
        ? <ol key={`list-${node.line}`} start={node.start}>{items}</ol>
        : <ul key={`list-${node.line}`}>{items}</ul>;
    }
    return <div class="dui-markdown">{parseMarkdown(content).map(block)}</div>;
  };
});
export type MarkdownEmits = Record<string, never>;
