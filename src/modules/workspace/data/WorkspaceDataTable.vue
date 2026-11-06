<template>
    <WorkspaceTableFrame v-slot="{ scrollTarget }" :skeleton="showSkeleton" :columns="columns">
        <q-table class="kn-ws-table" flat dense virtual-scroll :virtual-scroll-target="scrollTarget" :hide-bottom="rows.length > 0" binary-state-sort :rows-per-page-options="[0]" :rows="rows" :columns="columns" row-key="key" @row-click="(_evt, row) => emit('open', row)">
            <template #body-cell-name="props">
                <q-td :props="props">
                    <div class="row items-center no-wrap kn-ws-name">
                        <span class="kn-ws-name__icon"><q-icon :name="props.row.kind === 'MODEL' ? 'sym_o_account_tree' : 'sym_o_database'" size="18px" /></span>
                        <div class="column no-wrap kn-ws-name__text">
                            <span class="kn-ws-name__title ellipsis">{{ props.row.name }}</span>
                            <span v-if="props.row.label && props.row.label !== props.row.name" class="kn-ws-name__sub ellipsis">{{ props.row.label }}</span>
                        </div>
                    </div>
                </q-td>
            </template>
            <template #body-cell-tags="props">
                <q-td :props="props">
                    <div class="row no-wrap items-center kn-ws-tags">
                        <span v-for="tag in props.row.tags" :key="tag" class="kn-ws-tag">{{ tag }}</span>
                    </div>
                </q-td>
            </template>
            <template #body-cell-actions="props">
                <q-td :props="props" auto-width class="kn-ws-actions" :class="{ 'kn-ws-actions--open': menuOpenKey === props.row.key }">
                    <q-btn v-if="actions.canPreview(props.row)" flat round dense icon="sym_o_visibility" :aria-label="$t('common.preview')" data-ws-preview @click.stop="actions.preview(props.row)">
                        <q-tooltip>{{ $t('common.preview') }}</q-tooltip>
                    </q-btn>
                    <q-btn v-if="actions.canOpenInQbe(props.row)" flat round dense icon="sym_o_manage_search" :aria-label="$t('workspace.openInQbe')" data-ws-qbe @click.stop="actions.openInQbe(props.row)">
                        <q-tooltip>{{ $t('workspace.openInQbe') }}</q-tooltip>
                    </q-btn>
                    <WorkspaceActionMenu :row-key="props.row.key" :actions="actions.menu(props.row)" @show="menuOpenKey = props.row.key" @hide="menuOpenKey = null" />
                </q-td>
            </template>
            <template #no-data>
                <div class="full-width row items-center justify-center kn-ws-no-data">
                    <span>{{ $t('workspace.empty.noDataMatch') }}</span>
                    <q-btn flat no-caps color="primary" class="q-ml-sm" :label="$t('workspace.clearFilters')" @click="emit('clear')" />
                </div>
            </template>
        </q-table>
    </WorkspaceTableFrame>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { WsDataRow } from '../Workspace'
import WorkspaceActionMenu from '../common/WorkspaceActionMenu.vue'
import WorkspaceTableFrame from '../common/WorkspaceTableFrame.vue'
import { useDataActions } from './useDataActions'

// One column set per tab (spec 8.1).
const props = defineProps<{ rows: WsDataRow[]; loading: boolean; columnSet: 'datasets' | 'models'; actions: ReturnType<typeof useDataActions> }>()
const emit = defineEmits<{ open: [row: WsDataRow]; clear: [] }>()
const { t } = useI18n()

const menuOpenKey = ref<string | null>(null)

// first load: header and placeholder rows instead of an empty table
const showSkeleton = computed(() => props.loading && !props.rows.length)

const sortText = (a: string, b: string) => (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' })

const columns = computed(() => {
    const name = { name: 'name', label: t('workspace.columns.name'), field: 'name', align: 'left' as const, sortable: true, sort: sortText }
    const category = { name: 'category', label: t('workspace.columns.category'), field: 'category', align: 'left' as const, sortable: true, classes: 'kn-ws-muted' }
    const owner = { name: 'owner', label: t('workspace.columns.owner'), field: 'owner', align: 'left' as const, sortable: true, classes: 'kn-ws-muted' }
    const actions = { name: 'actions', label: '', field: 'key', align: 'right' as const }
    if (props.columnSet === 'datasets') return [name, { name: 'type', label: t('workspace.columns.type'), field: 'dsTypeCd', align: 'left' as const, sortable: true }, category, { name: 'tags', label: t('workspace.columns.tags'), field: 'tags', align: 'left' as const }, owner, actions]
    return [name, { name: 'description', label: t('workspace.columns.description'), field: 'description', align: 'left' as const, sortable: true, classes: 'kn-ws-muted ellipsis' }, category, { name: 'dataSource', label: t('workspace.columns.dataSource'), field: 'dataSourceLabel', align: 'left' as const, sortable: true }, actions]
})
</script>
