<template>
    <div class="kn-ws-tab column no-wrap" data-ws-tab="models">
        <!-- reload bar: right under the tabs, full width; the first load shows the skeleton instead -->
        <div class="kn-ws-progress-slot">
            <q-linear-progress v-if="store.modelsLoading && store.models !== null" indeterminate color="primary" />
        </div>

        <!-- no scope control: business models are never "Mine" (spec 6.1) -->
        <WorkspaceToolbar scope="" :scope-options="[]" :search="query.q" :search-placeholder="$t('workspace.search.data')" @update:search="update({ q: $event })">
            <template #filters>
                <WorkspaceFiltersButton :groups="filterGroups" @toggle="(_group, value) => toggleInList('category', value)" @clear="update({ category: [] })" />
            </template>
        </WorkspaceToolbar>

        <div class="col column no-wrap kn-ws-body">
            <KnHint v-if="modelsEmpty" class="col" title="workspace.empty.modelsTitle" hint="workspace.empty.modelsHint" data-ws="empty" />
            <WorkspaceDataTable v-else :rows="rows" :loading="store.models === null" column-set="models" :actions="actions" data-tour-id="ws-list" @open="openDrawer" @clear="clearAll" />
        </div>

        <WorkspaceDrawer v-model="drawerOpen">
            <WorkspaceDataDrawer :row="drawerRow" :actions="actions" />
        </WorkspaceDrawer>

        <QBE v-if="qbeState.open" :visible="qbeState.open" :dataset="qbeState.dataset" :source-dataset="qbeState.sourceDataset" @close="closeQbe" @query-saved="qbeSaved = true" @dataset-saved="qbeSaved = true" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import mainStore from '@/App.store'
import KnHint from '@/components/UI/KnHint.vue'
import QBE from '@/modules/qbe/QBE.vue'
import useWorkspaceStore from '../workspace.store'
import { filterData } from '../workspaceHelpers'
import { WsDataRow } from '../Workspace'
import { useWorkspaceQuery } from '../common/useWorkspaceQuery'
import WorkspaceDrawer from '../common/WorkspaceDrawer.vue'
import WorkspaceFiltersButton, { WsFilterGroup } from '../common/WorkspaceFiltersButton.vue'
import WorkspaceToolbar from '../common/WorkspaceToolbar.vue'
import { useDataActions } from './useDataActions'
import WorkspaceDataDrawer from './WorkspaceDataDrawer.vue'
import WorkspaceDataTable from './WorkspaceDataTable.vue'

// The Business models tab (spec 8.1, round 2): Category filter, Open in QBE.
const store = useWorkspaceStore()
const appStore = mainStore()

const {
    state: query,
    update,
    toggleInList
} = useWorkspaceQuery({
    category: { param: 'category', kind: 'list' },
    q: { param: 'q', kind: 'string' }
} as const)

const allRows = computed(() => store.models ?? [])
const rows = computed(() => [...filterData(allRows.value, { dsTypes: [], categories: query.value.category, q: query.value.q })].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })))
const modelsEmpty = computed(() => store.models !== null && store.models.length === 0)

// The counts are before the filters (spec 6.2).
const filterGroups = computed<WsFilterGroup[]>(() => {
    const categories = [...new Set([...allRows.value.map((r) => r.category ?? ''), ...query.value.category])].filter(Boolean).sort()
    return [{ id: 'category', labelKey: 'workspace.filter.category', options: categories.map((category) => ({ value: category, label: category, count: allRows.value.filter((r) => r.category === category).length, selected: query.value.category.includes(category) })) }]
})

const clearAll = () => update({ category: [], q: '' })

onMounted(() => store.loadModels().catch(() => {}))

// ---------- Drawer and QBE (QBE opened from the drawer closes it) ----------

const drawerOpen = ref(false)
const drawerKey = ref<string | null>(null)
const drawerRow = computed(() => allRows.value.find((r) => r.key === drawerKey.value) ?? null)
function openDrawer(row: WsDataRow) {
    drawerKey.value = row.key
    drawerOpen.value = true
}

const qbeState = reactive({ open: false, dataset: null as any, sourceDataset: null as any })
const qbeSaved = ref(false)
// A dataset saved from a model belongs to the Datasets tab: its lists load again on the next visit.
function closeQbe() {
    qbeState.open = false
    if (qbeSaved.value) {
        store.invalidateData()
        store.loadDatasets('all', appStore.user?.userId).catch(() => {})
    }
    qbeSaved.value = false
}

const noop = () => {}
const actions = useDataActions({
    openPreview: noop,
    openWizard: noop,
    openClone: noop,
    openExportParameters: noop,
    openQbe: ({ dataset, sourceDataset }) => {
        drawerOpen.value = false
        Object.assign(qbeState, { open: true, dataset, sourceDataset })
    },
    reload: () => store.loadModels(true).catch(() => {})
})
</script>
