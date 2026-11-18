import { createApp, h, nextTick, shallowRef } from "vue";
import { createLocalState, defaultConfig } from "../../../../../fixtures/comparison/scenarios";
import { snapshot } from "../protocol";
import { frameRuntime } from "../runtime";
import Preview from "./Preview.vue";

const runtime = frameRuntime("vue");
const config = shallowRef(defaultConfig);
const generation = shallowRef(0);
let state = snapshot(createLocalState());
const app = createApp({
  render: () => h(Preview, {
    key: generation.value,
    config: config.value,
    report: value => state = value,
    event: runtime.event,
  }),
});
app.config.errorHandler = runtime.fail;
app.mount("#app");
runtime.start({
  async configure(value, reset) {
    config.value = value;
    if (reset)
      generation.value++;
    await nextTick();
    return state;
  },
  destroy: () => app.unmount(),
});
