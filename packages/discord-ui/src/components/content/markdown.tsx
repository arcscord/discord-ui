// AST rendering adapted from the AutoThreads renderer; see THIRD_PARTY_NOTICES.
import type { ReactNode } from "react";
import { parse } from "discord-markdown-parser";
import { Fragment } from "react";
import { formatDiscordTimestamp } from "../../utils/timestamps";
import { linkUrl } from "../../utils/urls";
import { useDisplayOptions } from "../display-context";
import { Emoji } from "./emoji";
import { Mention } from "./mention";
import { Spoiler } from "./spoiler";

type Node = Record<string, unknown> & { type?: string; content?: unknown };
function string(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

export type MarkdownProps = { content: string; referenceTime?: string | undefined };

export function Markdown({ content, referenceTime }: MarkdownProps) {
  const options = useDisplayOptions();
  function children(value: unknown, key: string): ReactNode {
    return Array.isArray(value)
      ? value.map((node: Node, index) => render(node, `${key}-${index}`))
      : string(value);
  }
  function render(node: Node, key: string): ReactNode {
    const body = () => children(node.content, key);
    switch (node.type) {
      case "text": return string(node.content);
      case "br": case "newline": return <br key={key} />;
      case "strong": return <strong key={key}>{body()}</strong>;
      case "em": return <em key={key}>{body()}</em>;
      case "underline": return <u key={key}>{body()}</u>;
      case "strikethrough": return <s key={key}>{body()}</s>;
      case "inlineCode": return <code key={key} className="dui-inline-code">{string(node.content)}</code>;
      case "codeBlock": return (
        <pre key={key} className="dui-code-block">
          {options.renderCode
            ? options.renderCode(string(node.content), string(node.lang))
            : <code>{string(node.content)}</code>}
        </pre>
      );
      case "spoiler": return <Spoiler key={key}>{body()}</Spoiler>;
      case "blockQuote": return <blockquote key={key} className="dui-blockquote">{body()}</blockquote>;
      case "heading": return <div key={key} role="heading" aria-level={Math.max(1, Math.min(3, Number(node.level) || 1))} className={`dui-heading dui-heading-${Math.max(1, Math.min(3, Number(node.level) || 1))}`}>{body()}</div>;
      case "subtext": return <small key={key} className="dui-subtext">{body()}</small>;
      case "url": case "autolink": case "link": {
        const url = linkUrl(string(node.target ?? node.content));
        const label = Array.isArray(node.content)
          ? body()
          : string(node.content ?? node.target);
        return url
          ? <a key={key} href={url} target="_blank" rel="noreferrer noopener">{label}</a>
          : <Fragment key={key}>{label}</Fragment>;
      }
      case "user": case "channel": case "role": {
        const id = string(node.id);
        const kind = node.type;
        const entity = kind === "user"
          ? options.entities.users?.[id]
          : kind === "channel"
            ? options.entities.channels?.[id]
            : options.entities.roles?.[id];
        return <Mention key={key} kind={kind} name={entity?.name ?? id} color={entity?.color} />;
      }
      case "everyone": case "here": return <Mention key={key} name={node.type} />;
      case "emoji": {
        const entity = options.entities.emojis?.[string(node.id)];
        return <Emoji key={key} name={entity?.name ?? string(node.name)} image={entity?.image} />;
      }
      case "twemoji": return <span key={key} className="dui-unicode-emoji">{string(node.name)}</span>;
      case "slashCommand": return <Mention key={key} kind="command" name={options.entities.commands?.[string(node.id)]?.name ?? string(node.fullName ?? node.name)} />;
      case "timestamp": {
        const timestamp = formatDiscordTimestamp(string(node.timestamp), string(node.format), { ...options, referenceTime: referenceTime ?? options.referenceTime ?? "1970-01-01T00:00:00Z" });
        return timestamp
          ? <time key={key} className="dui-inline-timestamp" dateTime={timestamp.dateTime}>{timestamp.label}</time>
          : <span key={key}>{options.labels.invalidTimestamp}</span>;
      }
      default: return <Fragment key={key}>{body()}</Fragment>;
    }
  }

  function inline(value: string, key: string): ReactNode {
    const nodes = parse(value, "extended") as Node[];
    const normalized: Node[] = [];
    const isBreak = (node: Node | undefined) => node?.type === "br" || node?.type === "newline";
    const isBlock = (node: Node | undefined) => [
      "codeBlock",
      "heading",
      "blockQuote",
      "subtext",
    ].includes(node?.type ?? "");
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      if (!node)
        continue;
      if (!isBreak(node)) {
        normalized.push(node);
        continue;
      }
      let end = index + 1;
      while (isBreak(nodes[end])) end++;
      // Block margins already represent one source newline; retain intentional blank lines.
      const structural = isBlock(nodes[index - 1]) || isBlock(nodes[end])
        ? 1
        : 0;
      for (let count = index + structural; count < end; count++) normalized.push(nodes[count]!);
      index = end - 1;
    }
    return normalized.map((node, index) => render(node, `${key}-${index}`));
  }

  // Recognize simple list blocks without touching fenced code or multiline spoilers/quotes.
  function blocks(value: string): ReactNode {
    const lines = value.split("\n");
    const output: ReactNode[] = [];
    let buffer: string[] = [];
    let fenced = false;
    let spoiler = false;
    function flush(key: number): void {
      if (buffer.length) {
        output.push(<Fragment key={`text-${key}`}>{inline(buffer.join("\n"), `text-${key}`)}</Fragment>);
        buffer = [];
      }
    }
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index] ?? "";
      if (/^\s*```/u.test(line))
        fenced = !fenced;
      const match = !fenced && !spoiler
        ? /^\s*([-*]|\d+\.) (.+)$/u.exec(line)
        : null;
      if (match) {
        flush(index);
        const ordered = /^\d/u.test(match[1] ?? "");
        const items: ReactNode[] = [];
        const start = Number.parseInt(match[1] ?? "1", 10) || 1;
        let next = index;
        while (next < lines.length) {
          const item = /^\s*([-*]|\d+\.) (.+)$/u.exec(lines[next] ?? "");
          if (!item || /^\d/u.test(item[1] ?? "") !== ordered)
            break;
          items.push(<li key={next}>{inline(item[2] ?? "", `item-${next}`)}</li>);
          next++;
        }
        output.push(ordered
          ? <ol key={`list-${index}`} start={start}>{items}</ol>
          : <ul key={`list-${index}`}>{items}</ul>);
        index = next - 1;
      }
      else {
        buffer.push(line);
      }
      if (!fenced && (line.match(/\|\|/gu)?.length ?? 0) % 2)
        spoiler = !spoiler;
    }
    flush(lines.length);
    return output;
  }

  return <div className="dui-markdown">{blocks(content)}</div>;
}
