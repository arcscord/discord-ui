import type { ReplyView } from "../../model/message";
import { Author } from "../author/author";
import { Avatar } from "../author/avatar";
import { Mention } from "../content/mention";
import { useDisplayOptions } from "../display-context";

/** Renders the host-supplied message or interaction preview without loading original attachments. */
export function ReplyPreview({ reply }: { reply: ReplyView }) {
  const { labels } = useDisplayOptions();
  return (
    <div
      className="dui-reply-preview"
      aria-label={reply.kind === "interaction"
        ? labels.interactionReply
        : labels.reply}
    >
      <span className="dui-reply-connector" aria-hidden="true" />
      {reply.kind === "interaction"
        ? (
            <>
              <Avatar author={reply.author} />
              <Author author={reply.author} />
              <span className="dui-interaction-used">{labels.interactionUsed}</span>
              <span className="dui-interaction-command"><Mention kind="command" name={reply.commandName} /></span>
            </>
          )
        : reply.unavailable
          ? <span className="dui-reply-content">{labels.replyUnavailable}</span>
          : (
              <>
                <Avatar author={reply.author} />
                <Author author={reply.author} />
                <span className="dui-reply-content">{reply.content}</span>
              </>
            )}
    </div>
  );
}
