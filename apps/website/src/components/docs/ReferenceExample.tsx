import type { ThemeName } from "@arcscord/discord-ui";
import Link from "@docusaurus/Link";
import CodeBlock from "@theme/CodeBlock";
import { useState } from "react";
import { componentExamples, playgroundUrl } from "../../data/component-examples";
import { ComponentSample } from "../ComponentSample";
import { exportCode } from "../playground/export-code";
import { ThemeControl } from "../ThemeControl";

/** Reuse canonical source and precompiled previews; no separate fixture bindings. */
export default function ReferenceExample({ id, initiallyOpen = false }: { id: string; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [theme, setTheme] = useState<ThemeName>("dark");
  const [revision, setRevision] = useState(0);
  const example = componentExamples.find(candidate => candidate.id === id);
  if (!example)
    throw new Error(`Missing documented example: ${id}`);
  return (
    <section className="reference-example" aria-label={`${example.title} canonical example`}>
      <details open={open} onToggle={event => setOpen(event.currentTarget.open)}>
        <summary>{`${example.title}: preview and complete React module`}</summary>
        {open
          ? (
              <>
                <div className="reference-example-toolbar">
                  <ThemeControl value={theme} onChange={setTheme} />
                  <button type="button" className="demo-reset" onClick={() => setRevision(current => current + 1)}>Restart demo</button>
                </div>
                <div className="component-sample" key={`${id}-${theme}-${revision}`}><ComponentSample id={id} theme={theme} /></div>
                <p>
                  <Link to={playgroundUrl(id, theme)}>Open in playground</Link>
                  {" · "}
                  <Link to={`/components?example=${id}`}>Compare in catalogue</Link>
                </p>
                <CodeBlock language="jsx" title={`${id}.jsx`}>{exportCode(example.code, theme)}</CodeBlock>
                <p className="scope-note">
                  This complete module is also used by the catalogue and playground. Interactions are local simulations. Closing this example unmounts its local preview.
                  {" "}
                  <Link to="/docs/playground#assets">Copy referenced example assets</Link>
                  {" "}
                  when reusing image/file examples.
                </p>
              </>
            )
          : null}
      </details>
    </section>
  );
}
