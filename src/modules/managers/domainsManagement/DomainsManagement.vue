<template>
    <!-- Built from the My workspace parts (spec D2), like the Configuration page. -->
    <div class="kn-ws column no-wrap kn-mgr">
        <div class="kn-ws-header">
            <div class="row items-center no-wrap kn-ws-title-row kn-mgr__title-row">
                <h1 class="kn-ws-title" data-ws="title">{{ $t('managers.domainsManagement.title') }}</h1>
                <span class="kn-mgr__tenant" data-tour-id="mgr-tenant">
                    <q-icon name="sym_o_public" size="15px" />{{ $t('managers.configurationManagement.allTenants') }}
                    <q-tooltip :delay="300">{{ $t('managers.domainsManagement.allTenantsHint') }}</q-tooltip>
                </span>
                <q-space />
                <q-btn v-if="canWrite" unelevated no-caps color="primary" icon="add" :label="$t('managers.domainsManagement.newValue')" class="kn-ws-new" data-ws="new" data-tour-id="mgr-new" @click="openDialog(null)" />
            </div>
        </div>

        <div class="kn-ws-tab column no-wrap col">
            <div class="kn-ws-progress-slot">
                <q-linear-progress v-if="loading && loaded" indeterminate color="primary" />
            </div>

            <WorkspaceToolbar scope="" :scope-options="[]" :search="query.q" :search-placeholder="$t('managers.domainsManagement.searchPlaceholder')" @update:search="update({ q: $event })">
                <template #filters>
                    <WorkspaceFiltersButton
                        :groups="domainGroups"
                        searchable
                        :search-placeholder="$t('managers.domainsManagement.searchDomains')"
                        icon="sym_o_list"
                        :label="$t('managers.domainsManagement.allDomains')"
                        :active-label="activeDomainLabel"
                        :clearable="false"
                        data-ws="domain"
                        tour-id="mgr-group"
                        @toggle="(_group, value) => update({ domain: value === query.domain ? '' : value })"
                    />
                    <WorkspaceFiltersButton :groups="filterGroups" tour-id="mgr-filters" @toggle="(_group, value) => toggleInList('name', value)" @clear="update({ name: [] })" />
                </template>
            </WorkspaceToolbar>

            <div class="col column no-wrap kn-ws-body">
                <WorkspaceTableFrame v-slot="{ scrollTarget }" :skeleton="loading && !loaded" :columns="columns" data-tour-id="mgr-list">
                    <q-table class="kn-ws-table" flat dense virtual-scroll :virtual-scroll-target="scrollTarget" :hide-bottom="items.length > 0" :rows-per-page-options="[0]" :rows="items" :columns="columns" :row-key="rowKey">
                        <template #body="props">
                            <q-tr v-if="isBand(props.row)" :props="props" class="kn-ws-group-row" :data-mgr-band="props.row.code">
                                <q-td colspan="100%">
                                    {{ props.row.label }} · <span class="kn-mgr__band-code">{{ props.row.code }}</span> · {{ props.row.count }}
                                </q-td>
                            </q-tr>
                            <q-tr v-else :props="props" class="cursor-pointer" :data-mgr-value="props.row.valueId" @click="openDialog(props.row)">
                                <q-td key="name" :props="props" class="kn-mgr__cell">
                                    <div class="row items-center no-wrap kn-ws-name">
                                        <span class="kn-ws-name__icon" :class="{ 'kn-ws-name__icon--view': nameKind(props.row) === 'missing' }">
                                            <q-icon :name="nameKind(props.row) === 'missing' ? 'sym_o_translate' : 'sym_o_label'" size="18px" />
                                        </span>
                                        <div v-if="nameKind(props.row) === 'missing'" class="column no-wrap kn-ws-name__text">
                                            <span class="kn-ws-name__title ellipsis kn-mgr__mono kn-mgr__missing">{{ props.row.valueName }}</span>
                                            <span class="kn-ws-name__sub ellipsis">{{ $t('managers.domainsManagement.noTranslation') }}</span>
                                        </div>
                                        <div v-else class="column no-wrap kn-ws-name__text">
                                            <span class="kn-ws-name__title ellipsis">{{ displayName(props.row) }}</span>
                                            <span v-if="nameKind(props.row) === 'key'" class="kn-ws-name__sub ellipsis kn-mgr__mono">{{ props.row.valueName }}</span>
                                        </div>
                                    </div>
                                </q-td>
                                <q-td key="code" :props="props" class="kn-mgr__cell">
                                    <span class="kn-ws-tag ellipsis kn-mgr__mono">{{ props.row.valueCd }}</span>
                                </q-td>
                                <q-td key="description" :props="props" class="kn-mgr__cell kn-ws-muted">
                                    <span class="ellipsis block">{{ displayDescription(props.row) }}</span>
                                </q-td>
                                <q-td key="actions" :props="props" auto-width class="kn-ws-actions" :class="{ 'kn-ws-actions--open': menuOpenId === props.row.valueId }" @click.stop>
                                    <WorkspaceActionMenu :row-key="String(props.row.valueId)" :actions="rowActions(props.row)" @show="menuOpenId = props.row.valueId" @hide="menuOpenId = null" />
                                </q-td>
                            </q-tr>
                        </template>
                        <template #no-data>
                            <div class="full-width row items-center justify-center kn-ws-no-data">
                                <span>{{ $t('managers.domainsManagement.noMatch') }}</span>
                                <q-btn flat no-caps color="primary" class="q-ml-sm" :label="$t('workspace.clearFilters')" @click="clearAll" />
                            </div>
                        </template>
                    </q-table>
                </WorkspaceTableFrame>
            </div>
        </div>

        <DomainsManagementDialog v-model="dialog.open" :row="dialog.row" :values="values" :labels="labels" :preset-domain="query.domain" :read-only="!canWrite" @saved="loadValues" />
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
import { iDomain, iDomainBand } from './DomainsManagement'
import { displayDescription, displayName, domainLabels, filterValues, inDomain, isBand, matchesSearch, nameKind, withBands } from './domainsManagementHelpers'
import DomainsManagementDialog from './DomainsManagementDialog.vue'
import { startDomainsTour } from './DomainsManagementTour'

const API = import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/domains'

const { t } = useI18n()
const $q = useQuasar()
const appStore = mainStore()

usePageTour(() => startDomainsTour(t))

const { state: query, update, toggleInList } = useWorkspaceQuery({
    domain: { param: 'domain', kind: 'string' },
    name: { param: 'name', kind: 'list', values: ['key', 'plain', 'missing'] },
    q: { param: 'q', kind: 'string' }
} as const)

const values = ref<iDomain[]>([])
const loading = ref(false)
const loaded = ref(false)
const menuOpenId = ref<number | null>(null)
const dialog = reactive({ open: false, row: null as iDomain | null })

// Reading needs DomainManagement (the route), writing needs DomainWrite (the backend) (spec 10).
const canWrite = computed(() => {
    const user = appStore.user as any
    return !!user?.isSuperadmin || !!user?.functionalities?.includes('DomainWrite')
})

const labels = computed(() => domainLabels(values.value))
const rows = computed(() => filterValues(values.value, query.value))
// "All domains" shows a band in front of each domain (spec D12)
const items = computed<(iDomain | iDomainBand)[]>(() => (query.value.domain ? rows.value : withBands(rows.value, labels.value)))
const rowKey = (item: iDomain | iDomainBand) => (isBand(item) ? item.key : 'v' + item.valueId)

// ---------- Group button and Filters (spec 6.3, 6.4) ----------

const domainGroups = computed<WsFilterGroup[]>(() => {
    const counts = new Map<string, number>()
    values.value.forEach((row) => counts.set(row.domainCode, (counts.get(row.domainCode) ?? 0) + 1))
    const options = [...counts.entries()].map(([value, count]) => ({ value, label: labels.value.get(value) ?? value, count, selected: query.value.domain === value })).sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
    return [
        {
            id: 'domain',
            labelKey: 'managers.domainsManagement.domain',
            single: true,
            noneValue: '',
            options: [{ value: '', label: t('managers.domainsManagement.allDomains'), count: values.value.length, selected: !query.value.domain }, ...options]
        }
    ]
})
const activeDomainLabel = computed(() => (query.value.domain && labels.value.has(query.value.domain) ? labels.value.get(query.value.domain) : undefined))

// counts are for the current domain and search, before the filters (Workspace rule)
const scoped = computed(() => values.value.filter((row) => inDomain(row, query.value.domain) && matchesSearch(row, query.value.q)))
const filterGroups = computed<WsFilterGroup[]>(() => [
    {
        id: 'name',
        labelKey: 'managers.domainsManagement.filter.name',
        options: (['key', 'plain', 'missing'] as const).map((kind) => ({
            value: kind,
            label: t({ key: 'managers.domainsManagement.filter.i18nKey', plain: 'managers.domainsManagement.filter.plainText', missing: 'managers.domainsManagement.filter.missingTranslation' }[kind]),
            count: scoped.value.filter((row) => nameKind(row) === kind).length,
            selected: query.value.name.includes(kind)
        }))
    }
])

const clearAll = () => update({ domain: '', name: [], q: '' })

// ---------- Table ----------

const columns = computed(() => [
    { name: 'name', label: t('common.name'), field: 'valueName', align: 'left' as const },
    { name: 'code', label: t('common.code'), field: 'valueCd', align: 'left' as const },
    { name: 'description', label: t('common.description'), field: 'valueDescription', align: 'left' as const },
    { name: 'actions', label: '', field: 'valueId', align: 'right' as const }
])

// ---------- Actions ----------

function openDialog(row: iDomain | null) {
    dialog.row = row
    dialog.open = true
}

function rowActions(row: iDomain): WsAction[] {
    const actions: WsAction[] = [
        canWrite.value ? { id: 'edit', icon: 'sym_o_edit', labelKey: 'managers.configurationManagement.edit', run: () => openDialog(row) } : { id: 'view', icon: 'sym_o_visibility', labelKey: 'managers.domainsManagement.view', run: () => openDialog(row) },
        { id: 'copy', icon: 'sym_o_content_copy', labelKey: 'managers.domainsManagement.copyCode', run: () => copyCode(row) }
    ]
    if (canWrite.value) actions.push({ id: 'delete', icon: 'sym_o_delete', labelKey: 'managers.configurationManagement.delete', run: () => confirmDelete(row) })
    return actions
}

async function copyCode(row: iDomain) {
    try {
        await navigator.clipboard.writeText(row.valueCd)
        appStore.setInfo({ title: t('managers.domainsManagement.copied'), msg: row.valueCd })
    } catch {
        appStore.setError({ title: 'common.error.generic', msg: row.valueCd })
    }
}

function confirmDelete(row: iDomain) {
    $q.dialog({
        title: t('managers.domainsManagement.deleteTitle'),
        message: t('managers.domainsManagement.deleteMessage', { code: `${row.domainCode} · ${row.valueCd}` }),
        cancel: { label: t('common.cancel'), flat: true, noCaps: true },
        ok: { label: t('managers.configurationManagement.delete'), color: 'negative', unelevated: true, noCaps: true },
        persistent: true
    }).onOk(async () => {
        try {
            await axios.delete(`${API}/${row.valueId}`)
            appStore.setInfo({ title: 'common.toast.deleteTitle', msg: 'common.toast.deleteSuccess' })
            await loadValues()
        } catch {
            // the axios interceptor shows the error
        }
    })
}

async function loadValues() {
    loading.value = true
    try {
        const response = await axios.get(API)
        values.value = response.data ?? []
        loaded.value = true
    } finally {
        loading.value = false
    }
}

onMounted(loadValues)
</script>
