<script module lang="ts">
  import type { FileView } from "@arcscord/discord-ui-core";

  export type FileProps = { file: FileView };
</script>

<script lang="ts">
  import { linkUrl } from "@arcscord/discord-ui-core";
  import Spoiler from "../content/Spoiler.svelte";
  import { getDisplayOptions } from "../display-context.js";

  const { file }: FileProps = $props();
  const display = getDisplayOptions();
  const href = $derived(linkUrl(file.url));
  const download = $derived(display().labels.downloadFile.replace("{name}", file.name));
</script>

{#snippet content()}
  <div class="dui-file">
    <svg class="dui-file-icon" aria-hidden="true" width="32" height="40" viewBox="0 0 32 40" fill="none">
      <path d="M5 1.5h13.5L29 12v23a3.5 3.5 0 0 1-3.5 3.5H5A3.5 3.5 0 0 1 1.5 35V5A3.5 3.5 0 0 1 5 1.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
      <path d="M18 2v10h10M8 21h14M8 27h14M8 33h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <div class="dui-file-details">
      {#if href}<a {href} target="_blank" rel="noopener noreferrer">{file.name}</a>{:else}<span>{file.name}</span>{/if}
      {#if file.size}<small>{file.size}</small>{/if}
    </div>
    {#if href}
      <a class="dui-file-download" {href} download={file.name} target="_blank" rel="noopener noreferrer" aria-label={download} title={download}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 3v12m-5-5 5 5 5-5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </a>
    {/if}
  </div>
{/snippet}

{#if file.spoiler}
  <div class="dui-file-spoiler">
    {#key file.id}
      <Spoiler inline={false}>
        {#snippet placeholder()}
          <div class="dui-file dui-file-placeholder" aria-hidden="true">
            <span class="dui-file-icon"></span>
            <div class="dui-file-details"><span>&nbsp;</span>{#if file.size}<small>&nbsp;</small>{/if}</div>
          </div>
        {/snippet}
        {@render content()}
      </Spoiler>
    {/key}
  </div>
{:else}
  {@render content()}
{/if}
