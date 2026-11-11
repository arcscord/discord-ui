import type { ChannelSelectOptionView, ResolvedSelectOption, SelectMenuView } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import type { CSSProperties } from "vue";
import { defaultSelectValues, mediaUrl, selectOptions } from "@arcscord/discord-ui-core";
import { shallowRef, useId } from "vue";
import { defaults } from "../../display-context";
import { defineRenderer, elementRef, mountedWatch, state, styleValue } from "../../rendering";
import { Emoji } from "../content/emoji";

type SelectMenuPropsInput = {
  "menu": SelectMenuView;
  "values"?: readonly string[] | undefined;
  "onUpdate:values"?: ((values: string[]) => void) | undefined;
};
export type SelectMenuProps = SelectMenuPropsInput;
export type SelectMenuSlots = Record<string, never>;
type ChannelIconInput = { option: ChannelSelectOptionView };
const ChannelIcon = defineRenderer<ChannelIconInput, ChannelIconInput, Record<string, never>>("ChannelIcon", ["option"], [], (input, _display) => {
  return () => {
    const { option } = input(true);
    let path = "M10 3 6 21M18 3l-4 18M3 9h18M1 15h18";
    switch (option.channelType) {
      case 1:
      case 3:
        path = "M4 4h16v12H9l-5 4V4Z";
        break;
      case 2:
      case 13:
        path = "m3 9 5 0 5-5v16l-5-5H3V9Zm13-1c3 2 3 6 0 8m3-11c5 4 5 10 0 14";
        break;
      case 5:
        path = "M3 9h4l12-5v16L7 15H3V9Zm4 6 2 6h4l-2-4";
        break;
      case 4:
        path = "m4 9 8 7 8-7";
        break;
      case 10:
      case 11:
      case 12:
        path = "M6 3 3 17M13 3l-3 14M1 7h16M0 13h11M13 13h9v6h-4l-3 3v-3h-2v-6Z";
        break;
      case 14:
      case 15:
        path = "M3 4h18v13H10l-5 4v-4H3V4Zm4 5h10M7 13h7";
        break;
      case 16:
        path = "M3 4h18v16H3V4Zm0 13 6-6 4 4 3-3 5 5M15 8h2";
        break;
      default: break;
    }
    if (option.rules)
      path = "M5 3h14v16H5V3Zm-3 4v15h17M8 10l3 3 5-6";
    return (
      <span class="dui-select-channel-icon">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d={path} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        {option.locked
          ? <svg class="dui-select-channel-lock" aria-hidden="true" viewBox="0 0 12 14"><path d="M3 6V4a3 3 0 0 1 6 0v2M2 6h8v7H2Z" fill="var(--discord-ui-select-menu-background)" stroke="currentColor" stroke-width="2" /></svg>
          : null}
      </span>
    );
  };
});
type SelectAvatarInput = { source: string | undefined; label: string };
const SelectAvatar = defineRenderer<SelectAvatarInput, SelectAvatarInput, Record<string, never>>("SelectAvatar", ["source", "label"], [], (input, _display) => {
  const [failedState, setFailed] = state<boolean>(false);
  function derive(withSlots = false) {
    const { source, label } = input(withSlots);
    const failed = failedState.value;
    return { source, label, failed };
  }
  return () => {
    const { source, label, failed } = derive(true);
    return source && !failed
      ? <img src={source} alt="" onError={() => setFailed(true)} />
      : <span aria-hidden="true">{Array.from(label)[0]}</span>;
  };
});
type OptionIconInput = { option: ResolvedSelectOption; chip?: boolean };
const OptionIcon = defineRenderer<OptionIconInput, OptionIconInput, Record<string, never>>("OptionIcon", ["option", "chip"], [], (input, display) => {
  return () => {
    const { option, chip = false } = input(true);
    const { allowRemoteMedia, labels } = display;
    const statuses = {
      online: labels.userOnline,
      idle: labels.userIdle,
      dnd: labels.userDnd,
      offline: labels.userOffline,
    };
    if (option.entityType === "user") {
      const avatar = mediaUrl(option.avatarUrl, allowRemoteMedia);
      return (
        <span class="dui-select-avatar">
          <SelectAvatar key={avatar ?? ""} source={avatar} label={option.label} />
          {option.status && !chip
            ? <span class={`dui-select-status dui-select-status-${option.status}`} aria-label={statuses[option.status] ?? option.status} />
            : null}
        </span>
      );
    }
    if (option.entityType === "channel")
      return <ChannelIcon option={option} />;
    if (option.entityType === "role") {
      const color = /^#[a-f\d]{6}$/iu.test(option.color ?? "")
        ? option.color
        : undefined;
      return color
        ? <span class="dui-select-role-dot" style={styleValue({ background: color })} aria-hidden="true" />
        : null;
    }
    return option.emoji
      ? <span class="dui-select-emoji"><Emoji name={option.emoji.name} image={option.emoji.image} /></span>
      : null;
  };
});
export const SelectMenu = defineRenderer<SelectMenuProps, SelectMenuPropsInput, SelectMenuSlots>("SelectMenu", ["menu", "values", "onUpdate:values"], [], (input, _display) => {
  return () => {
    const props = input(true);

    return <SelectMenuInput key={JSON.stringify([props.menu.id, props.menu.kind])} {...props} />;
  };
});
export type SelectMenuEmits = { "update:values": Parameters<NonNullable<SelectMenuProps["onUpdate:values"]>> };
const SelectMenuInput = defineRenderer<SelectMenuPropsInput, SelectMenuPropsInput, Record<string, never>>("SelectMenuInput", ["menu", "values", "onUpdate:values"], [], (input, display) => {
  const id = useId();
  const rootRef = shallowRef<HTMLDivElement | null>(null);
  const inputRef = shallowRef<HTMLInputElement | null>(null);
  const buttonRef = shallowRef<HTMLButtonElement | null>(null);
  const listRef = shallowRef<HTMLDivElement | null>(null);
  const optionsRef = shallowRef<(HTMLDivElement | null)[]>([]);
  const [openState, setOpen] = state<boolean>(false);
  const [queryState, setQuery] = state<string>("");
  const [activeState, setActive] = state<number>(-1);
  const [localValuesState, setLocalValues] = state<string[]>(defaultSelectValues((input().menu)));
  const [placementState, setPlacement] = state<CSSProperties>({});
  function derive(withSlots = false) {
    const { menu, values, "onUpdate:values": onChange } = input(withSlots);
    const { labels } = display;
    const open = openState.value;
    const query = queryState.value;
    const active = activeState.value;
    const localValues = localValuesState.value;
    const placement = placementState.value;
    const options = selectOptions(menu);
    const max = Math.min(25, Math.max(1, menu.maxValues ?? 1));
    const min = Math.min(max, Math.max(0, menu.minValues ?? 1));
    // The host supplies the complete resolved option set, including selected entities.
    const available = new Set(options.map(option => option.value));
    const selected = [
      ...new Set(values ?? localValues),
    ].filter(value => available.has(value)).slice(0, max);
    const entityMenu = menu.kind !== "string-select";
    const filtered = entityMenu && query
      ? options.filter(option => `${option.label} ${option.username ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
      : options;
    const chosen = options.filter(option => selected.includes(option.value));
    const expanded = open && !menu.disabled;
    const placeholder = menu.placeholder ?? (menu.kind === "channel-select"
      ? labels.channelSelectPlaceholder ?? defaults.labels.channelSelectPlaceholder!
      : labels.selectPlaceholder ?? defaults.labels.selectPlaceholder!);
    const desiredHeight = Math.min(280, filtered.reduce((height, option) => height + (entityMenu
      ? 44
      : option.description ? 56 : 40), 8));
    function commit(next: string[]) {
      setLocalValues(next);
      onChange?.(next);
    }
    function choose(option: ResolvedSelectOption) {
      const removing = selected.includes(option.value);
      if ((!removing && max > 1 && selected.length >= max) || (removing && selected.length <= min)) {
        if (max === 1)
          setOpen(false);
        return;
      }
      commit(removing
        ? selected.filter(value => value !== option.value)
        : max === 1
          ? [option.value]
          : [...selected, option.value]);
      setQuery("");
      if (max === 1)
        setOpen(false);
      else
        setActive(-1);
    }
    function remove(value: string) {
      if (!menu.disabled && selected.length > min)
        commit(selected.filter(item => item !== value));
      inputRef.value?.focus();
    }
    function move(index: number) {
      setActive(index);
      optionsRef.value[index]?.scrollIntoView({ block: "nearest" });
    }
    function keyDown(event: KeyboardEvent) {
      switch (event.key) {
        case "ArrowDown":
        case "ArrowUp":
          event.preventDefault();
          setOpen(true);
          move(filtered.length
            ? (!expanded || active < 0
                ? (event.key === "ArrowDown"
                    ? 0
                    : filtered.length - 1)
                : (active + (event.key === "ArrowDown"
                    ? 1
                    : -1) + filtered.length) % filtered.length)
            : -1);
          break;
        case "Home":
        case "End":
          if (!expanded || entityMenu)
            return;
          event.preventDefault();
          move(event.key === "Home"
            ? 0
            : filtered.length - 1);
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
            setOpen(true);
            move(0);
          }
          break;
        case "Escape":
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          setQuery("");
          break;
        case "Tab":
          setOpen(false);
          setQuery("");
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
            setOpen(true);
            move(index);
          }
        }
      }
    }
    const combo = {
      "role": "combobox" as const,
      "aria-label": placeholder,
      "aria-haspopup": "listbox" as const,
      "aria-expanded": expanded,
      "aria-controls": expanded
        ? `${id}-list`
        : undefined,
      "aria-activedescendant": expanded && filtered[active]
        ? `${id}-${active}`
        : undefined,
      "disabled": menu.disabled,
      "onKeydown": keyDown,
    };
    const arrow = (
      <svg
        class="dui-select-chevron"
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        style={styleValue({
          transform: expanded ? "rotate(180deg)" : undefined,
        })}
      >
        <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    );
    return {
      menu,
      values,
      onChange,
      labels,
      open,
      query,
      active,
      localValues,
      placement,
      options,
      max,
      min,
      available,
      selected,
      entityMenu,
      filtered,
      chosen,
      expanded,
      placeholder,
      desiredHeight,
      commit,
      choose,
      remove,
      move,
      keyDown,
      combo,
      arrow,
    };
  }
  mountedWatch(() => {
    const { chosen, expanded, desiredHeight } = derive();
    return [expanded, desiredHeight, chosen.length];
  }, () => {
    const { expanded, desiredHeight } = derive();
    return (() => {
      if (!expanded)
        return;
      function position() {
        const rect = rootRef.value?.getBoundingClientRect();
        if (!rect)
          return;
        const below = window.innerHeight - rect.bottom - 12;
        const above = rect.top - 12;
        const upwards = below < desiredHeight && above > below;
        setPlacement({
          left: rect.left,
          width: rect.width,
          maxHeight: Math.max(64, Math.min(280, upwards ? above : below)),
          top: upwards
            ? undefined
            : rect.bottom + 6,
          bottom: upwards
            ? window.innerHeight - rect.top + 6
            : undefined,
        });
      }
      position();
      listRef.value?.showPopover?.();
      window.addEventListener("resize", position);
      // Keep the top-layer menu anchored while its surrounding history scrolls.
      function scroll(event: Event) {
        if (event.target !== listRef.value)
          position();
      }
      window.addEventListener("scroll", scroll, true);
      return () => {
        window.removeEventListener("resize", position);
        window.removeEventListener("scroll", scroll, true);
      };
    })();
  });
  mountedWatch(() => {
    const { expanded } = derive();
    return [expanded];
  }, () => {
    const { expanded } = derive();
    return (() => {
      if (!expanded)
        return;
      function dismiss(event: PointerEvent) {
        if (event.target instanceof Node && !rootRef.value?.contains(event.target)) {
          setOpen(false);
          setQuery("");
        }
      }
      document.addEventListener("pointerdown", dismiss);
      return () => document.removeEventListener("pointerdown", dismiss);
    })();
  });
  mountedWatch(() => {
    const { values, localValues, selected } = derive();
    return [
      values,
      localValues,
      selected.join("\u0000"),
    ];
  }, () => {
    const { values, localValues, selected } = derive();
    if (values === undefined && (selected.length !== localValues.length || selected.some((value, index) => value !== localValues[index])))
      setLocalValues(selected);
  });
  return () => {
    const { menu, labels, open, query, active, placement, max, min, selected, entityMenu, filtered, chosen, expanded, placeholder, choose, remove, combo, arrow } = derive(true);
    return (
      <div
        ref={rootRef}
        class="dui-select"
        data-kind={menu.kind}
        onFocusout={(event) => {
          if (!(event.currentTarget as HTMLInputElement & HTMLFormElement & HTMLDivElement).contains(event.relatedTarget as Node | null)) {
            setOpen(false);
            setQuery("");
          }
        }}
      >
        {entityMenu
          ? (
              <div
                class="dui-select-trigger dui-select-entity-trigger"
                data-disabled={menu.disabled || undefined}
                data-open={expanded || undefined}
                onClick={() => {
                  if (!menu.disabled) {
                    setOpen(true);
                    inputRef.value?.focus();
                  }
                }}
              >
                {chosen.map(option => (
                  <span class="dui-select-chip" key={option.value}>
                    <OptionIcon option={option} chip />
                    <span>{option.label}</span>
                    <button
                      type="button"
                      aria-label={(labels.removeSelection ?? defaults.labels.removeSelection!).replace("{name}", option.label)}
                      disabled={menu.disabled || selected.length <= min}
                      onMousedown={event => event.preventDefault()}
                      onClick={(event) => {
                        event.stopPropagation();
                        remove(option.value);
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  {...combo}
                  ref={inputRef}
                  aria-autocomplete="list"
                  class="dui-select-search"
                  value={query}
                  placeholder={chosen.length ? "" : placeholder}
                  onInput={(event) => {
                    setQuery((event.target as HTMLInputElement).value);
                    setActive(-1);
                    setOpen(true);
                  }}
                  onClick={() => setOpen(true)}
                />
                {arrow}
              </div>
            )
          : (
              <button
                {...combo}
                ref={buttonRef}
                type="button"
                class="dui-select-trigger"
                onClick={() => {
                  setOpen(!open);
                  setActive(-1);
                }}
              >
                {chosen.length === 1
                  ? <OptionIcon option={chosen[0]!} chip />
                  : null}
                <span class={chosen.length ? "dui-select-value" : "dui-select-placeholder"}>
                  {chosen.length
                    ? chosen.map(option => option.label).join(", ")
                    : placeholder}
                </span>
                {arrow}
              </button>
            )}
        {expanded
          ? (
              <div ref={listRef} {...{ popover: "manual" }} id={`${id}-list`} role="listbox" aria-label={placeholder} aria-multiselectable={max > 1} class="dui-select-options" style={styleValue(placement)}>
                {filtered.map((option, index) => {
                  const checked = selected.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      ref={(rawElement) => {
                        const element = elementRef<HTMLDivElement>(rawElement);
                        optionsRef.value[index] = element;
                      }}
                      id={`${id}-${index}`}
                      role="option"
                      aria-selected={checked}
                      aria-disabled={(!checked && max > 1 && selected.length >= max) || undefined}
                      class={`dui-select-option${active === index
                        ? " dui-select-option-active"
                        : ""}`}
                      onPointermove={() => setActive(index)}
                      onMousedown={event => event.preventDefault()}
                      onClick={() => choose(option)}
                    >
                      <OptionIcon option={option} />
                      <span class="dui-select-option-copy">
                        <span class="dui-select-option-label">
                          <span class="dui-select-name">{option.label}</span>
                          {option.username
                            ? <span class="dui-select-username">{option.username}</span>
                            : null}
                          {option.bot
                            ? (
                                <span class="dui-bot-badge">
                                  {option.verified ? "✓ " : ""}
                                  APP
                                </span>
                              )
                            : null}
                        </span>
                        {option.description
                          ? <span class="dui-select-description">{option.description}</span>
                          : null}
                      </span>
                      {max > 1
                        ? <span aria-hidden="true" class={`dui-select-checkbox${checked ? " dui-select-checkbox-checked" : ""}`}>{checked ? "✓" : null}</span>
                        : checked
                          ? <span class="dui-select-check" aria-hidden="true">✓</span>
                          : null}
                    </div>
                  );
                })}
                {!filtered.length
                  ? (
                      <div class="dui-select-empty" role="note">
                        {query
                          ? labels.selectNoResults ?? defaults.labels.selectNoResults
                          : labels.selectNoOptions ?? defaults.labels.selectNoOptions}
                      </div>
                    )
                  : null}
              </div>
            )
          : null}
      </div>
    );
  };
});
