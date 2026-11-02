/** Shared by the landing page, catalogue and standalone editor module. */
export const arcadeCode = `function ArcadeExample() {
    const quizzes = {
        gaming: {
            question: "Which item lets Mario survive an extra hit?",
            answers: ["Super Mushroom", "Banana Peel", "Portal Gun"],
            correct: 0,
            explanation: "The Super Mushroom turns Mario into Super Mario.",
        },
        space: {
            question: "Which planet is known as the Red Planet?",
            answers: ["Venus", "Mars", "Neptune"],
            correct: 1,
            explanation: "Iron oxide on Mars gives its surface a reddish colour.",
        },
    };
    const fortunes = [
        "Signs point to yes.",
        "Ask again after one more commit.",
        "The stars say: give it a try.",
        "Outlook uncertain. Snacks may help.",
    ];
    const [messages, setMessages] = useState(arcadeChannel.messages);
    const [draft, setDraft] = useState("");
    const [composerVersion, setComposerVersion] = useState(0);
    const rootRef = useRef(null);
    const serialRef = useRef(0);
    // A shortcut replaces any unfinished command and returns focus to the composer.
    useEffect(() => {
        if (composerVersion > 0)
            rootRef.current?.querySelector("textarea")?.focus();
    }, [composerVersion]);
    function invoke({ command, arguments: args }) {
        const id = \`play-\${++serialRef.current}\`;
        let response;
        if (command.name === "quiz") {
            const category = args.category === "space"
                ? "space"
                : "gaming";
            const quiz = quizzes[category];
            response = {
                id,
                author: demoBot,
                timestamp: demoTime,
                body: {
                    kind: "components-v2",
                    components: [
                        {
                            id: \`\${id}-card\`,
                            kind: "container",
                            accentColor: "#a7a9ff",
                            components: [
                                { id: \`\${id}-question\`, kind: "text-display", content: \`## Quick quiz · \${category}\\n\${quiz.question}\` },
                                {
                                    id: \`\${id}-answers\`,
                                    kind: "action-row",
                                    buttons: quiz.answers.map((label, index) => ({
                                        id: \`\${id}:\${category}:\${index}\`,
                                        kind: "button",
                                        label,
                                        style: "secondary",
                                    })),
                                },
                            ],
                        },
                    ],
                },
            };
        }
        else if (command.name === "dice") {
            const faces = ["6", "12", "20"].includes(args.faces ?? "")
                ? Number(args.faces)
                : 6;
            response = {
                id,
                author: demoBot,
                timestamp: demoTime,
                body: { kind: "markdown", content: \`## 🎲 You rolled \${Math.floor(Math.random() * faces) + 1}\\nA \${faces}-sided die. Another round?\` },
            };
        }
        else {
            response = {
                id,
                author: demoBot,
                timestamp: demoTime,
                body: { kind: "text", content: \`🎱 “\${args.question}”\\n\${fortunes[Math.floor(Math.random() * fortunes.length)]}\` },
            };
        }
        response.reply = { kind: "interaction", author: demoUser, commandName: command.name };
        response.ephemeral = command.name === "8ball";
        setMessages(current => [...current, response]);
    }
    function answer(buttonId) {
        const [messageId, category, chosen] = buttonId.split(":");
        if (category !== "gaming" && category !== "space")
            return;
        const quiz = quizzes[category];
        setMessages(current => current.map((message) => {
            if (message.id !== messageId || message.body.kind !== "components-v2")
                return message;
            // Disable every answer after the first choice, including rapid repeated clicks.
            const card = message.body.components[0];
            if (card?.kind !== "container" || card.components.some(child => child.id === \`\${messageId}-result\`))
                return message;
            return {
                id: message.id,
                author: message.author,
                timestamp: message.timestamp,
                ...(message.reply
                    ? { reply: message.reply }
                    : {}),
                ...(message.ephemeral
                    ? { ephemeral: true }
                    : {}),
                body: {
                    kind: "components-v2",
                    components: [
                        {
                            ...card,
                            components: [
                                ...card.components.map(child => child.kind === "action-row" && child.buttons
                                    ? {
                                        ...child,
                                        buttons: child.buttons.map((button, index) => ({
                                            ...button,
                                            disabled: true,
                                            style: index === quiz.correct
                                                ? "success"
                                                : index === Number(chosen)
                                                    ? "danger"
                                                    : "secondary",
                                        })),
                                    }
                                    : child),
                                { id: \`\${messageId}-result\`, kind: "text-display", content: \`\${Number(chosen) === quiz.correct
                                        ? "**Correct! 🎉**"
                                        : \`**Good try! The answer is \${quiz.answers[quiz.correct]}.**\`}\\n\${quiz.explanation}\` },
                            ],
                        },
                    ],
                },
            };
        }));
    }
    return (<div ref={rootRef}>
      <div className="command-shortcuts" aria-label="Command shortcuts">
        <span>Try a command</span>
        {arcadeCommands.map(command => (<button className="command-shortcut" key={command.name} type="button" onClick={() => {
                setDraft(\`/\${command.name}\`);
                setComposerVersion(version => version + 1);
            }}>
            {\`/\${command.name}\`}
            <span>
              {command.name === "dice"
                ? "Roll a die"
                : command.name === "quiz"
                    ? "Test your knowledge"
                    : "Ask a question"}
            </span>
          </button>))}
      </div>
      <ChannelView channel={{ ...arcadeChannel, messages }} height={520} showDateSeparators={false} onButtonClick={answer} onEphemeralDismiss={id => setMessages(current => current.filter(message => message.id !== id))} composer={<ChannelComposer key={composerVersion} channelName="bot-playground" value={draft} onValueChange={setDraft} commands={arcadeCommands} onSlashCommand={invoke}/>}/>
    </div>);
}`;
