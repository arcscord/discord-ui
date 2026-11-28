import type { ResolvedSelectOption, SelectMenuView } from "@arcscord/discord-ui-core";
import type { CSSProperties, KeyboardEvent } from "react";
import { defaultSelectValues, mediaUrl, selectOptions } from "@arcscord/discord-ui-core";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ChannelIcon } from "../channel/channel-icon";
import { Emoji } from "../content/emoji";
import { defaults, useDisplayOptions } from "../display-context";

export type SelectMenuProps = {
  menu: SelectMenuView;
  values?: readonly string[] | undefined;
  onChange?: ((values: string[]) => void) | undefined;
};

function SelectAvatar({ source, label }: { source: string | undefined; label: string }) {
  const [failed, setFailed] = useState(false);
  return source && !failed
    ? <img src={source} alt="" onError={() => setFailed(true)} />
    : <span aria-hidden="true">{Array.from(label)[0]}</span>;
}

function OptionIcon({ option, chip = false }: { option: ResolvedSelectOption; chip?: boolean }) {
  const { allowRemoteMedia, remoteMediaAllowlist, labels } = useDisplayOptions();
  const statuses = {
    online: labels.userOnline,
    idle: labels.userIdle,
    dnd: labels.userDnd,
    offline: labels.userOffline,
  };
  if (option.entityType === "user") {
    const avatar = mediaUrl(option.avatarUrl, allowRemoteMedia, remoteMediaAllowlist);
    return (
      <span className="dui-select-avatar">
        <SelectAvatar key={avatar} source={avatar} label={option.label} />
        {option.status && !chip
          ? <span className={`dui-select-status dui-select-status-${option.status}`} aria-label={statuses[option.status] ?? option.status} />
          : null}
      </span>
    );
  }
  if (option.entityType === "channel")
    return <ChannelIcon channelType={option.channelType} locked={option.locked} rules={option.rules} />;
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
export function SelectMenu(props: SelectMenuProps) {
  return <SelectMenuInput key={JSON.stringify([props.menu.id, props.menu.kind])} {...props} />;
}

function SelectMenuInput({ menu, values, onChange }: SelectMenuProps) {
  const { labels } = useDisplayOptions();
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
  const options = selectOptions(menu);
  const max = Math.min(25, Math.max(1, menu.maxValues ?? 1));
  const min = Math.min(max, Math.max(0, menu.minValues ?? 1));
  // The host supplies the complete resolved option set, including selected entities.
  const available = new Set(options.map(option => option.value));
  const selected = [
    ...new Set(values ?? localValues),
  ].filter(value => available.has(value)).slice(0, max);
  if (values === undefined && (selected.length !== localValues.length || selected.some((value, index) => value !== localValues[index])))
    setLocalValues(selected);
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
                    aria-label={(labels.removeSelection ?? defaults.labels.removeSelection!).replace("{name}", option.label)}
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
                ? (
                    <div className="dui-select-empty" role="note">
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
}
