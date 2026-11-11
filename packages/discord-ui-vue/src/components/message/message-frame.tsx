// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import type { VNodeChild } from "vue";
import { defineRenderer, styleValue } from "../../rendering";
import { themeStyle } from "../../themes";

type MessageFramePropsInput = {
  hasThread?: boolean;
  ephemeral?: boolean;
  reply?: VNodeChild;
  avatar?: VNodeChild;
  header?: VNodeChild;
  footer?: VNodeChild;
  children: VNodeChild;
};
export type MessageFrameProps = Omit<MessageFramePropsInput, "children" | "avatar" | "reply" | "header" | "footer">;
export type MessageFrameSlots = { default?: () => VNodeChild; avatar?: () => VNodeChild; reply?: () => VNodeChild; header?: () => VNodeChild; footer?: () => VNodeChild };
export const MessageFrame = defineRenderer<MessageFrameProps, MessageFramePropsInput, MessageFrameSlots>("MessageFrame", ["hasThread", "ephemeral"], [
  "children",
  "avatar",
  "reply",
  "header",
  "footer",
], (input, display) => {
  return () => {
    const { avatar, reply, header, footer, children, ephemeral = false, hasThread = false } = input(true);
    const { resolvedTheme, scoped } = display;
    return (
      <article
        class={`${scoped ? "" : "arcscord-discord-ui "}dui-message`}
        data-ephemeral={ephemeral || undefined}
        data-has-thread={hasThread || undefined}
        data-theme={resolvedTheme.name}
        data-base-theme={scoped ? undefined : resolvedTheme.base}
        data-color-scheme={resolvedTheme.colorScheme}
        style={styleValue(scoped
          ? undefined
          : themeStyle(resolvedTheme.tokens))}
      >
        {reply
          ? <div class="dui-message-reply">{reply}</div>
          : null}
        <div class="dui-message-avatar">{avatar}</div>
        <div class="dui-message-main">
          {header}
          <div class="dui-message-body">{children}</div>
          {footer}
        </div>
      </article>
    );
  };
});
export type MessageFrameEmits = Record<string, never>;
