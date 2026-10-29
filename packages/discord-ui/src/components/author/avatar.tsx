import type { MessageAuthor } from "../../model/message";
import { useState } from "react";
import { mediaUrl } from "../../utils/urls";

function AvatarImage({ author, source }: { author: MessageAuthor; source: string | undefined }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="dui-avatar" aria-hidden="true">
      {source && !failed
        ? <img src={source} alt="" width={40} height={40} onError={() => setFailed(true)} />
        : <span>{author.displayName.trim().slice(0, 2).toUpperCase() || "?"}</span>}
    </span>
  );
}

export function Avatar({ author }: { author: MessageAuthor }) {
  const source = mediaUrl(author.avatarUrl);
  return <AvatarImage key={source} author={author} source={source} />;
}
