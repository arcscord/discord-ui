import type { MessageView } from "@arcscord/discord-ui";

// Display-model checks for the playground, not Discord publication validation.
type ObjectValue = Record<string, unknown>;
function object(value: unknown, path: string): ObjectValue {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${path} : objet attendu.`);
  return value as ObjectValue;
}
function string(value: unknown, path: string): void {
  if (typeof value !== "string")
    throw new TypeError(`${path} : texte attendu.`);
}
function optional(value: ObjectValue, key: string, path: string, check: (value: unknown, path: string) => void): void {
  if (key in value)
    check(value[key], `${path}.${key}`);
}
function boolean(value: unknown, path: string): void {
  if (typeof value !== "boolean")
    throw new TypeError(`${path} : booléen attendu.`);
}
function identified(value: unknown, path: string): ObjectValue {
  const item = object(value, path);
  string(item.id, `${path}.id`);
  if (!item.id)
    throw new Error(`${path}.id : identifiant vide.`);
  return item;
}
function list(value: unknown, path: string, check: (item: unknown, path: string) => void): void {
  if (!Array.isArray(value))
    throw new TypeError(`${path} : tableau attendu.`);
  const ids = new Set<string>();
  value.forEach((item: unknown, index) => {
    const itemPath = `${path}[${index}]`;
    check(item, itemPath);
    const id = object(item, itemPath).id;
    if (typeof id === "string") {
      if (ids.has(id))
        throw new Error(`${itemPath}.id : identifiant dupliqué « ${id} ».`);
      ids.add(id);
    }
  });
}
function media(value: unknown, path: string): void {
  const item = identified(value, path);
  string(item.url, `${path}.url`);
  string(item.alt, `${path}.alt`);
  optional(item, "spoiler", path, boolean);
  for (const key of ["width", "height"]) {
    optional(item, key, path, (size, location) => {
      if (typeof size !== "number" || !Number.isFinite(size) || size <= 0)
        throw new Error(`${location} : nombre positif attendu.`);
    });
  }
}
function textDisplay(value: unknown, path: string): void {
  const item = identified(value, path);
  if (item.kind !== "text-display")
    throw new Error(`${path}.kind : « text-display » attendu.`);
  string(item.content, `${path}.content`);
}
function button(value: unknown, path: string): void {
  const item = identified(value, path);
  if (item.kind !== "link-button")
    throw new Error(`${path}.kind : « link-button » attendu.`);
  string(item.label, `${path}.label`);
  string(item.url, `${path}.url`);
  optional(item, "disabled", path, boolean);
  optional(item, "emoji", path, (value, location) => {
    const emoji = object(value, location);
    string(emoji.name, `${location}.name`);
    optional(emoji, "image", location, string);
  });
}
function component(value: unknown, path: string, allowContainer = true): void {
  const item = identified(value, path);
  switch (item.kind) {
    case "text-display":
      textDisplay(item, path);
      break;
    case "section": {
      list(item.components, `${path}.components`, textDisplay);
      const accessoryPath = `${path}.accessory`;
      const accessory = identified(item.accessory, accessoryPath);
      if (accessory.kind === "thumbnail")
        media(accessory.media, `${accessoryPath}.media`);
      else button(accessory, accessoryPath);
      break;
    }
    case "media-gallery":
      list(item.items, `${path}.items`, media);
      break;
    case "separator":
      optional(item, "divider", path, boolean);
      if ("spacing" in item && item.spacing !== "small" && item.spacing !== "large")
        throw new Error(`${path}.spacing : « small » ou « large » attendu.`);
      break;
    case "action-row":
      list(item.buttons, `${path}.buttons`, button);
      break;
    case "container":
      if (!allowContainer)
        throw new Error(`${path} : un conteneur ne peut pas contenir un autre conteneur.`);
      optional(item, "accentColor", path, string);
      optional(item, "spoiler", path, boolean);
      list(item.components, `${path}.components`, (child, location) => component(child, location, false));
      break;
    default: throw new Error(`${path}.kind : composant non pris en charge.`);
  }
}
function embed(value: unknown, path: string): void {
  const item = identified(value, path);
  for (const key of [
    "title",
    "url",
    "description",
    "color",
    "timestamp",
  ]) optional(item, key, path, string);
  for (const key of ["image", "thumbnail"]) optional(item, key, path, media);
  optional(item, "author", path, (value, location) => {
    const author = object(value, location);
    string(author.name, `${location}.name`);
    optional(author, "url", location, string);
    optional(author, "iconUrl", location, string);
  });
  optional(item, "footer", path, (value, location) => {
    const footer = object(value, location);
    string(footer.text, `${location}.text`);
    optional(footer, "iconUrl", location, string);
  });
  optional(item, "fields", path, (value, location) => list(value, location, (value, location) => {
    const field = identified(value, location);
    string(field.name, `${location}.name`);
    string(field.value, `${location}.value`);
    optional(field, "inline", location, boolean);
  }));
}
function validateMessage(value: unknown): asserts value is MessageView {
  const message = identified(value, "$");
  const author = identified(message.author, "$.author");
  string(author.displayName, "$.author.displayName");
  for (const key of ["avatarUrl", "color"]) optional(author, key, "$.author", string);
  for (const key of ["bot", "verified"]) optional(author, key, "$.author", boolean);
  string(message.timestamp, "$.timestamp");
  const body = object(message.body, "$.body");
  if (body.kind === "components-v2") {
    if ("embeds" in message || "media" in message)
      throw new Error("$ : un message V2 ne peut pas mélanger embeds ou médias classiques.");
    list(body.components, "$.body.components", component);
  }
  else if (body.kind === "text" || body.kind === "markdown") {
    string(body.content, "$.body.content");
    optional(message, "media", "$", (value, path) => list(value, path, media));
    optional(message, "embeds", "$", (value, path) => list(value, path, embed));
  }
  else {
    throw new Error("$.body.kind : « text », « markdown » ou « components-v2 » attendu.");
  }
}

export type ParsedMessage = { ok: true; message: MessageView } | { ok: false; error: string };
export function parseMessageJson(draft: string): ParsedMessage {
  let value: unknown;
  try {
    value = JSON.parse(draft);
  }
  catch (error) {
    return { ok: false, error: `JSON invalide : ${error instanceof Error
      ? error.message
      : "syntaxe incorrecte"}` };
  }
  try {
    validateMessage(value);
    return { ok: true, message: value };
  }
  catch (error) {
    return {
      ok: false,
      error: error instanceof Error
        ? error.message
        : "Structure de message invalide.",
    };
  }
}
export function serializeMessage(message: MessageView): string {
  return JSON.stringify(message, null, 2);
}
export function createMessageEditor(message: MessageView): { message: MessageView; draft: string; error: string | null } {
  return {
    message,
    draft: serializeMessage(message),
    error: null,
  };
}
