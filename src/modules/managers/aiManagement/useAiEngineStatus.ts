import mainStore from '@/App.store'
import axios from 'axios'
import { computed, onUnmounted, reactive, ref, watch } from 'vue'

export type AiSyncStatus = 'never' | 'inProcess' | 'ok' | 'error'
export type AiEngineState = 'off' | 'unknown' | 'ok' | 'busy' | 'error'

export interface IAiSyncState {
    status: AiSyncStatus
    last: string | null
    error: string | null
}

const POLLING_MS = 10000

// Status of the AI engine: knowledge base sync, business model sync and whether the engine responds.
export function useAiEngineStatus() {
    const store = mainStore()
    const aiUrl = computed<string>(() => store.configurations?.['KNOWAGE.AI.URL'] ?? '')
    const enabled = computed(() => !!store.isEnterprise && !!aiUrl.value)
    const reachable = ref<boolean | null>(null)
    const knowledgeBase = reactive<IAiSyncState>({ status: 'never', last: null, error: null })
    const businessModelSync = reactive<IAiSyncState>({ status: 'never', last: null, error: null })

    function requestBody() {
        return { tenant: store.user?.organization, token: sessionStorage.getItem('token') }
    }

    // The engine answers { status: 'Loaded' | 'In process' | 'Error', data }.
    function applyStatus(state: IAiSyncState, response: any, lastKey: string) {
        if (response?.status === 'Loaded') {
            state.status = 'ok'
            state.last = response.data?.[lastKey] ?? state.last
            state.error = null
        } else if (response?.status === 'In process') {
            state.status = 'inProcess'
        } else if (response?.status === 'Error') {
            state.status = 'error'
            state.error = response.data?.error?.description ?? null
        }
    }

    async function refreshKnowledgeBase() {
        try {
            const response = await axios.post(aiUrl.value + '/last_update', requestBody())
            reachable.value = true
            applyStatus(knowledgeBase, response.data, 'lastKBUpdate')
        } catch {
            reachable.value = false
        }
    }

    async function refreshBusinessModelSync() {
        try {
            const response = await axios.post(aiUrl.value + '/bm_sync_status', requestBody())
            applyStatus(businessModelSync, response.data, 'lastUpdate')
        } catch {
            // Older engines have no status endpoint: the card keeps its last known state.
        }
    }

    // The engine reads ai.xlsx from the "ai" folder in Resources.
    async function syncKnowledgeBase() {
        Object.assign(knowledgeBase, { status: 'inProcess', error: null })
        try {
            const folders = await axios.get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + '/api/2.0/resources/folders')
            const aiFolder = folders.data?.root?.[0]?.children?.find((folder: any) => folder.label === 'ai')
            await axios.post(aiUrl.value + '/load_data', { ...requestBody(), urlExcel: { key: aiFolder?.key ?? '', selectedFilesNames: ['ai.xlsx'] } })
            await refreshKnowledgeBase()
        } catch (error: any) {
            Object.assign(knowledgeBase, { status: 'error', error: error?.message ?? null })
        }
    }

    async function syncBusinessModels(businessModelIds: number[]) {
        Object.assign(businessModelSync, { status: 'inProcess', error: null })
        try {
            await axios.post(aiUrl.value + '/register_metadata_knowage', { ...requestBody(), businessModelIds })
            await refreshBusinessModelSync()
        } catch (error: any) {
            Object.assign(businessModelSync, { status: 'error', error: error?.message ?? null })
        }
    }

    const engineState = computed<AiEngineState>(() => {
        if (!enabled.value) return 'off'
        if (reachable.value === false || knowledgeBase.status === 'error' || businessModelSync.status === 'error') return 'error'
        if (knowledgeBase.status === 'inProcess' || businessModelSync.status === 'inProcess') return 'busy'
        return reachable.value ? 'ok' : 'unknown'
    })

    // ── Polling ───────────────────────────────────────────────

    let timer: ReturnType<typeof setInterval> | null = null

    function poll() {
        refreshKnowledgeBase()
        if (businessModelSync.status === 'inProcess') refreshBusinessModelSync()
    }

    // The configuration can arrive after the page mounts (direct link to the page).
    watch(
        enabled,
        (value) => {
            if (!value || timer) return
            refreshKnowledgeBase()
            refreshBusinessModelSync()
            timer = setInterval(poll, POLLING_MS)
        },
        { immediate: true }
    )

    onUnmounted(() => {
        if (timer) clearInterval(timer)
    })

    return { aiUrl, enabled, reachable, knowledgeBase, businessModelSync, engineState, syncKnowledgeBase, syncBusinessModels }
}
