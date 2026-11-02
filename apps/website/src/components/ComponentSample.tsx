import type { ThemeName } from "@arcscord/discord-ui";
import { examplePreviews } from "../generated/examples";

/** Precompiled from the same standalone module displayed in the editor. */
export function ComponentSample({ id, theme }: { id: string; theme: ThemeName }) {
  const Preview = examplePreviews[id];
  if (!Preview)
    throw new Error(`Missing preview for example: ${id}`);
  return <Preview theme={theme} />;
}
