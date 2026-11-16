<script module lang="ts">
  import type { EmbedView } from "@arcscord/discord-ui-core";

  export type EmbedProps = { embed: EmbedView; referenceTime?: string | undefined };
</script>

<script lang="ts">
  import { linkUrl, mediaUrl } from "@arcscord/discord-ui-core";
  import Emoji from "../content/Emoji.svelte";
  import Markdown from "../content/Markdown.svelte";
  import { getDisplayOptions, hexColor } from "../display-context.js";
  import Media from "../media/Media.svelte";
  import MessageTimestamp from "../message/MessageTimestamp.svelte";

  const { embed, referenceTime }: EmbedProps = $props();
  const display = getDisplayOptions();
  const url = $derived(linkUrl(embed.url));
  const authorUrl = $derived(linkUrl(embed.author?.url));
  const authorImage = $derived(mediaUrl(embed.author?.iconUrl, display().allowRemoteMedia, display().remoteMediaAllowlist));
  const footerImage = $derived(mediaUrl(embed.footer?.iconUrl, display().allowRemoteMedia, display().remoteMediaAllowlist));
</script>

<section class="dui-embed" style:border-left-color={hexColor(embed.color)} aria-label={embed.title}>
  <div class="dui-embed-main">
    {#if embed.author}
      <div class="dui-embed-author">
        {#if authorImage}<Emoji name={embed.author.name} image={authorImage} />{/if}
        {#if authorUrl}<a href={authorUrl} target="_blank" rel="noreferrer noopener">{embed.author.name}</a>{:else}{embed.author.name}{/if}
      </div>
    {/if}
    {#if embed.title}
      <div class="dui-embed-title">
        {#if url}<a href={url} target="_blank" rel="noreferrer noopener">{embed.title}</a>{:else}{embed.title}{/if}
      </div>
    {/if}
    {#if embed.description}<Markdown content={embed.description} {referenceTime} />{/if}
    {#if embed.fields?.length}
      <div class="dui-embed-fields">
        {#each embed.fields as field (field.id)}
          <div class={field.inline ? "dui-embed-field-inline" : "dui-embed-field"}>
            <strong>{field.name}</strong>
            <Markdown content={field.value} {referenceTime} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
  {#if embed.thumbnail}<div class="dui-embed-thumbnail"><Media media={embed.thumbnail} /></div>{/if}
  {#if embed.image}<div class="dui-embed-image"><Media media={embed.image} /></div>{/if}
  {#if embed.footer || embed.timestamp}
    <footer class="dui-embed-footer">
      {#if footerImage}<Emoji name="" image={footerImage} />{/if}
      {embed.footer?.text}
      {#if embed.timestamp}<MessageTimestamp timestamp={embed.timestamp} />{/if}
    </footer>
  {/if}
</section>
