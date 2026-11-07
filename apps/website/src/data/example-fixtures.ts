import { initialChannel, markdown, release, ticket, welcome } from "./examples";
import { arcadeChannel, arcadeCommands, createAnnouncement, createTranscript, demoBot, demoTime, demoUser } from "./landing-demos";

export const demoMedia = {
  id: "landscape",
  url: "/examples/landscape.svg",
  alt: "Illustrated mountains beneath a blue sky",
  width: 600,
  height: 320,
};
export const previewEntities = {
  users: {
    "123456789012345678": { name: "Inès" },
  },
};

export const exampleFixtures = {
  initialChannel,
  welcome,
  release,
  ticket,
  markdown,
  demoMedia,
  announcement: createAnnouncement("https://ui.arcscord.dev"),
  transcript: createTranscript("https://ui.arcscord.dev"),
  arcadeChannel,
  arcadeCommands,
  demoBot,
  demoUser,
  demoTime,
};
