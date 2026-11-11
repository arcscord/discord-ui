// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { defineRenderer, styleValue } from "../../rendering";

type MentionPropsInput = {
  name: string;
  kind?: "user" | "role" | "channel" | "command";
  color?: string | undefined;
};
export type MentionProps = MentionPropsInput;
export type MentionSlots = Record<string, never>;
export const Mention = defineRenderer<MentionProps, MentionPropsInput, MentionSlots>("Mention", ["name", "kind", "color"], [], (input, _display) => {
  return () => {
    const { name, kind = "user", color } = input(true);
    const safeColor = /^#[a-f\d]{6}$/iu.test(color ?? "")
      ? color
      : undefined;
    return (
      <span
        class="dui-mention"
        style={styleValue(safeColor
          ? { color: safeColor }
          : undefined)}
      >
        {kind === "channel"
          ? "#"
          : kind === "command"
            ? "/"
            : "@"}
        {name}
      </span>
    );
  };
});
export type MentionEmits = Record<string, never>;
