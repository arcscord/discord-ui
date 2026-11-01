import type { CSSProperties, KeyboardEvent } from "react";
import type { ChannelSelectOptionView, SelectMenuView } from "../../model/components";
import type { ResolvedSelectOption } from "../../utils/select-menus";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { defaultSelectValues, selectOptions } from "../../utils/select-menus";
import { mediaUrl } from "../../utils/urls";
import { Emoji } from "../content/emoji";

export type SelectMenuProps = {
  menu: SelectMenuView;
  values?: readonly string[] | undefined;
  onChange?: ((values: string[]) => void) | undefined;
};

function ChannelIcon({ option }: { option: ChannelSelectOptionView }) {
  let path = "M10 3 6 21M18 3l-4 18M3 9h18M1 15h18";
  switch (option.channelType) {
    case 1:
    case 3: path = "M4 4h16v12H9l-5 4V4Z";
      break;
    case 2:
    case 13: path = "m3 9 5 0 5-5v16l-5-5H3V9Zm13-1c3 2 3 6 0 8m3-11c5 4 5 10 0 14";
      break;
    case 5: path = "M3 9h4l12-5v16L7 15H3V9Zm4 6 2 6h4l-2-4";
      break;
    case 4: path = "m4 9 8 7 8-7";
      break;
    case 10:
    case 11:
    case 12: path = "M6 3 3 17M13 3l-3 14M1 7h16M0 13h11M13 13h9v6h-4l-3 3v-3h-2v-6Z";
      break;
    case 14:
    case 15: path = "M3 4h18v13H10l-5 4v-4H3V4Zm4 5h10M7 13h7";
      break;
    case 16: path = "M3 4h18v16H3V4Zm0 13 6-6 4 4 3-3 5 5M15 8h2";
      break;
    default: break;
  }
  if (option.rules)
    path = "M5 3h14v16H5V3Zm-3 4v15h17M8 10l3 3 5-6";
  return (
    <span className="dui-select-channel-icon">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d={path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {option.locked
        ? <svg className="dui-select-channel-lock" aria-hidden="true" viewBox="0 0 12 14"><path d="M3 6V4a3 3 0 0 1 6 0v2M2 6h8v7H2Z" fill="var(--discord-ui-select-menu-background)" stroke="currentColor" strokeWidth="2" /></svg>
        : null}
    </span>
  );
}

function OptionIcon({ option, chip = false }: { option: ResolvedSelectOption; chip?: boolean }) {
  if (option.entityType === "user") {
    const avatar = mediaUrl(option.avatarUrl);
    return (
      <span className="dui-select-avatar">
        {avatar
          ? <img src={avatar} alt="" />
          : <span aria-hidden="true">{option.label.slice(0, 1)}</span>}
        {option.status && !chip
          ? <span className={`dui-select-status dui-select-status-${option.status}`} aria-label={option.status} />
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
      ? <span className="dui-select-role-dot" style={{ background: color }} aria-hidden="true" />
      : null;
  }
  return option.emoji
    ? <span className="dui-select-emoji"><Emoji name={option.emoji.name} image={option.emoji.image} /></span>
    : null;
}

/** String options are fixed; entity menus search resolved server data supplied by the host. */
export function SelectMenu({ menu, values, onChange }: SelectMenuProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [localValues, setLocalValues] = useState(() => defaultSelectValues(menu));
  const [placement, setPlacement] = useState<CSSProperties>({});
  const selected = values ?? localValues;
  const options = selectOptions(menu);
  const entityMenu = menu.kind !== "string-select";
  const filtered = entityMenu && query
    ? options.filter(option => `${option.label} ${option.username ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    : options;
  const chosen = options.filter(option => selected.includes(option.value));
  const max = Math.min(25, Math.max(1, menu.maxValues ?? 1));
  const min = Math.max(0, menu.minValues ?? 1);
  const expanded = open && !menu.disabled;
  const placeholder = menu.placeholder ?? (menu.kind === "channel-select"
    ? "Select a channel"
    : "Make a selection");

  const desiredHeight = Math.min(280, filtered.reduce((height, option) => height + (entityMenu
    ? 44
    : option.description ? 56 : 40), 8));

  useLayoutEffect(() => {
    if (!expanded)
      return;
    function position() {
      const rect = rootRef.current?.getBoundingClientRect();
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
    listRef.current?.showPopover?.();
    window.addEventListener("resize", position);
    // Keep the top-layer menu anchored while its surrounding history scrolls.
    function scroll(event: Event) {
      if (event.target !== listRef.current)
        position();
    }
    window.addEventListener("scroll", scroll, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", scroll, true);
    };
  }, [expanded, desiredHeight, chosen.length]);

  useEffect(() => {
    if (!expanded)
      return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [expanded]);

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
    else setActive(-1);
  }
  function remove(value: string) {
    if (!menu.disabled && selected.length > min)
      commit(selected.filter(item => item !== value));
    inputRef.current?.focus();
  }
  function move(index: number) {
    setActive(index);
    optionsRef.current[index]?.scrollIntoView({ block: "nearest" });
  }
  function keyDown(event: KeyboardEvent<HTMLInputElement | HTMLButtonElement>) {
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
    "onKeyDown": keyDown,
  };
  const arrow = (
    <svg
      className="dui-select-chevron"
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      style={{
        transform: expanded ? "rotate(180deg)" : undefined,
      }}
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <div
      ref={rootRef}
      className="dui-select"
      data-kind={menu.kind}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setQuery("");
        }
      }}
    >
      {entityMenu
        ? (
            <div
              className="dui-select-trigger dui-select-entity-trigger"
              data-disabled={menu.disabled || undefined}
              data-open={expanded || undefined}
              onClick={() => {
                if (!menu.disabled) {
                  setOpen(true);
                  inputRef.current?.focus();
                }
              }}
            >
              {chosen.map(option => (
                <span className="dui-select-chip" key={option.value}>
                  <OptionIcon option={option} chip />
                  <span>{option.label}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${option.label}`}
                    disabled={menu.disabled || selected.length <= min}
                    onMouseDown={event => event.preventDefault()}
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
                className="dui-select-search"
                value={query}
                placeholder={chosen.length ? "" : placeholder}
                onChange={(event) => {
                  setQuery(event.target.value);
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
              className="dui-select-trigger"
              onClick={() => {
                setOpen(!open);
                setActive(-1);
              }}
            >
              {chosen.length === 1
                ? <OptionIcon option={chosen[0]!} chip />
                : null}
              <span className={chosen.length ? "dui-select-value" : "dui-select-placeholder"}>
                {chosen.length
                  ? chosen.map(option => option.label).join(", ")
                  : placeholder}
              </span>
              {arrow}
            </button>
          )}
      {expanded
        ? (
            <div ref={listRef} popover="manual" id={`${id}-list`} role="listbox" aria-label={placeholder} aria-multiselectable={max > 1} className="dui-select-options" style={placement}>
              {filtered.map((option, index) => {
                const checked = selected.includes(option.value);
                return (
                  <div
                    key={option.value}
                    ref={(element) => { optionsRef.current[index] = element; }}
                    id={`${id}-${index}`}
                    role="option"
                    aria-selected={checked}
                    aria-disabled={(!checked && max > 1 && selected.length >= max) || undefined}
                    className={`dui-select-option${active === index
                      ? " dui-select-option-active"
                      : ""}`}
                    onPointerMove={() => setActive(index)}
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => choose(option)}
                  >
                    <OptionIcon option={option} />
                    <span className="dui-select-option-copy">
                      <span className="dui-select-option-label">
                        <span className="dui-select-name">{option.label}</span>
                        {option.username
                          ? <span className="dui-select-username">{option.username}</span>
                          : null}
                        {option.bot
                          ? (
                              <span className="dui-bot-badge">
                                {option.verified ? "✓ " : ""}
                                APP
                              </span>
                            )
                          : null}
                      </span>
                      {option.description
                        ? <span className="dui-select-description">{option.description}</span>
                        : null}
                    </span>
                    {max > 1
                      ? <span aria-hidden="true" className={`dui-select-checkbox${checked ? " dui-select-checkbox-checked" : ""}`}>{checked ? "✓" : null}</span>
                      : checked
                        ? <span className="dui-select-check" aria-hidden="true">✓</span>
                        : null}
                  </div>
                );
              })}
              {!filtered.length
                ? <div className="dui-select-empty" role="note">{query ? "No results found" : "No options available"}</div>
                : null}
            </div>
          )
        : null}
    </div>
  );
}
