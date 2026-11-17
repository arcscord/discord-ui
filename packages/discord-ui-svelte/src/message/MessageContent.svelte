<script module lang="ts">
  export type MessageContentProps = { content: string };
</script>

<script lang="ts">
  import UnicodeEmoji from "../content/UnicodeEmoji.svelte";

  const { content }: MessageContentProps = $props();
</script>

<div class="dui-message-text"><UnicodeEmoji {content} /></div>
