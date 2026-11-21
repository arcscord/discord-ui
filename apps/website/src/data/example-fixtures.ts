import type { MessageView } from "@arcscord/discord-ui";
import { initialChannel, markdown, release, ticket, welcome } from "./examples";
import { arcadeChannel, arcadeCommands, createAnnouncement, createTranscript, demoBot, demoTime, demoUser } from "./landing-demos";

export const demoMedia = {
  id: "landscape",
  url: "/examples/landscape.svg",
  alt: "Illustrated mountains beneath a blue sky",
  width: 600,
  height: 320,
};
export const demoVideo = {
  id: "trail-video",
  kind: "video" as const,
  url: "/examples/trail.webm",
  posterUrl: "/examples/trail-poster.png",
  alt: "A short illustrated trail preview",
  width: 240,
  height: 135,
};
export const demoAudio = {
  id: "trail-audio",
  kind: "audio" as const,
  url: "/examples/trail.wav",
  name: "trail.wav",
  size: "47 KB",
  durationSeconds: 3,
};
export const demoSticker = {
  id: "arcscord-sticker",
  name: "Arcscord sticker",
  format: "png" as const,
  url: "/examples/arcscord-sticker.png",
};
const guide = {
  id: "ines",
  displayName: "Inès",
  avatarUrl: "/generated/avatars/ines.svg",
  tag: { text: "DEMO", badgeUrl: "/examples/tag-badge.png" },
};
const member = {
  id: "sam",
  displayName: "Sam",
  avatarFallback: { letter: "S" },
};
export const mediaConversation: readonly MessageView[] = [
  {
    id: "media-conversation-mentioned",
    author: member,
    timestamp: "2026-11-01T10:19:00Z",
    mentioned: true,
    body: { kind: "markdown", content: "<@123456789012345678> I collected the video, audio and voice note below. [Open trail guide](https://example.com/trail)." },
  },
  {
    id: "media-conversation-video",
    author: guide,
    timestamp: "2026-11-01T10:20:00Z",
    body: { kind: "markdown", content: "Here is a short preview of the route. Press play when you are ready." },
    media: [
      { ...demoVideo, id: "conversation-video" },
    ],
  },
  {
    id: "media-conversation-audio",
    author: member,
    timestamp: "2026-11-01T10:21:00Z",
    body: { kind: "text", content: "I attached the audio file too. You can download it from its card." },
    attachments: [
      { ...demoAudio, id: "conversation-audio" },
    ],
  },
  {
    id: "media-conversation-voice",
    author: guide,
    timestamp: "2026-11-01T10:22:00Z",
    body: { kind: "text", content: "A quick voice note before we leave." },
    attachments: [
      {
        ...demoAudio,
        id: "conversation-voice",
        name: "Trail voice note",
        voice: true,
        waveform: [0.2, 0.5, 0.8, 0.4, 0.9, 0.3, 0.6, 0.2],
      },
    ],
  },
  {
    id: "media-conversation-sticker",
    author: member,
    timestamp: "2026-11-01T10:23:00Z",
    body: { kind: "text", content: "Ready!" },
    stickers: [
      { ...demoSticker, id: "conversation-sticker" },
    ],
  },
  {
    id: "media-conversation-gallery",
    author: guide,
    timestamp: "2026-11-01T10:24:00Z",
    body: { kind: "text", content: "The illustrated map and the trip notes are here." },
    media: [
      { ...demoMedia, id: "conversation-landscape" },
    ],
    attachments: [
      {
        id: "conversation-notes",
        kind: "file",
        name: "trip-notes.txt",
        url: "https://example.com/trip-notes.txt",
        size: "2 KB",
      },
    ],
  },
];
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
  demoVideo,
  demoAudio,
  demoSticker,
  mediaConversation,
  announcement: createAnnouncement("https://ui.arcscord.dev"),
  transcript: createTranscript("https://ui.arcscord.dev"),
  arcadeChannel,
  arcadeCommands,
  demoBot,
  demoUser,
  demoTime,
};
