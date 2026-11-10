<template>
    <!-- Built from the My workspace parts (spec D2): header, toolbar, table frame, row menu, dialog. -->
    <div class="kn-ws column no-wrap kn-mgr">
        <div class="kn-ws-header">
            <div class="row items-center no-wrap kn-ws-title-row kn-mgr__title-row">
                <h1 class="kn-ws-title" data-ws="title">{{ $t('managers.configurationManagement.title') }}</h1>
                <span class="kn-mgr__tenant" data-tour-id="mgr-tenant">
                    <q-icon name="sym_o_public" size="15px" />{{ $t('managers.configurationManagement.allTenants') }}
                    <q-tooltip :delay="300">{{ $t('managers.configurationManagement.allTenantsHint') }}</q-tooltip>
                </span>
                <q-space />
                <q-btn unelevated no-caps color="primary" icon="add" :label="$t('managers.configurationManagement.newSetting')" class="kn-ws-new" data-ws="new" data-tour-id="mgr-new" @click="openDialog(null)" />
            </div>
        </div>

        <div class="kn-ws-tab column no-wrap col">
            <div class="kn-ws-progress-slot">
                <q-linear-progress v-if="loading && loaded" indeterminate color="primary" />
            </div>

            <WorkspaceToolbar scope="" :scope-options="[]" :search="query.q" :search-placeholder="$t('managers.configurationManagement.searchPlaceholder')" @update:search="update({ q: $event })">
                <template #filters>
                    <WorkspaceFiltersButton
                        :groups="categoryGroups"
                        searchable
                        :search-placeholder="$t('managers.configurationManagement.searchCategories')"
                        icon="sym_o_category"
                        :label="$t('managers.configurationManagement.allCategories')"
                        :active-label="activeCategoryLabel"
                        :clearable="false"
                        data-ws="category"
                        tour-id="mgr-group"
                        @toggle="(_group, value) => update({ category: value === query.category ? '' : value })"
                    />
                    <WorkspaceFiltersButton :groups="filterGroups" tour-id="mgr-filters" @toggle="(group, value) => toggleInList(group as 'status' | 'value', value)" @clear="update({ status: [], value: [] })" />
                </template>
            </WorkspaceToolbar>

            <div class="col column no-wrap kn-ws-body">
                <WorkspaceTableFrame v-slot="{ scrollTarget }" :skeleton="loading && !loaded" :columns="visibleColumnDefs" data-tour-id="mgr-list">
                    <q-table class="kn-ws-table" flat dense virtual-scroll :virtual-scroll-target="scrollTarget" :hide-bottom="rows.length > 0" binary-state-sort :rows-per-page-options="[0]" :rows="rows" :columns="columns" :visible-columns="visibleColumns" row-key="id" @row-click="(_evt, row) => openDialog(row)">
                        <template #body-cell-name="props">
                            <q-td :props="props" class="kn-mgr__cell">
                                <div class="row items-center no-wrap kn-ws-name">
                                    <span class="kn-ws-name__icon"><q-icon :name="categoryIcon(props.row.category)" size="18px" /></span>
                                    <div class="column no-wrap kn-ws-name__text">
                                        <span class="kn-ws-name__title ellipsis">{{ props.row.name || props.row.label }}</span>
                                        <span class="kn-ws-name__sub ellipsis kn-mgr__mono">{{ props.row.label }}</span>
                                    </div>
                                </div>
                            </q-td>
                        </template>
                        <template #body-cell-value="props">
                            <q-td :props="props" class="kn-mgr__cell">
                                <span v-if="!props.row.valueCheck" class="kn-mgr__empty">{{ $t('managers.configurationManagement.empty') }}</span>
                                <span v-else-if="isPasswordLabel(props.row.label)" class="kn-mgr__mono">••••••••</span>
                                <span v-else class="ellipsis block kn-mgr__mono">
                                    {{ props.row.valueCheck }}
                                    <q-tooltip v-if="props.row.valueCheck.length > 40" :delay="400" max-width="480px" class="kn-mgr__tooltip">{{ props.row.valueCheck }}</q-tooltip>
                                </span>
                            </q-td>
                        </template>
                        <template #body-cell-category="props">
                            <q-td :props="props">
                                <span class="kn-ws-tag ellipsis">{{ categoryName(groupOf(props.row)) }}</span>
                            </q-td>
                        </template>
                        <template #body-cell-status="props">
                            <q-td :props="props">
                                <span v-if="props.row.active" class="kn-ws-muted">{{ $t('common.active') }}</span>
                                <span v-else class="kn-ws-tag kn-mgr__tag-off">{{ $t('common.inactive') }}</span>
                            </q-td>
                        </template>
                        <template #body-cell-actions="props">
                            <q-td :props="props" auto-width class="kn-ws-actions" :class="{ 'kn-ws-actions--open': menuOpenId === props.row.id }">
                                <WorkspaceActionMenu :row-key="String(props.row.id)" :actions="rowActions(props.row)" @show="menuOpenId = props.row.id" @hide="menuOpenId = null" />
                            </q-td>
                        </template>
                        <template #no-data>
                            <div class="full-width row items-center justify-center kn-ws-no-data">
                                <span>{{ $t('managers.configurationManagement.noMatch') }}</span>
                                <q-btn flat no-caps color="primary" class="q-ml-sm" :label="$t('workspace.clearFilters')" @click="clearAll" />
                            </div>
                        </template>
                    </q-table>
                </WorkspaceTableFrame>
            </div>
        </div>

        <ConfigurationManagementDialog v-model="dialog.open" :row="dialog.row" :categories="categories" :labels="labels" @saved="loadSettings" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import axios from 'axios'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import mainStore from '@/App.store'
import { usePageTour } from '@/composables/usePageTour'
import '@/modules/workspace/workspace.scss'
import '../managerListPage.scss'
import WorkspaceToolbar from '@/modules/workspace/common/WorkspaceToolbar.vue'
import WorkspaceFiltersButton, { WsFilterGroup } from '@/modules/workspace/common/WorkspaceFiltersButton.vue'
import WorkspaceTableFrame from '@/modules/workspace/common/WorkspaceTableFrame.vue'
import WorkspaceActionMenu, { WsAction } from '@/modules/workspace/common/WorkspaceActionMenu.vue'
import { useWorkspaceQuery } from '@/modules/workspace/common/useWorkspaceQuery'
import { iConfiguration } from './ConfigurationManagement'
import { categoryIcon, categoryLabel, countBy, filterSettings, groupOf, inCategory, isPasswordLabel, matchesSearch, sortByName, statusTest, valueTest, visibleSettings } from './configurationManagementHelpers'
import ConfigurationManagementDialog from './ConfigurationManagementDialog.vue'
import { startConfigurationTour } from './ConfigurationManagementTour'

const API = import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/configs'

const { t } = useI18n()
const $q = useQuasar()
const appStore = mainStore()

usePageTour(() => startConfigurationTour(t))

const { state: query, update, toggleInList } = useWorkspaceQuery({
    category: { param: 'category', kind: 'string' },
    status: { param: 'status', kind: 'list', values: ['on', 'off'] },
    value: { param: 'value', kind: 'list', values: ['set', 'empty'] },
    q: { param: 'q', kind: 'string' }
} as const)

const settings = ref<iConfiguration[]>([])
const loading = ref(false)
const loaded = ref(false)
const menuOpenId = ref<number | null>(null)
const dialog = reactive({ open: false, row: null as iConfiguration | null })

const categoryName = (category: string) => categoryLabel(category, t('managers.configurationManagement.uncategorized'))
const rows = computed(() => sortByName(filterSettings(settings.value, query.value)))
const categories = computed(() => [...new Set(settings.value.map((row) => row.category).filter((category) => !!category))].sort((a, b) => a.localeCompare(b)))
const labels = computed(() => settings.value.map((row) => row.label))

// ---------- Group button and Filters (spec 6.3, 6.4) ----------

const categoryGroups = computed<WsFilterGroup[]>(() => {
    const counts = new Map<string, number>()
    settings.value.forEach((row) => counts.set(groupOf(row), (counts.get(groupOf(row)) ?? 0) + 1))
    const options = [...counts.entries()].map(([value, count]) => ({ value, label: categoryName(value), count, selected: query.value.category === value })).sort((a, b) => a.label.localeCompare(b.label))
    return [
        {
            id: 'category',
            labelKey: 'common.category',
            single: true,
            noneValue: '',
            options: [{ value: '', label: t('managers.configurationManagement.allCategories'), count: settings.value.length, selected: !query.value.category }, ...options]
        }
    ]
})
const activeCategoryLabel = computed(() => (query.value.category && settings.value.some((row) => groupOf(row) === query.value.category) ? categoryName(query.value.category) : undefined))

// counts are for the current category and search, before the filters (Workspace rule)
const scoped = computed(() => settings.value.filter((row) => inCategory(row, query.value.category) && matchesSearch(row, query.value.q)))
const filterGroups = computed<WsFilterGroup[]>(() => [
    {
        id: 'status',
        labelKey: 'managers.configurationManagement.filter.status',
        options: [
            { value: 'on', label: t('common.active'), count: countBy(scoped.value, statusTest('on')), selected: query.value.status.includes('on') },
            { value: 'off', label: t('common.inactive'), count: countBy(scoped.value, statusTest('off')), selected: query.value.status.includes('off') }
        ]
    },
    {
        id: 'value',
        labelKey: 'managers.configurationManagement.filter.value',
        options: [
            { value: 'set', label: t('managers.configurationManagement.filter.hasValue'), count: countBy(scoped.value, valueTest('set')), selected: query.value.value.includes('set') },
            { value: 'empty', label: t('managers.configurationManagement.filter.emptyValue'), count: countBy(scoped.value, valueTest('empty')), selected: query.value.value.includes('empty') }
        ]
    }
])

const clearAll = () => update({ category: '', status: [], value: [], q: '' })

// ---------- Table ----------

const columns = computed(() => [
    { name: 'name', label: t('common.name'), field: (row: iConfiguration) => row.name || row.label, align: 'left' as const, sortable: true, sort: (a: string, b: string) => (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base', numeric: true }) },
    { name: 'value', label: t('common.value'), field: 'valueCheck', align: 'left' as const },
    { name: 'category', label: t('common.category'), field: (row: iConfiguration) => categoryName(groupOf(row)), align: 'left' as const, sortable: true },
    { name: 'status', label: t('common.status'), field: 'active', align: 'left' as const, sortable: true },
    { name: 'actions', label: '', field: 'id', align: 'right' as const }
])
// the Category column only when no category is chosen
const visibleColumns = computed(() => ['name', 'value', 'status', 'actions', ...(query.value.category ? [] : ['category'])])
const visibleColumnDefs = computed(() => columns.value.filter((column) => visibleColumns.value.includes(column.name)))

// ---------- Actions ----------

function openDialog(row: iConfiguration | null) {
    dialog.row = row
    dialog.open = true
}

function rowActions(row: iConfiguration): WsAction[] {
    return [
        { id: 'edit', icon: 'sym_o_edit', labelKey: 'managers.configurationManagement.edit', run: () => openDialog(row) },
        { id: 'copy', icon: 'sym_o_content_copy', labelKey: 'managers.configurationManagement.copyLabel', run: () => copyLabel(row) },
        { id: 'delete', icon: 'sym_o_delete', labelKey: 'managers.configurationManagement.delete', run: () => confirmDelete(row) }
    ]
}

async function copyLabel(row: iConfiguration) {
    try {
        await navigator.clipboard.writeText(row.label)
        appStore.setInfo({ title: t('managers.configurationManagement.copied'), msg: row.label })
    } catch {
        appStore.setError({ title: 'common.error.generic', msg: row.label })
    }
}

function confirmDelete(row: iConfiguration) {
    $q.dialog({
        title: t('managers.configurationManagement.deleteTitle'),
        message: t('managers.configurationManagement.deleteMessage', { label: row.label }),
        cancel: { label: t('common.cancel'), flat: true, noCaps: true },
        ok: { label: t('managers.configurationManagement.delete'), color: 'negative', unelevated: true, noCaps: true },
        persistent: true
    }).onOk(async () => {
        try {
            await axios.delete(`${API}/${row.id}`)
            appStore.setInfo({ title: 'common.toast.deleteTitle', msg: 'common.toast.deleteSuccess' })
            await loadSettings()
        } catch {
            // the axios interceptor shows the error
        }
    })
}

async function loadSettings() {
    loading.value = true
    try {
        const response = await axios.get(API)
        settings.value = visibleSettings(response.data ?? [])
        loaded.value = true
    } finally {
        loading.value = false
    }
}

onMounted(loadSettings)
</script>
