<template>
    <div v-if="row" class="column no-wrap fit" :data-ws-drawer-row="row.key">
        <div class="row items-start no-wrap kn-ws-drawer__header">
            <span class="kn-ws-name__icon" :class="{ 'kn-ws-name__icon--view': isView }">
                <q-icon :name="documentTypeIcon(rowTypeKey(row))" size="18px" />
            </span>
            <div class="column col kn-ws-name__text">
                <span class="kn-ws-drawer__name">{{ row.name }}</span>
                <span class="kn-ws-name__sub">{{ isView ? $t('workspace.savedView') : `${typeLabel(rowTypeKey(row))} · ${row.label}` }}</span>
            </div>
            <div class="row no-wrap">
                <q-btn v-if="!isView && collectionsAllowed" flat round dense :icon="fav ? 'star' : 'sym_o_star'" class="kn-ws-star" :class="{ 'kn-ws-star--on': fav }" :aria-label="$t(fav ? 'workspace.removeFromFavorites' : 'workspace.addToFavorites')" data-ws-star @click="actions.toggleFavorite(row)">
                    <q-tooltip class="kn-ws-above-drawer">{{ $t(fav ? 'workspace.removeFromFavorites' : 'workspace.addToFavorites') }}</q-tooltip>
                </q-btn>
                <q-btn v-if="actions.hasDesigner(row)" flat round dense icon="sym_o_edit" :aria-label="$t('workspace.openDesigner')" @click="actions.openDesigner(row)">
                    <q-tooltip class="kn-ws-above-drawer">{{ $t('workspace.openDesigner') }}</q-tooltip>
                </q-btn>
                <WorkspaceDocumentRowMenu :row="row" :actions="menuActions" menu-class="kn-ws-above-drawer" @new-collection="emit('newCollection', $event)" />
                <q-btn v-close-popup flat round dense icon="close" :aria-label="$t('workspace.close')" data-ws-drawer-close>
                    <q-tooltip class="kn-ws-above-drawer">{{ $t('workspace.close') }}</q-tooltip>
                </q-btn>
            </div>
        </div>
        <q-separator />

        <q-scroll-area class="col">
            <div v-if="collectionsAllowed" class="row items-center kn-ws-chips kn-ws-drawer__section">
                <q-icon name="sym_o_folder" size="18px" class="kn-ws-muted" />
                <q-chip v-for="collection in rowCollections" :key="collection.id" dense outline :removable="!isView" :label="collection.path" :data-ws-chip="collection.name" @remove="removeFromCollection(collection.id)" />
                <q-btn flat dense no-caps :icon="isView ? 'sym_o_drive_file_move' : 'add'" :label="$t(isView ? 'workspace.moveToCollection' : 'workspace.addToCollection')" class="kn-ws-drawer__add" data-ws-add-collection>
                    <WorkspaceCollectionPicker :row="row" anchor="bottom left" self="top left" :offset="[0, 4]" menu-class="kn-ws-above-drawer" @new-collection="emit('newCollection', row)" />
                </q-btn>
            </div>

            <div class="kn-ws-drawer__preview">
                <img v-if="previewUrl" :src="previewUrl" :alt="row.name" />
                <q-icon v-else :name="documentTypeIcon(rowTypeKey(row))" size="40px" />
            </div>

            <div class="kn-ws-drawer__section">
                <q-btn unelevated no-caps color="primary" icon="sym_o_play_arrow" :label="$t('common.run')" class="full-width" data-ws-drawer-run @click="actions.run(row)" />
            </div>

            <div v-if="isView" class="column kn-ws-drawer__section">
                <span class="kn-ws-drawer__section-title">{{ $t('workspace.savedFrom') }}</span>
                <q-list dense>
                    <q-item :clickable="!!parentRow" @click="parentRow && emit('select', parentRow)">
                        <q-item-section avatar class="kn-ws-item-icon"><q-icon :name="documentTypeIcon(row.typeCode)" size="18px" /></q-item-section>
                        <q-item-section>{{ row.viewOf?.name }}</q-item-section>
                    </q-item>
                </q-list>
            </div>

            <div v-if="!isView && savedViews.length" class="column kn-ws-drawer__section">
                <span class="kn-ws-drawer__section-title">{{ $t('workspace.yourSavedViews') }}</span>
                <q-list dense>
                    <q-item v-for="view in savedViews" :key="view.key" clickable @click="emit('select', view)">
                        <q-item-section avatar class="kn-ws-item-icon"><q-icon name="sym_o_bookmark" size="18px" /></q-item-section>
                        <q-item-section>{{ view.name }}</q-item-section>
                    </q-item>
                </q-list>
            </div>

            <div class="column kn-ws-drawer__section">
                <span class="kn-ws-drawer__section-title">{{ $t('workspace.about') }}</span>
                <dl class="kn-ws-drawer__about">
                    <template v-if="row.description">
                        <dt>{{ $t('common.description') }}</dt>
                        <dd>{{ row.description }}</dd>
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
            </div>

            <div v-if="outputs.length" class="column kn-ws-drawer__section">
                <span class="kn-ws-drawer__section-title">{{ $t('workspace.scheduledOutputs') }}</span>
                <q-list dense>
                    <q-item v-for="output in outputs.slice(0, 3)" :key="output.key" clickable @click="emit('download', output)">
                        <q-item-section avatar class="kn-ws-item-icon"><q-icon name="sym_o_download" size="18px" /></q-item-section>
                        <q-item-section>
                            <q-item-label class="ellipsis">{{ output.jobName }}</q-item-label>
                            <q-item-label caption>{{ fullDate(output.created) }}</q-item-label>
                        </q-item-section>
                        <q-item-section side
                            ><span class="kn-ws-format">{{ output.format }}</span></q-item-section
                        >
                    </q-item>
                </q-list>
            </div>
        </q-scroll-area>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import mainStore from '@/App.store'
import { formatDateWithLocale } from '@/helpers/commons/localeHelper'
import useWorkspaceStore from '../workspace.store'
import { WsDocumentRow, WsOutputRow } from '../Workspace'
import { getPreviewImage } from '../workspaceApi'
import { canUseCollections, documentTypeIcon, isFavoriteRow, parseServerDate, rowTypeKey } from '../workspaceHelpers'
import { useDocumentActions } from './useDocumentActions'
import WorkspaceCollectionPicker from './WorkspaceCollectionPicker.vue'
import WorkspaceDocumentRowMenu from './WorkspaceDocumentRowMenu.vue'

// The interim drawer content of spec 9 (the v4 pane, no ★ on views).
const props = defineProps<{ row: WsDocumentRow | null; actions: ReturnType<typeof useDocumentActions>; typeLabel: (typeKey: string) => string }>()
const emit = defineEmits<{ select: [row: WsDocumentRow]; newCollection: [row: WsDocumentRow]; download: [output: WsOutputRow]; removed: [] }>()
const appStore = mainStore()
const store = useWorkspaceStore()

const isView = computed(() => props.row?.kind === 'VIEW')
const collectionsAllowed = computed(() => canUseCollections(appStore.user))
const fav = computed(() => !!props.row && isFavoriteRow(props.row, store.favoritesFolderId))
const rowCollections = computed(() => store.collections.filter((c) => props.row?.links.some((l) => l.folderId === c.id)))
const parentRow = computed(() => store.documents.find((d) => d.kind === 'DOCUMENT' && d.biObjectId === props.row?.biObjectId) ?? null)
const savedViews = computed(() => store.documents.filter((d) => d.kind === 'VIEW' && d.biObjectId === props.row?.biObjectId))
const outputs = computed(() => (isView.value ? [] : store.outputs.filter((o) => o.biObjectId === props.row?.biObjectId).sort((a, b) => b.created - a.created)))
const menuActions = computed(() => (props.row ? props.actions.rowActions(props.row, { insideDrawer: true, withRun: false, onRemoved: () => emit('removed') }) : []))

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
