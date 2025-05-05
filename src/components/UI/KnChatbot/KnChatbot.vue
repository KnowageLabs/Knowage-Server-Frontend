<template>
    <q-dialog allow-focus-outside persistent seamless v-model="showAlert" transition-show="slide-up" transition-hide="slide-down">
        <div class="kn-chatbot q-pa-sm column shadow-1 bg-white">
            <div class="text-h6">AI assistant</div>
            <div class="text-caption text-grey-8">The KNOWAGE consultant you were waiting for</div>

            <div class="column col">
                <div ref="chatContainer" class="col q-ma-sm overflow-y-auto">
                    <q-chat-message v-for="message in chat" :name="message.name" :avatar="message.avatar" :sent="message.name != 'AI'">
                        <div>{{ message.text[0] }}</div>
                        <div v-if="message.link" class="text-center">
                            <q-btn flat color="black" size="md" :label="$t('dashboark link')" @click="followLink(message.link)" />
                        </div>
                    </q-chat-message>
                    <q-chat-message v-if="awaitingReply" name="AI" :avatar="avatarImg">
                        <q-spinner-dots size="2rem" />
                    </q-chat-message>
                </div>
                <div class="row q-gutter-sm">
                    <q-input outlined dense square placeholder="type your message" class="col" v-model.trim="userMessage" @keyup.enter="simulateMessage" />
                    <q-btn outline color="primary" icon="send" @click="simulateMessage" />
                </div>
            </div>
        </div>
    </q-dialog>
    <q-btn fab :icon="showAlert ? 'close' : 'auto_awesome'" color="accent" id="kn-chatbot-button" @click="toggleChatbot" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import avatarImg from '@/assets/images/chatbot/chatty.webp'

const router = useRouter()

const showAlert = ref(false)
const awaitingReply = ref(false)
const userMessage = ref('')
const chat = ref([
    {
        name: 'AI',
        text: ['Hello, how can I help you?'],
        avatar: avatarImg
    }
]) as any

function toggleChatbot() {
    showAlert.value = !showAlert.value
}

function followLink(url) {
    router.push(url)
}

function simulateMessage() {
    if (userMessage.value === '') return
    chat.value.push({
        name: 'User',
        text: [userMessage.value]
    })
    userMessage.value = ''
    awaitingReply.value = true
    setTimeout(() => {
        chat.value.push({
            name: 'AI',
            text: [`Just for this demo purpose, I will provide you a useful link to the KNOWAGE 9.0 release!`],
            link: '/dashboard/welcome?organization=DEFAULT_TENANT&toolbar=false&menu=true&role=admin&finalUser=true',
            avatar: avatarImg
        })
        awaitingReply.value = false
    }, 5000)
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
