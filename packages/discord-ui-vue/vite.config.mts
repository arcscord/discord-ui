import { copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
    sourcemap: true,
    lib: {
      entry: { index: "src/index.ts", themes: "src/themes.ts", highlight: "src/highlight.tsx" },
      formats: ["es"],
      fileName: (_format, name) => `${name}.mjs`,
    },
    rolldownOptions: {
      external: id => id === "vue" || id.startsWith("vue/") || id === "@arcscord/discord-ui-core" || id.startsWith("@arcscord/discord-ui-core/"),
    },
  },
  // Every adapter ships the same standalone CSS, without source imports.
  plugins: [
    vue(),
    vueJsx({ tsTransform: "built-in" }),
    {
      name: "shared-styles",
      async closeBundle() {
        await copyFile(fileURLToPath(import.meta.resolve("@arcscord/discord-ui-core/styles.css")), "dist/styles.css");
      },
    },
  ],
});
