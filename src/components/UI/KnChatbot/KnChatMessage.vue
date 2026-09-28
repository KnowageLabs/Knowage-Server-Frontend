<template>
    <div class="kn-chat-msg" :class="isUser ? 'kn-chat-msg--user' : 'kn-chat-msg--assistant'">
        <img v-if="!isUser" :src="avatarImg" class="kn-chat-msg__avatar" alt="" />

        <div class="kn-chat-msg__body">
            <div class="kn-chat-msg__bubble" :class="{ 'kn-chat-msg__bubble--error': message.isError }">
                <!-- Running: the current step, or "thinking" before the first step -->
                <div v-if="isRunning" class="kn-chat-steps__running row no-wrap items-center">
                    <q-spinner-dots size="1.2rem" class="kn-chat-accent q-mr-sm flex-shrink-0" />
                    <Transition name="kn-chat-status" mode="out-in">
                        <span :key="runningLabel" class="kn-chat-steps__running-label">{{ runningLabel }}</span>
                    </Transition>
                </div>

                <!-- Finished: the steps collapse into a toggle -->
                <div v-else-if="message.steps?.length" class="kn-chat-steps">
                    <button type="button" class="kn-chat-steps__toggle" :aria-expanded="stepsOpen" @click="stepsOpen = !stepsOpen">
                        <q-icon name="checklist" size="16px" class="q-mr-xs" />
                        <span>{{ $t('ai.steps.count', message.steps.length) }}</span>
                        <q-icon :name="stepsOpen ? 'expand_less' : 'expand_more'" size="16px" />
                    </button>
                    <ul v-if="stepsOpen" class="kn-chat-steps__list">
                        <li v-for="step in message.steps" :key="step.id">
                            <q-icon :name="step.done ? 'check' : 'more_horiz'" size="14px" class="q-mr-xs" />
                            {{ stepLabel(step.tool) }}
                        </li>
                    </ul>
                </div>

                <div v-if="message.isStreamError" class="row no-wrap items-start">
                    <q-icon name="warning_amber" color="negative" size="sm" class="q-mr-xs flex-shrink-0" />
                    <vue-markdown-it :source="message.content" class="kn-chat-msg__markdown" />
                </div>
                <!-- User text is not markdown: show it as typed, line breaks included. -->
                <div v-else-if="isUser" class="kn-chat-msg__plain">{{ message.content }}</div>
                <vue-markdown-it v-else-if="message.content" :source="message.content" class="kn-chat-msg__markdown" />

                <div v-if="message.isStopped" class="kn-chat-msg__stopped row items-center">
                    <q-icon name="stop_circle" size="16px" class="q-mr-xs" />
                    {{ $t('ai.stopped') }}
                </div>
            </div>

            <!-- Dashboard links -->
            <div v-if="links.length > 0" class="kn-chat-msg__links">
                <button v-for="link in links" :key="link.url" type="button" class="kn-chat-link" @click="$emit('navigate', link.url)">
                    <q-icon name="dashboard" size="18px" class="kn-chat-accent" />
                    <span class="kn-chat-link__label">{{ link.title }}</span>
                    <q-icon name="open_in_new" size="16px" class="kn-chat-link__open" />
                </button>
            </div>

            <div class="kn-chat-msg__meta">
                <span v-if="message.timestamp && !message.isLive">{{ time }}</span>
                <button v-if="artifactCount > 0" type="button" class="kn-chat-msg__artifacts" @click="$emit('openArtifacts', message)">
                    <q-icon name="inventory_2" size="14px" class="q-mr-xs" />{{ $t('ai.artifactsCount', artifactCount) }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { VueMarkdownIt } from '@f3ve/vue-markdown-it'
import avatarImg from '@/assets/images/chatbot/chatty.webp'
import type { IChat, IChatLink } from './KnChatbot'

const props = withDefaults(defineProps<{ message: IChat; links?: IChatLink[]; artifactCount?: number; time?: string }>(), { links: () => [], artifactCount: 0, time: '' })

defineEmits<{
    (e: 'openArtifacts', message: IChat): void
    (e: 'navigate', url: string): void
}>()

const { t, te } = useI18n()
const stepsOpen = ref(false)

const isUser = computed(() => props.message.role === 'user')
// Before the first text arrives, the bubble shows what the assistant is doing.
const isRunning = computed(() => !!props.message.isLive && !props.message.content)

function stepLabel(tool: string): string {
    const key = `ai.steps.tools.${tool}`
    return te(key) ? t(key) : t('ai.steps.default', { tool })
}

const runningLabel = computed(() => {
    const steps = props.message.steps ?? []
    if (props.message.liveStatus) return props.message.liveStatus
    if (steps.length > 0) return stepLabel(steps[steps.length - 1].tool)
    return t('ai.thinking')
})
</script>

<style scoped lang="scss">
.kn-chat-msg {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 12px;

    &--user {
        justify-content: flex-end;
    }
}

.kn-chat-msg__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 2px;
}

.kn-chat-msg__body {
    display: flex;
    flex-direction: column;
    max-width: 85%;
    min-width: 0;

    .kn-chat-msg--user & {
        align-items: flex-end;
    }
}

.kn-chat-msg__bubble {
    padding: 8px 12px;
    border-radius: var(--kn-chatbot-border-radius);
    font-size: 0.875rem;
    line-height: 1.45;
    overflow-wrap: anywhere;
    min-width: 0;
    max-width: 100%;

    .kn-chat-msg--assistant & {
        background: var(--kn-chatbot-assistant-bubble-background-color);
        color: var(--kn-chatbot-assistant-bubble-color);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
        border-top-left-radius: 2px;
    }

    .kn-chat-msg--user & {
        background: var(--kn-chatbot-user-bubble-background-color);
        color: var(--kn-chatbot-user-bubble-color);
        border-top-right-radius: 2px;
    }

    &--error {
        border-left: 3px solid var(--q-negative);
    }
}

.kn-chat-accent {
    color: var(--kn-chatbot-accent-color);
}

.kn-chat-msg__plain {
    white-space: pre-wrap;
}

// ── Markdown ──

.kn-chat-msg__markdown {
    :deep(p) {
        margin: 0 0 6px;
        &:last-child {
            margin-bottom: 0;
        }
    }
    :deep(ul),
    :deep(ol) {
        margin: 4px 0 6px;
        padding-left: 20px;
    }
    :deep(h1),
    :deep(h2),
    :deep(h3) {
        font-size: 0.95rem;
        font-weight: 600;
        line-height: 1.3;
        text-transform: none;
        margin: 4px 0 6px;
    }
    :deep(blockquote) {
        margin: 6px 0;
        padding: 2px 10px;
        border-left: 3px solid rgba(0, 0, 0, 0.15);
        color: rgba(0, 0, 0, 0.6);
    }
    :deep(code) {
        font-size: 0.8rem;
        background: rgba(0, 0, 0, 0.06);
        padding: 1px 4px;
        border-radius: 3px;
    }
    :deep(table) {
        width: 100%;
        border-collapse: collapse;
        margin: 6px 0;
        font-size: 0.8rem;
    }
    :deep(th),
    :deep(td) {
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
        padding: 4px 8px;
        text-align: left;
        vertical-align: top;
    }
    :deep(th) {
        font-weight: 600;
        color: rgba(0, 0, 0, 0.6);
        white-space: nowrap;
    }
}

// ── Steps ──

.kn-chat-steps__running {
    color: rgba(0, 0, 0, 0.6);
    font-size: 0.8rem;
    min-height: 22px;
}

.kn-chat-steps {
    margin-bottom: 6px;
}

.kn-chat-steps__toggle {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 6px 2px 4px;
    border: none;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.05);
    color: rgba(0, 0, 0, 0.6);
    font-size: 0.75rem;
    cursor: pointer;

    &:hover {
        background: rgba(0, 0, 0, 0.09);
    }
}

.kn-chat-steps__list {
    list-style: none;
    margin: 4px 0 0;
    padding: 0 0 0 4px;
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.6);

    li {
        display: flex;
        align-items: center;
        padding: 1px 0;
    }
}

.kn-chat-msg__stopped {
    margin-top: 4px;
    font-size: 0.75rem;
    color: rgba(0, 0, 0, 0.54);
}

// ── Links and meta ──

.kn-chat-msg__links {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 6px;
}

.kn-chat-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: var(--kn-chatbot-border-radius);
    background: #ffffff;
    font-size: 0.85rem;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s ease;

    &:hover {
        border-color: var(--kn-chatbot-accent-color);
    }
}

.kn-chat-link__label {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
}

.kn-chat-link__open {
    color: rgba(0, 0, 0, 0.4);
}

.kn-chat-msg__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 3px;
    padding: 0 2px;
    font-size: 0.7rem;
    color: rgba(0, 0, 0, 0.45);
}

.kn-chat-msg__artifacts {
    display: inline-flex;
    align-items: center;
    padding: 0;
    border: none;
    background: none;
    color: var(--kn-chatbot-accent-color);
    font-size: 0.7rem;
    font-weight: 500;
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }
}

.kn-chat-status-enter-active,
.kn-chat-status-leave-active {
    transition: all 0.25s ease;
}
.kn-chat-status-enter-from {
    transform: translateY(8px);
    opacity: 0;
}
.kn-chat-status-leave-to {
    transform: translateY(-8px);
    opacity: 0;
}

.flex-shrink-0 {
    flex-shrink: 0;
}
</style>
