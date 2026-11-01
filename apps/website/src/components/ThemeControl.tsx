import type { ThemeName } from "@arcscord/discord-ui";

import { previewThemes } from "../data/preview-themes";

export function ThemeControl({ value, onChange }: { value: ThemeName | undefined; onChange: (theme: ThemeName) => void }) {
  return (
    <fieldset className="theme-control">
      <legend>Preview theme</legend>
      <div>{previewThemes.map(theme => <button key={theme} type="button" disabled={value === undefined} aria-pressed={value === theme} onClick={() => onChange(theme)}>{theme[0]!.toUpperCase() + theme.slice(1)}</button>)}</div>
    </fieldset>
  );
}
