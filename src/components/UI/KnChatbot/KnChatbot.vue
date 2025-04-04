<template>
    <q-dialog allow-focus-outside persistent seamless v-model="showAlert" transition-show="slide-up" transition-hide="slide-down">
        <div class="kn-chatbot q-pa-sm column shadow-1 bg-white">
            <div class="text-h6">AI assistant</div>
            <div class="text-caption text-grey-8">The KNOWAGE consultant you were waiting for</div>

            <div class="column col">
                <div class="col q-ma-sm overflow-auto">
                    <q-chat-message name="AI" :avatar="avatarImg" :text="['Hello, how can I help you?']" />
                </div>
                <div class="row q-gutter-sm">
                    <q-input outlined dense square placeholder="type your message" class="col" />
                    <q-btn outline color="primary" icon="send" />
                </div>
            </div>
        </div>
    </q-dialog>
    <q-btn fab :icon="showAlert ? 'close' : 'auto_awesome'" color="accent" id="kn-chatbot-button" @click="toggleChatbot" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import avatarImg from '@/assets/images/chatbot/chatty.webp'

const showAlert = ref(false)

function toggleChatbot() {
    showAlert.value = !showAlert.value
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
