import type { MessageView } from "@arcscord/discord-ui";

export const basicMessage: MessageView = {
  id: "message-welcome",
  author: {
    id: "author-arcscord",
    displayName: "Arcscord",
    bot: true,
    verified: true,
    color: "#8ea1e1",
  },
  timestamp: "2026-10-29T18:00:00Z",
  body: { kind: "text", content: "Bienvenue dans le playground !\nComposez votre premier message Discord avec des composants React indépendants." },
};

export const markdownMessage: MessageView = {
  ...basicMessage,
  id: "message-markdown",
  body: { kind: "markdown", content: "# Un message, plusieurs éléments\nBonjour <@123456789012345678>, rendez-vous dans <#234567890123456789> avec <@&345678901234567890> <:arc:456789012345678901>\n**Du gras**, *de l’italique*, __du souligné__ et ~~du barré~~.\n- Un renderer indépendant\n- Des composants composables\n> Une citation avec un [lien](https://arcscord.dev).\n||Le contenu du spoiler est révélé.||\n```ts\nconst message = { content: \"Hello Discord\" };\n```\nDisponible <t:1793297100:R>." },
};

export const mediaMessage: MessageView = {
  ...basicMessage,
  id: "message-media",
  body: { kind: "markdown", content: "Deux images, avec proportions conservées et spoiler accessible." },
  media: [
    {
      id: "landscape",
      url: "/landscape.svg",
      alt: "Paysage synthétique de montagnes",
      width: 600,
      height: 320,
    },
    {
      id: "spoiler-landscape",
      url: "/landscape.svg",
      alt: "Paysage masqué",
      spoiler: true,
      width: 600,
      height: 320,
    },
  ],
};

export const embedMessage: MessageView = {
  ...basicMessage,
  id: "message-embed",
  body: { kind: "markdown", content: "Un embed composé avec les mêmes primitives de contenu et de média." },
  embeds: [
    {
      id: "release",
      title: "Construire une interface Discord",
      url: "https://arcscord.dev",
      color: "#5865f2",
      author: { name: "Arcscord", iconUrl: "/emoji.svg" },
      description: "Du **Markdown**, des champs et une image. Tout reste personnalisable.",
      thumbnail: { id: "thumb", url: "/emoji.svg", alt: "Symbole Arcscord" },
      fields: [
        {
          id: "framework",
          name: "Framework",
          value: "React 19",
          inline: true,
        },
        {
          id: "styles",
          name: "Styles",
          value: "CSS autonome",
          inline: true,
        },
        {
          id: "typescript",
          name: "TypeScript",
          value: "API typée",
          inline: true,
        },
      ],
      image: {
        id: "embed-image",
        url: "/landscape.svg",
        alt: "Montagnes dans un embed",
        width: 600,
        height: 320,
      },
      footer: { text: "Exemple synthétique", iconUrl: "/emoji.svg" },
      timestamp: basicMessage.timestamp,
    },
  ],
};

export const unavailableMessage: MessageView = {
  ...basicMessage,
  id: "message-unavailable",
  body: { kind: "markdown", content: "Un média indisponible garde un état lisible. Un protocole interdit n’est jamais chargé." },
  media: [
    { id: "unsafe", url: "javascript:alert(1)", alt: "Image au protocole interdit" },
  ],
};

export const scenarios = {
  basic: { label: "Message simple", message: basicMessage },
  markdown: { label: "Markdown et mentions", message: markdownMessage },
  media: { label: "Médias et spoilers", message: mediaMessage },
  embed: { label: "Embed complet", message: embedMessage },
  unavailable: { label: "Média indisponible", message: unavailableMessage },
};

export const demoEntities = {
  users: {
    "123456789012345678": { name: "Alice" },
  },
  channels: {
    "234567890123456789": { name: "général" },
  },
  roles: {
    "345678901234567890": { name: "Équipe", color: "#eb9d62" },
  },
  emojis: {
    "456789012345678901": { name: "arc", image: "/emoji.svg" },
  },
};
