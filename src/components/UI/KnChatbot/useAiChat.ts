import mainStore from '@/App.store'
import axios from 'axios'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { IChat, IChatBlock } from './KnChatbot'

export function useAiChat(showAlert: Ref<boolean>, minimized: Ref<boolean>, minimizedToCard: Ref<boolean>) {
    const router = useRouter()
    const store = mainStore()
    const { t } = useI18n()

    // ── Business models ───────────────────────────────────────

    const businessModels = ref<any[]>([])
    const selectedBm = ref<any>(null)

    function resolveSelectedBmDbId(model: any): string {
        const prioritizedKeys = ['db_id', 'dbId', 'name', 'label', 'id']
        for (const key of prioritizedKeys) {
            const value = model?.[key]
            if (value !== null && value !== undefined && String(value).trim() !== '') {
                return String(value)
            }
        }
        return ''
    }

    async function loadBusinessModels() {
        try {
            const res = await axios.get(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/2.0/businessmodels`)
            businessModels.value = Array.isArray(res.data) ? res.data : []
            if (businessModels.value.length > 0 && !selectedBm.value) {
                selectedBm.value = businessModels.value[0]
            }
        } catch {
            businessModels.value = []
        }
    }

    // ── Session ───────────────────────────────────────────────

    const sessionId = ref('')
    const sessionReady = ref(false)
    const sessionLoading = ref(false)
    const sessionAttempted = ref(false)

    async function initSession() {
        if (!selectedBm.value) return
        const baseUrl: string = store.configurations['KNOWAGE.AI.URL'] ?? ''
        if (baseUrl === 'demo') {
            sessionReady.value = true
            sessionAttempted.value = true
            return
        }
        sessionId.value = crypto.randomUUID()
        sessionReady.value = false
        sessionLoading.value = true
        sessionAttempted.value = true
        const dbId = resolveSelectedBmDbId(selectedBm.value)
        if (!dbId) {
            pushErrorMessage(t('ai.sessionError'))
            sessionLoading.value = false
            return
        }
        const userId: string = store.user?.userId ?? store.user?.userUniqueIdentifier ?? store.user?.userID ?? 'user'
        try {
            await axios.post(
                `${baseUrl}/apps/eng_gpt_data_agent/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId.value)}`,
                {
                    db_ids: [dbId],
                    knowage_tenant: store.user?.organization ?? '',
                    knowage_role: store.user?.defaultRole ?? (store.user?.roles?.[0] ?? ''),
                    knowage_token: localStorage.getItem('token') ?? '',
                    knowage_project_description: ''
                }
            )
            sessionReady.value = true
        } catch {
            pushErrorMessage(t('ai.sessionError'))
        } finally {
            sessionLoading.value = false
        }
    }

    // Only attempt session init once per open; user must explicitly retry via Settings
    async function maybeInitSession() {
        if (showAlert.value && selectedBm.value && !sessionReady.value && !sessionLoading.value && !sessionAttempted.value) {
            await initSession()
        }
    }

    // ── Conversation state ────────────────────────────────────

    const confirm = ref(false)
    const turnId = ref(0)
    const awaitingReply = ref(false)
    const userMessage = ref('')
    const sideItems = ref<IChatBlock[]>([])
    const sidePanelVisible = ref(false)
    const unreadCount = ref(0)

    const welcomeMessage = computed<IChat>(() => ({
        role: 'assistant',
        content: t('ai.welcomeMessage'),
        turnId: 0,
        timestamp: new Date()
    }))

    const chat = ref<IChat[]>([{ ...welcomeMessage.value }])

    watch(
        () => welcomeMessage.value.content,
        (newContent) => {
            if (chat.value.length === 1 && chat.value[0].role === 'assistant') {
                chat.value[0].content = newContent
            }
        }
    )

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

    watch(showAlert, async (val) => {
        if (val) {
            nextTick(scrollToBottomInstant)
            focusInput()
            await maybeInitSession()
        }
    })

    watch(minimized, (val) => {
        if (!val) {
            nextTick(scrollToBottomInstant)
            focusInput()
        }
    })

    // Reset unread when restored from card
    watch(minimizedToCard, (val) => {
        if (!val) unreadCount.value = 0
    })

    // Track unread messages received while minimized to card
    watch(
        () => chat.value.length,
        () => {
            const last = chat.value[chat.value.length - 1]
            if (minimizedToCard.value && last?.role === 'assistant' && !last.isLive) {
                unreadCount.value++
            }
        }
    )

    // ── Helper: push error ────────────────────────────────────

    function pushErrorMessage(msg: string) {
        chat.value.push({
            role: 'assistant',
            content: msg,
            turnId: turnId.value++,
            timestamp: new Date(),
            isError: true
        })
        scrollToBottom()
    }

    // ── Conversation management ───────────────────────────────

    function newChat() {
        chat.value = [{ ...welcomeMessage.value, timestamp: new Date() }]
        turnId.value = 0
        sideItems.value = []
        sidePanelVisible.value = false
        sessionReady.value = false
        sessionAttempted.value = false
        unreadCount.value = 0
        // Do not auto-init: user retries via Settings > Start Session if needed
        // If BM is selected, attempt a fresh session automatically
        initSession()
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

    // ── SSE send ──────────────────────────────────────────────

    let currentSseAbort: AbortController | null = null

    async function sendMessage() {
        if (!userMessage.value.trim()) return

        const baseUrl: string = store.configurations['KNOWAGE.AI.URL'] ?? ''

        // Demo mode
        if (baseUrl === 'demo') {
            const text = userMessage.value.trim()
            userMessage.value = ''
            awaitingReply.value = true
            chat.value.push({ role: 'user', content: text, turnId: turnId.value++, timestamp: new Date() })
            scrollToBottom()
            setTimeout(() => {
                chat.value.push({
                    role: 'assistant',
                    content: 'This is a demo response. In a real scenario, the AI would process your request and return structured data.',
                    turnId: turnId.value++,
                    timestamp: new Date()
                })
                awaitingReply.value = false
                scrollToBottom()
            }, 2000)
            focusInput()
            return
        }

        if (!sessionReady.value) {
            pushErrorMessage(t('ai.sessionNotReady'))
            return
        }

        // License check
        if (store.licenses?.engGptIntegration) {
            const count = Number(localStorage.getItem('chatMessageCount')) || 0
            if (count >= store.licenses.engGptIntegration) {
                pushErrorMessage(t('ai.message.limitReached', { limit: store.licenses.engGptIntegration }))
                return
            }
            localStorage.setItem('chatMessageCount', String(count + 1))
        }

        const text = userMessage.value.trim()
        userMessage.value = ''
        awaitingReply.value = true

        chat.value.push({ role: 'user', content: text, turnId: turnId.value++, timestamp: new Date() })
        nextTick(() => setTimeout(scrollToBottom, 50))

        // Live streaming entry
        const liveEntry: IChat = { role: 'assistant', content: '', turnId: turnId.value, timestamp: new Date(), isLive: true }
        chat.value.push(liveEntry)
        const liveIndex = chat.value.length - 1

        const userId: string = store.user?.userId ?? store.user?.userUniqueIdentifier ?? store.user?.userID ?? 'user'
        currentSseAbort = new AbortController()

        try {
            const response = await fetch(`${baseUrl}/run_sse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appName: 'eng_gpt_data_agent',
                    userId,
                    sessionId: sessionId.value,
                    newMessage: { role: 'user', parts: [{ text }] },
                    streaming: true
                }),
                signal: currentSseAbort.signal
            })

            if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`)

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            let liveText = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() ?? ''

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    const rawData = line.slice(6).trim()
                    if (!rawData) continue
                    let evt: any
                    try { evt = JSON.parse(rawData) } catch { continue }

                    const author: string = evt.author ?? ''
                    const partial: boolean = evt.partial ?? false
                    const parts: any[] = evt.content?.parts ?? []

                    if (author === 'knowage_assistant') {
                        const textPart: string = parts.find((p: any) => typeof p.text === 'string')?.text ?? ''
                        if (partial) {
                            liveText += textPart
                            chat.value[liveIndex] = { ...chat.value[liveIndex], content: liveText }
                            scrollToBottom()
                        } else {
                            const finalText = textPart || liveText
                            if (finalText) {
                                chat.value[liveIndex] = {
                                    role: 'assistant',
                                    content: finalText,
                                    turnId: turnId.value++,
                                    timestamp: new Date(),
                                    isLive: false
                                }
                                liveText = ''
                                scrollToBottom()
                            }
                        }
                    } else if (author === 'eng_gpt_data_controller') {
                        const rawPayload = parts.find((p: any) => typeof p.text === 'string')?.text ?? ''
                        if (!rawPayload) continue
                        let block: any
                        try { block = JSON.parse(rawPayload) } catch { continue }
                        if (['sql_query', 'artifacts', 'python_code'].includes(block?.type)) {
                            sideItems.value.push(block as IChatBlock)
                            if (!sidePanelVisible.value) sidePanelVisible.value = true
                        }
                    }
                }
            }

            // Finalize live entry if not yet replaced
            if (chat.value[liveIndex]?.isLive) {
                chat.value[liveIndex] = { ...chat.value[liveIndex], isLive: false, turnId: turnId.value++ }
            }
        } catch (err: any) {
            if (err?.name === 'AbortError') return
            chat.value[liveIndex] = {
                role: 'assistant',
                content: t('ai.streamError'),
                turnId: turnId.value++,
                timestamp: new Date(),
                isError: true,
                isLive: false
            }
            scrollToBottom()
        } finally {
            awaitingReply.value = false
            currentSseAbort = null
            scrollToBottom()
            focusInput()
        }
    }

    // ── Mount ─────────────────────────────────────────────────

    onMounted(() => {
        loadBusinessModels()
    })

    return {
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
        newChat,
        loadBusinessModels
    }
}
