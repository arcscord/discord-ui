import type { ReplyView } from "../../model/message";
import { Author } from "../author/author";
import { Avatar } from "../author/avatar";
import { useDisplayOptions } from "../display-context";

/** Renders the host-supplied plain-text preview without loading original attachments. */
export function ReplyPreview({ reply }: { reply: ReplyView }) {
  const { labels } = useDisplayOptions();
  return (
    <div className="dui-reply-preview" aria-label={labels.reply}>
      <span className="dui-reply-connector" aria-hidden="true" />
      {reply.unavailable
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
