import type { ChannelViewModel, MessageView } from "@arcscord/discord-ui";

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
function validateAuthor(value: unknown, path: string): void {
  const author = identified(value, path);
  string(author.displayName, `${path}.displayName`);
  for (const key of ["avatarUrl", "color"]) optional(author, key, path, string);
  for (const key of ["bot", "verified"]) optional(author, key, path, boolean);
}
function validateThreadSummary(value: unknown, path: string): void {
  const thread = identified(value, path);
  string(thread.name, `${path}.name`);
  if (typeof thread.messageCount !== "number" || !Number.isSafeInteger(thread.messageCount) || thread.messageCount < 0)
    throw new Error(`${path}.messageCount : entier positif ou nul attendu.`);
  optional(thread, "lastMessage", path, (value, location) => {
    const last = object(value, location);
    validateAuthor(last.author, `${location}.author`);
    string(last.content, `${location}.content`);
    string(last.timestamp, `${location}.timestamp`);
  });
}

function validateMessage(value: unknown, path = "$", allowThread = true): asserts value is MessageView {
  const message = identified(value, path);
  validateAuthor(message.author, `${path}.author`);
  if (!allowThread && "thread" in message)
    throw new Error(`${path}.thread : les réponses d’un fil ne peuvent pas contenir un autre fil.`);
  optional(message, "thread", path, validateThreadSummary);
  string(message.timestamp, `${path}.timestamp`);
  const body = object(message.body, `${path}.body`);
  if (body.kind === "components-v2") {
    if ("embeds" in message || "media" in message)
      throw new Error(`${path} : un message V2 ne peut pas mélanger embeds ou médias classiques.`);
    list(body.components, `${path}.body.components`, component);
  }
  else if (body.kind === "text" || body.kind === "markdown") {
    string(body.content, `${path}.body.content`);
    optional(message, "media", path, (value, path) => list(value, path, media));
    optional(message, "embeds", path, (value, path) => list(value, path, embed));
  }
  else {
    throw new Error(`${path}.body.kind : « text », « markdown » ou « components-v2 » attendu.`);
  }
}

function validateChannel(value: unknown): asserts value is ChannelViewModel {
  const channel = identified(value, "$");
  string(channel.name, "$.name");
  optional(channel, "topic", "$", string);
  list(channel.messages, "$.messages", validateMessage);
  optional(channel, "threads", "$", (value, path) => list(value, path, (value, path) => {
    const thread = identified(value, path);
    string(thread.name, `${path}.name`);
    string(thread.parentMessageId, `${path}.parentMessageId`);
    list(thread.messages, `${path}.messages`, (value, path) => validateMessage(value, path, false));
    const parent = (channel.messages as MessageView[]).find(message => message.id === thread.parentMessageId);
    if ((thread.messages as MessageView[]).some(message => message.id === thread.parentMessageId))
      throw new Error(`${path}.messages : le message parent ne doit pas être répété dans les réponses.`);
    if (!parent || parent.thread?.id !== thread.id)
      throw new Error(`${path}.parentMessageId : le parent doit référencer ce fil.`);
  }));
}

function parseDocument<T>(draft: string, validate: (value: unknown) => asserts value is T): { ok: true; value: T } | { ok: false; error: string } {
  try {
    const value: unknown = JSON.parse(draft);
    validate(value);
    return { ok: true, value };
  }
  catch (error) {
    return {
      ok: false,
      error: error instanceof SyntaxError
        ? `JSON invalide : ${error.message}`
        : error instanceof Error
          ? error.message
          : "Structure invalide.",
    };
  }
}

export type ParsedMessage = { ok: true; message: MessageView } | { ok: false; error: string };
export function parseMessageJson(draft: string): ParsedMessage {
  const result = parseDocument(draft, validateMessage);
  return result.ok
    ? { ok: true, message: result.value }
    : result;
}
export function parseChannelJson(draft: string): { ok: true; channel: ChannelViewModel } | { ok: false; error: string } {
  const result = parseDocument(draft, validateChannel);
  return result.ok
    ? { ok: true, channel: result.value }
    : result;
}
export function serializeChannel(channel: ChannelViewModel): string {
  return JSON.stringify(channel, null, 2);
}
export function createChannelEditor(channel: ChannelViewModel): { channel: ChannelViewModel; draft: string; error: string | null } {
  return {
    channel,
    draft: serializeChannel(channel),
    error: null,
  };
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
