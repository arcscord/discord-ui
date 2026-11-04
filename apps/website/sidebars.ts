import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  guide: [
    {
      type: "category",
      label: "Getting started",
      collapsed: false,
      items: [
        "introduction",
        "installation",
        "quick-start",
        "choosing-components",
      ],
    },
    {
      type: "category",
      label: "Core concepts",
      link: {
        type: "doc",
        id: "concepts",
      },
      items: [
        {
          type: "link",
          label: "Display models and application responsibilities",
          href: "/docs/concepts#display-models-and-application-responsibilities",
        },
        {
          type: "link",
          label: "Classic messages and Components V2",
          href: "/docs/concepts#classic-messages-and-components-v2",
        },
        {
          type: "link",
          label: "Entities and identifiers",
          href: "/docs/concepts#entities-and-identifiers",
        },
        {
          type: "link",
          label: "Controlled and local state",
          href: "/docs/concepts#controlled-and-local-state",
        },
        "public-api",
      ],
    },
    {
      type: "category",
      label: "Guides",
      link: {
        type: "doc",
        id: "guides",
      },
      items: [
        "guides/messages",
        "guides/markdown",
        "guides/embeds",
        "guides/media",
        "guides/components-v2",
        "guides/interactions",
        "guides/reactions",
        "guides/channels",
        "guides/composer",
        "guides/threads",
        "guides/themes",
        "guides/localization",
        "guides/ssr",
        "guides/accessibility",
        "playground",
        "search",
      ],
    },
    {
      type: "category",
      label: "API reference",
      link: {
        type: "doc",
        id: "api-reference",
      },
      items: [
        "api/entry-points",
        "api/display-components",
        "api/interactive-components",
        "api/conversation-components",
        "api/models",
        "api/callbacks",
        "api/themes",
        "api/highlight",
      ],
    },
    {
      type: "category",
      label: "Recipes",
      link: {
        type: "doc",
        id: "recipes",
      },
      items: [
        "recipes/transcript",
        "recipes/interactive-preview",
        "recipes/controlled-selections",
        "recipes/local-channel",
        "recipes/channel-threads",
        "recipes/local-commands",
        "recipes/theme-labels",
      ],
    },
    {
      type: "category",
      label: "Troubleshooting",
      link: {
        type: "doc",
        id: "troubleshooting",
      },
      items: [
        {
          type: "link",
          label: "Styling and media",
          href: "/docs/troubleshooting#styling-and-media",
        },
        {
          type: "link",
          label: "Models and interactions",
          href: "/docs/troubleshooting#models-and-interactions",
        },
        {
          type: "link",
          label: "SSR and timestamps",
          href: "/docs/troubleshooting#ssr-and-timestamps",
        },
        {
          type: "link",
          label: "Playground behavior",
          href: "/docs/troubleshooting#playground-behavior",
        },
      ],
    },
    {
      type: "category",
      label: "Project",
      link: {
        type: "doc",
        id: "project",
      },
      items: [
        "project/documentation-quality",
        {
          type: "link",
          label: "Compatibility and limitations",
          href: "/docs/project/compatibility",
        },
        {
          type: "link",
          label: "Changelog and migration guides",
          href: "/docs/project/migrations",
        },
        {
          type: "link",
          label: "Contributing",
          href: "/docs/project/maintaining-docs",
        },
      ],
    },
  ],
};
export default sidebars;
