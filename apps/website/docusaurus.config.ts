import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { createRequire } from "node:module";
import { themes } from "prism-react-renderer";
import documentationSearch from "./plugins/documentation-search";
import examplePreviews from "./plugins/example-previews";
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
  sitemap: {
    ignorePatterns: ["/search", "/404.html"],
    lastmod: null,
    changefreq: null,
    priority: null,
  },
};

const config: Config = {
  title: "Arcscord Discord UI",
  tagline: "Discord messages. Without screenshots.",
  favicon: "img/favicon.png",
  url: "https://ui.arcscord.dev",
  baseUrl: "/",
  trailingSlash: false,
  onBrokenLinks: "throw",
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  plugins: [examplePreviews, documentationSearch],
  presets: [
    ["classic", classicOptions],
  ],
  themeConfig: {
    image: "img/social-card.png",
    metadata: [
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Arcscord Discord UI" },
      { property: "og:image:alt", content: "Arcscord Discord UI — React components for Discord messages" },
      { name: "twitter:image:alt", content: "Arcscord Discord UI — React components for Discord messages" },
    ],
    colorMode: { defaultMode: "dark", disableSwitch: true, respectPrefersColorScheme: false },
    navbar: {
      title: "Arcscord Discord UI",
      items: [
        { to: "/components", label: "Components", position: "left" },
        { to: "/docs/introduction", label: "Docs", position: "left" },
        { to: "/playground", label: "Playground", position: "left" },
        { href: site.github, label: "GitHub", position: "right" },
        { href: site.npm, label: "npm", position: "right" },
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
            { label: "npm", href: site.npm },
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
