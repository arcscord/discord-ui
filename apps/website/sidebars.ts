import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  guide: [
    {
      type: "category",
      label: "Getting started",
      collapsed: false,
      items: ["introduction", "installation"],
    },
  ],
};
export default sidebars;
