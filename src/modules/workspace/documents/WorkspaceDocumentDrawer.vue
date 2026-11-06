<template>
    <div v-if="row" class="column no-wrap fit" :data-ws-drawer-row="row.key">
        <WorkspaceDrawerHeader :name="row.name" :icon="documentTypeIcon(rowTypeKey(row))" :view="isView" :image-url="previewUrl">
            <template #subtitle>
                <i18n-t v-if="isView" keypath="workspace.viewOf" tag="span" scope="global">
                    <template #name>
                        <a v-if="parentRow" href="#" class="kn-ws-link" data-ws="drawer-parent" @click.prevent="emit('select', parentRow)">{{ row.viewOf?.name }}</a>
                        <span v-else>{{ row.viewOf?.name }}</span>
                    </template>
                </i18n-t>
                <template v-else>{{ typeLabel(rowTypeKey(row)) }} · {{ row.label }}</template>
            </template>
            <template #buttons>
                <q-btn v-if="!isView && collectionsAllowed" flat round dense :icon="fav ? 'star' : 'sym_o_star'" class="kn-ws-star" :class="{ 'kn-ws-star--on': fav }" :aria-label="$t(fav ? 'workspace.removeFromFavorites' : 'workspace.addToFavorites')" data-ws-star @click="actions.toggleFavorite(row)">
                    <q-tooltip class="kn-ws-above-drawer">{{ $t(fav ? 'workspace.removeFromFavorites' : 'workspace.addToFavorites') }}</q-tooltip>
                </q-btn>
            </template>
        </WorkspaceDrawerHeader>

        <WorkspaceDrawerAction :primary="runAction" :menu="menuActions" />

        <q-scroll-area class="col">
            <section class="column kn-ws-drawer__section">
                <span class="kn-ws-drawer__section-title">{{ $t('workspace.details') }}</span>
                <dl class="kn-ws-drawer__about">
                    <dt>{{ $t('workspace.columns.name') }}</dt>
                    <dd>{{ row.name }}</dd>
                    <template v-if="!isView && row.label">
                        <dt>{{ $t('workspace.label') }}</dt>
                        <dd>{{ row.label }}</dd>
                    </template>
                    <dt>{{ $t('workspace.columns.type') }}</dt>
                    <dd>{{ isView ? $t('workspace.savedView') : typeLabel(rowTypeKey(row)) }}</dd>
                    <template v-if="row.description">
                        <dt>{{ $t('common.description') }}</dt>
                        <dd class="kn-ws-drawer__multiline">{{ row.description }}</dd>
                    </template>
                    <template v-if="row.creationUser">
                        <dt>{{ $t('workspace.columns.owner') }}</dt>
                        <dd>{{ row.creationUser }}</dd>
                    </template>
                    <template v-if="created">
                        <dt>{{ $t('workspace.created') }}</dt>
                        <dd>{{ created }}</dd>
                    </template>
                    <template v-if="!isView">
                        <dt>{{ $t('workspace.columns.lastRun') }}</dt>
                        <dd>{{ row.lastRun ? fullDate(row.lastRun) : $t('workspace.neverRun') }}</dd>
                    </template>
                </dl>
            </section>

            <section v-if="collectionsAllowed" class="column kn-ws-drawer__section">
                <span class="kn-ws-drawer__section-title">{{ $t('workspace.filter.collections') }}</span>
                <div class="row items-center kn-ws-chips">
                    <q-chip v-for="collection in rowCollections" :key="collection.id" dense outline :removable="!isView" :label="collection.path" :data-ws-chip="collection.name" @remove="removeFromCollection(collection.id)" />
                    <q-btn flat dense no-caps :icon="isView ? 'sym_o_drive_file_move' : 'add'" :label="$t(isView ? 'workspace.moveToCollection' : 'workspace.addToCollection')" class="kn-ws-drawer__add" data-ws-add-collection>
                        <WorkspaceCollectionPicker :row="row" anchor="bottom left" self="top left" :offset="[0, 4]" menu-class="kn-ws-above-drawer" @new-collection="emit('newCollection', row)" />
                    </q-btn>
                </div>
            </section>

            <section v-if="!isView && savedViews.length" class="column kn-ws-drawer__section">
                <span class="kn-ws-drawer__section-title">{{ $t('workspace.yourSavedViews') }}</span>
                <q-list dense class="kn-ws-drawer__list">
                    <q-item v-for="view in savedViews" :key="view.key" clickable :data-ws-view="view.key" @click="emit('select', view)">
                        <q-item-section avatar class="kn-ws-item-icon"><q-icon name="sym_o_bookmark" size="18px" /></q-item-section>
                        <q-item-section class="ellipsis">{{ view.name }}</q-item-section>
                    </q-item>
                </q-list>
            </section>
        </q-scroll-area>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import mainStore from '@/App.store'
import { formatDateWithLocale } from '@/helpers/commons/localeHelper'
import useWorkspaceStore from '../workspace.store'
import { WsDocumentRow } from '../Workspace'
import { getPreviewImage } from '../workspaceApi'
import { canUseCollections, documentTypeIcon, isFavoriteRow, parseServerDate, rowTypeKey } from '../workspaceHelpers'
import { WsAction } from '../common/WorkspaceActionMenu.vue'
import WorkspaceDrawerAction from '../common/WorkspaceDrawerAction.vue'
import WorkspaceDrawerHeader from '../common/WorkspaceDrawerHeader.vue'
import { useDocumentActions } from './useDocumentActions'
import WorkspaceCollectionPicker from './WorkspaceCollectionPicker.vue'

// Spec 9, round 2 (option B): header, Run with ▾, flat sections. No scheduled outputs, no preview block.
const props = defineProps<{ row: WsDocumentRow | null; actions: ReturnType<typeof useDocumentActions>; typeLabel: (typeKey: string) => string }>()
const emit = defineEmits<{ select: [row: WsDocumentRow]; newCollection: [row: WsDocumentRow]; removed: [] }>()
const appStore = mainStore()
const store = useWorkspaceStore()

const isView = computed(() => props.row?.kind === 'VIEW')
const collectionsAllowed = computed(() => canUseCollections(appStore.user))
const fav = computed(() => !!props.row && isFavoriteRow(props.row, store.favoritesFolderId))
const rowCollections = computed(() => store.collections.filter((c) => props.row?.links.some((l) => l.folderId === c.id)))
const parentRow = computed(() => store.documents.find((d) => d.kind === 'DOCUMENT' && d.biObjectId === props.row?.biObjectId) ?? null)
const savedViews = computed(() => store.documents.filter((d) => d.kind === 'VIEW' && d.biObjectId === props.row?.biObjectId))

const runAction = computed<WsAction>(() => ({ id: 'run', icon: 'sym_o_play_arrow', labelKey: 'common.run', run: () => props.row && props.actions.run(props.row) }))
// ★ is in the header and the collections in their section, so ▾ leaves them out.
const menuActions = computed<WsAction[]>(() => (props.row ? props.actions.rowActions(props.row, { insideDrawer: true, withRun: false, onRemoved: () => emit('removed') }).filter((a) => a.id !== 'favorite' && a.id !== 'collection') : []))

const fullDate = (time: number) => formatDateWithLocale(time, { dateStyle: 'medium', timeStyle: 'short' })
const created = computed(() => {
    const time = parseServerDate(props.row?.creationDate)
    return time ? formatDateWithLocale(time, { dateStyle: 'medium' }) : ''
})

async function removeFromCollection(folderId: string) {
    if (!props.row) return
    try {
        await store.unlinkDocumentFromFolder(props.row, folderId)
    } catch {
        // the axios interceptor shows the error
    }
}

const previewUrl = ref<string | null>(null)
const releasePreview = () => {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
}
watch(
    () => props.row?.previewFile,
    async (fileName) => {
        releasePreview()
        if (!fileName) return
        try {
            previewUrl.value = URL.createObjectURL(await getPreviewImage(fileName))
        } catch {
            previewUrl.value = null
        }
    },
    { immediate: true }
)
onBeforeUnmount(releasePreview)
</script>
