<script lang="ts">
  import type { ComparisonConfig } from "../../../../../fixtures/comparison/scenarios";
  import type { NativeEvent, Snapshot } from "../protocol";
  import { tick } from "svelte";
  import { createLocalState, defaultConfig } from "../../../../../fixtures/comparison/scenarios";
  import { snapshot } from "../protocol";
  import Preview from "./Preview.svelte";

  const { event }: { event: (event: NativeEvent, state: Snapshot) => void } = $props();
  let config = $state(defaultConfig);
  let generation = $state(0);
  let latestSnapshot = snapshot(createLocalState());
  export async function configure(value: ComparisonConfig, reset: boolean): Promise<Snapshot> {
    config = value;
    if (reset)
      generation++;
    await tick();
    return latestSnapshot;
  }
</script>

{#key generation}
  <Preview {config} {event} report={value => latestSnapshot = value} />
{/key}
