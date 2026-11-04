<template>
    <WorkspaceDialog :model-value="modelValue" :title="$t('workspace.manageCollectionsTitle')" name="manage-collections" size="md" @update:model-value="emit('update:modelValue', $event)">
        <q-list v-if="collections.length" bordered separator class="kn-ws-dialog-list">
            <q-item v-for="collection in collections" :key="collection.id" class="kn-ws-collection-row" :inset-level="collection.depth * 0.5" :data-ws-collection="collection.name">
                <q-item-section avatar class="kn-ws-item-icon"><q-icon name="sym_o_folder" size="18px" /></q-item-section>
                <q-item-section>
                    <q-item-label class="ellipsis">{{ collection.name }}</q-item-label>
                    <q-item-label v-if="collection.description" caption class="ellipsis">{{ collection.description }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                    <!-- + (on hover) adds a collection inside; the menu (always visible) holds the rest -->
                    <div class="row items-center no-wrap kn-ws-collection-actions" :class="{ 'kn-ws-collection-actions--open': openMenu === collection.id }">
                        <q-btn flat round dense size="sm" icon="sym_o_create_new_folder" class="kn-ws-collection-actions__add" :aria-label="$t('workspace.newCollectionInside')" data-ws-add-inside @click="emit('create', collection)">
                            <q-tooltip>{{ $t('workspace.newCollectionInside') }}</q-tooltip>
                        </q-btn>
                        <q-btn flat round dense size="sm" icon="more_vert" :aria-label="$t('common.menu')" data-ws-collection-menu>
                            <q-menu :model-value="openMenu === collection.id" class="kn-ws-menu kn-ws-action-menu" anchor="bottom right" self="top right" :offset="[0, 4]" @update:model-value="(open) => (openMenu = open ? collection.id : openMenu === collection.id ? null : openMenu)">
                                <div class="kn-ws-menu__list">
                                    <MainMenuPopupRow v-close-popup icon="sym_o_edit" :label="$t('workspace.editCollection')" data-ws-collection-action="rename" @activate="emit('rename', collection)" />
                                    <!-- Move to: top level (when nested) and every collection that is not this one or inside it -->
                                    <div>
                                        <MainMenuPopupRow icon="sym_o_drive_file_move" :label="$t('workspace.moveTo')" show-chevron :disabled="!targetsFor(collection).length" data-ws-collection-action="move" />
                                        <q-menu class="kn-ws-menu kn-ws-action-menu" anchor="top end" self="top start" :offset="[4, -4]" max-height="50vh">
                                            <div class="kn-ws-menu__list">
                                                <MainMenuPopupRow v-for="target in targetsFor(collection)" :key="target.id ?? 'top'" :style="target.depth ? { paddingLeft: 6 + target.depth * 16 + 'px' } : undefined" :icon="target.id ? 'sym_o_folder' : 'sym_o_vertical_align_top'" :label="target.label" :data-ws-move-target="target.id ?? 'top'" @activate="move(collection, target.id)" />
                                            </div>
                                        </q-menu>
                                    </div>
                                    <div class="kn-ws-menu__separator"></div>
                                    <!-- a disabled row gets no pointer events: the reason shows from its wrapper -->
                                    <div :data-ws-delete="collection.name">
                                        <MainMenuPopupRow v-close-popup icon="sym_o_delete" :label="$t('workspace.delete')" :meta="isEmpty(collection) ? '' : $t('workspace.notEmpty')" :disabled="!isEmpty(collection)" data-ws-collection-action="delete" @activate="remove(collection)" />
                                        <q-tooltip v-if="!isEmpty(collection)">{{ notEmptyText(collection) }}</q-tooltip>
                                    </div>
                                </div>
                            </q-menu>
                        </q-btn>
                    </div>
                </q-item-section>
            </q-item>
        </q-list>
        <div v-else class="kn-ws-muted q-pa-md text-center">{{ $t('common.info.noDataFound') }}</div>
        <template #actions>
            <q-btn flat no-caps icon="sym_o_create_new_folder" :label="$t('workspace.newCollection')" data-ws-new-top @click="emit('create', null)" />
            <q-space />
            <q-btn v-close-popup flat no-caps :label="$t('workspace.close')" />
        </template>
    </WorkspaceDialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import mainStore from '@/App.store'
import MainMenuPopupRow from '@/modules/mainMenu/MainMenuPopupRow.vue'
import useWorkspaceStore from '../workspace.store'
import { WsCollection } from '../Workspace'
import WorkspaceDialog from '../common/WorkspaceDialog.vue'

// Spec 7.4 item 6: rename, add a collection inside another, move a collection (to the top level or inside another),
// delete only when empty (backend rule).
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; rename: [collection: WsCollection]; create: [parent: WsCollection | null] }>()
const $q = useQuasar()
const { t } = useI18n()
const appStore = mainStore()
const store = useWorkspaceStore()

const collections = computed(() => store.collections)
const openMenu = ref<string | null>(null)

// The collection and everything inside it: never a target for its own move.
function subtreeIds(collection: WsCollection): Set<string> {
    const ids = new Set([collection.id])
    let added = true
    while (added) {
        added = false
        for (const c of store.collections)
            if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
                ids.add(c.id)
                added = true
            }
    }
    return ids
}

function targetsFor(collection: WsCollection): { id: string | null; label: string; depth: number }[] {
    const blocked = subtreeIds(collection)
    const targets: { id: string | null; label: string; depth: number }[] = collection.parentId ? [{ id: null, label: t('workspace.topLevel'), depth: 0 }] : []
    for (const c of store.collections) if (!blocked.has(c.id) && c.id !== collection.parentId) targets.push({ id: c.id, label: c.name, depth: c.depth })
    return targets
}

const contents = (collection: WsCollection) => store.collectionContents(collection.id)
const isEmpty = (collection: WsCollection) => {
    const c = contents(collection)
    return c.docs + c.views + c.folders === 0
}
const notEmptyText = (collection: WsCollection) => t('workspace.collectionNotEmpty', contents(collection))

// The row menu closes through its model (its sub-menu goes with it), then the collection moves.
async function move(collection: WsCollection, parentId: string | null) {
    openMenu.value = null
    try {
        await store.moveCollection(collection, parentId)
    } catch {
        // the axios interceptor shows the error
    }
}

function remove(collection: WsCollection) {
    $q.dialog({ title: t('common.toast.deleteConfirmTitle'), message: t('common.toast.deleteMessage'), cancel: true, persistent: true }).onOk(async () => {
        try {
            await store.deleteCollection(collection)
            appStore.setInfo({ title: 'common.toast.deleteTitle', msg: 'common.toast.success' })
        } catch (error: any) {
            if (!error?.response) appStore.setError({ title: 'common.toast.deleteTitle', msg: error?.message === 'sbi.workspace.organizer.folder.error.delete' ? t('workspace.myRepository.folderDeleteError') : error?.message })
        }
    })
}
</script>
