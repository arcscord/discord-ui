import type { MentionInteractionHandlers as CoreMentionInteractionHandlers, MessageInteractionHandlers as CoreMessageInteractionHandlers, UserInteractionHandlers as CoreUserInteractionHandlers } from "@arcscord/discord-ui-core";

export type UserInteractionHandlers<E = MouseEvent> = CoreUserInteractionHandlers<E>;
export type MentionInteractionHandlers<E = MouseEvent> = CoreMentionInteractionHandlers<E>;
export type MessageInteractionHandlers<E = MouseEvent> = CoreMessageInteractionHandlers<E>;
