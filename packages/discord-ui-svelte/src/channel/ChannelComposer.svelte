<script module lang="ts">
  import type { SlashCommand, SlashCommandHandler } from "@arcscord/discord-ui-core";
  import type { Snippet } from "svelte";

  export type ChannelComposerProps = {
    channelName: string;
    value: string;
    onValueChange: (value: string) => void;
    onSend?: ((content: string) => void) | undefined;
    commands?: readonly SlashCommand[] | undefined;
    onSlashCommand?: SlashCommandHandler | undefined;
    disabled?: boolean | undefined;
    leading?: Snippet;
    trailing?: Snippet;
  };
</script>

<script lang="ts">
  import { tick } from "svelte";
  import { getDisplayOptions } from "../display-context.js";
  import SlashCommandEditor from "./SlashCommandEditor.svelte";

  const { channelName, value, onValueChange, onSend, commands, onSlashCommand, disabled = false, leading, trailing }: ChannelComposerProps = $props();
  const display = getDisplayOptions();
  const labels = $derived(display().labels);
  const placeholder = $derived(labels.messagePlaceholder.replace("{channel}", channelName));
  const listId = $props.id();
  let input = $state<HTMLTextAreaElement>();
  let form = $state<HTMLFormElement>();
  let restoreInputFocus = false;
  let selected = $state.raw<SlashCommand>();
  let argumentValues = $state<Record<string, string>>({});
  let active = $state(0);
  let dismissed = $state(false);
  const query = $derived(value.slice(1).toLowerCase());
  const matches = $derived(value.startsWith("/") && !selected && !dismissed && !disabled
    ? commands?.filter(command => command.name.toLowerCase().includes(query)) ?? []
    : []);
  const activeIndex = $derived(Math.min(active, Math.max(0, matches.length - 1)));
  const canSend = $derived(selected
    ? Boolean(onSlashCommand)
    : Boolean(onSend));
  const valid = $derived(selected
    ? (selected.arguments ?? []).every((argument) => {
      const value = argumentValues[argument.name];
      return (!argument.required || Boolean(value?.trim()))
        && (!value || !argument.choices || argument.choices.some(choice => choice.value === value));
    })
    : Boolean(value.trim()));

  $effect(() => {
    if (selected) {
      const target = selected.arguments?.length
        ? form?.querySelector<HTMLElement>(".dui-slash-more")
        : form?.querySelector<HTMLElement>("button[type=submit]:not(:disabled)");
      (target ?? form?.querySelector<HTMLElement>(".dui-slash-heading button"))?.focus();
    }
    else if (restoreInputFocus) {
      restoreInputFocus = false;
      input?.focus();
    }
  });

  function selectCommand(command: SlashCommand): void {
    selected = command;
    argumentValues = {};
    onValueChange("");
  }

  function cancelCommand(): void {
    restoreInputFocus = true;
    selected = undefined;
    argumentValues = {};
    dismissed = true;
    onValueChange("/");
  }

  function send(): void {
    if (disabled || !valid)
      return;
    if (!selected) {
      onSend?.(value);
      return;
    }
    if (!onSlashCommand)
      return;
    onSlashCommand({
      command: selected,
      arguments: Object.fromEntries(Object.entries(argumentValues).filter(([, value]) => value.trim())),
    });
    restoreInputFocus = true;
    selected = undefined;
    argumentValues = {};
    onValueChange("");
  }

  function commandKey(event: KeyboardEvent): void {
    if (event.defaultPrevented || !selected || disabled || event.isComposing)
      return;
    if (event.key === "Escape" || (event.key === "Backspace" && !selected.arguments?.length)) {
      event.preventDefault();
      event.stopPropagation();
      cancelCommand();
    }
    else if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      form?.requestSubmit();
    }
  }

  function inputKey(event: KeyboardEvent): void {
    if (event.isComposing)
      return;
    if (matches.length) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const next = (activeIndex + (event.key === "ArrowDown"
          ? 1
          : -1) + matches.length) % matches.length;
        active = next;
        void tick().then(() => document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" }));
        return;
      }
      if ((event.key === "Enter" && !event.shiftKey) || event.key === "Tab") {
        event.preventDefault();
        selectCommand(matches[activeIndex]!);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        dismissed = true;
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey && onSend) {
      event.preventDefault();
      send();
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions (Handles keys bubbling from the composer controls.) -->
<form bind:this={form} class="dui-channel-composer" class:dui-composer-command={selected} onkeydown={commandKey} onsubmit={(event) => {
  event.preventDefault();
  send();
}}>
  {#if matches.length}
    <div class="dui-slash-list" id={listId} role="listbox" aria-label={labels.slashCommands}>
      {#each matches as command, index (command.name)}
        <button id={`${listId}-${index}`} type="button" role="option" aria-selected={index === activeIndex} class="dui-slash-option"
                onmousemove={() => active = index} onfocus={() => active = index}
                onmousedown={event => event.preventDefault()} onclick={() => selectCommand(command)}>
          <span class="dui-slash-summary"><strong>/{command.name}</strong><span>{command.description}</span></span>
          {#if command.application}<span class="dui-slash-application">{command.application}</span>{/if}
        </button>
      {/each}
    </div>
  {/if}
  {#if selected}
    <div class="dui-slash-fields">
      <SlashCommandEditor command={selected} values={argumentValues} onChange={values => argumentValues = values} onCancel={cancelCommand} {disabled} />
    </div>
  {/if}
  {#if leading}<div class="dui-composer-leading">{@render leading()}</div>{/if}
  <textarea bind:this={input} hidden={Boolean(selected)} aria-controls={matches.length ? listId : undefined}
            aria-activedescendant={matches.length
              ? `${listId}-${activeIndex}`
              : undefined}
            class="dui-channel-input" aria-label={placeholder} {placeholder} rows={1} {value} {disabled}
            oninput={(event) => {
              onValueChange(event.currentTarget.value);
              active = 0;
              dismissed = false;
            }} onkeydown={inputKey}></textarea>
  {#if trailing}<div class="dui-composer-trailing">{@render trailing()}</div>{/if}
  {#if canSend}
    <button type="submit" class="dui-channel-send" aria-label={labels.sendMessage} disabled={disabled || !valid}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m3 3 19 9-19 9 4-9-4-9Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
        <path d="M7 12h14" stroke="currentColor" stroke-width="1.8" />
      </svg>
    </button>
  {/if}
</form>
