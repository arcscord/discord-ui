import type { ThreadSummaryView } from "@arcscord/discord-ui-core";
import type { PublicComponent } from "../../public-component";
import Implementation from "./thread-preview.vue";

export type ThreadPreviewProps = { thread: ThreadSummaryView; onOpen?: ((id: string) => void) | undefined; active?: boolean | undefined };
export type ThreadPreviewSlots = Record<string, never>;
export type ThreadPreviewEmits = { open: [id: string] };
export const ThreadPreview = Implementation as unknown as PublicComponent<ThreadPreviewProps, ThreadPreviewSlots, ThreadPreviewEmits>;
