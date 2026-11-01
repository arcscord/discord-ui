import type { SelectMenuExample } from "../../../../fixtures/select-menus";
import { Button, SelectMenu } from "@arcscord/discord-ui";
import { useState } from "react";
import { selectMenuForWebsite } from "../../../../fixtures/select-menus";
import { defaultSelectValues, singleSelectMenu } from "../../../../packages/discord-ui/src/utils/select-menus";

export function SelectMenuSample({ example }: { example: SelectMenuExample }) {
  const menu = selectMenuForWebsite(example.menu);
  const defaults = defaultSelectValues(menu);
  const [values, setValues] = useState(defaults);
  const [single, setSingle] = useState<string[]>([]);
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h3>{example.title}</h3>
      <p>{example.description}</p>
      <p>
        Multiple selection:
        {menu.minValues}
        –
        {menu.maxValues}
        {" "}
        values.
      </p>
      <SelectMenu menu={menu} values={values} onChange={setValues} />
      <p role="status" aria-label="Selected values">{JSON.stringify(values)}</p>
      <h4>Single selection</h4>
      <SelectMenu
        menu={singleSelectMenu(menu)}
        values={single}
        onChange={setSingle}
      />
      <p role="status" aria-label="Single selected value">{JSON.stringify(single)}</p>
      <h4>Disabled state</h4>
      <SelectMenu
        menu={{
          ...menu,
          id: `${menu.id}-disabled`,
          placeholder: "Disabled selection",
          disabled: true,
        }}
        values={defaults}
      />
      <div>
        <Button
          label="Reset selections"
          style="secondary"
          onClick={() => {
            setValues(defaults);
            setSingle([]);
          }}
        />
      </div>
    </div>
  );
}
