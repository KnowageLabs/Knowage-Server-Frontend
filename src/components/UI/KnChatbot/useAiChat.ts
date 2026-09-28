import mainStore from '@/App.store'
import axios from 'axios'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IChat, IChatArtifactFile, IChatBlock, IChatBlockArtifacts, IChatLink } from './KnChatbot'
import { getRandomStreamingMessage } from './AiToolsStreamingMessages'

const SIDE_PANEL_WIDTH_KEY = 'chatbot_side_panel_width_v1'
const SIDE_PANEL_MIN_WIDTH = 260
const SIDE_PANEL_MAX_WIDTH = 800

export type ConfirmMode = 'newChat' | 'switchModel'

export function useAiChat(showAlert: Ref<boolean>, minimizedToCard: Ref<boolean>) {
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
            businessModels.value = (Array.isArray(res.data) ? res.data : []).filter((bm) => bm.isForAi === true)
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
    const sessionError = ref(false)
    const sessionAttempted = ref(false)

    function aiBaseUrl(): string {
        return store.configurations['KNOWAGE.AI.URL'] ?? ''
    }

    function currentUserId(): string {
        return store.user?.userId ?? store.user?.userUniqueIdentifier ?? store.user?.userID ?? 'user'
    }

    async function initSession() {
        if (!selectedBm.value) return
        sessionAttempted.value = true
        sessionError.value = false
        if (aiBaseUrl() === 'demo') {
            sessionReady.value = true
            return
        }
        sessionId.value = crypto.randomUUID()
        sessionReady.value = false
        const dbId = resolveSelectedBmDbId(selectedBm.value)
        if (!dbId) {
            sessionError.value = true
            return
        }
        sessionLoading.value = true
        try {
            await axios.post(`${aiBaseUrl()}/apps/eng_gpt_data_agent/users/${encodeURIComponent(currentUserId())}/sessions/${encodeURIComponent(sessionId.value)}`, {
                model_ids: [dbId],
                knowage_tenant: store.user?.organization ?? '',
                knowage_role: store.user?.defaultRole ?? store.user?.roles?.[0] ?? '',
                knowage_token: sessionStorage.getItem('token') ?? '',
                knowage_project_description: ''
            })
            sessionReady.value = true
        } catch {
            sessionError.value = true
        } finally {
            sessionLoading.value = false
        }
    }

    // Only one automatic attempt per open. After a failure the user retries from the banner.
    async function maybeInitSession() {
        if (showAlert.value && selectedBm.value && !sessionReady.value && !sessionLoading.value && !sessionAttempted.value) {
            await initSession()
        }
    }

    // ── Conversation state ────────────────────────────────────

    const confirmMode = ref<ConfirmMode | null>(null)
    const pendingBm = ref<any>(null)
    const turnId = ref(1)
    const conversationId = ref(1)
    const awaitingReply = ref(false)
    const userMessage = ref('')
    const sideItems = ref<IChatBlock[]>([])
    const urlLinks = ref<Record<string, IChatLink[]>>({})
    const sidePanelVisible = ref(false)
    const sidePanelWidth = ref(getInitialSidePanelWidth())
    const unreadCount = ref(0)
    const artifactNavigationTargetId = ref('')
    const artifactHighlightedItemIds = ref<string[]>([])

    let artifactHighlightTimeout: ReturnType<typeof setTimeout> | null = null

    const hasUserMessages = computed(() => chat.value.some((m) => m.role === 'user'))

    function getCurrentLocale(): string {
        return (store.locale || 'en_US').replace('-', '_')
    }

    // ── Side panel width ──────────────────────────────────────

    function clampSidePanelWidth(value: number): number {
        return Math.max(SIDE_PANEL_MIN_WIDTH, Math.min(SIDE_PANEL_MAX_WIDTH, value))
    }

    function getInitialSidePanelWidth(): number {
        try {
            const saved = Number(localStorage.getItem(SIDE_PANEL_WIDTH_KEY))
            if (!Number.isNaN(saved) && saved > 0) return clampSidePanelWidth(saved)
        } catch {
            // Storage unavailable: use the default width.
        }
        return 380
    }

    // The panel can live in the pop-out window, so listen on the document the drag started in.
    function startSidePanelResize(e: MouseEvent) {
        e.stopPropagation()
        const doc = (e.view?.document ?? document) as Document
        const startX = e.clientX
        const startW = sidePanelWidth.value
        doc.body.style.userSelect = 'none'
        const onMove = (ev: MouseEvent) => (sidePanelWidth.value = clampSidePanelWidth(startW - (ev.clientX - startX)))
        const onUp = () => {
            doc.body.style.userSelect = ''
            doc.removeEventListener('mousemove', onMove)
            doc.removeEventListener('mouseup', onUp)
            try {
                localStorage.setItem(SIDE_PANEL_WIDTH_KEY, String(sidePanelWidth.value))
            } catch {
                // Storage unavailable: the width is kept for this session only.
            }
        }
        doc.addEventListener('mousemove', onMove)
        doc.addEventListener('mouseup', onUp)
    }

    // ── Artifacts ─────────────────────────────────────────────

    function clearArtifactNavigation() {
        artifactNavigationTargetId.value = ''
        artifactHighlightedItemIds.value = []
        if (artifactHighlightTimeout) {
            clearTimeout(artifactHighlightTimeout)
            artifactHighlightTimeout = null
        }
    }

    function decorateSideBlock(block: IChatBlock, invocationId: string, question: string): IChatBlock {
        return { ...block, id: crypto.randomUUID(), conversationId: conversationId.value, createdAt: new Date(), invocationId, question }
    }

    function upsertArtifactFilesByName(existingFiles: IChatArtifactFile[], incomingFiles: IChatArtifactFile[]): IChatArtifactFile[] {
        const mergedFiles = [...existingFiles]
        incomingFiles.forEach((incomingFile) => {
            const existingIndex = mergedFiles.findIndex((file) => file.name === incomingFile.name)
            if (existingIndex >= 0) mergedFiles[existingIndex] = { ...mergedFiles[existingIndex], ...incomingFile }
            else mergedFiles.push(incomingFile)
        })
        return mergedFiles
    }

    function upsertArtifactsBlock(block: IChatBlockArtifacts, invocationId: string, question: string) {
        const decoratedBlock = decorateSideBlock(block, invocationId, question) as IChatBlockArtifacts
        if (!Array.isArray(decoratedBlock.files)) return

        const existingBlockIndex = sideItems.value.findIndex((item) => item.type === 'artifacts' && item.invocationId === invocationId)
        if (existingBlockIndex < 0 || !decoratedBlock.edit) {
            sideItems.value.push(decoratedBlock)
            return
        }

        const existingBlock = sideItems.value[existingBlockIndex] as IChatBlockArtifacts
        sideItems.value[existingBlockIndex] = { ...existingBlock, files: upsertArtifactFilesByName(existingBlock.files, decoratedBlock.files) }
    }

    function isAllowedArtifactFileExt(ext?: string): boolean {
        const normalized = (ext ?? '').toLowerCase()
        return normalized === 'csv' || normalized === 'png'
    }

    function isRenderableSideItem(item: IChatBlock): boolean {
        if (item.type === 'sql_query' || item.type === 'python_code') return true
        return item.files.some((file) => isAllowedArtifactFileExt(file.ext))
    }

    function getLinkedRenderableItems(invocationId?: string): IChatBlock[] {
        if (!invocationId) return []
        return sideItems.value.filter((item) => item.invocationId === invocationId && isRenderableSideItem(item))
    }

    function getUrlLinksForMessage(message: IChat): IChatLink[] {
        if (!message.invocationId) return []
        return urlLinks.value[message.invocationId] ?? []
    }

    // An artifacts block holds several files; each renderable file counts as one artifact.
    function countArtifacts(items: IChatBlock[]): number {
        return items.reduce((count, item) => count + (item.type === 'artifacts' ? item.files.filter((f) => isAllowedArtifactFileExt(f.ext)).length : 1), 0)
    }

    const artifactTotal = computed(() => countArtifacts(sideItems.value.filter(isRenderableSideItem)))

    // Number of artifacts of a finished reply. A reply that is still streaming has none yet.
    function artifactCountForMessage(message: IChat): number {
        if (message.role !== 'assistant' || message.isLive || message.isError || !message.invocationId) return 0
        return countArtifacts(getLinkedRenderableItems(message.invocationId))
    }

    async function openArtifactsForMessage(message: IChat) {
        const linkedItems = getLinkedRenderableItems(message.invocationId)
        if (linkedItems.length === 0) return

        clearArtifactNavigation()
        sidePanelVisible.value = true
        await nextTick()

        artifactNavigationTargetId.value = linkedItems[0].id
        artifactHighlightedItemIds.value = linkedItems.map((item) => item.id)
        artifactHighlightTimeout = setTimeout(clearArtifactNavigation, 1800)
    }

    // ── Stream event helpers ──────────────────────────────────

    function resolveInvocationId(evt: any): string {
        const candidate = evt?.invocationId ?? evt?.invocation_id ?? evt?.metadata?.invocationId ?? evt?.metadata?.invocation_id
        return candidate === null || candidate === undefined ? '' : String(candidate)
    }

    // Tool calls and tool results in an event, by tool name.
    function resolveToolActivity(evt: any): { calls: string[]; results: string[] } {
        const calls: string[] = []
        const results: string[] = []
        const nameOf = (fn: any) => {
            const name = fn?.name ?? fn?.function_name
            return name !== null && name !== undefined && String(name).trim() !== '' ? String(name) : ''
        }

        const direct = nameOf(evt?.functionCall ?? evt?.function_call ?? evt?.metadata?.functionCall ?? evt?.metadata?.function_call)
        if (direct) calls.push(direct)

        for (const part of evt?.content?.parts ?? []) {
            const call = nameOf(part?.functionCall ?? part?.function_call)
            if (call) calls.push(call)
            const result = nameOf(part?.functionResponse ?? part?.function_response)
            if (result) results.push(result)
        }
        return { calls, results }
    }

    // ── Messages ──────────────────────────────────────────────

    const welcomeMessage = computed<IChat>(() => ({ role: 'assistant', content: t('ai.welcomeMessage'), turnId: 0, timestamp: new Date() }))
    const chat = ref<IChat[]>([{ ...welcomeMessage.value }])

    watch(
        () => welcomeMessage.value.content,
        (newContent) => {
            if (chat.value.length === 1 && chat.value[0].role === 'assistant') chat.value[0].content = newContent
        }
    )

    const bottomAnchor = ref<HTMLElement | null>(null)
    const messageInput = ref<any>(null)

    function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
        nextTick(() => bottomAnchor.value?.scrollIntoView({ behavior, block: 'end' }))
    }

    function focusInput() {
        nextTick(() => setTimeout(() => messageInput.value?.focus(), 80))
    }

    watch(showAlert, async (val) => {
        if (!val) return
        scrollToBottom('auto')
        focusInput()
        await maybeInitSession()
    })

    watch(minimizedToCard, (val) => {
        if (!val) unreadCount.value = 0
    })

    // Replies that arrive while the chat is minimized count as unread.
    watch(
        () => chat.value.length,
        () => {
            const last = chat.value[chat.value.length - 1]
            if (minimizedToCard.value && last?.role === 'assistant' && !last.isLive) unreadCount.value++
        }
    )

    function pushErrorMessage(msg: string) {
        chat.value.push({ role: 'assistant', content: msg, turnId: turnId.value++, timestamp: new Date(), isError: true })
        scrollToBottom()
    }

    // ── Conversation management ───────────────────────────────

    function newChat() {
        stopReply()
        chat.value = [{ ...welcomeMessage.value, timestamp: new Date() }]
        turnId.value = 1
        conversationId.value++
        sideItems.value = []
        urlLinks.value = {}
        sidePanelVisible.value = false
        clearArtifactNavigation()
        sessionReady.value = false
        sessionAttempted.value = false
        unreadCount.value = 0
        initSession()
    }

    // A model can only be changed together with a new conversation. Without messages there is nothing to lose, so no confirmation.
    function requestModelChange(bm: any) {
        if (!bm || bm === selectedBm.value) return
        if (!hasUserMessages.value) {
            selectedBm.value = bm
            newChat()
            return
        }
        pendingBm.value = bm
        confirmMode.value = 'switchModel'
    }

    function requestNewChat() {
        if (!hasUserMessages.value) return newChat()
        confirmMode.value = 'newChat'
    }

    function confirmPending() {
        const savedMessage = userMessage.value
        if (confirmMode.value === 'switchModel' && pendingBm.value) selectedBm.value = pendingBm.value
        cancelPending()
        newChat()
        userMessage.value = savedMessage
    }

    function cancelPending() {
        confirmMode.value = null
        pendingBm.value = null
    }

    function formatTime(date?: Date): string {
        return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
    }

    // ── Send / stop ───────────────────────────────────────────

    let currentSseAbort: AbortController | null = null
    let liveMessage: IChat | null = null

    function finishSteps(message: IChat) {
        message.steps?.forEach((step) => (step.done = true))
    }

    function stopReply() {
        if (!currentSseAbort) return
        currentSseAbort.abort()
        currentSseAbort = null
        if (liveMessage) {
            liveMessage.isLive = false
            liveMessage.isStopped = true
            liveMessage.liveStatus = ''
            finishSteps(liveMessage)
            liveMessage = null
        }
        awaitingReply.value = false
    }

    function sendDemoMessage(text: string) {
        awaitingReply.value = true
        chat.value.push({ role: 'user', content: text, turnId: turnId.value++, timestamp: new Date() })
        scrollToBottom()
        setTimeout(() => {
            chat.value.push({ role: 'assistant', content: 'This is a demo response. In a real scenario, the AI would process your request and return structured data.', turnId: turnId.value++, timestamp: new Date() })
            awaitingReply.value = false
            scrollToBottom()
        }, 2000)
        focusInput()
    }

    // Returns false when the license limit is reached.
    function checkMessageLimit(): boolean {
        const limit = store.licenses?.engGptIntegration
        if (!limit) return true
        const count = Number(localStorage.getItem('chatMessageCount')) || 0
        if (count >= limit) {
            pushErrorMessage(t('ai.message.limitReached', { limit }))
            return false
        }
        localStorage.setItem('chatMessageCount', String(count + 1))
        return true
    }

    async function sendMessage() {
        const text = userMessage.value.trim()
        if (!text || awaitingReply.value) return

        if (aiBaseUrl() === 'demo') {
            userMessage.value = ''
            return sendDemoMessage(text)
        }
        if (!sessionReady.value || !checkMessageLimit()) return

        userMessage.value = ''
        awaitingReply.value = true
        chat.value.push({ role: 'user', content: text, turnId: turnId.value++, timestamp: new Date() })

        chat.value.push({ role: 'assistant', content: '', turnId: turnId.value++, timestamp: new Date(), isLive: true, invocationId: crypto.randomUUID(), steps: [], liveStatus: '' })
        // The reactive proxy, so changes below render.
        const live = chat.value[chat.value.length - 1]
        liveMessage = live
        scrollToBottom()

        const abort = new AbortController()
        currentSseAbort = abort

        try {
            const response = await fetch(`${aiBaseUrl()}/run_sse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appName: 'eng_gpt_data_agent', userId: currentUserId(), sessionId: sessionId.value, newMessage: { role: 'user', parts: [{ text }] }, streaming: true }),
                signal: abort.signal
            })
            if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`)

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            let liveText = ''
            let streamEnded = false

            while (!streamEnded) {
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
                    try {
                        evt = JSON.parse(rawData)
                    } catch {
                        continue
                    }

                    if (evt.error) {
                        Object.assign(live, { content: evt.error, isError: true, isStreamError: true, isLive: false, liveStatus: '' })
                        finishSteps(live)
                        streamEnded = true
                        break
                    }

                    const eventInvocationId = resolveInvocationId(evt)
                    if (eventInvocationId) live.invocationId = eventInvocationId
                    const invocationId = live.invocationId as string

                    // Tool steps: a call opens a step, a result closes it.
                    const { calls, results } = resolveToolActivity(evt)
                    calls.forEach((tool) => {
                        const running = live.steps?.find((s) => s.tool === tool && !s.done)
                        if (running) return
                        live.steps?.forEach((s) => (s.done = true))
                        live.steps?.push({ id: crypto.randomUUID(), tool, done: false })
                        if (!liveText) live.liveStatus = getRandomStreamingMessage(tool, getCurrentLocale()) ?? ''
                        scrollToBottom()
                    })
                    results.forEach((tool) => {
                        const step = live.steps?.find((s) => s.tool === tool && !s.done)
                        if (step) step.done = true
                    })

                    const author: string = evt.author ?? ''
                    const parts: any[] = evt.content?.parts ?? []
                    const textPart: string = parts.find((p: any) => typeof p.text === 'string')?.text ?? ''

                    if (author === 'knowage_assistant' && textPart) {
                        if (evt.partial) {
                            liveText += textPart
                            live.content = liveText
                        } else {
                            Object.assign(live, { content: textPart || liveText, isLive: false, liveStatus: '', timestamp: new Date() })
                            finishSteps(live)
                            liveText = ''
                        }
                        scrollToBottom()
                    } else if (author === 'eng_gpt_data_controller' && textPart) {
                        let block: any
                        try {
                            block = JSON.parse(textPart)
                        } catch {
                            continue
                        }
                        if (!['sql_query', 'artifacts', 'python_code'].includes(block?.type)) continue

                        if (block.type === 'artifacts' && Array.isArray(block.files)) {
                            const links: IChatLink[] = block.files.filter((f: any) => f.ext === 'url' && f.url && f.title).map((f: any) => ({ title: f.title, url: f.url }))
                            const files = block.files.filter((f: any) => f.ext !== 'url')
                            if (links.length > 0) urlLinks.value[invocationId] = [...(urlLinks.value[invocationId] ?? []), ...links]
                            if (files.length > 0) upsertArtifactsBlock({ ...block, files }, invocationId, text)
                        } else {
                            sideItems.value.push(decorateSideBlock(block as IChatBlock, invocationId, text))
                        }
                    }
                }
            }

            if (live.isLive) {
                Object.assign(live, { isLive: false, liveStatus: '' })
                finishSteps(live)
            }
        } catch (err: any) {
            if (err?.name === 'AbortError') return
            Object.assign(live, { content: t('ai.streamError'), isError: true, isStreamError: true, isLive: false, liveStatus: '' })
            finishSteps(live)
        } finally {
            // A stopped reply was already cleaned up by stopReply, and a new request may have started since.
            if (currentSseAbort === abort) {
                currentSseAbort = null
                liveMessage = null
                awaitingReply.value = false
            }
            scrollToBottom()
            focusInput()
        }
    }

    onMounted(loadBusinessModels)

    onUnmounted(() => {
        currentSseAbort?.abort()
        clearArtifactNavigation()
    })

    return {
        confirmMode,
        pendingBm,
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
    }
}
