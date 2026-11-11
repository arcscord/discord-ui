import type { DefineSetupFnComponent, SlotsType } from "vue";

type KebabCase<S extends string> = S extends `${infer Head}${infer Tail}`
  ? `${Lowercase<Head>}${Tail extends Uncapitalize<Tail> ? "" : "-"}${KebabCase<Tail>}`
  : S;
type EventName<Key extends string> = Key extends `onUpdate:${infer Model}` ? `update:${Model}` : Key extends `on${infer Name}` ? KebabCase<Name> : never;
export type EventsFromProps<P> = {
  [Key in keyof P & string as EventName<Key>]: NonNullable<P[Key]> extends (...args: infer Args) => unknown ? Args : never;
};
type RuntimeEmits<E extends Record<string, unknown[]>> = { [Key in keyof E]: (...args: E[Key]) => void };

/** Stable Vue 3.5.0 constructor, with explicit optional listener props and typed $emit. */
export type PublicComponent<P extends object, S extends object, E extends Record<string, unknown[]>> = DefineSetupFnComponent<P, RuntimeEmits<E>, SlotsType<S>, P>;
