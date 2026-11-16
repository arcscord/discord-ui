<script module lang="ts">
  import type { MarkdownNode } from "@arcscord/discord-ui-core/markdown";

  export type MarkdownProps = { content: string; referenceTime?: string | undefined };

  function string(value: unknown): string {
    return typeof value === "string" || typeof value === "number"
      ? String(value)
      : "";
  }
</script>

<script lang="ts">
  // AST rendering adapted from the AutoThreads renderer; see THIRD_PARTY_NOTICES.
  import { formatDiscordTimestamp, linkUrl } from "@arcscord/discord-ui-core";
  import { parseMarkdown } from "@arcscord/discord-ui-core/markdown";
  import { getDisplayOptions } from "../display-context.js";
  import Emoji from "./Emoji.svelte";
  import Mention from "./Mention.svelte";
  import Spoiler from "./Spoiler.svelte";
  import UnicodeEmoji from "./UnicodeEmoji.svelte";

  const { content, referenceTime }: MarkdownProps = $props();
  const display = getDisplayOptions();
  const blocks = $derived(parseMarkdown(content));
</script>

{#snippet inline(nodes: MarkdownNode[])}
  {#each nodes as node (node)}{@render renderNode(node)}{/each}
{/snippet}

{#snippet children(value: unknown)}
  {#if Array.isArray(value)}{@render inline(value)}{:else}{string(value)}{/if}
{/snippet}

{#snippet linkLabel(node: MarkdownNode)}
  {#if Array.isArray(node.content)}{@render children(node.content)}{:else}<UnicodeEmoji content={string(node.content ?? node.target)} />{/if}
{/snippet}

{#snippet renderNode(node: MarkdownNode)}
  {#if node.type === "text"}
    <UnicodeEmoji content={string(node.content)} />
  {:else if node.type === "br" || node.type === "newline"}
    <br />
  {:else if node.type === "strong"}
    <strong>{@render children(node.content)}</strong>
  {:else if node.type === "em"}
    <em>{@render children(node.content)}</em>
  {:else if node.type === "underline"}
    <u>{@render children(node.content)}</u>
  {:else if node.type === "strikethrough"}
    <s>{@render children(node.content)}</s>
  {:else if node.type === "inlineCode"}
    <code class="dui-inline-code">{string(node.content)}</code>
  {:else if node.type === "codeBlock"}
    {@const renderCode = display().renderCode}
    <pre class="dui-code-block">{#if renderCode}{@render renderCode(string(node.content), string(node.lang))}{:else}<code>{string(node.content)}</code>{/if}</pre>
  {:else if node.type === "spoiler"}
    <Spoiler>{@render children(node.content)}</Spoiler>
  {:else if node.type === "blockQuote"}
    <blockquote class="dui-blockquote">{@render children(node.content)}</blockquote>
  {:else if node.type === "heading"}
    {@const level = Math.max(1, Math.min(3, Number(node.level) || 1))}
    <div role="heading" aria-level={level} class={`dui-heading dui-heading-${level}`}>{@render children(node.content)}</div>
  {:else if node.type === "subtext"}
    <small class="dui-subtext">{@render children(node.content)}</small>
  {:else if node.type === "url" || node.type === "autolink" || node.type === "link"}
    {@const url = linkUrl(string(node.target ?? node.content))}
    {#if url}<a href={url} target="_blank" rel="noreferrer noopener">{@render linkLabel(node)}</a>{:else}{@render linkLabel(node)}{/if}
  {:else if node.type === "user" || node.type === "channel" || node.type === "role"}
    {@const id = string(node.id)}
    {@const entities = display().entities}
    {@const entity = node.type === "user"
      ? entities.users?.[id]
      : node.type === "channel"
      ? entities.channels?.[id]
      : entities.roles?.[id]}
    <Mention kind={node.type} name={entity?.name ?? id} color={entity?.color} />
  {:else if node.type === "everyone" || node.type === "here"}
    <Mention name={node.type} />
  {:else if node.type === "emoji"}
    {@const entity = display().entities.emojis?.[string(node.id)]}
    <Emoji name={entity?.name ?? string(node.name)} image={entity?.image} />
  {:else if node.type === "twemoji"}
    <UnicodeEmoji content={string(node.name)} />
  {:else if node.type === "slashCommand"}
    <Mention kind="command" name={display().entities.commands?.[string(node.id)]?.name ?? string(node.fullName ?? node.name)} />
  {:else if node.type === "timestamp"}
    {@const timestamp = formatDiscordTimestamp(string(node.timestamp), string(node.format), {
      ...display(),
      referenceTime: referenceTime ?? display().referenceTime ?? "1970-01-01T00:00:00Z",
    })}
    {#if timestamp}<time class="dui-inline-timestamp" datetime={timestamp.dateTime}>{timestamp.label}</time>{:else}<span>{display().labels.invalidTimestamp}</span>{/if}
  {:else}
    {@render children(node.content)}
  {/if}
{/snippet}

<div class="dui-markdown">
  {#each blocks as block (`${block.kind}-${block.line}`)}
    {#if block.kind === "text"}
      {@render inline(block.children)}
    {:else}
      <svelte:element this={block.ordered ? "ol" : "ul"} start={block.ordered ? block.start : undefined}>
        {#each block.items as item (item.line)}<li>{@render inline(item.children)}</li>{/each}
      </svelte:element>
    {/if}
  {/each}
</div>
