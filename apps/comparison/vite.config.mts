import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const entry = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [
    vue(),
    svelte({ configFile: false }),
  ],
  oxc: {
    jsx: { runtime: "automatic" },
  },
  build: {
    target: "es2022",
    rollupOptions: {
      input: {
        comparison: entry("index.html"),
        react: entry("previews/react/index.html"),
        vue: entry("previews/vue/index.html"),
        svelte: entry("previews/svelte/index.html"),
      },
    },
  },
});
