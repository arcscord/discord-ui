<script lang="ts">
  import { MessageFrame } from "../src/index.js";

  const { mentioned = false }: { mentioned?: boolean } = $props();
</script>

<MessageFrame {mentioned}><p>Standalone mentioned frame</p></MessageFrame>
