import { createSSRApp } from "vue";
import { createVueHydrationFixture } from "./vue-hydration";
import "@arcscord/discord-ui-vue/styles.css";

const app = createSSRApp(createVueHydrationFixture());
app.config.idPrefix = "vue-fixture-";
app.mount("#app");
document.documentElement.dataset.vueHydrated = "true";
