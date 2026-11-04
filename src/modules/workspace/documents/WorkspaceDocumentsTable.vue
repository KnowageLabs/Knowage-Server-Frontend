<template>
    <WorkspaceTableFrame v-slot="{ scrollTarget }" :skeleton="showSkeleton" :columns="frameColumns">
        <q-table class="kn-ws-table" flat dense virtual-scroll :virtual-scroll-target="scrollTarget" :hide-bottom="rows.length > 0" binary-state-sort :rows-per-page-options="[0]" :rows="rows" :columns="columns" :visible-columns="visibleColumns" row-key="key" @row-click="(_evt, row) => emit('open', row)">
            <template #body-cell-star="props">
                <q-td :props="props" auto-width>
                    <q-btn v-if="props.row.kind === 'DOCUMENT'" flat round dense size="sm" :icon="isFav(props.row) ? 'star' : 'sym_o_star'" class="kn-ws-star" :class="{ 'kn-ws-star--on': isFav(props.row) }" :aria-label="$t(isFav(props.row) ? 'workspace.removeFromFavorites' : 'workspace.addToFavorites')" data-ws-star @click.stop="emit('star', props.row)">
                        <q-tooltip>{{ $t(isFav(props.row) ? 'workspace.removeFromFavorites' : 'workspace.addToFavorites') }}</q-tooltip>
                    </q-btn>
                </q-td>
            </template>
            <template #body-cell-name="props">
                <q-td :props="props">
                    <div class="row items-center no-wrap kn-ws-name">
                        <span class="kn-ws-name__icon" :class="{ 'kn-ws-name__icon--view': props.row.kind === 'VIEW' }">
                            <q-icon :name="documentTypeIcon(rowTypeKey(props.row))" size="18px" />
                        </span>
                        <div class="column no-wrap kn-ws-name__text">
                            <span class="kn-ws-name__title ellipsis">{{ props.row.name }}</span>
                            <span class="kn-ws-name__sub ellipsis">{{ props.row.kind === 'VIEW' ? $t('workspace.viewOf', { name: props.row.viewOf?.name }) : props.row.label }}</span>
                        </div>
                    </div>
                </q-td>
            </template>
            <template #body-cell-collections="props">
                <q-td :props="props">
                    <div class="row no-wrap items-center kn-ws-tags">
                        <span v-for="collection in collectionsOf(props.row).slice(0, MAX_TAGS)" :key="collection.id" class="kn-ws-tag ellipsis">{{ collection.name }}</span>
                        <span v-if="collectionsOf(props.row).length > MAX_TAGS" class="kn-ws-tag kn-ws-tag--more">
                            +{{ collectionsOf(props.row).length - MAX_TAGS }}
                            <q-tooltip>{{
                                collectionsOf(props.row)
                                    .slice(MAX_TAGS)
                                    .map((c) => c.path)
                                    .join(', ')
                            }}</q-tooltip>
                        </span>
                    </div>
                </q-td>
            </template>
            <template #body-cell-actions="props">
                <q-td :props="props" auto-width class="kn-ws-actions" :class="{ 'kn-ws-actions--open': menuOpenKey === props.row.key }">
                    <q-btn flat round dense icon="sym_o_play_arrow" :aria-label="$t('common.run')" data-ws-run @click.stop="emit('run', props.row)">
                        <q-tooltip>{{ $t('common.run') }}</q-tooltip>
                    </q-btn>
                    <WorkspaceDocumentRowMenu :row="props.row" :actions="actionsFor(props.row)" @show="menuOpenKey = props.row.key" @hide="menuOpenKey = null" @new-collection="emit('newCollection', $event)" />
                </q-td>
            </template>
            <template #no-data>
                <div class="full-width row items-center justify-center kn-ws-no-data">
                    <span>{{ $t('workspace.empty.noMatch') }}</span>
                    <q-btn flat no-caps color="primary" class="q-ml-sm" :label="$t('workspace.clearFilters')" @click="emit('clear')" />
                </div>
            </template>
        </q-table>
    </WorkspaceTableFrame>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useWorkspaceStore from '../workspace.store'
import { WsCollection, WsDocumentRow } from '../Workspace'
import { documentTypeIcon, isFavoriteRow, rowTypeKey } from '../workspaceHelpers'
import WorkspaceTableFrame from '../common/WorkspaceTableFrame.vue'
import { WsDocumentAction } from './useDocumentActions'
import WorkspaceDocumentRowMenu from './WorkspaceDocumentRowMenu.vue'

const MAX_TAGS = 2

const props = defineProps<{ rows: WsDocumentRow[]; loading: boolean; showStar: boolean; favoritesFolderId: string | null; typeLabel: (typeKey: string) => string; actionsFor: (row: WsDocumentRow) => WsDocumentAction[] }>()
const emit = defineEmits<{ open: [row: WsDocumentRow]; run: [row: WsDocumentRow]; star: [row: WsDocumentRow]; clear: []; newCollection: [row: WsDocumentRow] }>()
const { t } = useI18n()
const store = useWorkspaceStore()

const menuOpenKey = ref<string | null>(null)

const isFav = (row: WsDocumentRow) => isFavoriteRow(row, props.favoritesFolderId)

// The collections a row is in, in the order of the collection list. The Favorites folder is not a collection.
const collectionsOf = (row: WsDocumentRow): WsCollection[] => {
    const ids = new Set(row.links.map((l) => l.folderId))
    return store.collections.filter((c) => ids.has(c.id))
}

const columns = computed(() => [
    { name: 'star', label: '', field: 'key', align: 'center' as const },
    { name: 'name', label: t('workspace.columns.name'), field: 'name', align: 'left' as const, sortable: true, sort: (a: string, b: string) => (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' }) },
    { name: 'type', label: t('workspace.columns.type'), field: (row: WsDocumentRow) => props.typeLabel(rowTypeKey(row)), align: 'left' as const, sortable: true },
    { name: 'collections', label: t('workspace.columns.collections'), field: 'key', align: 'left' as const },
    { name: 'owner', label: t('workspace.columns.owner'), field: 'creationUser', align: 'left' as const, sortable: true, classes: 'kn-ws-muted' },
    { name: 'actions', label: '', field: 'key', align: 'right' as const }
])

const visibleColumns = computed(() => ['name', 'type', 'owner', 'actions', ...(props.showStar ? ['star', 'collections'] : [])])

// first load: header and placeholder rows instead of an empty table
const showSkeleton = computed(() => props.loading && !props.rows.length)
const frameColumns = computed(() => columns.value.filter((c) => visibleColumns.value.includes(c.name)))
</script>
