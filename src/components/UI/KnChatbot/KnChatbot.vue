<template>
    <div v-if="showAlert" class="kn-chatbot column shadow-4 bg-white" :style="panelStyle">
        <q-card-section class="q-pa-none">
            <q-toolbar class="bg-primary text-white kn-chatbot-toolbar" :class="minimized ? 'kn-chatbot-toolbar--minimized' : ''" @mousedown="startDrag">
                <q-icon class="q-mr-sm" name="smart_toy" size="sm" />
                <q-toolbar-title class="kn-chatbot-toolbar-title">
                    <div class="kn-chatbot-toolbar-main">{{ $t('ai.title') }}</div>
                    <div v-if="!minimized" class="kn-chatbot-toolbar-sub"><span class="kn-chatbot-toolbar-dot"></span>{{ todayDate }}</div>
                </q-toolbar-title>
                <q-btn flat round dense :icon="minimized ? 'unfold_more' : 'remove'" @click.stop="minimized = !minimized">
                    <q-tooltip :delay="500" anchor="center left" self="center right">{{ minimized ? $t('common.expand') : $t('common.minimize') }}</q-tooltip>
                </q-btn>
                <q-btn flat round dense icon="close" @click.stop="showAlert = false">
                    <q-tooltip :delay="500" anchor="center left" self="center right">{{ $t('common.close') }}</q-tooltip>
                </q-btn>
            </q-toolbar>
        </q-card-section>

        <div v-if="!minimized" class="column col">
            <div v-if="confirm" class="kn-chatbot-confirm-overlay">
                <q-card class="kn-chatbot-confirm-card">
                    <q-card-section class="row items-center">
                        <span class="q-ml-sm">{{ $t('ai.newConversationConfirm') }}</span>
                    </q-card-section>
                    <q-card-actions align="right">
                        <q-btn flat :label="$t('common.cancel')" color="primary" @click="confirm = false" />
                        <q-btn flat :label="$t('common.yes')" color="primary" @click="confirmNewChat" />
                    </q-card-actions>
                </q-card>
            </div>
            <div ref="chatContainer" class="kn-chatbot-messages col q-px-sm q-pt-sm" style="overflow-y: auto; overflow-x: hidden">
                <div v-for="message in chat" class="q-mr-md relative-position">
                    <q-chat-message :name="message.role === 'assistant' ? 'AI' : 'user'" :avatar="message.role === 'assistant' ? avatarImg : undefined" :sent="message.role === 'user'">
                        <vue-markdown-it :source="message.content"></vue-markdown-it>
                    </q-chat-message>

                    <q-chip v-if="message.url" clickable class="dashboard-link" size="sm" color="accent" text-color="white" icon="open_in_new" @click="followLink(message.url)"> {{ $t('ai.dashboardLink') }} </q-chip>
                    <div v-if="message.timestamp" class="text-caption kn-chatbot-timestamp" :class="message.role === 'user' ? 'text-right q-pr-xs' : 'text-left q-pl-xs'">{{ formatTime(message.timestamp) }}</div>
                </div>

                <q-chat-message v-if="awaitingReply" name="AI" :avatar="avatarImg">
                    <q-spinner-dots size="2rem" />
                </q-chat-message>

                <div ref="bottomAnchor"></div>
            </div>
            <div class="kn-chatbot-input-area q-pa-sm">
                <q-input outlined :placeholder="$t('ai.message.placeholder')" v-model.trim="userMessage" @keyup.enter="sendMessage">
                    <template #prepend>
                        <q-btn flat round dense icon="queue" color="primary" @click="confirm = true">
                            <q-tooltip :delay="500" anchor="top middle" self="bottom middle">{{ $t('common.new', { name: $t('common.conversation') }) }}</q-tooltip>
                        </q-btn>
                    </template>
                    <template #append>
                        <q-btn flat round dense :color="listening ? 'negative' : 'primary'" :icon="listening ? 'mic_off' : 'mic'" @click="toggleVoice" class="q-mr-sm">
                            <q-tooltip :delay="500" anchor="top middle" self="bottom middle">{{ listening ? $t('ai.voice.stop') : $t('ai.voice.start') }}</q-tooltip>
                        </q-btn>
                        <q-btn color="primary" icon="send" @click="sendMessage">
                            <q-tooltip :delay="500" anchor="top middle" self="bottom middle">{{ $t('common.send') }}</q-tooltip>
                        </q-btn>
                    </template>
                </q-input>
                <span class="text-caption q-mt-xs block" style="font-size: 0.7rem">{{ $t('ai.disclaimer') }}</span>
            </div>
        </div>
        <div v-if="!minimized" class="kn-chatbot-resize-handle" @mousedown="startResize"></div>
    </div>

    <q-btn flat square class="q-py-md" color="accent" :icon="'smart_toy'" @click="toggleChatbot">
        <q-tooltip :delay="500" anchor="center right" self="center left">{{ $t('AI assistant') }}</q-tooltip>
    </q-btn>
</template>

<script setup lang="ts">
import mainStore from '@/App.store'
import axios from 'axios'
import { computed, nextTick, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IChat } from './KnChatbot'
import avatarImg from '@/assets/images/chatbot/chatty.webp'
import { useI18n } from 'vue-i18n'
import { VueMarkdownIt } from '@f3ve/vue-markdown-it'

const router = useRouter()
const store = mainStore()
let dashStore = null as any

const { t } = useI18n()

const confirm = ref(false)
const turnId = ref(0)
const showAlert = ref(false)
const awaitingReply = ref(false)
const userMessage = ref('')
const chat = ref<IChat[]>([
    {
        role: 'assistant',
        content: t('ai.welcomeMessage'),
        turnId: 0,
        timestamp: new Date()
    }
]) as any
const bottomAnchor = ref(null)
const body = reactive({
    conversationId: crypto.randomUUID()
} as any)

const minimized = ref(false)
// panel is 60vw x 60vh → center it: offset = (100% - 60%) / 2 = 20%
const posX = ref(Math.round(window.innerWidth * 0.2))
const posY = ref(Math.round(window.innerHeight * 0.2))
const panelWidth = ref(Math.round(window.innerWidth * 0.6))
const panelHeight = ref(Math.round(window.innerHeight * 0.6))

const todayDate = computed(() => new Date().toLocaleDateString(navigator.language || 'it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
let dragOffsetX = 0
let dragOffsetY = 0
let resizeStartX = 0
let resizeStartY = 0
let resizeStartW = 0
let resizeStartH = 0

const panelStyle = computed(() => {
    if (minimized.value) {
        return {
            left: posX.value + 'px',
            bottom: '0px',
            top: 'auto',
            height: 'auto',
            minHeight: 'unset',
            width: panelWidth.value + 'px'
        } as Record<string, string>
    }
    return {
        left: posX.value + 'px',
        top: posY.value + 'px',
        width: panelWidth.value + 'px',
        height: panelHeight.value + 'px'
    } as Record<string, string>
})

function startDrag(e: MouseEvent) {
    dragOffsetX = e.clientX - posX.value
    dragOffsetY = e.clientY - posY.value
    document.addEventListener('mousemove', onDragMove)
    document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
    posX.value = e.clientX - dragOffsetX
    posY.value = e.clientY - dragOffsetY
}

function onDragEnd() {
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)
}

function startResize(e: MouseEvent) {
    e.stopPropagation()
    resizeStartX = e.clientX
    resizeStartY = e.clientY
    resizeStartW = panelWidth.value
    resizeStartH = panelHeight.value
    document.addEventListener('mousemove', onResizeMove)
    document.addEventListener('mouseup', onResizeEnd)
}

function onResizeMove(e: MouseEvent) {
    const newW = resizeStartW + (e.clientX - resizeStartX)
    const newH = resizeStartH + (e.clientY - resizeStartY)
    panelWidth.value = Math.max(400, newW)
    panelHeight.value = Math.max(300, newH)
}

function onResizeEnd() {
    document.removeEventListener('mousemove', onResizeMove)
    document.removeEventListener('mouseup', onResizeEnd)
}

onUnmounted(() => {
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)
    document.removeEventListener('mousemove', onResizeMove)
    document.removeEventListener('mouseup', onResizeEnd)
})

watch(showAlert, (val) => {
    if (val) {
        scrollToBottom()
    }
})

function newChat() {
    chat.value = [
        {
            role: 'assistant',
            content: t('ai.welcomeMessage'),
            turnId: 0,
            timestamp: new Date()
        }
    ]
    turnId.value = 0
    body.conversationId = crypto.randomUUID()
}

function confirmNewChat() {
    confirm.value = false
    newChat()
}

function toggleChatbot() {
    showAlert.value = !showAlert.value
    if (showAlert.value) minimized.value = false
}

function followLink(url) {
    router.push(url)
}

function formatTime(date?: Date): string {
    if (!date) return ''
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const listening = ref(false)
let recognition: any = null

function toggleVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    if (listening.value) {
        recognition?.stop()
        listening.value = false
        return
    }

    recognition = new SpeechRecognition()
    recognition.lang = navigator.language || 'it-IT'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        userMessage.value = userMessage.value ? userMessage.value + ' ' + transcript : transcript
    }
    recognition.onerror = () => {
        listening.value = false
    }
    recognition.onend = () => {
        listening.value = false
    }

    recognition.start()
    listening.value = true
}

async function sendMessage() {
    if (userMessage.value === '') return
    awaitingReply.value = true
    const newMessage: IChat = {
        role: 'user',
        content: userMessage.value,
        turnId: turnId.value++,
        timestamp: new Date()
    }
    ;((body.tenant = store.user.organization), (body.token = localStorage.getItem('token')), (body.role = store.user.defaultRole || store.user.roles[0]), (body.pathQuestion = router.currentRoute.value.path), (body.promptUser = userMessage.value), (body.conversationHistory = chat.value), (body.timestamp = new Date().toISOString()))

    body.dashboard = null
    body.drivers = null

    if (['dashboard', 'dashboard-execution'].includes(String(router.currentRoute.value?.name)) || router.currentRoute.value?.params?.mode === 'dashboard') {
        if (!dashStore) {
            const dashboardStoreModule = await import('@/modules/documentExecution/dashboard/Dashboard.store')
            dashStore = dashboardStoreModule.default()
        }

        const dashboardId = Array.isArray(router.currentRoute.value?.params?.id) ? router.currentRoute.value?.params?.id[0] : router.currentRoute.value?.params?.id

        // Try to get dashboard by ID first, then by label as fallback
        let currentDashboard: any = dashStore.getDashboard(dashboardId)
        if (!currentDashboard) {
            currentDashboard = dashStore.getDashboardFromLabel(dashboardId)
        }

        if (currentDashboard?.configuration?.aiSettings) {
            body.dashboard = currentDashboard.configuration.aiSettings
        }
        if (currentDashboard?.drivers) {
            body.drivers = currentDashboard.drivers
        }
    }
    chat.value.push(newMessage)

    if (store.configurations['KNOWAGE.AI.URL'] === 'demo') sendToDemo()
    else sendToAI()

    userMessage.value = ''
}

function sendToDemo() {
    scrollToBottom()
    setTimeout(() => {
        chat.value.push({
            role: 'assistant',
            content: 'This is a demo response. In a real scenario, the AI would process your request.',
            turnId: 1,
            url: '/dashboard/DASHBOARD_AIRBNB?organization=demo&toolbar=true&menu=true&role=/demo/admin',
            timestamp: new Date()
        })
        awaitingReply.value = false
        scrollToBottom()
    }, 2000)
}

function scrollToBottom() {
    nextTick(() => {
        bottomAnchor.value?.scrollIntoView({ behavior: 'smooth' })
    })
}

async function sendToAI() {
    if (store.licenses?.engGptIntegration) {
        let count = Number(localStorage.getItem('chatMessageCount')) || 0
        if (count >= store.licenses.engGptIntegration) {
            chat.value.push({
                role: 'assistant',
                content: t('ai.message.limitReached', { limit: store.licenses.engGptIntegration }),
                turnId: chat.value[chat.value.length - 1].turnId,
                timestamp: new Date()
            })
            awaitingReply.value = false
            return
        }
        count++
        localStorage.setItem('chatMessageCount', count)
    }

    scrollToBottom()
    axios
        .post(store.configurations['KNOWAGE.AI.URL'] + '/bot-response', body)
        .then((response) => {
            if (response.data) {
                let tempResponse: IChat = {
                    role: 'assistant',
                    content: response.data.response,
                    turnId: chat.value[chat.value.length - 1].turnId + 1,
                    timestamp: new Date()
                }
                if (response.data.urlDashboard) {
                    tempResponse.url = response.data.urlDashboard
                }
                chat.value.push(tempResponse)
            } else {
                chat.value.push({
                    role: 'assistant',
                    content: 'Sorry, I cannot help you with that.',
                    turnId: chat.value[chat.value.length - 1].turnId + 1,
                    timestamp: new Date()
                })
            }
            console.log(response.data)
        })
        .catch((error) => {
            chat.value.push({
                role: 'assistant',
                content: 'Sorry, I cannot help you with that.',
                turnId: chat.value[chat.value.length - 1].turnId + 1,
                timestamp: new Date()
            })
        })
        .finally(() => {
            awaitingReply.value = false
            scrollToBottom()
        })
}
</script>

<style lang="scss">
.kn-chatbot {
    position: fixed;
    z-index: 1500;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 10px;
    overflow: visible;
    min-height: 300px;
    min-width: 400px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18) !important;

    // clip inner content to rounded corners without clipping the resize handle
    & > *:not(.kn-chatbot-resize-handle) {
        overflow: hidden;
    }
    & > *:first-child {
        border-radius: 10px 10px 0 0;
        overflow: hidden;
    }
    & > *:nth-last-child(2) {
        border-radius: 0 0 10px 10px;
        overflow: hidden;
    }

    .kn-chatbot-resize-handle {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 18px;
        height: 18px;
        cursor: se-resize;
        z-index: 5;
        &::after {
            content: '';
            position: absolute;
            bottom: 4px;
            right: 4px;
            width: 8px;
            height: 8px;
            border-right: 2px solid rgba(0, 0, 0, 0.3);
            border-bottom: 2px solid rgba(0, 0, 0, 0.3);
            border-radius: 1px;
        }
    }

    .kn-chatbot-toolbar {
        cursor: move;
        user-select: none;
        border-radius: 0;
        min-height: 56px;
        align-items: center;

        &.kn-chatbot-toolbar--minimized {
            min-height: 36px;
            padding-top: 0;
            padding-bottom: 0;
        }
    }

    .kn-chatbot-toolbar-title {
        line-height: 1.2;
        padding: 6px 0;
    }

    .kn-chatbot-toolbar-main {
        font-size: 0.95rem;
        font-weight: 600;
        letter-spacing: 0.01em;
    }

    .kn-chatbot-toolbar-sub {
        font-size: 0.7rem;
        opacity: 0.8;
        font-weight: 400;
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 1px;
        text-transform: capitalize;
    }

    .kn-chatbot-toolbar-dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #69f0ae;
        flex-shrink: 0;
        box-shadow: 0 0 4px #69f0ae;
    }

    // ── Chat scroll area ──────────────────────────────────────
    .kn-chatbot-messages {
        background-color: #f4f6f9;

        &::-webkit-scrollbar {
            width: 4px;
        }
        &::-webkit-scrollbar-track {
            background: transparent;
        }
        &::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.18);
            border-radius: 4px;
        }
    }

    // ── Message bubbles ───────────────────────────────────────
    .q-message {
        margin-bottom: 2px;
    }

    .q-message-name {
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        opacity: 0.55;
        margin-bottom: 2px;
    }

    .q-message-avatar {
        border-radius: 50%;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
    }

    .q-message-text {
        border-radius: 14px !important;
        padding: 10px 14px !important;
        line-height: 1.55;
        font-size: 0.875rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);

        p {
            margin: 0 0 6px;
            &:last-child {
                margin-bottom: 0;
            }
        }
        ul,
        ol {
            padding-left: 1.2em;
            margin: 4px 0;
        }
        code {
            background: rgba(0, 0, 0, 0.08);
            border-radius: 4px;
            padding: 1px 5px;
            font-size: 0.82em;
            font-family: 'Fira Mono', 'Consolas', monospace;
        }
        pre {
            background: rgba(0, 0, 0, 0.06);
            border-radius: 6px;
            padding: 10px 14px;
            overflow-x: auto;
            font-size: 0.82em;
            margin: 6px 0 0;
        }
    }

    .q-message-text--received {
        background-color: #ffffff !important;
        color: #1a2332 !important;
        border-radius: 4px 14px 14px 14px !important;
        border-left: 3px solid var(--q-primary);

        &::before,
        &::after {
            display: none;
        }
    }

    .q-message-text--sent {
        background: linear-gradient(135deg, var(--q-primary), color-mix(in srgb, var(--q-primary) 80%, #000)) !important;
        color: #ffffff !important;
        border-radius: 14px 4px 14px 14px !important;

        &,
        & * {
            color: #ffffff !important;
        }

        code,
        pre {
            background: rgba(255, 255, 255, 0.15) !important;
        }

        &::before,
        &::after {
            display: none;
        }
    }

    // ── Dashboard chip ────────────────────────────────────────
    .dashboard-link {
        position: absolute;
        left: 50px;
        bottom: -25px;
    }

    // ── Timestamp ─────────────────────────────────────────────
    .kn-chatbot-timestamp {
        font-size: 0.68rem;
        opacity: 0.5;
        margin-top: -2px;
        margin-bottom: 12px;
        letter-spacing: 0.02em;
    }

    // ── Input area ────────────────────────────────────────────
    .kn-chatbot-input-area {
        background: #ffffff;
        border-top: 1px solid rgba(0, 0, 0, 0.08);

        .q-field__control {
            border-radius: 8px;
        }
    }

    // ── Confirm overlay ───────────────────────────────────────
    .kn-chatbot-confirm-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        border-radius: inherit;
        backdrop-filter: blur(2px);

        .kn-chatbot-confirm-card {
            min-width: 280px;
            border-radius: 10px;
        }
    }
}
</style>
