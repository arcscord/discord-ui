import type { ComponentPublicInstance, CSSProperties, ShallowRef, SlotsType, VNode, VNodeChild } from "vue";
import type { DisplayContextValue } from "./display-context";
import type { EventsFromProps, PublicComponent } from "./public-component";
import { Comment, defineComponent, getCurrentInstance, onBeforeUnmount, onMounted, shallowRef, Text, watch } from "vue";
import { useDisplayOptions } from "./display-context";

export type ViewSlots = Record<string, (() => VNodeChild) | undefined>;

/** Stateless and stateful renderers use the same typed Vue props/slots/event boundary. */
export function defineRenderer<P extends object, Input extends object = P, S extends ViewSlots = ViewSlots>(
  name: string,
  propNames: (keyof P & string)[],
  slotNames: string[],
  factory: (input: (withSlots?: boolean) => Input, display: DisplayContextValue) => () => VNodeChild,
): PublicComponent<P, S, EventsFromProps<P>> {
  const listeners = propNames.filter(key => key.startsWith("on"));
  function eventName(key: string): string {
    return key.startsWith("onUpdate:")
      ? `update:${key.slice(9)}`
      : key.slice(2).replace(/[A-Z]/gu, (letter, index) => `${index ? "-" : ""}${letter.toLowerCase()}`);
  }
  const booleanProps = new Set([
    "disabled",
    "inline",
    "spoiler",
    "divider",
    "edited",
    "ephemeral",
    "hasThread",
    "showThreadPreview",
    "showDateSeparators",
    "showThreadPreviews",
    "active",
    "composerDisabled",
    "autoScroll",
    "chip",
  ]);
  const runtimeProps = Object.fromEntries(propNames.map(key => [
    key,
    booleanProps.has(key)
      ? { type: Boolean, default: undefined }
      : null,
  ])) as import("vue").ComponentObjectPropsOptions<P>;
  const component = defineComponent((props: P, { slots, emit }) => {
    const display = useDisplayOptions();
    const instance = getCurrentInstance()!;
    const input = (withSlots = false): Input => {
      const values = { ...props } as Record<string, unknown>;
      for (const key of listeners) {
        if (Reflect.get(props, key) || instance.vnode.props?.[`${key}Once`] || key.startsWith("onUpdate:"))
          values[key] = (...args: unknown[]) => emit(eventName(key), ...args);
      }
      for (const key of withSlots
        ? slotNames
        : []) {
        const nodes = slots[key === "children"
          ? "default"
          : key]?.() as VNode[] | undefined;
        if (nodes?.some(node => node.type !== Comment && (node.type !== Text || String(node.children).length > 0)))
          values[key] = nodes;
      }
      return values as Input;
    };
    return factory(input, display);
  }, {
    name,
    props: runtimeProps,
    emits: listeners.map(eventName),
    slots: Object as SlotsType<S>,
  });
  return component as unknown as PublicComponent<P, S, EventsFromProps<P>>;
}

/** Native shallow refs with functional updates, used by the render-function components. */
export function state<T>(initial: T): readonly [ShallowRef<T>, (value: T | ((previous: T) => T)) => void] {
  const value = shallowRef(initial);
  return [
    value,
    (next) => {
      value.value = typeof next === "function"
        ? (next as (previous: T) => T)(value.value)
        : next;
    },
  ];
}

/** DOM work starts after mount and each watcher disposes its listeners on rerun/unmount. */
export function mountedWatch(source: () => unknown[], effect: () => void | (() => void)): void {
  let stop: (() => void) | undefined;
  onMounted(() => {
    // Watch each dependency, rather than a newly allocated tuple. This avoids
    // rerunning positioning effects when they update unrelated local state.
    const dependencies = source().map((_value, index) => () => source()[index]);
    stop = watch(dependencies, (_next, _previous, cleanup) => {
      const dispose = effect();
      if (dispose)
        cleanup(dispose);
    }, { immediate: true, flush: "post" });
  });
  onBeforeUnmount(() => stop?.());
}

const lengths = new Set([
  "height",
  "width",
  "minHeight",
  "maxHeight",
  "minWidth",
  "maxWidth",
  "top",
  "bottom",
  "left",
  "right",
]);
export function styleValue(style: CSSProperties | undefined): CSSProperties | undefined {
  return style && Object.fromEntries(Object.entries(style).map(([key, value]) => [
    key,
    typeof value === "number" && lengths.has(key)
      ? `${value}px`
      : value,
  ]));
}

export function elementRef<T extends Element>(node: Element | ComponentPublicInstance | null): T | null {
  return node instanceof Element
    ? node as T
    : null;
}
