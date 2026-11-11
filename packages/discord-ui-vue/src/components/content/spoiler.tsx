import type { VNodeChild } from "vue";
import type { PublicComponent } from "../../public-component";
import Implementation from "./spoiler.vue";

export type SpoilerProps = { inline?: boolean };
export type SpoilerSlots = { default?: () => VNodeChild; placeholder?: () => VNodeChild };
export type SpoilerEmits = Record<string, never>;
export const Spoiler = Implementation as unknown as PublicComponent<SpoilerProps, SpoilerSlots, SpoilerEmits>;
