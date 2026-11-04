import type { MessageView, SelectValues } from "@arcscord/discord-ui";
import { DiscordUI, Message } from "@arcscord/discord-ui";
import React, { useState } from "react";
import "@arcscord/discord-ui/styles.css";

const author = { id: "guide-bot", displayName: "Guide Bot", bot: true };
const timestamp = "2026-11-01T10:24:00Z";

const message: MessageView = {
  id: "settings",
  author,
  timestamp,
  body: { kind: "text", content: "Choose notification categories." },
  components: [
    {
      id: "row",
      kind: "action-row",
      select: {
        id: "categories",
        kind: "string-select",
        minValues: 0,
        maxValues: 2,
        options: [
          { value: "news", label: "News" },
          { value: "events", label: "Events" },
        ],
      },
    },
  ],
};
export default function Interactions(): React.ReactElement {
  const [values, setValues] = useState<SelectValues>({ categories: [] });
  return (
    <DiscordUI theme="dark" locale="en-US" timeZone="UTC">
      <Message
        message={message}
        selectValues={values}
        onSelectChange={(id, next) => setValues(current => ({ ...current, [id]: next }))}
      />
      <p role="status">
        Selected:
        {" "}
        {values.categories?.join(", ") || "none"}
      </p>
    </DiscordUI>
  );
}
