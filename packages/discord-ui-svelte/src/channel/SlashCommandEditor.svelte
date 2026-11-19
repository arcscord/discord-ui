<script lang="ts">
  import type { SlashCommand } from "@arcscord/discord-ui-core";
  import { getDisplayOptions } from "../display-context.js";

  const { command, values, onChange, onCancel, disabled }: {
    command: SlashCommand;
    values: Record<string, string>;
    onChange: (values: Record<string, string>) => void;
    onCancel: () => void;
    disabled: boolean;
  } = $props();
  const display = getDisplayOptions();
  const labels = $derived(display().labels);
  const id = $props.id();
  let added = $state<string[]>([]);
  let editing = $state<string>();
  let active = $state(0);
  let more = $state<HTMLButtonElement>();
  let editor = $state<HTMLDivElement>();
  const argument = $derived(command.arguments?.find(argument => argument.name === editing));
  const available = $derived(command.arguments?.filter(argument => !added.includes(argument.name)) ?? []);
  const query = $derived(argument
    ? values[argument.name] ?? ""
    : "");
  const choices = $derived(argument?.choices?.filter(choice => !query || choice.value === query
    || choice.name.toLowerCase().includes(query.toLowerCase())
    || choice.value.toLowerCase().includes(query.toLowerCase())));
  const options = $derived(editing
    ? choices ?? []
    : available);
  const activeIndex = $derived(Math.min(active, Math.max(0, options.length - 1)));

  $effect(() => {
    if (editing)
      editor?.querySelector<HTMLInputElement>(".dui-slash-token-active input")?.focus();
  });

  function activate(name: string): void {
    if (!added.includes(name))
      added = [...added, name];
    editing = name;
    active = 0;
  }

  function pick(index: number): void {
    if (argument?.choices) {
      const choice = choices?.[index];
      if (choice) {
        onChange({ ...values, [argument.name]: choice.value });
        editing = undefined;
        more?.focus();
      }
    }
    else if (available[index]) {
      activate(available[index].name);
    }
  }

  function removeArgument(name = editing, focusPrevious = false): void {
    if (!name) {
      onCancel();
      return;
    }
    const next = { ...values };
    delete next[name];
    onChange(next);
    const previousName = focusPrevious
      ? added[added.indexOf(name) - 1]
      : undefined;
    added = added.filter(item => item !== name);
    editing = previousName;
    if (!previousName)
      more?.focus();
  }

  function editorKey(event: KeyboardEvent): void {
    if (disabled || event.isComposing || !options.length || (event.target instanceof HTMLElement && event.target.closest(".dui-slash-heading")))
      return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      active = (activeIndex + (event.key === "ArrowDown"
        ? 1
        : -1) + options.length) % options.length;
      document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: "nearest" });
    }
    if (event.key === "Enter" || (event.key === "Tab" && editing && choices?.length)) {
      event.preventDefault();
      event.stopPropagation();
      pick(activeIndex);
    }
  }

  function moreKey(event: KeyboardEvent): void {
    if (disabled || event.isComposing || event.key !== "Backspace")
      return;
    const last = added.at(-1);
    event.preventDefault();
    event.stopPropagation();
    if (!last) {
      onCancel();
    }
    else if (!values[last]) {
      removeArgument(last, true);
    }
    else {
      const field = editor?.querySelector<HTMLInputElement>(".dui-slash-token:last-of-type input");
      field?.focus();
      field?.setSelectionRange(field.value.length, field.value.length);
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions (The editor handles keystrokes bubbling from its own keyboard-operable inputs and buttons.) -->
<div class="dui-slash-editor" bind:this={editor} onkeydown={editorKey}>
  {#if options.length && !disabled}
    <div class="dui-slash-list dui-slash-arguments" role="listbox" {id} aria-label={argument ? labels.chooseValue : labels.commandOptions}>
      <div class="dui-slash-list-title">{argument ? argument.name : labels.commandOptions}</div>
      {#each options as option, index (option.name)}
        <button id={`${id}-${index}`} type="button" role="option" aria-selected={index === activeIndex} class="dui-slash-option"
                onmousemove={() => active = index} onfocus={() => active = index} onmousedown={event => event.preventDefault()} onclick={() => pick(index)}>
          <span>{option.name}</span>
          {#if "description" in option}<span class="dui-slash-option-description">{option.description}</span>{/if}
        </button>
      {/each}
    </div>
  {/if}
  <div class="dui-slash-heading">
    <strong>{argument?.name ?? `/${command.name}`}</strong>
    <span>{argument?.description ?? command.description}</span>
    <button type="button" onclick={() => removeArgument()} {disabled} aria-label={argument ? labels.removeArgument : labels.cancelCommand}>×</button>
  </div>
  <div class="dui-slash-line">
    <span class="dui-slash-app-icon" aria-hidden="true">/</span>
    <strong class="dui-slash-command-name">/{command.name}</strong>
    {#each added as name (name)}
      {@const option = command.arguments?.find(argument => argument.name === name)}
      {#if option}
        {@const text = option.choices?.find(choice => choice.value === values[name])?.name ?? values[name] ?? ""}
        {@const expanded = Boolean(option.choices && editing === name && choices?.length)}
        <label class="dui-slash-token" class:dui-slash-token-active={editing === name}>
          <span>{name}</span>
          <input aria-label={name} {...{ "aria-description": option.description }}
                 role={option.choices ? "combobox" : undefined} aria-expanded={option.choices ? expanded : undefined}
                 aria-controls={expanded ? id : undefined} aria-activedescendant={expanded
                   ? `${id}-${activeIndex}`
                   : undefined}
                 autocomplete="off" style:--dui-argument-width={`${Math.max(1, text.length)}ch`} value={text}
                 required={option.required} {disabled} onfocus={() => activate(name)} onkeydown={(event) => {
                   if (!disabled && !event.isComposing && event.key === "Backspace" && !event.currentTarget.value) {
                     event.preventDefault();
                     event.stopPropagation();
                     removeArgument(name, true);
                   }
                 }} oninput={(event) => {
                   onChange({ ...values, [name]: event.currentTarget.value });
                   active = 0;
                 }} />
        </label>
      {/if}
    {/each}
    <button bind:this={more} class="dui-slash-more" type="button" {disabled} aria-label={labels.commandOptions}
            aria-expanded={!editing && available.length > 0} onfocus={() => editing = undefined} onkeydown={moreKey} onclick={() => {
              if (available.length)
                activate((available[activeIndex] ?? available[0]!).name);
              else
                more?.closest("form")?.requestSubmit();
            }}>
      {available.length
        ? `+${available.length} ${labels.commandOptions.toLowerCase()}`
        : labels.commandReady}
    </button>
  </div>
</div>
