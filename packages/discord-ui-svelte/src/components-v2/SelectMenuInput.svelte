<script lang="ts">
  import type { ResolvedSelectOption } from "@arcscord/discord-ui-core";
  import type { SelectMenuProps } from "./SelectMenu.svelte";
  import { defaultDisplayOptions, defaultSelectValues, selectOptions } from "@arcscord/discord-ui-core";
  import { tick, untrack } from "svelte";
  import { getDisplayOptions } from "../display-context.js";
  import SelectOptionIcon from "./SelectOptionIcon.svelte";

  const { menu, values, onChange }: SelectMenuProps = $props();
  const display = getDisplayOptions();
  const labels = $derived(display().labels);
  const defaults = defaultDisplayOptions.labels;
  const id = $props.id();
  let root = $state<HTMLDivElement>();
  let input = $state<HTMLInputElement>();
  let list = $state<HTMLDivElement>();
  let open = $state(false);
  let query = $state("");
  let active = $state(-1);
  let localValues = $state(untrack(() => defaultSelectValues(menu)));
  let placement = $state("");
  const options = $derived(selectOptions(menu));
  const max = $derived(Math.min(25, Math.max(1, menu.maxValues ?? 1)));
  const min = $derived(Math.min(max, Math.max(0, menu.minValues ?? 1)));
  const available = $derived(new Set(options.map(option => option.value)));
  const selected = $derived(Array.from(new Set(values ?? localValues)).filter(value => available.has(value)).slice(0, max));
  const entityMenu = $derived(menu.kind !== "string-select");
  const filtered = $derived(entityMenu && query
    ? options.filter(option => (`${option.label} ${option.username ?? ""}`).toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    : options);
  const chosen = $derived(options.filter(option => selected.includes(option.value)));
  const expanded = $derived(open && !menu.disabled);
  const placeholder = $derived(menu.placeholder ?? (menu.kind === "channel-select"
    ? labels.channelSelectPlaceholder ?? defaults.channelSelectPlaceholder
    : labels.selectPlaceholder ?? defaults.selectPlaceholder));
  const desiredHeight = $derived(Math.min(280, filtered.reduce((height, option) => height + (entityMenu
    ? 44
    : option.description ? 56 : 40), 8)));
  const listId = `${id}-list`;
  const combo = $derived({
    "role": "combobox" as const,
    "aria-label": placeholder,
    "aria-haspopup": "listbox" as const,
    "aria-expanded": expanded,
    "aria-controls": expanded ? listId : undefined,
    "aria-activedescendant": expanded && filtered[active]
      ? `${id}-${active}`
      : undefined,
    "disabled": menu.disabled,
    "onkeydown": keyDown,
  });

  $effect(() => {
    if (values === undefined && (selected.length !== localValues.length || selected.some((value, index) => value !== localValues[index])))
      localValues = selected;
  });

  $effect(() => {
    if (menu.disabled)
      dismiss();
  });

  $effect(() => {
    const popup = list;
    const trigger = root;
    if (!expanded || !popup || !trigger)
      return;
    // Recompute when option height or chip wrapping changes.
    const height = desiredHeight;
    function position(): void {
      if (!trigger)
        return;
      const rect = trigger.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const upwards = below < height && above > below;
      placement = `left:${rect.left}px;width:${rect.width}px;max-height:${
        Math.max(64, Math.min(280, upwards ? above : below))}px;${
        upwards
          ? `bottom:${window.innerHeight - rect.top + 6}`
          : `top:${rect.bottom + 6}`}px`;
    }
    position();
    popup.showPopover?.();
    function scroll(event: Event): void {
      if (event.target !== popup)
        position();
    }
    window.addEventListener("resize", position);
    window.addEventListener("scroll", scroll, true);
    const observer = typeof ResizeObserver === "undefined"
      ? undefined
      : new ResizeObserver(position);
    observer?.observe(trigger);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", scroll, true);
    };
  });

  $effect(() => {
    if (!expanded)
      return;
    function outside(event: PointerEvent): void {
      if (event.target instanceof Node && !root?.contains(event.target))
        dismiss();
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  });

  function dismiss(): void {
    open = false;
    query = "";
    active = -1;
  }

  function commit(next: string[]): void {
    localValues = next;
    onChange?.(next);
  }

  function choose(option: ResolvedSelectOption): void {
    if (menu.disabled)
      return;
    const removing = selected.includes(option.value);
    if ((!removing && max > 1 && selected.length >= max) || (removing && selected.length <= min)) {
      if (max === 1)
        dismiss();
      return;
    }
    commit(removing
      ? selected.filter(value => value !== option.value)
      : max === 1
      ? [option.value]
      : [...selected, option.value]);
    query = "";
    active = -1;
    if (max === 1)
      open = false;
  }

  function remove(value: string): void {
    if (!menu.disabled && selected.length > min)
      commit(selected.filter(item => item !== value));
    input?.focus();
  }

  function move(index: number): void {
    active = index;
    void tick().then(() => {
      if (active === index)
        list?.querySelectorAll<HTMLElement>(".dui-select-option")[index]?.scrollIntoView({ block: "nearest" });
    });
  }

  function keyDown(event: KeyboardEvent): void {
    if (menu.disabled || event.isComposing)
      return;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        const forward = event.key === "ArrowDown";
        const next = !expanded || active < 0
          ? forward
            ? 0
            : filtered.length - 1
          : (active + (forward
            ? 1
            : -1) + filtered.length) % filtered.length;
        open = true;
        move(filtered.length
          ? next
          : -1);
        break;
      }
      case "Home":
      case "End":
        if (expanded && !entityMenu) {
          event.preventDefault();
          move(event.key === "Home"
            ? 0
            : filtered.length - 1);
        }
        break;
      case "Enter":
      case " ":
        if (event.key === " " && entityMenu)
          return;
        event.preventDefault();
        if (expanded && filtered[active]) {
          choose(filtered[active]);
        }
        else {
          open = true;
          move(filtered.length
            ? 0
            : -1);
        }
        break;
      case "Escape":
        if (expanded) {
          event.preventDefault();
          event.stopPropagation();
          dismiss();
        }
        break;
      case "Tab":
        dismiss();
        break;
      case "Backspace":
        if (entityMenu && !query && selected.length > min)
          remove(selected[selected.length - 1]!);
        break;
      default: {
        if (entityMenu || event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey)
          return;
        const index = options.findIndex(option => option.label.toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()));
        if (index >= 0) {
          event.preventDefault();
          open = true;
          move(index);
        }
      }
    }
  }
</script>

{#snippet arrow()}
  <svg class="dui-select-chevron" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" style:transform={expanded ? "rotate(180deg)" : undefined}>
    <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
{/snippet}

<div bind:this={root} class="dui-select" data-kind={menu.kind} onfocusout={(event) => {
  if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget))
    dismiss();
}}>
  {#if entityMenu}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (Spacing around the keyboard-operable search input also transfers pointer focus.) -->
    <div class="dui-select-trigger dui-select-entity-trigger" data-disabled={menu.disabled || undefined} data-open={expanded || undefined} onclick={() => {
      if (!menu.disabled) {
        open = true;
        input?.focus();
      }
    }}>
      {#each chosen as option (option.value)}
        <span class="dui-select-chip">
          <SelectOptionIcon {option} chip />
          <span>{option.label}</span>
          <button type="button" aria-label={(labels.removeSelection ?? defaults.removeSelection ?? "").replace("{name}", option.label)}
                  disabled={menu.disabled || selected.length <= min} onmousedown={event => event.preventDefault()} onclick={(event) => {
                    event.stopPropagation();
                    remove(option.value);
                  }}>×</button>
        </span>
      {/each}
      <input {...combo} bind:this={input} aria-autocomplete="list" class="dui-select-search" value={query} placeholder={chosen.length ? "" : placeholder}
             oninput={(event) => {
               query = event.currentTarget.value;
               active = -1;
               open = true;
             }} onclick={() => open = true} />
      {@render arrow()}
    </div>
  {:else}
    <button {...combo} type="button" class="dui-select-trigger" onclick={() => {
      open = !open;
      active = -1;
    }}>
      {#if chosen.length === 1}<SelectOptionIcon option={chosen[0]!} chip />{/if}
      <span class={chosen.length ? "dui-select-value" : "dui-select-placeholder"}>{chosen.length
        ? chosen.map(option => option.label).join(", ")
        : placeholder}</span>
      {@render arrow()}
    </button>
  {/if}
  {#if expanded}
    <div bind:this={list} popover="manual" id={listId} role="listbox" aria-label={placeholder} aria-multiselectable={max > 1} class="dui-select-options" style={placement}>
      {#each filtered as option, index (option.value)}
        {@const checked = selected.includes(option.value)}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus (The combobox keeps focus and handles keyboard selection via aria-activedescendant.) -->
        <div id={`${id}-${index}`} role="option" aria-selected={checked} aria-disabled={(!checked && max > 1 && selected.length >= max) || undefined}
             class="dui-select-option" class:dui-select-option-active={active === index}
             onpointermove={() => active = index} onmousedown={event => event.preventDefault()} onclick={() => choose(option)}>
          <SelectOptionIcon {option} />
          <span class="dui-select-option-copy">
            <span class="dui-select-option-label">
              <span class="dui-select-name">{option.label}</span>
              {#if option.username}<span class="dui-select-username">{option.username}</span>{/if}
              {#if option.bot}<span class="dui-bot-badge">{option.verified ? "✓ " : ""}APP</span>{/if}
            </span>
            {#if option.description}<span class="dui-select-description">{option.description}</span>{/if}
          </span>
          {#if max > 1}
            <span aria-hidden="true" class="dui-select-checkbox" class:dui-select-checkbox-checked={checked}>{checked ? "✓" : ""}</span>
          {:else if checked}
            <span class="dui-select-check" aria-hidden="true">✓</span>
          {/if}
        </div>
      {:else}
        <div class="dui-select-empty" role="note">{query
          ? labels.selectNoResults ?? defaults.selectNoResults
          : labels.selectNoOptions ?? defaults.selectNoOptions}</div>
      {/each}
    </div>
  {/if}
</div>
