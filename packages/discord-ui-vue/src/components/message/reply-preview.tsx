import type { ReplyView } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { defineRenderer } from "../../rendering";
import { Author } from "../author/author";
import { Avatar } from "../author/avatar";
import { Mention } from "../content/mention";
/** Renders the host-supplied message or interaction preview without loading original attachments. */
type ReplyPreviewPropsInput = {
  reply: ReplyView;
};
export type ReplyPreviewProps = ReplyPreviewPropsInput;
export type ReplyPreviewSlots = Record<string, never>;
export const ReplyPreview = defineRenderer<ReplyPreviewProps, ReplyPreviewPropsInput, ReplyPreviewSlots>("ReplyPreview", ["reply"], [], (input, display) => {
  return () => {
    const { reply } = input(true);
    const { labels } = display;
    return (
      <div
        class="dui-reply-preview"
        aria-label={reply.kind === "interaction"
          ? labels.interactionReply
          : labels.reply}
      >
        <span class="dui-reply-connector" aria-hidden="true" />
        {reply.kind === "interaction"
          ? (
              <>
                <Avatar author={reply.author} />
                <Author author={reply.author} />
                <span class="dui-interaction-used">{labels.interactionUsed}</span>
                <span class="dui-interaction-command"><Mention kind="command" name={reply.commandName} /></span>
              </>
            )
          : reply.unavailable
            ? <span class="dui-reply-content">{labels.replyUnavailable}</span>
            : (
                <>
                  <Avatar author={reply.author} />
                  <Author author={reply.author} />
                  <span class="dui-reply-content">{reply.content}</span>
                </>
              )}
      </div>
    );
  };
});
export type ReplyPreviewEmits = Record<string, never>;
