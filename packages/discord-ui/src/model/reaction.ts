/** Serializable reaction state owned by the consuming application. */
export type ReactionView = {
  id: string;
  emoji: { name: string; image?: string };
  count: number;
  me?: boolean;
};

export type ReactionToggleHandler = (messageId: string, reactionId: string) => void;
