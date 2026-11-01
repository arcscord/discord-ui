import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { createRequire } from "node:module";
import { themes } from "prism-react-renderer";
import { site } from "./src/data/site";

const require = createRequire(import.meta.url);

const classicOptions: Preset.Options = {
  docs: { sidebarPath: "./sidebars.ts", showLastUpdateTime: false },
  blog: false,
  theme: {
    customCss: [
      require.resolve("@arcscord/discord-ui/styles.css"),
      "./src/css/custom.css",
    ],
  },
  sitemap: false,
};

const config: Config = {
  title: "Arcscord Discord UI",
  tagline: "Discord messages. Without screenshots.",
  url: "https://ui.arcscord.dev",
  baseUrl: "/",
  trailingSlash: false,
  onBrokenLinks: "throw",
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  presets: [
    ["classic", classicOptions],
  ],
  themeConfig: {
    colorMode: { defaultMode: "dark", disableSwitch: true, respectPrefersColorScheme: false },
    announcementBar: site.inDevelopment
      ? {
          id: "development-v1",
          content: "In development — preparing our first release.",
          backgroundColor: "#141331",
          textColor: "#e8eefb",
          isCloseable: true,
        }
      : undefined,
    navbar: {
      title: "Arcscord Discord UI",
      items: [
        { to: "/components", label: "Components", position: "left" },
        { to: "/docs/introduction", label: "Docs", position: "left" },
        { to: "/playground", label: "Playground", position: "left" },
        { href: site.github, label: "GitHub", position: "right" },
        { to: "/docs/installation", label: "npm · upcoming", position: "right" },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Arcscord Discord UI",
          items: [
            { label: "Arcscord", href: site.arcscord },
            { label: "GitHub", href: site.github },
            { label: "npm · upcoming", to: "/docs/installation" },
            { label: "Discord", href: site.discord },
            { label: "Changelog", href: site.changelog },
          ],
        },
      ],
    },
    prism: { theme: themes.oneDark, darkTheme: themes.oneDark },
    docs: {
      sidebar: { hideable: false },
    },
  } satisfies Preset.ThemeConfig,
};
export default config;
