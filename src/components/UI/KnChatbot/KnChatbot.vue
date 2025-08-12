<template>
    <q-dialog modal v-model="showAlert" transition-show="slide-up" transition-hide="slide-down">
        <q-card class="kn-chatbot column shadow-1 bg-white">
            <q-card-section class="q-pa-none">
                <q-toolbar class="bg-primary text-white">
                    <q-toolbar-title><q-icon class="q-mr-sm" name="smart_toy" />{{ $t('ai.title') }} </q-toolbar-title>
                </q-toolbar>
            </q-card-section>

            <div class="column col">
                <div ref="chatContainer" class="col q-ml-sm" style="overflow-y: auto; overflow-x: hidden">
                    <div v-for="message in chat" class="q-mr-md relative-position">
                        <q-chat-message :name="message.role === 'assistant' ? 'AI' : message.role" :avatar="message.role === 'assistant' ? avatarImg : undefined" :sent="message.role === 'user'">
                            <div>{{ message.content }}</div>
                        </q-chat-message>

                        <q-chip v-if="message.url" clickable class="dashboard-link" size="sm" color="accent" text-color="white" icon="open_in_new" @click="followLink(message.url)"> {{ $t('ai.dashboardLink') }} </q-chip>
                    </div>
                    <q-chat-message v-if="awaitingReply" name="AI" :avatar="avatarImg">
                        <q-spinner-dots size="2rem" />
                    </q-chat-message>
                    <div ref="bottomAnchor"></div>
                </div>
                <div class="row q-gutter-sm q-pa-sm">
                    <q-input outlined dense square :placeholder="$t('ai.message.placeholder')" class="col" v-model.trim="userMessage" @keyup.enter="sendMessage" />
                    <q-btn outline square color="primary" icon-right="send" :label="$t('common.send')" @click="sendMessage" />
                    <span class="text-caption col-12 q-my-none" style="font-size: 0.7rem">{{ $t('ai.disclaimer') }}</span>
                </div>
            </div>
        </q-card>
    </q-dialog>
    <q-btn flat square class="q-py-md" color="accent" :icon="'smart_toy'" @click="toggleChatbot">
        <q-tooltip :delay="500" anchor="center right" self="center left">{{ $t('AI assistant') }}</q-tooltip>
    </q-btn>
</template>

<script setup lang="ts">
import mainStore from '@/App.store'
import axios from 'axios'
import { nextTick, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IChat } from './KnChatbot'
import avatarImg from '@/assets/images/chatbot/chatty.webp'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const store = mainStore()
let dashStore = null as any

const { t } = useI18n()

const turnId = ref(0)
const showAlert = ref(false)
const awaitingReply = ref(false)
const userMessage = ref('')
const chat = ref<IChat[]>([
    {
        role: 'assistant',
        content: t('ai.welcomeMessage'),
        turnId: 0
    }
]) as any
const bottomAnchor = ref(null)
const body = reactive({} as any)

function toggleChatbot() {
    showAlert.value = !showAlert.value
}

function followLink(url) {
    router.push({ path: url })
}

async function sendMessage() {
    if (userMessage.value === '') return
    awaitingReply.value = true
    const newMessage: IChat = {
        role: 'user',
        content: userMessage.value,
        turnId: turnId.value++
    }
    ;(body.tenant = store.user.organization), (body.token = localStorage.getItem('token')), (body.role = store.user.defaultRole || store.user.roles[0]), (body.pathQuestion = router.currentRoute.value.path), (body.promptUser = userMessage.value), (body.conversationHistory = chat.value), (body.timestamp = new Date().toISOString())
    body.dashboard = null
    body.drivers = null

    if (router.currentRoute.value?.params?.mode === 'dashboard') {
        if (!dashStore) {
            const dashboardStoreModule = await import('@/modules/documentExecution/dashboard/Dashboard.store')
            dashStore = dashboardStoreModule.default()
        }

        const dashboardId = Array.isArray(router.currentRoute.value?.params?.id) ? router.currentRoute.value?.params?.id[0] : router.currentRoute.value?.params?.id

        const currentDashboard: any = dashStore.getDashboardFromLabel(dashboardId)
        body.dashboard = currentDashboard.configuration.aiSettings
        body.drivers = currentDashboard.drivers
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
            url: '/dashboard/DASHBOARD_AIRBNB?organization=demo&toolbar=true&menu=true&role=/demo/admin'
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
    scrollToBottom()
    axios
        .post(store.configurations['KNOWAGE.AI.URL'] + '/bot_response', body)
        .then((response) => {
            if (response.data) {
                let tempResponse: IChat = {
                    role: response.data.role,
                    content: response.data.response,
                    turnId: 1
                }
                if (response.data.urlDashboard) {
                    tempResponse.url = response.data.urlDashboard
                }
            } else {
                chat.value.push({
                    role: 'assistant',
                    content: 'Sorry, I cannot help you with that.',
                    turnId: 1
                })
            }
            console.log(response.data)
        })
        .catch((error) => {
            chat.value.push({
                role: 'assistant',
                content: 'Sorry, I cannot help you with that.',
                turnId: 1
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
    border: 1px solid var(--kn-color-borders);
    min-height: 500px;
    min-width: 400px;
    width: 60vw;
    height: 60vh;
    max-width: 60vw !important;
    max-height: 60vh !important;
    .dashboard-link {
        position: absolute;
        left: 50px;
        bottom: -25px;
    }
    .q-message-text--received {
        background-color: var(--kn-chatbot-color-background);
        color: var(--kn-chatbot-color-background);
    }
}
</style>
