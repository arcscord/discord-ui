import type { ChannelViewModel, ComponentInteractionContext, MessageView, SelectValues, SlashCommandInvocation } from "@arcscord/discord-ui-core";
import { ChannelComposer, ChannelView, DiscordUI, Emoji, Message, SelectMenu } from "@arcscord/discord-ui-vue";
import { computed, defineComponent, h, ref } from "vue";
import { demoChannel } from "./channel.ts";
import { basicMessage, componentsV2Message, demoEntities, embedMessage, interactiveMessage, markdownMessage, mediaMessage, reactionsMessage, unavailableMessage } from "./messages.ts";
import { selectMenuExamples } from "./select-menus.ts";

/** Resolve the shared fixture assets at this website's public example boundary. */
function websiteData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value).replaceAll("\"/emoji.svg\"", "\"/examples/emoji.svg\"").replaceAll("\"/landscape.svg\"", "\"/examples/landscape.svg\"")) as T;
}

/** Same component factory runs on the server and client; no browser globals or implicit clock. */
export function createVueHydrationFixture(): import("vue").Component {
  return defineComponent({
    name: "VueHydrationFixture",
    setup() {
      const theme = ref<"light" | "ash" | "dark">("dark");
      const channel = ref<ChannelViewModel>(websiteData(demoChannel));
      const activeThreadId = ref<string | null>(null);
      const selections = ref<Record<string, readonly string[]>>({});
      const context = ref("");
      const commandStatus = ref("");
      const composerValue = ref("");
      const buttonCount = ref(0);
      const reacted = ref(false);
      const disabled = ref(false);
      const localMenu = ref({
        id: "identity",
        kind: "string-select" as const,
        minValues: 0,
        options: [
          { value: "a", label: "Alpha", default: true },
          { value: "b", label: "Beta" },
        ],
      });
      const controlledMessage = computed<MessageView>(() => ({
        author: basicMessage.author,
        timestamp: basicMessage.timestamp,
        id: "controlled",
        body: {
          kind: "components-v2",
          components: [
            {
              id: "row",
              kind: "action-row",
              buttons: [
                { id: "wave", kind: "button", label: "Wave" },
              ],
            },
            {
              id: "select-row",
              kind: "action-row",
              select: {
                id: "pick",
                kind: "string-select",
                minValues: 0,
                options: [
                  { value: "a", label: "Alpha" },
                  { value: "b", label: "Beta" },
                ],
              },
            },
          ],
        },
        reactions: [
          {
            id: "wave",
            emoji: { name: "👋" },
            count: reacted.value ? 2 : 1,
            me: reacted.value,
          },
        ],
      }));
      const messageSelections = ref<SelectValues>({ pick: [] });
      function button(id: string, source: ComponentInteractionContext): void {
        buttonCount.value++;
        context.value = `${source.messageId}:${id}`;
      }
      function select(id: string, values: string[], source: ComponentInteractionContext): void {
        messageSelections.value = { ...messageSelections.value, [id]: values };
        context.value = `${source.messageId}:${id}:${values.join(",")}`;
      }
      function send(content: string): void {
        channel.value = {
          ...channel.value,
          messages: [
            ...channel.value.messages,
            {
              author: basicMessage.author,
              timestamp: basicMessage.timestamp,
              id: `sent-${channel.value.messages.length}`,
              body: { kind: "text", content },
            },
          ],
        };
      }
      function threadSend(threadId: string, content: string): void {
        channel.value = {
          ...channel.value,
          threads: (channel.value.threads ?? []).map(thread => thread.id === threadId
            ? {
                ...thread,
                messages: [
                  ...thread.messages,
                  {
                    author: basicMessage.author,
                    timestamp: basicMessage.timestamp,
                    id: `reply-${thread.messages.length}`,
                    body: { kind: "text", content },
                  },
                ],
              }
            : thread),
        };
      }
      function slashCommand(invocation: SlashCommandInvocation): void {
        commandStatus.value = `${invocation.command.name}:${JSON.stringify(invocation.arguments)}`;
      }
      return () => h("main", [
        h("h1", "Vue SSR and hydration fixture"),
        h("nav", { "aria-label": "Fixture controls" }, [
          ...(["light", "ash", "dark"] as const).map(value => h("button", {
            onClick: () => { theme.value = value; },
          }, value)),
          h("button", {
            onClick: () => { disabled.value = !disabled.value; },
          }, "Toggle disabled"),
        ]),
        h(DiscordUI, {
          theme: theme.value,
          locale: "en-US",
          timeZone: "UTC",
          referenceTime: "2026-10-29T18:10:00Z",
          entities: websiteData(demoEntities),
          unicodeEmoji: { mode: "native" },
          allowRemoteMedia: false,
        }, {
          default: () => [
            h("section", { "aria-label": "All shared fixtures" }, [
              basicMessage,
              markdownMessage,
              mediaMessage,
              embedMessage,
              unavailableMessage,
              componentsV2Message,
              reactionsMessage,
              interactiveMessage,
            ].map(message => h(Message, {
              key: message.id,
              message: websiteData(message),
            }))),
            h("section", { "aria-label": "Local emoji" }, [
              h(DiscordUI, {
                unicodeEmoji: { mode: "twemoji", baseUrl: "/examples/twemoji" },
                allowRemoteMedia: false,
              }, {
                default: () => h(Emoji, { name: "👋" }),
              }),
            ]),
            h("section", { "aria-label": "Controlled message" }, [
              h(Message, {
                message: controlledMessage.value,
                selectValues: messageSelections.value,
                onButtonClick: button,
                onSelectChange: select,
                onReactionToggle: () => { reacted.value = !reacted.value; },
              }),
              h("p", { role: "status" }, `${buttonCount.value} waves; ${context.value}`),
            ]),
            h("section", { "aria-label": "All menu kinds" }, selectMenuExamples.map(example => h("div", { "data-menu-kind": example.id }, [
              h("h2", example.title),
              h(SelectMenu, {
                "menu": { ...example.menu, disabled: disabled.value },
                "values": selections.value[example.id],
                "onUpdate:values": (values: string[]) => { selections.value = { ...selections.value, [example.id]: values }; },
              }),
              h("output", JSON.stringify(selections.value[example.id] ?? null)),
            ]))),
            h("section", { "aria-label": "Selection identity" }, [
              h(SelectMenu, { menu: localMenu.value }),
              h("button", {
                onClick: () => {
                  localMenu.value = {
                    ...localMenu.value,
                    options: [
                      { value: "b", label: "Beta" },
                    ],
                  };
                },
              }, "Remove Alpha"),
              h("button", {
                onClick: () => {
                  localMenu.value = {
                    ...localMenu.value,
                    id: "new-identity",
                    options: [
                      { value: "a", label: "Alpha", default: true },
                    ],
                  };
                },
              }, "Replace menu"),
            ]),
            h("section", { "aria-label": "Controlled conversation" }, [
              h(ChannelView, {
                "channel": channel.value,
                "height": 450,
                "activeThreadId": activeThreadId.value,
                "onUpdate:activeThreadId": (value: string | null) => { activeThreadId.value = value; },
                "onSend": send,
                "onThreadSend": threadSend,
                "onSlashCommand": slashCommand,
                "commands": [
                  {
                    name: "echo",
                    description: "Echo text",
                    arguments: [
                      { name: "text", description: "Text to echo", required: true },
                      {
                        name: "mode",
                        description: "Output mode",
                        choices: [
                          { name: "Normal", value: "normal" },
                          { name: "Loud", value: "loud" },
                        ],
                      },
                    ],
                  },
                ],
              }),
              h("p", { role: "status" }, commandStatus.value),
            ]),
            h("section", { "aria-label": "Standalone composer" }, [
              h(ChannelComposer, {
                "channelName": "standalone",
                "modelValue": composerValue.value,
                "onUpdate:modelValue": (value: string) => { composerValue.value = value; },
                "onSend": (content: string) => {
                  context.value = content;
                  composerValue.value = "";
                },
              }, {
                leading: () => "Leading",
                trailing: () => "Trailing",
              }),
            ]),
          ],
        }),
      ]);
    },
  });
}
