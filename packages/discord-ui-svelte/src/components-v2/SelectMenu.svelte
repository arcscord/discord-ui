<script module lang="ts">
  import type { SelectMenuView } from "@arcscord/discord-ui-core";

  export type SelectMenuProps = {
    menu: SelectMenuView;
    values?: readonly string[] | undefined;
    onChange?: ((values: string[]) => void) | undefined;
  };
</script>

<script lang="ts">
  import SelectMenuInput from "./SelectMenuInput.svelte";

  const props: SelectMenuProps = $props();
</script>

{#key JSON.stringify([props.menu.id, props.menu.kind])}
  <SelectMenuInput {...props} />
{/key}
