<script module lang="ts">
  export type TextDisplayProps = { content: string; referenceTime?: string | undefined };
</script>

<script lang="ts">
  import Markdown from "../content/Markdown.svelte";

  const { content, referenceTime }: TextDisplayProps = $props();
</script>

<div class="dui-text-display"><Markdown {content} {referenceTime} /></div>
