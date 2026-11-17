<script module lang="ts">
  export type MentionProps = { name: string; kind?: "user" | "role" | "channel" | "command"; color?: string | undefined };
</script>

<script lang="ts">
  import { hexColor } from "../display-context.js";

  const { name, kind = "user", color }: MentionProps = $props();
</script>

<span class="dui-mention" style:color={hexColor(color)}>{kind === "channel"
  ? "#"
  : kind === "command"
  ? "/"
  : "@"}{name}</span>
