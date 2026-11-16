import BrowserOnly from "@docusaurus/BrowserOnly";
import CodeBlock from "@theme/CodeBlock";
import React, { useEffect, useRef, useState } from "react";
import sources from "../../../generated/svelte-examples.json";

type ExampleId = keyof typeof sources;

function SveltePreview({ id }: { id: ExampleId }): React.ReactElement {
  const targetRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading Svelte example…");
  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;
    import("../../../generated/svelte-demos/demo.mjs").then(({ mountExample }) => {
      if (!cancelled && targetRef.current) {
        destroy = mountExample(id, targetRef.current);
        setStatus("");
      }
    }).catch(() => {
      if (!cancelled)
        setStatus("Svelte example could not be loaded.");
    });
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [id]);

  return (
    <div data-svelte-demo={id}>
      <p role="status" hidden={!status}>{status}</p>
      <div ref={targetRef} />
    </div>
  );
}

export default function SvelteExample({ id }: { id: ExampleId }): React.ReactElement {
  return (
    <section aria-label={`Svelte example: ${id}`}>
      <BrowserOnly fallback={<p>Interactive Svelte example loads in the browser.</p>}>
        {() => <SveltePreview key={id} id={id} />}
      </BrowserOnly>
      <CodeBlock language="html" title={`${id}.svelte`}>{sources[id]}</CodeBlock>
    </section>
  );
}
