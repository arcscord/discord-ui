import type { MentionInteractionHandlers as CoreMentionHandlers, MessageInteractionHandlers as CoreMessageHandlers, UserInteractionHandlers as CoreUserHandlers } from "@arcscord/discord-ui-core";
import type { MouseEvent } from "react";

export type { MentionTarget } from "@arcscord/discord-ui-core";
export type UserInteractionHandlers<E = MouseEvent<HTMLElement>> = CoreUserHandlers<E>;
export type MentionInteractionHandlers<E = MouseEvent<HTMLElement>> = CoreMentionHandlers<E>;
export type MessageInteractionHandlers<E = MouseEvent<HTMLElement>> = CoreMessageHandlers<E>;
