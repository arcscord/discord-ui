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
  if (!["link-button", "button", "premium-button"].includes(String(item.kind)))
    throw new Error(`${path}.kind : bouton attendu.`);
  string(item.label, `${path}.label`);
  if (item.kind === "link-button")
    string(item.url, `${path}.url`);
  if (item.kind === "premium-button")
    string(item.skuId, `${path}.skuId`);
  if (item.kind === "button" && "style" in item && ![
    "primary",
    "secondary",
    "success",
    "danger",
  ].includes(String(item.style))) {
    throw new Error(`${path}.style : style de bouton invalide.`);
  }
  optional(item, "disabled", path, boolean);
  optional(item, "emoji", path, (value, location) => {
    const emoji = object(value, location);
    string(emoji.name, `${location}.name`);
    optional(emoji, "image", location, string);
  });
}
function selectMenu(value: unknown, path: string): void {
  const item = identified(value, path);
  if (![
    "string-select",
    "user-select",
    "role-select",
    "mentionable-select",
    "channel-select",
  ].includes(String(item.kind))) {
    throw new Error(`${path}.kind : menu de sélection attendu.`);
  }
  optional(item, "placeholder", path, string);
  optional(item, "disabled", path, boolean);
  for (const key of ["minValues", "maxValues"]) {
    optional(item, key, path, (value, location) => {
      if (typeof value !== "number" || !Number.isInteger(value) || value < (key === "maxValues"
        ? 1
        : 0) || value > 25) {
        throw new Error(`${location} : limite de sélection invalide.`);
      }
    });
  }
  if (Number(item.minValues ?? 1) > Number(item.maxValues ?? 1))
    throw new Error(`${path} : minimum supérieur au maximum.`);
  function fields(value: ObjectValue, allowed: string[], location: string): void {
    for (const key of Object.keys(value)) {
      if (!allowed.includes(key))
        throw new Error(`${location}.${key} : propriété non prise en charge pour ce type de menu.`);
    }
  }
  const isString = item.kind === "string-select";
  const entityTypes = item.kind === "mentionable-select"
    ? ["user", "role"]
    : [
        String(item.kind).replace("-select", ""),
      ];
  fields(item, [
    "id",
    "kind",
    "placeholder",
    "minValues",
    "maxValues",
    "disabled",
    ...(isString
      ? ["options"]
      : ["entities", "defaultValues"]),
    ...(item.kind === "channel-select"
      ? ["channelTypes"]
      : []),
  ], path);
  const values = new Map<string, string>();
  const choicesKey = isString ? "options" : "entities";
  list(item[choicesKey], `${path}.${choicesKey}`, (value, location) => {
    const option = object(value, location);
    const valueKey = isString ? "value" : "id";
    const labelKey = isString
      ? "label"
      : option.entityType === "user"
        ? "displayName"
        : "name";
    string(option[valueKey], `${location}.${valueKey}`);
    string(option[labelKey], `${location}.${labelKey}`);
    if (values.has(option[valueKey] as string))
      throw new Error(`${location}.${valueKey} : valeur dupliquée.`);
    values.set(option[valueKey] as string, String(option.entityType));
    if (isString) {
      fields(option, [
        "value",
        "label",
        "description",
        "emoji",
        "default",
      ], location);
      for (const key of ["value", "label", "description"]) {
        optional(option, key, location, (value, location) => {
          string(value, location);
          if ((value as string).length > 100)
            throw new Error(`${location} : 100 caractères maximum.`);
        });
      }
      optional(option, "default", location, boolean);
      optional(option, "emoji", location, (value, location) => {
        const emoji = object(value, location);
        string(emoji.name, `${location}.name`);
        optional(emoji, "image", location, string);
      });
    }
    else {
      if (!entityTypes.includes(String(option.entityType)))
        throw new Error(`${location}.entityType : type d’entité incompatible avec ce menu.`);
      const extra = option.entityType === "user"
        ? [
            "username",
            "avatarUrl",
            "status",
            "bot",
            "verified",
          ]
        : option.entityType === "role"
          ? ["color"]
          : ["channelType", "rules", "locked"];
      fields(option, [
        "id",
        option.entityType === "user"
          ? "displayName"
          : "name",
        "entityType",
        ...extra,
      ], location);
      for (const key of ["username", "avatarUrl", "color"]) optional(option, key, location, string);
      for (const key of ["bot", "verified", "rules", "locked"]) optional(option, key, location, boolean);
      if ("status" in option && !["online", "idle", "dnd", "offline"].includes(String(option.status)))
        throw new Error(`${location}.status : statut invalide.`);
      if (option.entityType === "channel" && ![
        0,
        1,
        2,
        3,
        4,
        5,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
      ].includes(Number(option.channelType))) {
        throw new Error(`${location}.channelType : type de salon invalide.`);
      }
      if (option.entityType === "channel" && typeof option.channelType !== "number")
        throw new Error(`${location}.channelType : nombre attendu.`);
    }
  });
  if (isString && (item.options as unknown[]).length > 25)
    throw new Error(`${path}.options : 25 options maximum.`);
  optional(item, "defaultValues", path, (value, location) => list(value, location, (value, location) => {
    const entry = identified(value, location);
    if (!entityTypes.includes(String(entry.type)) || values.get(entry.id as string) !== entry.type)
      throw new Error(`${location} : valeur par défaut incompatible avec les entités du menu.`);
  }));
  optional(item, "channelTypes", path, (value, location) => {
    if (!Array.isArray(value) || value.some(type => typeof type !== "number" || ![
      0,
      1,
      2,
      3,
      4,
      5,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
    ].includes(type))) {
      throw new Error(`${location} : types de salons invalides.`);
    }
  });
  if (typeof item.placeholder === "string" && item.placeholder.length > 150)
    throw new Error(`${path}.placeholder : 150 caractères maximum.`);
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
      if ("select" in item && "buttons" in item)
        throw new Error(`${path} : choisir boutons ou menu.`);
      if ("select" in item)
        selectMenu(item.select, `${path}.select`);
      else list(item.buttons, `${path}.buttons`, button);
      break;
    case "file":
      string(item.name, `${path}.name`);
      string(item.url, `${path}.url`);
      optional(item, "size", path, string);
      optional(item, "spoiler", path, boolean);
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
  optional(author, "avatarFallback", path, (value, location) => {
    const fallback = object(value, location);
    for (const key of ["background", "letter", "color"]) optional(fallback, key, location, string);
  });
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
  optional(message, "reactions", path, (value, location) => list(value, location, (value, location) => {
    const reaction = identified(value, location);
    const emoji = object(reaction.emoji, `${location}.emoji`);
    string(emoji.name, `${location}.emoji.name`);
    optional(emoji, "image", `${location}.emoji`, string);
    if (typeof reaction.count !== "number" || !Number.isSafeInteger(reaction.count) || reaction.count < 0)
      throw new Error(`${location}.count : entier positif ou nul attendu.`);
    optional(reaction, "me", location, boolean);
  }));
  string(message.timestamp, `${path}.timestamp`);
  optional(message, "edited", path, boolean);
  optional(message, "editedTimestamp", path, string);
  optional(message, "reply", path, (value, location) => {
    const reply = object(value, location);
    string(reply.messageId, `${location}.messageId`);
    optional(reply, "unavailable", location, boolean);
    if (reply.unavailable === true) {
      if ("author" in reply || "content" in reply)
        throw new Error(`${location} : un original indisponible ne contient ni auteur ni contenu.`);
    }
    else {
      validateAuthor(reply.author, `${location}.author`);
      string(reply.content, `${location}.content`);
    }
  });
  const body = object(message.body, `${path}.body`);
  if (body.kind === "components-v2") {
    if ("embeds" in message || "media" in message || "components" in message || "attachments" in message)
      throw new Error(`${path} : un message V2 ne peut pas mélanger embeds ou médias classiques.`);
    list(body.components, `${path}.body.components`, component);
  }
  else if (body.kind === "text" || body.kind === "markdown") {
    string(body.content, `${path}.body.content`);
    optional(message, "components", path, (value, location) => list(value, location, (value, location) => {
      if (object(value, location).kind !== "action-row")
        throw new Error(`${location} : ligne d’actions attendue.`);
      component(value, location);
    }));
    optional(message, "attachments", path, (value, location) => list(value, location, (value, location) => {
      if (object(value, location).kind !== "file")
        throw new Error(`${location}.kind : « file » attendu.`);
      component(value, location);
    }));
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
