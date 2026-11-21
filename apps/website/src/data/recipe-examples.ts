import type { ComponentExample } from "./component-examples";

/** Complete local recipes; exportCode supplies only the explicitly used public imports/hooks. */
export const recipeExamples: ComponentExample[] = [
  {
    id: "recipe-transcript-interactions",
    title: "Transcript utility interactions",
    component: "MessageList",
    family: "Recipes",
    layout: "message",
    interactive: true,
    description: "Open host-controlled author and mention information or a contextual action from a transcript.",
    code: `function TranscriptInteractions({ theme }) {
  const [selection, setSelection] = useState(null);
  const [status, setStatus] = useState("Ready");
  const opener = useRef(null);
  const panel = useRef(null);
  const author = { id: "123456789012345678", displayName: "Sam" };
  const records = [{ id: "transcript-question", author, timestamp: "2026-11-01T10:00:00Z",
    body: { kind: "markdown", content: "Ask <@123456789012345678> in <#234567890123456789>, notify <@&345678901234567890>, or try </help:456789012345678901>." },
    reply: { messageId: "original", author, content: "An earlier question" },
    embeds: [{ id: "details", description: "Follow up with <@123456789012345678>." }],
  }];
  useEffect(() => {
    if (selection) panel.current?.querySelector("button")?.focus();
  }, [selection]);
  function close() {
    setSelection(null);
    opener.current?.focus();
  }
  function show(kind, target, event, menu = false) {
    const wasPrevented = event.defaultPrevented;
    if (menu) event.preventDefault();
    opener.current = event.currentTarget;
    setSelection({ kind, target, menu });
    setStatus(JSON.stringify({ kind, id: target.id, name: target.displayName || target.name || target.id, defaultPrevented: wasPrevented }));
  }
  return <DiscordUI theme={theme} locale="en-US" timeZone="UTC" allowRemoteMedia={false}>
    <MessageList messages={records}
      onUserClick={(target, event) => show("user", target, event)}
      onUserContextMenu={(target, event) => show("user-context", target, event, true)}
      onMentionClick={(target, event) => show(target.kind, target, event)}
      onMentionContextMenu={(target, event) => show(target.kind + "-context", target, event, true)}
      onMessageContextMenu={(target, event) => show("message-context", target, event, true)} />
    <p role="status" aria-live="polite" style={{ overflowWrap: "anywhere" }}>{status}</p>
    {selection && <section ref={panel} role="region" aria-label={selection.menu ? "Context actions" : "Entity information"}
      onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); close(); } }}
      style={{ padding: 12, border: "1px solid currentColor", borderRadius: 8 }}>
      <p>{selection.kind} · {selection.target.displayName || selection.target.name || selection.target.id}</p>
      <p>ID {selection.target.id}</p>
      {selection.menu && <button type="button" onClick={() => { setStatus("Selected " + selection.target.id); close(); }}>Select entity</button>}
      <button type="button" onClick={close}>Close information</button>
    </section>}
  </DiscordUI>;
}`,
  },
  {
    id: "recipe-transcript",
    title: "Read-only transcript",
    component: "MessageList",
    family: "Recipes",
    layout: "message",
    description: "A fixed support transcript with a resolved reply and a file, without a composer or sending callback.",
    code: `function ReadOnlyTranscript({ theme }) {
  const agent = { id: "agent", displayName: "Support", bot: true };
  const reader = { id: "reader", displayName: "Sam" };
  const records = [
    { id: "question", author: reader, timestamp: "2026-11-01T10:00:00Z", body: { kind: "text", content: "Where can I find the configuration?" } },
    { id: "answer", author: agent, timestamp: "2026-11-01T10:01:00Z",
      reply: { messageId: "question", author: reader, content: "Where can I find the configuration?" },
      body: { kind: "markdown", content: "Here is the **configuration**. This transcript is read-only." },
      attachments: [{ id: "configuration", kind: "file", name: "welcome-config.json", url: "https://ui.arcscord.dev/examples/welcome-config.json", size: "Fixture JSON" }] },
  ];
  return <DiscordUI theme={theme} locale="en-US" timeZone="UTC" allowRemoteMedia={false}>
    <MessageList messages={records} />
  </DiscordUI>;
}`,
  },
  {
    id: "recipe-interactive-preview",
    title: "Interactive message preview",
    component: "Message",
    family: "Recipes",
    layout: "message",
    interactive: true,
    description: "Approve a classic message and toggle its reaction while keeping every result in application state.",
    code: `function InteractivePreview({ theme }) {
  const [record, setRecord] = useState({
    id: "review", author: { id: "review-bot", displayName: "Review Bot", bot: true }, timestamp: "2026-11-01T10:00:00Z",
    body: { kind: "markdown", content: "**Review this announcement** before sharing." },
    components: [{ id: "actions", kind: "action-row", buttons: [{ id: "approve", kind: "button", label: "Approve", style: "success" }] }],
    reactions: [{ id: "thanks", emoji: { name: "👍" }, count: 2, me: false }],
  });
  const [status, setStatus] = useState("Waiting for review");
  function approve(id, context) {
    if (id !== "approve" || context.messageId !== record.id) return;
    setRecord(current => ({ ...current, edited: true,
      body: { kind: "markdown", content: "**Approved locally.** Nothing has been published." },
      components: current.components.map(row => ({ ...row, buttons: row.buttons.map(button => ({ ...button, disabled: true })) })),
    }));
    setStatus("Review approved locally");
  }
  function react(messageId, reactionId) {
    setRecord(current => current.id !== messageId ? current : ({ ...current,
      reactions: current.reactions.map(item => item.id === reactionId
        ? { ...item, me: !item.me, count: item.count + (item.me ? -1 : 1) } : item),
    }));
  }
  return <DiscordUI theme={theme} locale="en-US" timeZone="UTC" allowRemoteMedia={false}>
    <Message message={record} onButtonClick={approve} onReactionToggle={react} />
    <p role="status">{status}</p>
  </DiscordUI>;
}`,
  },
  {
    id: "recipe-controlled-selections",
    title: "Controlled selections across messages",
    component: "MessageList",
    family: "Recipes",
    layout: "message",
    interactive: true,
    description: "Two messages reuse the same select ID while the host stores selections under separate message IDs.",
    code: `function ControlledSelections({ theme }) {
  const [values, setValues] = useState({ alpha: { topics: [] }, beta: { topics: [] } });
  const records = ["alpha", "beta"].map(id => ({
    id, author: { id: "settings-bot", displayName: "Settings Bot", bot: true }, timestamp: "2026-11-01T10:00:00Z",
    body: { kind: "text", content: "Choose topics for " + id },
    components: [{ id: "row", kind: "action-row", select: {
      id: "topics", kind: "string-select", placeholder: "Topics for " + id, minValues: 0, maxValues: 2,
      options: [{ value: "news", label: "News" }, { value: "events", label: "Events" }],
    } }],
  }));
  function change(selectId, next, context) {
    if (!context.messageId) return;
    setValues(current => ({ ...current, [context.messageId]: { ...current[context.messageId], [selectId]: next } }));
  }
  return <DiscordUI theme={theme} locale="en-US" timeZone="UTC" allowRemoteMedia={false}>
    <MessageList messages={records} selectValuesByMessage={values} onSelectChange={change} />
    <p role="status">{JSON.stringify(values)}</p>
    <Button label="Clear both selections" style="secondary" onClick={() => setValues({ alpha: { topics: [] }, beta: { topics: [] } })} />
  </DiscordUI>;
}`,
  },
  {
    id: "recipe-local-channel",
    title: "Channel with local messages",
    component: "ChannelView",
    family: "Recipes",
    layout: "conversation",
    interactive: true,
    description: "Append immutable message snapshots from a controlled local send handler and reset the local conversation.",
    code: `function LocalChannel({ theme }) {
  const initial = { id: "recipe-channel", name: "local-help", topic: "Messages stay in this demo", messages: [
    { id: "initial", author: { id: "helper", displayName: "Helper", bot: true }, timestamp: "2026-11-01T10:00:00Z", body: { kind: "text", content: "Send a local message below." } },
  ] };
  const [conversation, setConversation] = useState(initial);
  function send(content) {
    setConversation(current => ({ ...current, messages: [...current.messages, {
      id: "local-" + current.messages.length, author: { id: "you", displayName: "You" },
      timestamp: "2026-11-01T10:05:00Z", body: { kind: "text", content },
    }] }));
  }
  return <DiscordUI theme={theme} locale="en-US" timeZone="UTC" allowRemoteMedia={false}>
    <ChannelView channel={conversation} height={380} onSend={send} />
    <Button label="Clear local messages" style="secondary" onClick={() => setConversation(initial)} />
  </DiscordUI>;
}`,
  },
  {
    id: "recipe-channel-threads",
    title: "Channel with threads",
    component: "ChannelView",
    family: "Recipes",
    layout: "conversation",
    interactive: true,
    description: "Control thread navigation, append replies and update the starter's count and latest-reply summary together.",
    code: `function ChannelThreads({ theme }) {
  const helper = { id: "helper", displayName: "Helper", bot: true };
  const stamp = "2026-11-01T10:00:00Z";
  const [active, setActive] = useState(null);
  const [conversation, setConversation] = useState({ id: "thread-recipe", name: "support", messages: [
    { id: "starter", author: helper, timestamp: stamp, body: { kind: "text", content: "Let's finish the setup in a thread." },
      thread: { id: "setup", name: "Setup checklist", messageCount: 1 } },
  ], threads: [{ id: "setup", name: "Setup checklist", parentMessageId: "starter", messages: [
    { id: "first-reply", author: helper, timestamp: stamp, body: { kind: "text", content: "Which step needs help?" } },
  ] }] });
  function reply(threadId, content) {
    setConversation(current => {
      const target = current.threads.find(item => item.id === threadId);
      if (!target) return current;
      const record = { id: threadId + "-reply-" + target.messages.length, author: { id: "you", displayName: "You" },
        timestamp: "2026-11-01T10:05:00Z", body: { kind: "text", content } };
      return { ...current,
        threads: current.threads.map(item => item.id === threadId ? { ...item, messages: [...item.messages, record] } : item),
        messages: current.messages.map(item => item.thread?.id === threadId ? { ...item, thread: { ...item.thread,
          messageCount: target.messages.length + 1, lastMessage: { author: record.author, content, timestamp: record.timestamp },
        } } : item),
      };
    });
  }
  return <DiscordUI theme={theme} locale="en-US" timeZone="UTC" allowRemoteMedia={false}>
    <ChannelView channel={conversation} height={440} composer={false} activeThreadId={active}
      onThreadOpen={setActive} onThreadClose={() => setActive(null)} onThreadSend={reply} />
  </DiscordUI>;
}`,
  },
  {
    id: "recipe-local-commands",
    title: "Local slash-command responses",
    component: "ChannelComposer",
    family: "Recipes",
    layout: "conversation",
    interactive: true,
    description: "Define a local /greet command, validate its required argument and append a response with invocation context.",
    code: `function LocalCommands({ theme }) {
  const [records, setRecords] = useState([]);
  const commands = [{ name: "greet", description: "Create a local greeting", arguments: [
    { name: "name", description: "Who should be greeted?", required: true },
  ] }];
  function invoke(invocation) {
    setRecords(current => [...current, {
      id: "command-" + current.length, author: { id: "greeter", displayName: "Greeter", bot: true }, timestamp: "2026-11-01T10:00:00Z",
      reply: { kind: "interaction", author: { id: "you", displayName: "You" }, commandName: invocation.command.name },
      body: { kind: "text", content: "Hello, " + invocation.arguments.name + "! This response is local." },
    }]);
  }
  return <DiscordUI theme={theme} locale="en-US" timeZone="UTC" allowRemoteMedia={false}>
    <ChannelView channel={{ id: "command-recipe", name: "commands", messages: records }} height={380}
      commands={commands} onSlashCommand={invoke} />
  </DiscordUI>;
}`,
  },
  {
    id: "recipe-theme-labels",
    title: "Custom theme and translated labels",
    component: "DiscordUI",
    family: "Recipes",
    layout: "message",
    interactive: true,
    description: "Extend the selected theme, localize display labels and format an explicit timestamp in French/Swiss time.",
    code: `function ThemeAndLabels({ theme }) {
  const custom = defineTheme({ name: "recipe-violet", extends: theme, tokens: { accent: "#9d8dff" } });
  const [visible, setVisible] = useState(true);
  const record = { id: "translated", author: { id: "assistant", displayName: "Assistant", bot: true }, timestamp: "2026-11-01T10:00:00Z",
    edited: true, ephemeral: true, body: { kind: "markdown", content: "**Aperçu local.** ||Un détail masqué||" } };
  return <DiscordUI theme={custom} locale="fr-CH" timeZone="Europe/Zurich" referenceTime="2026-11-01T11:00:00Z" allowRemoteMedia={false}
    labels={{ edited: "(modifié)", ephemeralNotice: "Visible dans cet aperçu", dismissMessage: "Masquer le message",
      showSpoiler: "Révéler le contenu", hideSpoiler: "Masquer le contenu" }}>
    {visible ? <Message message={record} onEphemeralDismiss={() => setVisible(false)} />
      : <Button label="Restaurer le message" style="secondary" onClick={() => setVisible(true)} />}
  </DiscordUI>;
}`,
  },
];
