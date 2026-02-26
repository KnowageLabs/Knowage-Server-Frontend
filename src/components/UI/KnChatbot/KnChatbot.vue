<template>
    <div v-show="showAlert" class="kn-chatbot column shadow-4 bg-white" :style="panelStyle">
        <q-card-section class="q-pa-none">
            <q-toolbar class="bg-primary text-white kn-chatbot-toolbar" :class="minimized ? 'kn-chatbot-toolbar--minimized' : ''" @mousedown="startDrag">
                <q-icon class="q-mr-sm" name="smart_toy" size="sm" />
                <q-toolbar-title class="kn-chatbot-toolbar-title">
                    <div class="kn-chatbot-toolbar-main">{{ $t('ai.title') }}</div>
                    <div v-if="!minimized" class="kn-chatbot-toolbar-sub"><span class="kn-chatbot-toolbar-dot"></span>{{ todayDate }}</div>
                </q-toolbar-title>
                <q-btn v-if="!isMobile" flat round dense :icon="minimized ? 'unfold_more' : 'remove'" @click.stop="minimized = !minimized">
                    <q-tooltip :delay="500" anchor="center left" self="center right">{{ minimized ? $t('common.expand') : $t('common.minimize') }}</q-tooltip>
                </q-btn>
                <q-btn flat round dense icon="close" @click.stop="closePanel">
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
                <q-input ref="messageInput" outlined :placeholder="$t('ai.message.placeholder')" v-model.trim="userMessage" @keyup.enter="sendMessage">
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
        <div v-if="!minimized && !isMobile" class="kn-chatbot-resize-handle" @mousedown="startResize"></div>
    </div>

    <q-btn flat square class="q-py-md" color="accent" :icon="'smart_toy'" @click="toggleChatbot">
        <q-tooltip :delay="500" anchor="center right" self="center left">{{ $t('AI assistant') }}</q-tooltip>
    </q-btn>
</template>

<script setup lang="ts">
import avatarImg from '@/assets/images/chatbot/chatty.webp'
import { VueMarkdownIt } from '@f3ve/vue-markdown-it'
import { useChatbotPanel } from './useChatbotPanel'
import { useAiChat } from './useAiChat'
import { useVoiceInput } from './useVoiceInput'

const { showAlert, minimized, isMobile, todayDate, panelStyle, startDrag, startResize, closePanel, toggleChatbot } = useChatbotPanel()

const { confirm, awaitingReply, userMessage, chat, bottomAnchor, chatContainer, messageInput, confirmNewChat, followLink, formatTime, sendMessage } = useAiChat(showAlert, minimized)

const { listening, toggleVoice } = useVoiceInput(userMessage)
</script>
