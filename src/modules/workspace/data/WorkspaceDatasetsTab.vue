<template>
    <div class="kn-ws-tab column no-wrap" data-ws-tab="datasets">
        <!-- kept alive: only the shown tab puts its New button in the shell -->
        <Teleport v-if="tabActive" defer to="#kn-ws-new-slot">
            <q-btn unelevated no-caps color="primary" icon="sym_o_upload_file" :label="$t('workspace.uploadFile')" class="kn-ws-new" data-ws="new" data-tour-id="ws-new" @click="openWizard(null)" />
        </Teleport>

        <!-- reload bar: right under the tabs, full width; the first load shows the skeleton instead -->
        <div class="kn-ws-progress-slot">
            <q-linear-progress v-if="store.datasetsLoading && scopeRows !== null" indeterminate color="primary" />
        </div>

        <WorkspaceToolbar :scope="query.scope" :scope-options="scopeOptions" :search="query.q" :search-placeholder="$t('workspace.search.data')" @update:scope="update({ scope: $event as any })" @update:search="update({ q: $event })">
            <template #filters>
                <WorkspaceFiltersButton :groups="filterGroups" @toggle="onFilterToggle" @clear="update({ dstype: [], category: [] })" />
            </template>
        </WorkspaceToolbar>

        <div class="col column no-wrap kn-ws-body">
            <KnHint v-if="dataEmpty" class="col" title="workspace.empty.dataTitle" hint="workspace.empty.dataHint" data-ws="empty" />
            <WorkspaceDataTable v-else :rows="rows" :loading="scopeRows === null" column-set="datasets" :actions="actions" data-tour-id="ws-list" @open="openDrawer" @clear="clearAll" />
        </div>

        <WorkspaceDrawer v-model="drawerOpen">
            <WorkspaceDataDrawer :row="drawerRow" :actions="actions" />
        </WorkspaceDrawer>

        <WorkspaceDrawer v-model="exportState.open">
            <div class="col relative-position" data-ws="export-parameters">
                <KnParameterSidebar v-if="exportState.open && exportState.dataset" class="kn-overflow-y" :filters-data="exportState.filtersData" :prop-document="exportState.dataset" prop-mode="workspaceView" :prop-q-b-e-parameters="exportState.dataset.pars" :user-role="userRole" :dataset="exportState.dataset" @execute="onExportExecute" @role-changed="onExportRoleChange" />
            </div>
        </WorkspaceDrawer>

        <WorkspaceDatasetWizard v-if="wizard.open" :visible="wizard.open" :selected-dataset="wizard.dataset" @close-dialog="wizard.open = false" @close-dialog-and-reload="onWizardSaved" />
        <WorkspaceDataCloneDialog v-model="cloneState.open" :prop-dataset="cloneState.dataset" @cloned="reload" />
        <WorkspaceDataPreviewDialog v-if="previewState.open && previewState.roles" :visible="previewState.open" :prop-dataset="previewState.dataset" preview-type="workspace" :correct-roles-for-execution="previewState.roles" @close="previewState.open = false" />
        <QBE v-if="qbeState.open" :visible="qbeState.open" :dataset="qbeState.dataset" :source-dataset="qbeState.sourceDataset" @close="closeQbe" @query-saved="qbeSaved = true" @dataset-saved="qbeSaved = true" />
    </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import mainStore from '@/App.store'
import KnHint from '@/components/UI/KnHint.vue'
import KnParameterSidebar from '@/components/UI/KnParameterSidebar/KnParameterSidebar.vue'
import QBE from '@/modules/qbe/QBE.vue'
import useWorkspaceStore from '../workspace.store'
import { WsDataRow, WsDataScope } from '../Workspace'
import * as api from '../workspaceApi'
import { filterData } from '../workspaceHelpers'
import { useWorkspaceQuery } from '../common/useWorkspaceQuery'
import WorkspaceDrawer from '../common/WorkspaceDrawer.vue'
import WorkspaceFiltersButton, { WsFilterGroup } from '../common/WorkspaceFiltersButton.vue'
import WorkspaceToolbar, { WsScopeOption } from '../common/WorkspaceToolbar.vue'
import WorkspaceDataPreviewDialog from '../views/dataView/dialogs/WorkspaceDataPreviewDialog.vue'
import { formatDrivers, getFormattedDrivers } from './datasetHelpers'
import { useDataActions } from './useDataActions'
import WorkspaceDatasetWizard from './datasetWizard/WorkspaceDatasetWizard.vue'
import WorkspaceDataCloneDialog from './WorkspaceDataCloneDialog.vue'
import WorkspaceDataDrawer from './WorkspaceDataDrawer.vue'
import WorkspaceDataTable from './WorkspaceDataTable.vue'

const { t } = useI18n()
const appStore = mainStore()
const store = useWorkspaceStore()

const tabActive = ref(true)
// a list dropped while the tab was hidden (QBE saved from a model) loads again
onActivated(() => {
    tabActive.value = true
    load()
})
onDeactivated(() => (tabActive.value = false))

const {
    state: query,
    update,
    toggleInList
} = useWorkspaceQuery({
    scope: { param: 'scope', kind: 'enum', values: ['all', 'mine', 'available'], default: 'all' },
    dstype: { param: 'dstype', kind: 'list' },
    category: { param: 'category', kind: 'list' },
    q: { param: 'q', kind: 'string' }
} as const)

const userRole = computed(() => (appStore.user?.sessionRole !== t('role.defaultRolePlaceholder') ? appStore.user?.sessionRole : null))

const scopeOptions: WsScopeOption[] = [
    { value: 'all', labelKey: 'workspace.scope.all' },
    { value: 'mine', labelKey: 'workspace.scope.mine', icon: 'sym_o_person' },
    { value: 'available', labelKey: 'workspace.scope.available', icon: 'sym_o_domain' }
]

const scope = computed(() => query.value.scope as WsDataScope)
const scopeRows = computed(() => store.datasets[scope.value])
const filters = computed(() => ({ dsTypes: query.value.dstype, categories: query.value.category, q: query.value.q }))
const rows = computed(() => [...filterData(scopeRows.value ?? [], filters.value)].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })))
const dataEmpty = computed(() => scope.value === 'all' && scopeRows.value !== null && scopeRows.value.length === 0 && !filters.value.q)

const countBy = (predicate: (row: WsDataRow) => boolean) => (scopeRows.value ?? []).filter(predicate).length

// The counts are for the current scope, before the filters (spec 6.2).
const filterGroups = computed<WsFilterGroup[]>(() => {
    const all = scopeRows.value ?? []
    const groups: WsFilterGroup[] = []
    const types = [...new Set([...all.map((r) => r.dsTypeCd ?? ''), ...query.value.dstype])].filter(Boolean).sort()
    groups.push({ id: 'dstype', labelKey: 'workspace.filter.datasetType', options: types.map((type) => ({ value: type, label: type, count: countBy((r) => r.dsTypeCd === type), selected: query.value.dstype.includes(type) })) })
    const categories = [...new Set([...all.map((r) => r.category ?? ''), ...query.value.category])].filter(Boolean).sort()
    groups.push({ id: 'category', labelKey: 'workspace.filter.category', options: categories.map((category) => ({ value: category, label: category, count: countBy((r) => r.category === category), selected: query.value.category.includes(category) })) })
    return groups
})

function onFilterToggle(groupId: string, value: string) {
    if (groupId === 'dstype') toggleInList('dstype', value)
    else if (groupId === 'category') toggleInList('category', value)
}

const clearAll = () => update({ scope: 'all', dstype: [], category: [], q: '' })

// Each list is loaded once per visit; changes the page makes reload it (spec 5.4, 8.1).
const load = (force = false) => store.loadDatasets(scope.value, appStore.user?.userId, force).catch(() => {})
function reload() {
    store.invalidateData()
    load(true)
    if (scope.value !== 'all') store.loadDatasets('all', appStore.user?.userId).catch(() => {})
}
watch(scope, () => load())
onMounted(() => load())

// ---------- Drawer and overlays (an overlay opened from the drawer closes it) ----------

const drawerOpen = ref(false)
const drawerKey = ref<string | null>(null)
const drawerRow = computed(() => (scopeRows.value ?? []).find((r) => r.key === drawerKey.value) ?? null)
function openDrawer(row: WsDataRow) {
    drawerKey.value = row.key
    drawerOpen.value = true
}

const wizard = reactive({ open: false, dataset: null as any })
const cloneState = reactive({ open: false, dataset: null as any })
const previewState = reactive({ open: false, dataset: null as any, roles: null as string[] | null })
const qbeState = reactive({ open: false, dataset: null as any, sourceDataset: null as any })
const exportState = reactive({ open: false, dataset: null as any, filtersData: {} as any, format: 'csv' as 'xls' | 'csv' })
const qbeSaved = ref(false)

function openWizard(dataset: any | null) {
    drawerOpen.value = false
    Object.assign(wizard, { open: true, dataset: dataset ?? {} })
}
function onWizardSaved() {
    wizard.open = false
    reload()
}
// QBE.vue emits querySaved when a dataset is saved: the list reloads when it closes (spec 8.2).
function closeQbe() {
    qbeState.open = false
    if (qbeSaved.value) reload()
    qbeSaved.value = false
}

async function onExportExecute(parameters: any, drivers: any) {
    try {
        await actions.exportNow(exportState.dataset, exportState.format, { drivers: getFormattedDrivers(drivers), parameters })
    } catch {
        // the interceptor shows the error
    } finally {
        exportState.open = false
    }
}
async function onExportRoleChange(role: string) {
    const filtersData = await api.getDatasetFilters(exportState.dataset.label, role).catch(() => ({}))
    if (filtersData.filterStatus) filtersData.filterStatus = filtersData.filterStatus.filter((filter: any) => filter.id)
    formatDrivers(filtersData)
    exportState.filtersData = filtersData
}

const actions = useDataActions({
    openPreview: (dataset, roles) => {
        drawerOpen.value = false
        Object.assign(previewState, { open: true, dataset, roles })
    },
    openWizard,
    openClone: (dataset) => {
        drawerOpen.value = false
        Object.assign(cloneState, { open: true, dataset })
    },
    openQbe: ({ dataset, sourceDataset }) => {
        drawerOpen.value = false
        Object.assign(qbeState, { open: true, dataset, sourceDataset })
    },
    openExportParameters: (dataset, filtersData, format) => {
        drawerOpen.value = false
        Object.assign(exportState, { open: true, dataset, filtersData, format })
    },
    reload
})
</script>
