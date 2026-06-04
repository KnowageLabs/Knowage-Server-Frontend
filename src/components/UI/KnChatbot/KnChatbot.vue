<template>
    <!-- ── Minimized-to-card pill ─────────────────────────────────────────── -->
    <Teleport to="body">
        <Transition name="kn-card-pop">
            <div v-if="minimizedToCard" class="kn-chatbot-pill" @click="restoreFromCard">
                <q-icon name="smart_toy" size="xs" color="white" class="q-mr-xs" />
                <span class="kn-chatbot-pill-label">{{ selectedBm?.name ?? $t('ai.title') }}</span>
                <q-badge v-if="unreadCount > 0" color="red" floating class="kn-chatbot-pill-badge">{{ unreadCount }}</q-badge>
            </div>
        </Transition>
    </Teleport>

    <!-- ── Main panel ─────────────────────────────────────────────────────── -->
    <div v-show="showAlert && !minimizedToCard" class="kn-chatbot shadow-4" :style="panelStyle">

        <!-- Toolbar -->
        <div class="kn-chatbot-toolbar" @mousedown="startDrag">
            <q-icon name="smart_toy" size="sm" color="white" class="q-mr-sm flex-shrink-0" />
            <div class="col column kn-overflow-hidden q-mr-sm">
                <div class="kn-chatbot-toolbar-main">{{ $t('ai.title') }}</div>
                <div v-if="!minimized && selectedBm" class="kn-chatbot-toolbar-sub">
                    <span class="kn-chatbot-toolbar-dot"></span>{{ selectedBm.name }}
                </div>
            </div>

            <!-- Session loading indicator -->
            <q-spinner-dots v-if="sessionLoading" size="xs" color="white" class="q-mr-sm" />

            <!-- New conversation -->
            <q-btn flat round dense icon="add_comment" color="white" size="sm" class="q-mr-xs" @mousedown.stop @click="confirm = true">
                <q-tooltip :delay="500">{{ $t('ai.newChat') }}</q-tooltip>
            </q-btn>

            <!-- Settings popover button -->
            <q-btn flat round dense icon="settings" color="white" size="sm" class="q-mr-xs" @mousedown.stop>
                <q-tooltip :delay="500">{{ $t('ai.sessionSettings') }}</q-tooltip>
                <q-menu anchor="bottom middle" self="top middle" :offset="[0, 4]" class="kn-chatbot-menu">
                    <q-card flat class="kn-settings-card">
                        <q-card-section class="q-pa-md">
                            <div class="text-subtitle2 text-weight-bold q-mb-sm" style="color: #4f46e5">{{ $t('ai.sessionSettings') }}</div>
                            <q-select
                                v-model="selectedBm"
                                :options="businessModels"
                                :option-label="(bm) => bm?.name ?? ''"
                                :label="$t('ai.selectModel')"
                                dense
                                outlined
                                class="q-mb-sm kn-bm-select"
                                :popup-content-style="{ zIndex: 9700 }"
                                @update:model-value="onBmChange"
                            />
                            <q-btn
                                unelevated
                                color="primary"
                                :label="$t('ai.startSession')"
                                :loading="sessionLoading"
                                :disable="!selectedBm"
                                size="sm"
                                class="full-width kn-settings-start-btn"
                                v-close-popup
                                @click="onStartSession"
                            />
                        </q-card-section>
                    </q-card>
                </q-menu>
            </q-btn>

            <!-- Side panel toggle -->
            <q-btn flat round dense icon="analytics" :color="sidePanelVisible ? 'yellow-3' : 'white'" size="sm" class="q-mr-xs" @mousedown.stop @click="sidePanelVisible = !sidePanelVisible">
                <q-badge v-if="sideItems.length > 0" color="red" floating>{{ sideItems.length }}</q-badge>
                <q-tooltip :delay="500">{{ $t('ai.sidePanel.toggle') }}</q-tooltip>
            </q-btn>

            <!-- Minimize to card -->
            <q-btn flat round dense icon="remove" color="white" size="sm" class="q-mr-xs" @mousedown.stop @click="minimizeToCard">
                <q-tooltip :delay="500">{{ $t('common.minimize') }}</q-tooltip>
            </q-btn>

            <!-- Close -->
            <q-btn flat round dense icon="close" color="white" size="sm" @mousedown.stop @click="closePanel">
                <q-tooltip :delay="500">{{ $t('common.close') }}</q-tooltip>
            </q-btn>
        </div>

        <!-- Body: chat + optional side panel -->
        <div v-if="!minimized" class="kn-chatbot-body col row">

            <!-- New conversation confirm overlay -->
            <div v-if="confirm" class="kn-chatbot-confirm-overlay">
                <q-card class="kn-chatbot-confirm-card shadow-6">
                    <q-card-section class="row items-center q-pb-none">
                        <q-icon name="warning_amber" color="orange-6" size="sm" class="q-mr-sm" />
                        <span class="text-body2">{{ $t('ai.newConversationConfirm') }}</span>
                    </q-card-section>
                    <q-card-actions align="right" class="q-pt-sm">
                        <q-btn flat :label="$t('common.cancel')" color="grey-7" size="sm" @click="confirm = false" />
                        <q-btn unelevated :label="$t('common.yes')" color="primary" size="sm" @click="confirmNewChat" />
                    </q-card-actions>
                </q-card>
            </div>

            <!-- Messages column -->
            <div class="col column kn-overflow-hidden">
                <!-- Session loading banner -->
                <div v-if="sessionLoading" class="kn-session-banner row items-center q-px-md q-py-xs">
                    <q-spinner-dots size="xs" color="primary" class="q-mr-sm" />
                    <span class="text-caption">{{ $t('ai.sessionLoading') }}</span>
                </div>

                <div ref="chatContainer" class="kn-chatbot-messages col q-px-sm q-pt-sm" style="overflow-y: auto; overflow-x: hidden">
                    <div v-for="message in chat" :key="message.turnId" class="q-mr-md relative-position">
                        <q-chat-message
                            :name="message.role === 'assistant' ? 'AI' : $t('common.user')"
                            :avatar="message.role === 'assistant' ? avatarImg : undefined"
                            :sent="message.role === 'user'"
                            :bg-color="message.isError ? 'red-1' : undefined"
                        >
                            <div v-if="message.isLive && message.content === ''" class="row items-center">
                                <q-spinner-dots size="1.5rem" color="primary" />
                            </div>
                            <vue-markdown-it v-else :source="message.content"></vue-markdown-it>
                        </q-chat-message>

                        <q-chip v-if="message.url" clickable class="kn-dashboard-link" size="sm" color="accent" text-color="white" icon="open_in_new" @click="followLink(message.url)">
                            {{ $t('ai.dashboardLink') }}
                        </q-chip>
                        <div v-if="message.timestamp" class="text-caption kn-chatbot-timestamp" :class="message.role === 'user' ? 'text-right q-pr-xs' : 'text-left q-pl-xs'">
                            {{ formatTime(message.timestamp) }}
                        </div>
                    </div>

                    <div ref="bottomAnchor"></div>
                </div>

                <!-- Input area -->
                <div class="kn-chatbot-input-area q-pa-sm">
                    <q-input
                        ref="messageInput"
                        outlined
                        dense
                        :placeholder="$t('ai.message.placeholder')"
                        v-model.trim="userMessage"
                        :disable="awaitingReply || sessionLoading || !sessionReady"
                        @keyup.enter="sendMessage"
                    >
                        <template #append>
                            <q-btn flat round dense :color="listening ? 'negative' : 'primary'" :icon="listening ? 'mic_off' : 'mic'" size="sm" @click="toggleVoice" class="q-mr-xs">
                                <q-tooltip :delay="500" anchor="top middle" self="bottom middle">{{ listening ? $t('ai.voice.stop') : $t('ai.voice.start') }}</q-tooltip>
                            </q-btn>
                            <q-btn color="primary" icon="send" size="sm" :loading="awaitingReply" :disable="!userMessage || !sessionReady" @click="sendMessage">
                                <q-tooltip :delay="500" anchor="top middle" self="bottom middle">{{ $t('common.send') }}</q-tooltip>
                            </q-btn>
                        </template>
                    </q-input>
                    <span class="text-caption q-mt-xs block kn-disclaimer">{{ $t('ai.disclaimer') }}</span>
                </div>
            </div>

            <!-- Side panel (slide in) -->
            <Transition name="kn-slide-right">
                <KnChatSidePanel v-if="sidePanelVisible" :items="sideItems" class="kn-side-panel-slot" @close="sidePanelVisible = false" />
            </Transition>
        </div>

        <!-- Resize handle -->
        <div v-if="!minimized && !isMobile" class="kn-chatbot-resize-handle" @mousedown="startResize"></div>
    </div>

    <!-- Toggle button (in the sidebar/menu) -->
    <q-btn flat square class="q-py-md" color="accent" icon="smart_toy" @click="toggleChatbot">
        <q-tooltip :delay="500" anchor="center right" self="center left">{{ $t('ai.title') }}</q-tooltip>
    </q-btn>
</template>

<script setup lang="ts">
import avatarImg from '@/assets/images/chatbot/chatty.webp'
import { VueMarkdownIt } from '@f3ve/vue-markdown-it'
import { useChatbotPanel } from './useChatbotPanel'
import { useAiChat } from './useAiChat'
import { useVoiceInput } from './useVoiceInput'
import KnChatSidePanel from './KnChatSidePanel.vue'

const { showAlert, minimized, minimizedToCard, isMobile, panelStyle, startDrag, startResize, closePanel, toggleChatbot, minimizeToCard, restoreFromCard } = useChatbotPanel()

const {
    confirm,
    awaitingReply,
    userMessage,
    chat,
    bottomAnchor,
    chatContainer,
    messageInput,
    sideItems,
    sidePanelVisible,
    businessModels,
    selectedBm,
    sessionReady,
    sessionLoading,
    unreadCount,
    confirmNewChat,
    followLink,
    formatTime,
    sendMessage,
    initSession,
    newChat
} = useAiChat(showAlert, minimized, minimizedToCard)

const { listening, toggleVoice } = useVoiceInput(userMessage)

function onBmChange() {
    // BM changed via dropdown — will be confirmed via Start Session button
}

function onStartSession() {
    confirm.value = true
}
</script>

<style scoped lang="scss">
// ── Main floating panel ────────────────────────────────────────────────────

.kn-chatbot {
    position: fixed;
    z-index: 9000;
    border-radius: 14px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border: 1px solid rgba(79, 70, 229, 0.18);
}

// ── Toolbar ────────────────────────────────────────────────────────────────

.kn-chatbot-toolbar {
    display: flex;
    align-items: center;
    padding: 6px 8px 6px 12px;
    min-height: 48px;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    cursor: grab;
    flex-shrink: 0;
    user-select: none;

    &:active { cursor: grabbing; }
}

.kn-chatbot-toolbar-main {
    font-size: 0.85rem;
    font-weight: 600;
    color: white;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.kn-chatbot-toolbar-sub {
    font-size: 0.68rem;
    color: rgba(255, 255, 255, 0.75);
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.kn-chatbot-toolbar-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #4ade80;
    display: inline-block;
    flex-shrink: 0;
    box-shadow: 0 0 4px #4ade80;
}

// ── Body layout ────────────────────────────────────────────────────────────

.kn-chatbot-body {
    position: relative;
    overflow: hidden;
    flex: 1 1 0;
    min-height: 0;
}

// ── Messages ───────────────────────────────────────────────────────────────

.kn-chatbot-messages {
    flex: 1 1 0;
    min-height: 0;
}

.kn-chatbot-timestamp {
    font-size: 0.65rem;
    color: #9ca3af;
    margin-top: -6px;
    margin-bottom: 4px;
}

// ── Input area ─────────────────────────────────────────────────────────────

.kn-chatbot-input-area {
    border-top: 1px solid #f1f5f9;
    flex-shrink: 0;
    background: white;
}

.kn-disclaimer {
    font-size: 0.62rem;
    color: #9ca3af;
    display: block;
    margin-top: 2px;
}

// ── Dashboard link chip ───────────────────────────────────────────────────

.kn-dashboard-link {
    margin-left: 44px;
    margin-top: -4px;
    margin-bottom: 4px;
}

// ── Session loading banner ─────────────────────────────────────────────────

.kn-session-banner {
    background: #eff6ff;
    border-bottom: 1px solid #bfdbfe;
    color: #1d4ed8;
    flex-shrink: 0;
}

// ── Confirm overlay ────────────────────────────────────────────────────────

.kn-chatbot-confirm-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    padding: 16px;
}

.kn-chatbot-confirm-card {
    width: 100%;
    max-width: 340px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

// ── Resize handle ──────────────────────────────────────────────────────────

.kn-chatbot-resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 18px;
    height: 18px;
    cursor: se-resize;
    background: linear-gradient(135deg, transparent 50%, rgba(79, 70, 229, 0.3) 50%);
    border-radius: 0 0 14px 0;
}

// ── Settings menu ──────────────────────────────────────────────────────────

.kn-settings-card {
    min-width: 260px;
    border-radius: 10px;
}

.kn-settings-start-btn {
    border-radius: 6px;
}

.kn-bm-select {
    font-size: 0.82rem;
}

// ── Minimized pill ─────────────────────────────────────────────────────────

.kn-chatbot-pill {
    position: fixed;
    bottom: 16px;
    right: 80px;
    z-index: 9100;
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    border-radius: 20px;
    padding: 6px 14px 6px 10px;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(79, 70, 229, 0.4);
    transition: box-shadow 0.2s ease, transform 0.15s ease;
    user-select: none;

    &:hover {
        box-shadow: 0 6px 24px rgba(79, 70, 229, 0.55);
        transform: translateY(-2px);
    }

    &:active {
        transform: translateY(0);
    }
}

.kn-chatbot-pill-label {
    font-size: 0.78rem;
    color: white;
    font-weight: 500;
    max-width: 160px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.kn-chatbot-pill-badge {
    top: -4px;
    right: -4px;
}

// ── Side panel slot ────────────────────────────────────────────────────────

.kn-side-panel-slot {
    height: 100%;
}

// ── Utilities ──────────────────────────────────────────────────────────────

.kn-overflow-hidden {
    overflow: hidden;
    min-width: 0;
}

.flex-shrink-0 {
    flex-shrink: 0;
}

// ── Transitions ────────────────────────────────────────────────────────────

.kn-slide-right-enter-active,
.kn-slide-right-leave-active {
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.kn-slide-right-enter-from,
.kn-slide-right-leave-to {
    transform: translateX(20px);
    opacity: 0;
    width: 0 !important;
    min-width: 0 !important;
}

.kn-card-pop-enter-active,
.kn-card-pop-leave-active {
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.kn-card-pop-enter-from,
.kn-card-pop-leave-to {
    transform: scale(0.7) translateY(16px);
    opacity: 0;
}
</style>

<!-- Global: q-menu is teleported to <body> so scoped styles cannot reach it -->
<style lang="scss">
.kn-chatbot-menu {
    z-index: 9500 !important;
    border-radius: 10px !important;
}
</style>
