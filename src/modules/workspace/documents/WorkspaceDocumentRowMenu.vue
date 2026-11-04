<template>
    <q-btn flat round dense icon="more_vert" :aria-label="$t('common.menu')" :data-ws-row-menu="row.key" @click.stop>
        <q-tooltip v-if="!open" :delay="300">{{ $t('common.menu') }}</q-tooltip>
        <q-menu v-model="open" class="kn-ws-menu kn-ws-action-menu" :class="menuClass" anchor="bottom right" self="top right" :offset="[0, 4]" @show="emit('show')" @hide="onHide">
            <div class="kn-ws-menu__list">
                <template v-for="action in actions" :key="action.id">
                    <div v-if="action.submenu === 'collections'" @mouseenter="onSubmenuEnter" @mouseleave="onSubmenuLeave" @keydown.right="submenuOpen = true" @keydown.left="submenuOpen = false">
                        <MainMenuPopupRow :icon="action.icon" :label="$t(action.labelKey)" :active="submenuOpen" show-chevron :data-ws-action="action.id" @activate="toggleSubmenu" />
                        <WorkspaceCollectionPicker v-model="submenuOpen" :row="row" :menu-class="menuClass" @mouseenter="onSubmenuEnter" @mouseleave="onSubmenuLeave" @new-collection="onNewCollection" />
                    </div>
                    <MainMenuPopupRow v-else :icon="action.icon" :label="$t(action.labelKey)" :data-ws-action="action.id" @mouseenter="onOtherRowEnter" @activate="onActivate(action)" />
                </template>
            </div>
        </q-menu>
    </q-btn>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import MainMenuPopupRow from '@/modules/mainMenu/MainMenuPopupRow.vue'
import { WsDocumentRow } from '../Workspace'
import { WsDocumentAction } from './useDocumentActions'
import WorkspaceCollectionPicker from './WorkspaceCollectionPicker.vue'

// The same timings as the dashboard toolbar menu (DocumentExecutionToolbarMenu).
const SUBMENU_OPEN_DELAY = 120
const SUBMENU_CLOSE_DELAY = 220

const props = defineProps<{ row: WsDocumentRow; actions: WsDocumentAction[]; menuClass?: string }>()
const emit = defineEmits<{ show: []; hide: []; newCollection: [row: WsDocumentRow] }>()

const open = ref(false)
const submenuOpen = ref(false)
let hoverTimer: ReturnType<typeof setTimeout> | null = null

function clearHoverTimer() {
    if (hoverTimer) clearTimeout(hoverTimer)
    hoverTimer = null
}
function onSubmenuEnter() {
    clearHoverTimer()
    if (!submenuOpen.value) hoverTimer = setTimeout(() => (submenuOpen.value = true), SUBMENU_OPEN_DELAY)
}
function onSubmenuLeave() {
    clearHoverTimer()
    hoverTimer = setTimeout(() => (submenuOpen.value = false), SUBMENU_CLOSE_DELAY)
}
// moving onto another row closes the sub-menu right away
function onOtherRowEnter() {
    clearHoverTimer()
    submenuOpen.value = false
}
function toggleSubmenu() {
    clearHoverTimer()
    submenuOpen.value = !submenuOpen.value
}
function onActivate(action: WsDocumentAction) {
    open.value = false
    action.run()
}
function onNewCollection() {
    open.value = false
    emit('newCollection', props.row)
}
function onHide() {
    clearHoverTimer()
    submenuOpen.value = false
    emit('hide')
}

onBeforeUnmount(clearHoverTimer)
</script>
