<template>
    <!-- Minimized pill -->
    <Teleport to="body">
        <Transition name="kn-chatbot-pop">
            <button v-if="minimizedToCard && !poppedOut" type="button" class="kn-chatbot-pill" @click="restoreFromCard">
                <q-icon name="smart_toy" size="18px" class="q-mr-xs" />
                <span class="kn-chatbot-pill__label">{{ selectedBm?.name ?? $t('ai.title') }}</span>
                <q-badge v-if="unreadCount > 0" color="negative" floating>{{ unreadCount }}</q-badge>
            </button>
        </Transition>
    </Teleport>

    <!-- Chat window. In the pop-out it moves to the Picture-in-Picture document. -->
    <Teleport :to="pipBody ?? 'body'">
        <div v-show="poppedOut || (showAlert && !minimizedToCard)" class="kn-chatbot" :class="{ 'kn-chatbot--popped': poppedOut, 'kn-chatbot--mobile': isMobile && !poppedOut }" :style="poppedOut ? undefined : panelStyle">
            <!-- Toolbar -->
            <div class="kn-chatbot__toolbar row no-wrap items-center" :class="{ 'kn-chatbot__toolbar--draggable': !poppedOut && !isMobile }" @mousedown="!poppedOut && startDrag($event)">
                <q-icon name="smart_toy" size="20px" class="q-mr-sm" />
                <span class="kn-chatbot__title col ellipsis">{{ $t('ai.title') }}</span>

                <q-btn v-for="action in toolbarActions" :key="action.icon" flat round dense size="sm" :icon="action.icon" :title="poppedOut ? action.label : undefined" @mousedown.stop @click="action.handler">
                    <q-badge v-if="action.badge" color="negative" floating>{{ action.badge }}</q-badge>
                    <q-tooltip v-if="!poppedOut" :delay="500">{{ action.label }}</q-tooltip>
                </q-btn>
            </div>

            <div class="kn-chatbot__body row no-wrap col">
                <div class="column no-wrap col kn-chatbot__main">
                    <!-- Confirmation (inline, so it also works in the pop-out) -->
                    <div v-if="confirmMode" class="kn-chatbot__overlay">
                        <q-card class="kn-chatbot__confirm">
                            <q-card-section class="row no-wrap items-start q-pb-sm">
                                <q-icon name="warning_amber" color="warning" size="sm" class="q-mr-sm" />
                                <span class="text-body2">{{ confirmMode === 'switchModel' ? $t('ai.modelChangeConfirm') : $t('ai.newConversationConfirm') }}</span>
                            </q-card-section>
                            <q-card-actions align="right">
                                <q-btn flat :label="$t('common.cancel')" @click="cancelPending" />
                                <q-btn unelevated class="kn-chatbot__accent-btn" :label="$t('common.yes')" @click="confirmPending" />
                            </q-card-actions>
                        </q-card>
                    </div>

                    <!-- Session error -->
                    <q-banner v-if="sessionError" dense class="kn-chatbot__banner">
                        <template #avatar><q-icon name="cloud_off" color="negative" /></template>
                        {{ $t('ai.sessionError') }}
                        <template #action>
                            <q-btn flat dense :label="$t('common.retry')" @click="initSession" />
                        </template>
                    </q-banner>

                    <!-- Messages -->
                    <div class="kn-chatbot__messages col">
                        <div v-if="modelsLoaded && businessModels.length === 0" class="kn-chatbot__empty column items-center">
                            <q-icon name="hub" size="2.5rem" color="grey-5" class="q-mb-sm" />
                            <span>{{ $t('ai.noModels') }}</span>
                        </div>
                        <KnChatMessage
                            v-for="message in chat"
                            v-else
                            :key="message.turnId"
                            :message="message"
                            :links="getUrlLinksForMessage(message)"
                            :artifact-count="artifactCountForMessage(message)"
                            :time="formatTime(message.timestamp)"
                            @open-artifacts="openArtifactsForMessage"
                            @navigate="navigateToLink"
                        />
                        <div ref="bottomAnchor"></div>
                    </div>

                    <!-- Composer: the prompt on top; the business model and the send controls in its footer -->
                    <div class="kn-chatbot__input">
                        <div class="kn-chatbot__composer" :class="{ 'kn-chatbot__composer--disabled': inputDisabled }">
                            <q-input ref="messageInput" v-model="userMessage" type="textarea" autogrow borderless dense class="kn-chatbot__prompt" :placeholder="$t('ai.message.placeholder')" :disable="inputDisabled" @keydown.enter="onEnter" />

                            <div class="kn-chatbot__composer-footer row no-wrap items-center">
                                <!-- The icon colour is the session state. -->
                                <q-btn v-if="!poppedOut && businessModels.length > 0" flat dense no-caps class="kn-chatbot__model-btn" :disable="awaitingReply">
                                    <q-icon name="storage" size="16px" class="kn-chatbot__model-icon" :class="`kn-chatbot__model-icon--${sessionState}`" />
                                    <span class="ellipsis q-mx-xs">{{ selectedBm?.name ?? $t('ai.selectModel') }}</span>
                                    <q-icon name="expand_more" size="16px" />
                                    <q-tooltip :delay="500">{{ sessionStateLabel }}</q-tooltip>
                                    <q-menu anchor="top left" self="bottom left" :offset="[0, 4]" class="kn-chatbot-popup">
                                        <q-list dense class="kn-chatbot__model-list">
                                            <q-item-label header>{{ $t('ai.selectModel') }}</q-item-label>
                                            <q-item v-for="bm in businessModels" :key="bm.id" v-close-popup clickable :active="bm.id === selectedBm?.id" @click="requestModelChange(bm)">
                                                <q-item-section>{{ bm.name }}</q-item-section>
                                                <q-item-section v-if="bm.id === selectedBm?.id" side><q-icon name="check" size="16px" /></q-item-section>
                                            </q-item>
                                        </q-list>
                                    </q-menu>
                                </q-btn>
                                <!-- In the pop-out, Quasar menus would open in the main window, so the model is read-only there. -->
                                <span v-else-if="selectedBm" class="kn-chatbot__model-static row no-wrap items-center" :title="`${sessionStateLabel} · ${$t('ai.modelInMainWindow')}`">
                                    <q-icon name="storage" size="16px" class="kn-chatbot__model-icon" :class="`kn-chatbot__model-icon--${sessionState}`" />
                                    <span class="ellipsis q-ml-xs">{{ selectedBm.name }}</span>
                                </span>
                                <q-spinner v-if="sessionLoading" size="14px" color="grey-6" class="q-ml-xs" />

                                <q-space />

                                <q-btn v-if="hasVoice" flat round dense size="sm" :icon="listening ? 'mic_off' : 'mic'" :color="listening ? 'negative' : 'grey-7'" :title="poppedOut ? voiceLabel : undefined" @click="toggleVoice">
                                    <q-tooltip v-if="!poppedOut" :delay="500">{{ voiceLabel }}</q-tooltip>
                                </q-btn>
                                <q-btn v-if="awaitingReply" round dense unelevated size="sm" icon="stop" class="kn-chatbot__accent-btn q-ml-xs" :title="poppedOut ? $t('ai.stop') : undefined" @click="stopReply">
                                    <q-tooltip v-if="!poppedOut" :delay="500">{{ $t('ai.stop') }}</q-tooltip>
                                </q-btn>
                                <q-btn v-else round dense unelevated size="sm" icon="arrow_upward" class="kn-chatbot__accent-btn q-ml-xs" :disable="!userMessage.trim() || !sessionReady" :title="poppedOut ? $t('common.send') : undefined" @click="sendMessage">
                                    <q-tooltip v-if="!poppedOut" :delay="500">{{ $t('common.send') }}</q-tooltip>
                                </q-btn>
                            </div>
                        </div>
                        <div class="kn-chatbot__disclaimer">{{ $t('ai.disclaimer') }}</div>
                    </div>
                </div>

                <KnChatSidePanel
                    v-if="sidePanelVisible"
                    :class="{ 'kn-chatbot__side--mobile': isMobile && !poppedOut }"
                    :items="sideItems"
                    :width="sidePanelWidth"
                    :is-mobile="isMobile && !poppedOut"
                    :popped-out="poppedOut"
                    :target-item-id="artifactNavigationTargetId"
                    :highlighted-item-ids="artifactHighlightedItemIds"
                    @close="sidePanelVisible = false"
                    @start-resize="startSidePanelResize"
                />
            </div>

            <div v-if="!poppedOut && !isMobile" class="kn-chatbot__resize" @mousedown="startResize"></div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useChatbotPanel } from './useChatbotPanel'
import { useAiChat } from './useAiChat'
import { useVoiceInput } from './useVoiceInput'
import { usePopOut } from './usePopOut'
import KnChatMessage from './KnChatMessage.vue'
import KnChatSidePanel from './KnChatSidePanel.vue'

const { t } = useI18n()
const router = useRouter()

const { showAlert, minimizedToCard, isMobile, geometry, panelStyle, startDrag, startResize, closePanel, toggleChatbot: togglePanel, minimizeToCard, restoreFromCard } = useChatbotPanel()

const {
    confirmMode,
    awaitingReply,
    userMessage,
    chat,
    bottomAnchor,
    messageInput,
    sideItems,
    sidePanelVisible,
    sidePanelWidth,
    artifactNavigationTargetId,
    artifactHighlightedItemIds,
    businessModels,
    selectedBm,
    sessionReady,
    sessionLoading,
    sessionError,
    unreadCount,
    formatTime,
    getUrlLinksForMessage,
    artifactCountForMessage,
    artifactTotal,
    openArtifactsForMessage,
    sendMessage,
    stopReply,
    initSession,
    requestNewChat,
    requestModelChange,
    confirmPending,
    cancelPending,
    startSidePanelResize
} = useAiChat(showAlert, minimizedToCard)

const { listening, toggleVoice } = useVoiceInput(userMessage)
const hasVoice = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
const voiceLabel = computed(() => (listening.value ? t('ai.voice.stop') : t('ai.voice.start')))

const { supported: popOutSupported, poppedOut, pipBody, open: openPopOut, close: closePopOut } = usePopOut()

// "No models" is shown only after the list was loaded, not while it loads.
const modelsLoaded = ref(false)
onMounted(() => setTimeout(() => (modelsLoaded.value = true), 1500))
watch(businessModels, () => (modelsLoaded.value = true))

const sessionState = computed(() => {
    if (sessionLoading.value) return 'loading'
    if (sessionReady.value) return 'ready'
    return 'offline'
})
const inputDisabled = computed(() => !sessionReady.value || sessionLoading.value)

// Enter sends, Shift+Enter adds a line. Enter while an IME composes text belongs to the IME.
function onEnter(event: KeyboardEvent) {
    if (event.shiftKey || event.isComposing) return
    event.preventDefault()
    sendMessage()
}

const sessionStateLabel = computed(() => (sessionReady.value ? t('ai.sessionReady') : sessionLoading.value ? t('ai.sessionLoading') : t('ai.sessionOffline')))

// ── Toolbar ───────────────────────────────────────────────

async function popOut() {
    const g = geometry.value
    await openPopOut(Math.max(g.width, 420), Math.max(g.height, 560))
}

function closeChat() {
    if (poppedOut.value) closePopOut()
    closePanel()
}

const toolbarActions = computed(() => {
    const actions: { icon: string; label: string; handler: () => void; badge?: number }[] = [
        { icon: 'add_comment', label: t('ai.newChat'), handler: requestNewChat },
        { icon: 'inventory_2', label: t('ai.sidePanel.toggle'), handler: () => (sidePanelVisible.value = !sidePanelVisible.value), badge: artifactTotal.value || undefined }
    ]
    if (poppedOut.value) {
        actions.push({ icon: 'close_fullscreen', label: t('ai.popIn'), handler: closePopOut })
    } else {
        if (popOutSupported && !isMobile.value) actions.push({ icon: 'picture_in_picture_alt', label: t('ai.popOut'), handler: popOut })
        actions.push({ icon: 'remove', label: t('common.minimize'), handler: minimizeToCard })
    }
    actions.push({ icon: 'close', label: t('common.close'), handler: closeChat })
    return actions
})

// The menu entry brings a popped-out chat back to the page.
function toggleChatbot() {
    if (poppedOut.value) {
        closePopOut()
        showAlert.value = true
        return
    }
    togglePanel()
}

// The pop-out replaces the in-page window. Closing the pop-out brings the chat back where it was.
watch(poppedOut, (value) => {
    if (value) {
        minimizedToCard.value = false
        showAlert.value = true
    }
})

defineExpose({ toggleChatbot })

// Links from the AI server are absolute URLs. The router works with paths relative to the app base (/knowage-vue).
function navigateToLink(url: string) {
    const base = String(import.meta.env.VITE_PUBLIC_PATH ?? '').replace(/\/$/, '')
    try {
        const parsed = new URL(url)
        const path = base && parsed.pathname.startsWith(base + '/') ? parsed.pathname.slice(base.length) : parsed.pathname
        router.push(path + parsed.search + parsed.hash)
    } catch {
        router.push(url)
    }
}
</script>

<style scoped lang="scss">
.kn-chatbot {
    position: fixed;
    z-index: 9000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--kn-chatbot-background-color);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: var(--kn-chatbot-border-radius);
    box-shadow:
        0 8px 10px 1px rgba(0, 0, 0, 0.14),
        0 3px 14px 2px rgba(0, 0, 0, 0.12),
        0 5px 5px -3px rgba(0, 0, 0, 0.2);
    font-family: var(--kn-font-family);

    &--popped {
        position: static;
        width: 100vw;
        height: 100vh;
        border: none;
        border-radius: 0;
        box-shadow: none;
    }

    &--mobile {
        border: none;
    }
}

// ── Toolbar and model bar ──

.kn-chatbot__toolbar {
    min-height: 40px;
    padding: 0 6px 0 12px;
    background: var(--kn-chatbot-header-background-color);
    color: var(--kn-chatbot-header-color);
    flex-shrink: 0;
    user-select: none;

    &--draggable {
        cursor: grab;
        &:active {
            cursor: grabbing;
        }
    }
}

.kn-chatbot__title {
    font-size: var(--kn-toolbar-font-size, 1rem);
    font-weight: 400;
}

// ── Body ──

.kn-chatbot__body {
    position: relative;
    min-height: 0;
}

.kn-chatbot__main {
    position: relative;
    min-width: 0;
}

.kn-chatbot__messages {
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px;
    min-height: 0;
}

.kn-chatbot__empty {
    padding: 40px 24px;
    text-align: center;
    font-size: 0.85rem;
    color: rgba(0, 0, 0, 0.54);
}

.kn-chatbot__banner {
    background: #ffffff;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    font-size: 0.8rem;
}

.kn-chatbot__overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(255, 255, 255, 0.75);
}

.kn-chatbot__confirm {
    width: 100%;
    max-width: 360px;
}

.kn-chatbot__accent-btn {
    background: var(--kn-chatbot-accent-color);
    color: #ffffff;
}

// ── Composer ──

.kn-chatbot__input {
    padding: 8px 12px 6px;
    flex-shrink: 0;
}

.kn-chatbot__composer {
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.24);
    border-radius: var(--kn-chatbot-border-radius);
    transition: border-color 0.15s ease;

    &:focus-within {
        border-color: var(--kn-chatbot-accent-color);
    }

    &--disabled {
        background: #fafafa;
    }
}

// Quasar gives a dense textarea a 36px minimum and extra top padding; the doubled class outranks its selector.
.kn-chatbot__prompt.q-textarea {
    padding: 0 12px;
    font-size: 0.875rem;

    :deep(.q-field__control),
    :deep(.q-field__control-container) {
        min-height: 0;
        padding: 0;
    }

    :deep(.q-field__native) {
        min-height: 0;
        max-height: 160px;
        padding: 6px 0;
        line-height: 1.4;
        resize: none;
        overflow-y: auto;
    }
}

// The divider spans the whole composer, so the footer carries its own padding.
.kn-chatbot__composer-footer {
    min-height: 34px;
    padding: 2px 6px;
    gap: 2px;
    border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.kn-chatbot__model-btn {
    max-width: 60%;
    padding: 0 6px;
    color: rgba(0, 0, 0, 0.7);
    font-size: 0.875rem;
    font-weight: 400;
}

.kn-chatbot__model-static {
    max-width: 60%;
    padding: 0 6px;
    color: rgba(0, 0, 0, 0.7);
    font-size: 0.875rem;
}

.kn-chatbot__model-icon {
    color: #9e9e9e;

    &--ready {
        color: var(--q-positive);
    }
    &--loading {
        color: var(--q-warning);
    }
}

.kn-chatbot__disclaimer {
    margin-top: 4px;
    text-align: center;
    font-size: 0.65rem;
    color: rgba(0, 0, 0, 0.45);
}

// On a phone the artifacts cover the chat instead of squeezing it.
.kn-chatbot__side--mobile {
    position: absolute;
    inset: 0;
    z-index: 5;
    width: 100% !important;
    max-width: none;
    border-left: none;
}

.kn-chatbot__resize {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 16px;
    height: 16px;
    cursor: se-resize;
    z-index: 6;

    &::after {
        content: '';
        position: absolute;
        right: 4px;
        bottom: 4px;
        width: 7px;
        height: 7px;
        border-right: 2px solid rgba(0, 0, 0, 0.3);
        border-bottom: 2px solid rgba(0, 0, 0, 0.3);
    }
}

// ── Minimized pill ──

.kn-chatbot-pill {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 9000;
    display: flex;
    align-items: center;
    max-width: 240px;
    padding: 8px 16px 8px 12px;
    border: none;
    border-radius: 20px;
    background: var(--kn-chatbot-header-background-color);
    color: var(--kn-chatbot-header-color);
    box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14);
    font-size: 0.85rem;
    cursor: pointer;
    transition: transform 0.15s ease;

    &:hover {
        transform: translateY(-2px);
    }
}

.kn-chatbot-pill__label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.kn-chatbot-pop-enter-active,
.kn-chatbot-pop-leave-active {
    transition: all 0.2s ease;
}
.kn-chatbot-pop-enter-from,
.kn-chatbot-pop-leave-to {
    transform: scale(0.8) translateY(12px);
    opacity: 0;
}
</style>

<style lang="scss">
// The select popup is teleported to <body>, so it needs a global rule to open above the chat.
.kn-chatbot-popup {
    z-index: 9500 !important;
}

.kn-chatbot__model-list {
    min-width: 200px;
}
</style>
