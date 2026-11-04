<template>
    <q-btn flat round dense icon="more_vert" :aria-label="$t('common.menu')" :data-ws-row-menu="rowKey" @click.stop>
        <q-tooltip v-if="!open" :delay="300">{{ $t('common.menu') }}</q-tooltip>
        <q-menu v-model="open" class="kn-ws-menu kn-ws-action-menu" :class="menuClass" anchor="bottom right" self="top right" :offset="[0, 4]" @show="emit('show')" @hide="emit('hide')">
            <div class="kn-ws-menu__list">
                <MainMenuPopupRow v-for="action in actions" :key="action.id" :icon="action.icon" :label="$t(action.labelKey)" :data-ws-action="action.id" @activate="onActivate(action)" />
                <div v-if="!actions.length" class="kn-ws-menu__empty">{{ $t('common.info.noDataFound') }}</div>
            </div>
        </q-menu>
    </q-btn>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MainMenuPopupRow from '@/modules/mainMenu/MainMenuPopupRow.vue'

export interface WsAction {
    id: string
    icon: string
    labelKey: string
    run: () => void
}

// The ⋮ menu of a row (hand-off 6.5). A hidden action is not in the list.
defineProps<{ rowKey: string; actions: WsAction[]; menuClass?: string }>()
const emit = defineEmits<{ show: []; hide: [] }>()

const open = ref(false)

function onActivate(action: WsAction) {
    open.value = false
    action.run()
}
</script>
