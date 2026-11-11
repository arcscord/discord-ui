import BrowserOnly from "@docusaurus/BrowserOnly";
import CodeBlock from "@theme/CodeBlock";
import React, { useEffect, useId, useRef, useState } from "react";
import sources from "../../../generated/vue-examples.json";

type DemoModule = { mount: (id: string, element: HTMLElement, prefix: string) => () => void };
function VuePreview({ id }: { id: keyof typeof sources }): React.ReactElement {
  const targetRef = useRef<HTMLDivElement>(null);
  const prefix = useId().replace(/[^a-z\d-]/giu, "");
  const [status, setStatus] = useState("Loading Vue example…");
  useEffect(() => {
    let cancelled = false;
    let unmount: (() => void) | undefined;
    import("../../../generated/vue-demos/demo.mjs").then((module: DemoModule) => {
      if (cancelled || !targetRef.current)
        return;
      unmount = module.mount(id, targetRef.current, `vue-${prefix}-`);
      setStatus("");
    }).catch(() => {
      if (!cancelled)
        setStatus("Vue example could not be loaded.");
    });
    return () => {
      cancelled = true;
      unmount?.();
    };
  }, [id, prefix]);
  return (
    <div data-vue-demo={id}>
      <p role="status" hidden={!status}>{status}</p>
      <div ref={targetRef} />
    </div>
  );
}
export default function VueExample({ id }: { id: keyof typeof sources }): React.ReactElement {
  return (
    <section aria-label={`Vue example: ${id}`}>
      <BrowserOnly fallback={<p>Interactive Vue example loads in the browser.</p>}>{() => <VuePreview id={id} />}</BrowserOnly>
      <CodeBlock language="html" title={`${id}.vue`}>{sources[id]}</CodeBlock>
    </section>
  );
}
