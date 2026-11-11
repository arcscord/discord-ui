<script setup lang="ts">
import type { ThreadPreviewProps } from "./thread-preview";
import { formatDiscordTimestamp } from "@arcscord/discord-ui-core";
import { computed, useId } from "vue";
import { useDisplayOptions } from "../../display-context";
import { Author } from "../author/author";
import { Avatar } from "../author/avatar";

const props = defineProps<ThreadPreviewProps>();
const emit = defineEmits<{ open: [id: string] }>();
const options = useDisplayOptions();
const descriptionId = useId();
const countLabel = computed(() => (new Intl.PluralRules(options.locale).select(props.thread.messageCount) === "one"
  ? options.labels.threadMessageSingular
  : options.labels.threadMessagePlural).replace("{count}", new Intl.NumberFormat(options.locale).format(props.thread.messageCount)));
const time = computed(() => {
  const last = props.thread.lastMessage;
  const date = last && new Date(last.timestamp);
  return last && date && /T.*(?:Z|[+-]\d{2}:\d{2})$/u.test(last.timestamp) && Number.isFinite(date.valueOf())
    ? formatDiscordTimestamp(String(date.valueOf() / 1000), "R", {
        locale: options.locale,
        timeZone: options.timeZone,
        referenceTime: options.referenceTime ?? last.timestamp,
        relativeStyle: "narrow",
      })
    : undefined;
});
</script>

<template>
  <component :is="onOpen ? 'button' : 'div'" :type="onOpen ? 'button' : undefined" class="dui-thread-preview" :data-active="active || undefined" :aria-label="onOpen ? `${options.labels.openThread} ${thread.name}, ${countLabel}` : undefined" :aria-describedby="onOpen ? descriptionId : undefined" :aria-expanded="onOpen ? !!active : undefined" @click="onOpen && emit('open', thread.id)">
    <span class="dui-thread-preview-header">
      <span class="dui-thread-name" :title="thread.name">{{ thread.name }}</span>
      <span class="dui-thread-count">{{ countLabel }}<span v-if="onOpen" aria-hidden="true"> ›</span></span>
    </span>
    <span :id="descriptionId" class="dui-thread-last">
      <template v-if="thread.lastMessage"><Avatar :author="thread.lastMessage.author" /><span class="dui-thread-last-author"><Author :author="thread.lastMessage.author" /></span><span class="dui-thread-snippet" :title="thread.lastMessage.content">{{ thread.lastMessage.content }}</span><time v-if="time" class="dui-thread-last-time" :datetime="time.dateTime">{{ time.label }}</time></template>
      <span v-else class="dui-thread-snippet">{{ options.labels.threadNoRecentMessages }}</span>
    </span>
  </component>
</template>
