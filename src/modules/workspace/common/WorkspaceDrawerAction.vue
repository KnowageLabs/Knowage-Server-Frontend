<template>
    <div class="kn-ws-drawer__action" data-ws="drawer-action">
        <q-btn-dropdown v-if="menu.length" split unelevated no-caps color="primary" :icon="primary.icon" :label="$t(primary.labelKey)" dropdown-icon="sym_o_arrow_drop_down" content-class="kn-ws-menu kn-ws-action-menu kn-ws-above-drawer" :menu-offset="[0, 4]" menu-anchor="bottom right" menu-self="top right" :toggle-aria-label="$t('common.menu')" :data-ws-action="primary.id" @click="primary.run()">
            <div class="kn-ws-menu__list">
                <template v-for="(action, index) in menu" :key="action.id">
                    <div v-if="index > 0 && DANGER_IDS.includes(action.id) && !DANGER_IDS.includes(menu[index - 1].id)" class="kn-ws-menu__separator"></div>
                    <MainMenuPopupRow v-close-popup :icon="action.icon" :label="$t(action.labelKey)" :data-ws-action="action.id" @activate="action.run()" />
                </template>
            </div>
        </q-btn-dropdown>
        <q-btn v-else unelevated no-caps color="primary" class="full-width" :icon="primary.icon" :label="$t(primary.labelKey)" :data-ws-action="primary.id" @click="primary.run()" />
    </div>
</template>

<script setup lang="ts">
import MainMenuPopupRow from '@/modules/mainMenu/MainMenuPopupRow.vue'
import { WsAction } from './WorkspaceActionMenu.vue'

// The only button of the drawer (spec 9): the main action, and ▾ with every other action, labeled.
// Remove and Delete sit under a line at the end.
const DANGER_IDS = ['remove', 'delete']

defineProps<{ primary: WsAction; menu: WsAction[] }>()
</script>
