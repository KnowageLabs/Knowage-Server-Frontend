<template>
    <!-- Uncontrolled (opens on a click of its parent) unless the parent drives modelValue, as the row menu
         does to open it on hover; then no-parent-event stops the parent click from toggling it too. -->
    <q-menu :model-value="modelValue" :no-parent-event="modelValue !== undefined" :anchor="anchor" :self="self" :offset="offset" max-height="60vh" class="kn-ws-menu kn-ws-action-menu" :class="menuClass" @update:model-value="emit('update:modelValue', $event)" @show="emit('show')" @hide="emit('hide')">
        <div class="kn-ws-menu__list" :data-ws-picker="row.key">
            <div class="kn-ws-menu__header">{{ $t('workspace.filter.collections') }}</div>
            <MainMenuPopupRow v-for="collection in collections" :key="collection.id" :style="collection.depth ? { paddingLeft: 6 + collection.depth * 16 + 'px' } : undefined" icon="sym_o_folder" :label="collection.name" :checked="isLinked(collection.id)" :disabled="busy !== null" :data-ws-collection="collection.id" @activate="toggle(collection.id)" />
            <div v-if="!collections.length" class="kn-ws-menu__empty">{{ $t('common.info.noDataFound') }}</div>
            <div class="kn-ws-menu__separator"></div>
            <MainMenuPopupRow v-close-popup icon="sym_o_create_new_folder" :label="$t('workspace.newCollection')" @activate="emit('newCollection')" />
        </div>
    </q-menu>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MainMenuPopupRow from '@/modules/mainMenu/MainMenuPopupRow.vue'
import useWorkspaceStore from '../workspace.store'
import { WsDocumentRow } from '../Workspace'

// "Add to collection…" (a document: each click links or unlinks a folder, several can be checked) and
// "Move to collection…" (a view: one folder, a click moves the view). Spec 7.4 item 5.
const props = withDefaults(defineProps<{ row: WsDocumentRow; modelValue?: boolean; anchor?: any; self?: any; offset?: [number, number]; menuClass?: string }>(), {
    modelValue: undefined,
    anchor: 'top end',
    self: 'top start',
    offset: () => [4, -4],
    menuClass: undefined
})
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; newCollection: []; show: []; hide: [] }>()
const store = useWorkspaceStore()

const busy = ref<string | null>(null)
const isView = computed(() => props.row.kind === 'VIEW')
const collections = computed(() => store.collections)
// the row object of the store, so the checks follow the changes
const current = computed(() => store.documents.find((d) => d.key === props.row.key) ?? props.row)

const isLinked = (folderId: string) => current.value.links.some((l) => l.folderId === folderId)

async function toggle(folderId: string) {
    if (busy.value) return
    busy.value = folderId
    try {
        if (isView.value) {
            if (!isLinked(folderId)) await store.moveView(current.value, folderId)
        } else if (isLinked(folderId)) await store.unlinkDocumentFromFolder(current.value, folderId)
        else await store.linkDocumentOnce(current.value, folderId)
    } catch {
        // the axios interceptor shows the error
    } finally {
        busy.value = null
    }
}
</script>
