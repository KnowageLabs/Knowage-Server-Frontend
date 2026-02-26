import mainStore from '@/App.store'
import axios from 'axios'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { IChat } from './KnChatbot'

export function useAiChat(showAlert: Ref<boolean>, minimized: Ref<boolean>) {
    const router = useRouter()
    const store = mainStore()
    const { t } = useI18n()

    let dashStore: any = null

    // ── State ─────────────────────────────────────────────────

    const confirm = ref(false)
    const turnId = ref(0)
    const awaitingReply = ref(false)
    const userMessage = ref('')

    const welcomeMessage = computed<IChat>(() => ({
        role: 'assistant',
        content: t('ai.welcomeMessage'),
        turnId: 0,
        timestamp: new Date()
    }))

    const chat = ref<IChat[]>([{ ...welcomeMessage.value }]) as any

    // aggiorna il welcome message quando cambia la lingua (solo se è l'unico messaggio)
    watch(
        () => welcomeMessage.value.content,
        (newContent) => {
            if (chat.value.length === 1 && chat.value[0].role === 'assistant') {
                chat.value[0].content = newContent
            }
        }
    )

    const body = reactive({ conversationId: crypto.randomUUID() } as any)

    // ── Template refs ─────────────────────────────────────────

    const bottomAnchor = ref<HTMLElement | null>(null)
    const chatContainer = ref<HTMLElement | null>(null)
    const messageInput = ref<any>(null)

    // ── Scroll / focus ────────────────────────────────────────

    function scrollToBottom() {
        nextTick(() => bottomAnchor.value?.scrollIntoView({ behavior: 'smooth' }))
    }

    function scrollToBottomInstant() {
        nextTick(() => bottomAnchor.value?.scrollIntoView({ behavior: 'auto' }))
    }

    function focusInput() {
        nextTick(() => setTimeout(() => messageInput.value?.focus(), 80))
    }

    watch(showAlert, (val) => {
        if (val) {
            nextTick(scrollToBottomInstant)
            focusInput()
        }
    })

    watch(minimized, (val) => {
        if (!val) {
            nextTick(scrollToBottomInstant)
            focusInput()
        }
    })

    // ── Conversation management ───────────────────────────────

    function newChat() {
        chat.value = [{ ...welcomeMessage.value, timestamp: new Date() }]
        turnId.value = 0
        body.conversationId = crypto.randomUUID()
    }

    function confirmNewChat() {
        confirm.value = false
        newChat()
    }

    function followLink(url: string) {
        router.push(url)
    }

    function formatTime(date?: Date): string {
        if (!date) return ''
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // ── Send message ──────────────────────────────────────────

    async function sendMessage() {
        if (userMessage.value === '') return

        awaitingReply.value = true

        const newMessage: IChat = {
            role: 'user',
            content: userMessage.value,
            turnId: turnId.value++,
            timestamp: new Date()
        }

        body.tenant = store.user.organization
        body.token = localStorage.getItem('token')
        body.role = store.user.defaultRole || store.user.roles[0]
        body.pathQuestion = router.currentRoute.value.path
        body.promptUser = userMessage.value
        body.conversationHistory = chat.value
        body.timestamp = new Date().toISOString()
        body.dashboard = null
        body.drivers = null

        const routeName = String(router.currentRoute.value?.name)
        const routeMode = router.currentRoute.value?.params?.mode
        if (['dashboard', 'dashboard-execution'].includes(routeName) || routeMode === 'dashboard') {
            if (!dashStore) {
                const mod = await import('@/modules/documentExecution/dashboard/Dashboard.store')
                dashStore = mod.default()
            }
            const rawId = router.currentRoute.value?.params?.id
            const dashboardId = Array.isArray(rawId) ? rawId[0] : rawId
            const currentDashboard: any = dashStore.getDashboard(dashboardId) ?? dashStore.getDashboardFromLabel(dashboardId)
            if (currentDashboard?.configuration?.aiSettings) body.dashboard = currentDashboard.configuration.aiSettings
            if (currentDashboard?.drivers) body.drivers = currentDashboard.drivers
        }

        chat.value.push(newMessage)
        nextTick(() => setTimeout(scrollToBottom, 50))

        if (store.configurations['KNOWAGE.AI.URL'] === 'demo') sendToDemo()
        else sendToAI()

        userMessage.value = ''
        focusInput()
    }

    // ── API calls ─────────────────────────────────────────────

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

    function sendToAI() {
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
            localStorage.setItem('chatMessageCount', String(++count))
        }

        scrollToBottom()
        axios
            .post(store.configurations['KNOWAGE.AI.URL'] + '/bot-response', body)
            .then((response) => {
                if (response.data) {
                    const tempResponse: IChat = {
                        role: 'assistant',
                        content: response.data.response,
                        turnId: chat.value[chat.value.length - 1].turnId + 1,
                        timestamp: new Date()
                    }
                    if (response.data.urlDashboard) tempResponse.url = response.data.urlDashboard
                    chat.value.push(tempResponse)
                } else {
                    chat.value.push({
                        role: 'assistant',
                        content: t('ai.error'),
                        turnId: chat.value[chat.value.length - 1].turnId + 1,
                        timestamp: new Date()
                    })
                }
                console.log(response.data)
            })
            .catch(() => {
                chat.value.push({
                    role: 'assistant',
                    content: t('ai.error'),
                    turnId: chat.value[chat.value.length - 1].turnId + 1,
                    timestamp: new Date()
                })
            })
            .finally(() => {
                awaitingReply.value = false
                scrollToBottom()
            })
    }

    return {
        confirm,
        awaitingReply,
        userMessage,
        chat,
        bottomAnchor,
        chatContainer,
        messageInput,
        confirmNewChat,
        followLink,
        formatTime,
        sendMessage
    }
}
