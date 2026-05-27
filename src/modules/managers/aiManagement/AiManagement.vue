<template>
    <div class="kn-page-content ai-management-page">
        <q-toolbar class="kn-toolbar kn-toolbar--primary">
            <q-toolbar-title>{{ $t('managers.ai.title') }}</q-toolbar-title>
        </q-toolbar>

        <div class="ai-management-body">
            <!-- Left column: Business Models -->
            <div class="ai-bm-column">
                <div class="ai-section-card">
                    <!-- Section header -->
                    <div class="ai-section-header">
                        <div class="ai-section-header-left">
                            <q-icon name="storage" size="20px" class="ai-section-icon" />
                            <span class="ai-section-title">{{ $t('managers.ai.businessModels.title') }}</span>
                        </div>
                    </div>

                    <q-separator />

                    <!-- Loading bar -->
                    <ProgressBar v-if="loadingBm" mode="indeterminate" class="kn-progress-bar" />

                    <!-- Empty state -->
                    <div v-if="!loadingBm && businessModels.length === 0" class="ai-bm-empty">
                        <q-icon name="inbox" size="40px" color="grey-4" />
                        <span class="text-grey-5 text-body2">{{ $t('common.noDataFound') }}</span>
                    </div>

                    <!-- BM list -->
                    <div v-else class="ai-bm-list">
                        <div v-for="bm in businessModels" :key="bm.id" class="ai-bm-row">
                            <!-- Avatar -->
                            <q-avatar size="36px" class="ai-bm-avatar" :style="{ background: avatarColor(bm.name) }">
                                <span class="ai-bm-avatar-text">{{ bm.name.charAt(0).toUpperCase() }}</span>
                            </q-avatar>

                            <!-- Name & description -->
                            <div class="ai-bm-info">
                                <span class="ai-bm-name">{{ bm.name }}</span>
                                <span v-if="bm.description" class="ai-bm-description">{{ bm.description }}</span>
                            </div>

                            <!-- Controls -->
                            <div class="ai-bm-controls">
                                <!-- Gold queries badge + button -->
                                <q-btn flat round dense size="sm" class="ai-bm-gq-btn" :title="$t('managers.ai.goldQueries.editTitle')" @click.stop="openGoldQueriesDialog(bm)">
                                                    <q-icon name="code" size="18px" :color="goldQueriesCount(bm.id) > 0 ? 'primary' : 'grey-5'" />
                                    <q-badge v-if="goldQueriesCount(bm.id) > 0" color="primary" floating transparent>
                                        {{ goldQueriesCount(bm.id) }}
                                    </q-badge>
                                    <q-tooltip>{{ $t('managers.ai.goldQueries.editTitle') }} ({{ goldQueriesCount(bm.id) }})</q-tooltip>
                                </q-btn>

                                <!-- Toggle -->
                                <q-toggle v-model="bmEnabled[bm.id]" color="primary" dense :title="$t('managers.ai.businessModels.enabledToggle')" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right column: AI Engine -->
            <div class="ai-engine-column">
                <!-- Hint card -->
                <div class="ai-hint-card q-mb-md">
                    <q-icon name="info_outline" size="16px" color="primary" class="q-mr-sm" />
                    <span class="ai-hint-text">{{ $t('managers.ai.hint') }}</span>
                </div>

                <!-- Engine card -->
                <q-card class="ai-engine-card" flat bordered>
                    <div class="ai-engine-header">
                        <q-icon name="smart_toy" size="56px" class="ai-engine-icon" />
                        <span class="ai-engine-label">AI Engine</span>
                    </div>

                    <q-separator />

                    <q-card-section class="q-pa-md">
                        <div class="ai-status-row">
                            <q-icon :name="statusIcon" :color="statusColor" size="16px" />
                            <span class="ai-status-label text-uppercase">{{ $t('common.lastChangeDate') }}</span>
                        </div>
                        <div class="ai-status-value q-mt-xs">
                            <span v-if="loading" class="row items-center text-grey-5">
                                <q-spinner size="14px" color="primary" class="q-mr-xs" />
                                {{ $t('common.status') }}…
                            </span>
                            <span v-else class="text-weight-medium">{{ update || $t('common.never') }}</span>
                        </div>
                    </q-card-section>

                    <template v-if="store.isEnterprise && store.configurations['KNOWAGE.AI.URL']">
                        <q-separator />
                        <q-card-actions class="q-pa-md">
                            <q-btn color="primary" unelevated :disable="loading" class="full-width ai-sync-btn" @click.stop="syncronize">
                                <q-icon :name="loading ? 'hourglass_empty' : 'sync'" :class="{ 'ai-spin': loading }" class="q-mr-sm" />
                                {{ $t('managers.ai.syncronize') }}
                            </q-btn>
                        </q-card-actions>
                    </template>
                </q-card>

                <!-- Error banner -->
                <q-banner v-if="updateError" rounded class="bg-warning q-mt-md">
                    <template v-slot:avatar><q-icon name="warning" color="white" /></template>
                    <span class="text-white text-body2">{{ updateError }}</span>
                    <template v-slot:action>
                        <q-btn flat color="white" icon="close" round dense size="sm" @click="updateError = null" />
                    </template>
                </q-banner>

                <!-- BM Sync card -->
                <q-card v-if="store.isEnterprise && store.configurations['KNOWAGE.AI.URL']" class="ai-engine-card q-mt-md" flat bordered>
                    <div class="ai-engine-header ai-engine-header--bm">
                        <q-icon name="hub" size="56px" class="ai-engine-icon" />
                        <span class="ai-engine-label">{{ $t('managers.ai.businessModels.title') }}</span>
                    </div>

                    <q-separator />

                    <q-card-section class="q-pa-md">
                        <div class="ai-status-row">
                            <q-icon :name="bmSyncStatusIcon" :color="bmSyncStatusColor" size="16px" />
                            <span class="ai-status-label text-uppercase">{{ $t('common.lastChangeDate') }}</span>
                        </div>
                        <div class="ai-status-value q-mt-xs">
                            <span v-if="bmSyncLoading" class="row items-center text-grey-5">
                                <q-spinner size="14px" color="secondary" class="q-mr-xs" />
                                {{ $t('common.status') }}…
                            </span>
                            <span v-else class="text-weight-medium">{{ bmSyncUpdate || $t('common.never') }}</span>
                        </div>
                    </q-card-section>

                    <q-separator />
                    <q-card-actions class="q-pa-md">
                        <q-btn color="secondary" unelevated :disable="bmSyncLoading || syncingBm" class="full-width ai-sync-btn" @click.stop="syncronizeBusinessModels">
                            <q-icon :name="syncingBm ? 'hourglass_empty' : 'sync'" :class="{ 'ai-spin': syncingBm }" class="q-mr-sm" />
                            {{ $t('managers.ai.businessModels.syncronize') }}
                        </q-btn>
                    </q-card-actions>
                </q-card>

                <!-- BM Sync error banner -->
                <q-banner v-if="bmSyncError" rounded class="bg-warning q-mt-md">
                    <template v-slot:avatar><q-icon name="warning" color="white" /></template>
                    <span class="text-white text-body2">{{ bmSyncError }}</span>
                    <template v-slot:action>
                        <q-btn flat color="white" icon="close" round dense size="sm" @click="bmSyncError = null" />
                    </template>
                </q-banner>
            </div>
        </div>
    </div>

    <!-- Gold Queries Dialog -->
    <AiManagementGoldQueriesDialog
        v-if="goldQueriesDialogVisible && selectedBm"
        :business-model="selectedBm"
        :gold-queries="goldQueriesMap[selectedBm.id] || []"
        @close="goldQueriesDialogVisible = false"
        @saved="onGoldQueriesSaved"
    />
</template>

<script setup lang="ts">
import mainStore from '@/App.store'
import axios from 'axios'
import { computed, onMounted, onUnmounted, ref, Ref } from 'vue'
import AiManagementGoldQueriesDialog from './AiManagementGoldQueriesDialog.vue'
import { iBusinessModel } from '@/modules/managers/businessModelCatalogue/BusinessModelCatalogue'
import { IGoldQuery } from './AiManagement'
import ProgressBar from 'primevue/progressbar'

const store = mainStore()
const polling: Ref<number | null> = ref(null)
const update: Ref<Date | string | null> = ref(null)
const loading: Ref<boolean> = ref(false)
const updateError: Ref<string | null> = ref(null)

const businessModels: Ref<iBusinessModel[]> = ref([])
const loadingBm: Ref<boolean> = ref(false)
const bmEnabled: Ref<Record<number, boolean>> = ref({})
const goldQueriesMap: Ref<Record<number, IGoldQuery[]>> = ref({})
const syncingBm: Ref<boolean> = ref(false)

// BM Sync card state
const bmSyncUpdate: Ref<string | null> = ref(null)
const bmSyncLoading: Ref<boolean> = ref(false)
const bmSyncError: Ref<string | null> = ref(null)

const goldQueriesDialogVisible: Ref<boolean> = ref(false)
const selectedBm: Ref<iBusinessModel | null> = ref(null)

// Palette of soft colours for BM avatars
const AVATAR_PALETTE = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#6366f1']
function avatarColor(name: string): string {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

const statusIcon = computed(() => {
    if (loading.value) return 'hourglass_empty'
    if (updateError.value) return 'error_outline'
    if (update.value) return 'check_circle_outline'
    return 'radio_button_unchecked'
})

const statusColor = computed(() => {
    if (loading.value) return 'primary'
    if (updateError.value) return 'warning'
    if (update.value) return 'positive'
    return 'grey-5'
})

const bmSyncStatusIcon = computed(() => {
    if (bmSyncLoading.value) return 'hourglass_empty'
    if (bmSyncError.value) return 'error_outline'
    if (bmSyncUpdate.value) return 'check_circle_outline'
    return 'radio_button_unchecked'
})

const bmSyncStatusColor = computed(() => {
    if (bmSyncLoading.value) return 'secondary'
    if (bmSyncError.value) return 'warning'
    if (bmSyncUpdate.value) return 'positive'
    return 'grey-5'
})

onMounted(async () => {
    await loadBusinessModels()
    setTimeout(() => {
        if (store.isEnterprise && store.configurations['KNOWAGE.AI.URL']) {
            getLastUpdate()
            //getBmLastUpdate()
        }
    }, 2000)
    polling.value = setInterval(() => {
        if (store.isEnterprise && store.configurations['KNOWAGE.AI.URL']) {
            getLastUpdate()
            //getBmLastUpdate()
        }
    }, 10000)
})

onUnmounted(() => {
    if (polling.value) { clearInterval(polling.value); polling.value = null }
})

async function loadBusinessModels() {
    loadingBm.value = true
    await axios
        .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/businessmodels')
        .then(async (response) => {
            businessModels.value = response.data || []
            businessModels.value.forEach((bm) => { bmEnabled.value[bm.id] = true })
            await Promise.all(businessModels.value.map((bm) => loadGoldQueries(bm.id)))
        })
        .finally(() => { loadingBm.value = false })
}

async function loadGoldQueries(bmId: number) {
    await axios
        .get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/eng-gpt-data/${bmId}`)
        .then((response) => {
            const data = response.data
            goldQueriesMap.value[bmId] = Array.isArray(data?.sql_gold) ? data.sql_gold : Array.isArray(data) ? data : []
        })
        .catch(() => { goldQueriesMap.value[bmId] = [] })
}

function goldQueriesCount(bmId: number): number {
    return goldQueriesMap.value[bmId]?.length ?? 0
}

function openGoldQueriesDialog(bm: iBusinessModel) {
    selectedBm.value = bm
    goldQueriesDialogVisible.value = true
}

function onGoldQueriesSaved(queries: IGoldQuery[]) {
    if (selectedBm.value) goldQueriesMap.value[selectedBm.value.id] = queries
    goldQueriesDialogVisible.value = false
}

async function syncronizeBusinessModels() {
    syncingBm.value = true
    const enabledIds = Object.keys(bmEnabled.value).filter((id) => bmEnabled.value[Number(id)]).map(Number)
    await axios
        .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/PLACEHOLDER_SYNC_BM_AI', {
            tenant: store.user.organization,
            token: localStorage.getItem('token'),
            businessModelIds: enabledIds
        })
        .then(() => { getBmLastUpdate() })
        .catch((error) => { bmSyncError.value = error?.message || 'Sync failed' })
        .finally(() => { syncingBm.value = false })
}

function getBmLastUpdate() {
    bmSyncLoading.value = true
    axios
        .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/PLACEHOLDER_BM_SYNC_STATUS', {
            tenant: store.user.organization,
            token: localStorage.getItem('token')
        })
        .then((response) => {
            if (response.data?.status === 'Loaded') bmSyncUpdate.value = response.data?.data?.lastUpdate
            else if (response.data?.status === 'Error') bmSyncError.value = response.data?.data?.error?.description
            bmSyncLoading.value = response.data?.status === 'In process'
        })
        .catch(() => { bmSyncLoading.value = false })
}

async function syncronize() {
    loading.value = true
    await axios.get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/folders`).then((response) => {
        const root = response.data.root[0]
        const folder = root.children.find((folder: any) => folder.label === 'ai')
        const folderKey = folder ? folder.key : ''
        axios
            .post(store.configurations['KNOWAGE.AI.URL'] + '/load_data', {
                tenant: store.user.organization,
                token: localStorage.getItem('token'),
                urlExcel: { key: folderKey, selectedFilesNames: ['ai.xlsx'] }
            })
            .then(() => { getLastUpdate() })
            .catch((error) => { console.error(error) })
    })
}

function getLastUpdate() {
    axios
        .post(store.configurations['KNOWAGE.AI.URL'] + '/last_update', {
            tenant: store.user.organization,
            token: localStorage.getItem('token')
        })
        .then((response) => {
            if (response.data.status === 'Loaded') update.value = response.data.data.lastKBUpdate
            else if (response.data.status === 'Error') updateError.value = response.data.data.error.description
            loading.value = response.data.status === 'In process'
        })
        .catch((error) => { updateError.value = error.data || 'No data available' })
}
</script>

<style scoped lang="scss">
.ai-management-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.ai-management-body {
    display: flex;
    gap: 20px;
    padding: 20px;
    flex: 1;
    overflow: hidden;
    align-items: flex-start;
}

/* ── Left column: BM list ─────────────── */
.ai-bm-column {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
}

.ai-section-card {
    background: #fff;
    border: 1px solid #e0e4ea;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.ai-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: #fafbfc;
}

.ai-section-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.ai-section-icon {
    color: var(--q-primary);
    opacity: 0.85;
}

.ai-section-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: #333;
}

.ai-sync-bm-btn {
    font-size: 0.78rem;
    font-weight: 600;
}

.ai-bm-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px 20px;
}

.ai-bm-list {
    display: flex;
    flex-direction: column;
}

.ai-bm-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 18px;
    border-bottom: 1px solid #f0f2f6;
    transition: background 0.12s ease;
    &:last-child {
        border-bottom: none;
    }
    &:hover {
        background: #f7f9ff;
    }
}

.ai-bm-avatar {
    flex-shrink: 0;
    border-radius: 8px !important;
}

.ai-bm-avatar-text {
    color: white;
    font-weight: 700;
    font-size: 0.9rem;
}

.ai-bm-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.ai-bm-name {
    font-size: 0.88rem;
    font-weight: 600;
    color: #222;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ai-bm-description {
    font-size: 0.78rem;
    color: #888;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ai-bm-controls {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
}

.ai-bm-gq-btn {
    position: relative;
}

/* ── Right column: AI engine ──────────── */
.ai-engine-column {
    width: 280px;
    flex-shrink: 0;
}

.ai-hint-card {
    display: flex;
    align-items: flex-start;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 0.78rem;
    color: #1e40af;
    line-height: 1.5;
}

.ai-hint-text {
    flex: 1;
}

.ai-engine-card {
    border-radius: 10px;
    overflow: hidden;
}

.ai-engine-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 28px 20px 20px;
    background: var(--q-primary);
    background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0.15) 100%);
    color: white;
    gap: 8px;
    &--bm {
        background: var(--q-secondary, #26a69a);
        background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0.15) 100%);
    }
}

.ai-engine-icon {
    color: rgba(255, 255, 255, 0.92);
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.25));
}

.ai-engine-label {
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.3px;
}

.ai-status-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
}

.ai-status-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #888;
    letter-spacing: 0.5px;
}

.ai-status-value {
    font-size: 0.88rem;
    padding-left: 22px;
}

.ai-sync-btn {
    font-weight: 600;
    letter-spacing: 0.4px;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}
.ai-spin {
    animation: spin 1.2s linear infinite;
}

/* ── Responsive ─────────────────────────── */
@media (max-width: 768px) {
    // Page scrolls vertically instead of clipping inner columns
    .ai-management-page {
        overflow-y: auto;
        overflow-x: hidden;
    }

    // Body stacks columns, lets its children take natural height
    .ai-management-body {
        flex-direction: column;
        overflow: visible;
        flex: none;
        align-items: stretch;
        padding: 12px;
        gap: 12px;
    }

    // BM list: natural height, no inner scroll
    .ai-bm-column {
        overflow-y: visible;
        flex: none;
    }

    .ai-engine-column {
        width: 100%;
    }

    .ai-section-header {
        flex-wrap: wrap;
        gap: 8px;
    }
}
</style>


