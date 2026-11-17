<script module lang="ts">
  import type { ComponentHandlers, ComponentInteractionContext, MessageButtonView, MessageComponent, SelectValues } from "@arcscord/discord-ui-core";

  export type MessageComponentsProps = ComponentHandlers & {
    components: readonly MessageComponent[];
    referenceTime?: string | undefined;
    messageId?: string | undefined;
    selectValues?: SelectValues | undefined;
  };
</script>

<script lang="ts">
  import Emoji from "../content/Emoji.svelte";
  import MediaGallery from "../media/MediaGallery.svelte";
  import ActionRow from "./ActionRow.svelte";
  import Button from "./Button.svelte";
  import Container from "./Container.svelte";
  import File from "./File.svelte";
  import LinkButton from "./LinkButton.svelte";
  import Section from "./Section.svelte";
  import SelectMenu from "./SelectMenu.svelte";
  import Separator from "./Separator.svelte";
  import TextDisplay from "./TextDisplay.svelte";
  import Thumbnail from "./Thumbnail.svelte";

  const { components, referenceTime, messageId, selectValues, onButtonClick, onSelectChange, onPremiumClick }: MessageComponentsProps = $props();

  function context(componentId: string): ComponentInteractionContext {
    return messageId === undefined
      ? { componentId }
      : { componentId, messageId };
  }
</script>

{#snippet button(view: MessageButtonView)}
  {#if view.kind === "premium-button"}
    <Button label={`◆ ${view.label}`} ariaLabel={view.ariaLabel} variant="premium" disabled={view.disabled} onClick={() => onPremiumClick?.(view.skuId, context(view.id))} />
  {:else}
    {@const ariaLabel = view.ariaLabel?.trim() || (!view.label.trim()
      ? view.emoji?.name
      : undefined)}
    {#snippet emoji()}<Emoji name={view.emoji?.name ?? ""} image={view.emoji?.image} />{/snippet}
    {#if view.kind === "link-button"}
      <LinkButton label={view.label} {ariaLabel} url={view.url} disabled={view.disabled} emoji={view.emoji ? emoji : undefined} />
    {:else}
      <Button label={view.label} {ariaLabel} variant={view.style} disabled={view.disabled} emoji={view.emoji ? emoji : undefined} onClick={() => onButtonClick?.(view.id, context(view.id))} />
    {/if}
  {/if}
{/snippet}

{#snippet render(component: MessageComponent)}
  {#if component.kind === "text-display"}
    <TextDisplay content={component.content} {referenceTime} />
  {:else if component.kind === "section"}
    <Section>
      {#snippet accessory()}
        {#if component.accessory.kind === "thumbnail"}<Thumbnail media={component.accessory.media} />{:else}{@render button(component.accessory)}{/if}
      {/snippet}
      {#each component.components as text (text.id)}<TextDisplay content={text.content} {referenceTime} />{/each}
    </Section>
  {:else if component.kind === "media-gallery"}
    <MediaGallery items={component.items} />
  {:else if component.kind === "separator"}
    <Separator divider={component.divider} spacing={component.spacing} />
  {:else if component.kind === "action-row"}
    <ActionRow>
      {#if component.select}
        {@const menu = component.select}
        <SelectMenu {menu} values={selectValues && Object.hasOwn(selectValues, menu.id)
          ? selectValues[menu.id]
          : undefined} onChange={values => onSelectChange?.(menu.id, values, context(menu.id))} />
      {:else}
        {#each component.buttons as item (item.id)}{@render button(item)}{/each}
      {/if}
    </ActionRow>
  {:else if component.kind === "file"}
    <File file={component} />
  {:else if component.kind === "container"}
    <Container accentColor={component.accentColor} spoiler={component.spoiler}>
      {#each component.components as child (child.id)}{@render render(child)}{/each}
    </Container>
  {:else}
    <span role="note">Unsupported component</span>
  {/if}
{/snippet}

<div class="dui-components-v2">{#each components as component (component.id)}{@render render(component)}{/each}</div>
