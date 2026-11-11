import type { DiscordUIEmits, DiscordUIProps, DiscordUISlots } from "../display-context";
import type { PublicComponent } from "../public-component";
import Implementation from "./discord-ui.vue";

export const DiscordUI = Implementation as unknown as PublicComponent<DiscordUIProps, DiscordUISlots, DiscordUIEmits>;
