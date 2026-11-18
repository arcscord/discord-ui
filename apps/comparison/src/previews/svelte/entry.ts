import { mount, unmount } from "svelte";
import { frameRuntime } from "../runtime";
import App from "./App.svelte";

const runtime = frameRuntime("svelte");
const app = mount(App, {
  target: document.querySelector("#app")!,
  props: { event: runtime.event },
});
runtime.start({
  configure: app.configure,
  destroy: () => { void unmount(app); },
});
