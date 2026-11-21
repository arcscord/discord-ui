import type { ComparisonConfig, Framework } from "../../../../fixtures/comparison/scenarios";
import type { FrameMessage, NativeEvent, Snapshot } from "./protocol";
import { parseConfig } from "../../../../fixtures/comparison/scenarios";
import { isConfigureMessage, protocol } from "./protocol";

export type NativeHost = { configure: (config: ComparisonConfig, reset: boolean) => Promise<Snapshot>; destroy: () => void };

/** Transport only. Native hosts own rendering, local state and callbacks. */
export function frameRuntime(framework: Framework): { start: (host: NativeHost) => void; event: (event: NativeEvent, state: Snapshot) => void; fail: (error: unknown) => void } {
  let revision = 0;
  let failed = false;
  let disposed = false;
  const log = document.querySelector<HTMLPreElement>("#events")!;
  function post(message: FrameMessage): void {
    if (!disposed && window.parent !== window)
      window.parent.postMessage(JSON.parse(JSON.stringify(message)), window.location.origin);
  }
  function fail(error: unknown): void {
    failed = true;
    const message = error instanceof Error
      ? error.message
      : String(error);
    document.documentElement.dataset.status = "error";
    document.querySelector<HTMLElement>("#status")!.textContent = `Failed — ${message}`;
    post({
      protocol,
      framework,
      revision,
      type: "error",
      error: message,
    });
  }
  function event(event: NativeEvent, state: Snapshot): void {
    log.textContent = `${log.textContent}\n${JSON.stringify({ event, state })}`.trim().split("\n").slice(-50).join("\n");
    document.querySelector<HTMLElement>("#state")!.textContent = JSON.stringify(state, null, 2);
    post({
      protocol,
      framework,
      revision,
      type: "event",
      event,
      state,
    });
  }
  function start(host: NativeHost): void {
    async function apply(config: ComparisonConfig, reset: boolean, requestedRevision: number): Promise<void> {
      failed = false;
      document.documentElement.dataset.status = "loading";
      document.querySelector<HTMLElement>("#capture")!.inert = true;
      document.documentElement.lang = config.locale;
      document.documentElement.dataset.theme = config.theme;
      document.documentElement.dataset.scenario = config.scenario;
      if (reset)
        log.textContent = "";
      try {
        const state = await host.configure(config, reset);
        await document.fonts.ready;
        await Promise.all(Array.from(document.images, (image) => {
          // Offscreen iframe fixtures must finish loading before they can be expanded.
          image.loading = "eager";
          return image.decode().catch(() => undefined);
        }));
        if (disposed || revision !== requestedRevision || failed)
          return;
        document.documentElement.dataset.status = "ready";
        document.querySelector<HTMLElement>("#capture")!.inert = false;
        document.documentElement.dataset.revision = String(revision);
        document.querySelector<HTMLElement>("#status")!.textContent = "Loaded — local simulation";
        document.querySelector<HTMLElement>("#state")!.textContent = JSON.stringify(state, null, 2);
        post({
          protocol,
          framework,
          revision,
          type: "applied",
          state,
        });
      }
      catch (error) {
        if (revision === requestedRevision)
          fail(error);
      }
    }
    function receive(message: MessageEvent<unknown>): void {
      if (message.source !== window.parent || message.origin !== window.location.origin || !isConfigureMessage(message.data))
        return;
      const data = message.data;
      if (data.framework !== framework || data.revision <= revision)
        return;
      revision = data.revision;
      void apply(data.config, data.reset, revision);
    }
    function dispose(event: PageTransitionEvent): void {
      if (event.persisted)
        return;
      disposed = true;
      window.removeEventListener("message", receive);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("pagehide", dispose);
      host.destroy();
    }
    window.addEventListener("message", receive);
    window.addEventListener("pagehide", dispose);
    const { config } = parseConfig(new URLSearchParams(window.location.search));
    void apply(config, true, 0).then(() => post({
      protocol,
      framework,
      revision,
      type: "ready",
    }));
  }
  function onError(event: ErrorEvent): void {
    fail(event.error ?? event.message);
  }
  function onRejection(event: PromiseRejectionEvent): void {
    fail(event.reason);
  }
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return { start, event, fail };
}
