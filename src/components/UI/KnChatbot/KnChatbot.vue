<template>
    <q-dialog allow-focus-outside persistent seamless v-model="showAlert" transition-show="slide-up" transition-hide="slide-down">
        <div class="kn-chatbot q-pa-sm column shadow-1 bg-white">
            <div class="text-h6">AI assistant</div>
            <div class="text-caption text-grey-8">The KNOWAGE consultant you were waiting for</div>

            <div class="column col">
                <div ref="chatContainer" class="col q-ma-sm overflow-y-auto">
                    <q-chat-message v-for="message in chat" :name="message.role === 'assistant' ? 'AI' : message.role" :avatar="message.role === 'assistant' ? avatarImg : undefined" :sent="message.role === 'user'">
                        <div>{{ message.content }}</div>
                        <div v-if="message.url" class="text-center">
                            <q-btn flat color="black" size="md" :label="$t('dashboark link')" @click="followLink(message.url)" />
                        </div>
                    </q-chat-message>
                    <q-chat-message v-if="awaitingReply" name="AI" :avatar="avatarImg">
                        <q-spinner-dots size="2rem" />
                    </q-chat-message>
                </div>
                <div class="row q-gutter-sm">
                    <q-input outlined dense square placeholder="type your message" class="col" v-model.trim="userMessage" @keyup.enter="sendMessage" />
                    <q-btn outline color="primary" icon="send" @click="sendMessage" />
                </div>
            </div>
        </div>
    </q-dialog>
    <q-btn fab :icon="showAlert ? 'close' : 'auto_awesome'" color="accent" id="kn-chatbot-button" @click="toggleChatbot" />
</template>

<script setup lang="ts">
import mainStore from '@/App.store'
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IChat } from './KnChatbot'
import avatarImg from '@/assets/images/chatbot/chatty.webp'

const router = useRouter()
const store = mainStore()

const showAlert = ref(false)
const awaitingReply = ref(false)
const userMessage = ref('')
const chat = ref<IChat[]>([
    {
        role: 'assistant',
        content: 'Hello, how can I help you?',
        turnId: 1
    }
]) as any

function toggleChatbot() {
    showAlert.value = !showAlert.value
}

function followLink(url) {
    router.push(url)
}

function sendMessage() {
    if (userMessage.value === '') return
    awaitingReply.value = true
    chat.value.push({
        role: 'user',
        content: userMessage.value,
        turnId: 1
    })

    if (store.configurations['KNOWAGE.AI.URL'] === 'demo') sendToDemo()
    else sendToAI()

    userMessage.value = ''
}

function sendToDemo() {
    setTimeout(() => {
        chat.value.push({
            role: 'assistant',
            content: 'This is a demo response. In a real scenario, the AI would process your request.',
            turnId: 1,
            url: '/dashboard/AI-test?organization=dte&toolbar=true&menu=true&role=/dte/admin&params=W3sidmFsdWUiOlt7InZhbHVlIjoiMSIsImRlc2NyaXB0aW9uIjoiU3RvcmUgMSJ9XSwidXJsTmFtZSI6InN0b3JlIiwibXVsdGl2YWx1ZSI6ZmFsc2V9XQ=='
        })
        awaitingReply.value = false
    }, 2000)
}

async function sendToAI() {
    axios
        .post(store.configurations['KNOWAGE.AI.URL'] + '/bot_response', {
            tenant: store.user.organization,
            role: store.user.defaultRole || store.user.roles[0],
            pathQuestion: router.currentRoute.value.path,
            promptUser: userMessage.value,
            conversationHistory: chat.value,
            timestamp: new Date().toISOString()
        })
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
        .finally(() => (awaitingReply.value = false))
}
</script>

<style>
.kn-chatbot {
    position: absolute !important;
    border: 1px solid var(--kn-color-borders);
    height: 500px;
    width: 400px;
    bottom: 100px;
    right: 20px;
}
#kn-chatbot-button {
    position: absolute;
    right: 30px;
    bottom: 30px;
    z-index: 9997;
}
</style>
