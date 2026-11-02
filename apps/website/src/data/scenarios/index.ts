import type { ComponentExample } from "../component-examples";
import { arcadeCode } from "./arcade";

export const scenarioExamples: ComponentExample[] = [
  {
    id: "announcement",
    title: "Community announcement",
    component: "Message",
    family: "Scenarios",
    layout: "message",
    description: "The announcement from the homepage: a complete Components V2 message with an image and a link button.",
    code: `function AnnouncementExample({ theme }) {
  const [message, setMessage] = useState(announcement);
  useEffect(() => {
    const url = new URL("/playground?example=announcement&theme=" + theme, window.location.origin).href;
    setMessage({ ...announcement, body: { ...announcement.body, components: announcement.body.components.map(card => ({
      ...card, components: card.components.map(component => component.kind === "action-row"
        ? { ...component, buttons: component.buttons.map(button => ({ ...button, url })) }
        : component),
    })) } });
  }, [theme]);
  return <Message message={message} />;
}`,

  },
  {
    id: "transcript",
    title: "Resolved ticket",
    component: "ChannelView",
    family: "Scenarios",
    layout: "conversation",
    interactive: true,
    description: "The saved ticket from the homepage, with replies, a configuration file and a browsable permission-check thread.",
    code: `function TranscriptExample() {
  const [channel, setChannel] = useState(transcript);
  useEffect(() => {
    setChannel({ ...transcript, messages: transcript.messages.map(message => message.attachments
      ? { ...message, attachments: message.attachments.map(file => ({ ...file, url: new URL(new URL(file.url).pathname, window.location.origin).href })) }
      : message) });
  }, []);
  return <ChannelView channel={channel} height={640} composer={false} autoScroll={false} showDateSeparators={false} />;
}`,

  },
  {
    id: "arcade",
    title: "Command arcade",
    component: "ChannelComposer",
    family: "Scenarios",
    layout: "conversation",
    interactive: true,
    description: "The homepage arcade: roll a die, answer a quiz or ask the eight ball. Responses show interaction context; eight-ball messages are ephemeral.",
    code: arcadeCode,
  },
];
