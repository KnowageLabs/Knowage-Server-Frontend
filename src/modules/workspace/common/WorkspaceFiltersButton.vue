<template>
    <q-btn flat no-caps class="kn-ws-control" :class="{ 'kn-ws-control--active': activeCount > 0 }" data-ws="filters" data-tour-id="ws-filters">
        <q-icon name="sym_o_filter_list" size="18px" class="kn-ws-control__icon" />
        <span>{{ $t('workspace.filters') }}</span>
        <span v-if="activeCount" class="kn-ws-count">{{ activeCount }}</span>
        <q-icon name="sym_o_expand_more" size="18px" class="kn-ws-control__icon" />
        <!-- every value click writes the query (router.replace): no-route-dismiss keeps the menu open -->
        <!-- every value click writes the query (router.replace): no-route-dismiss keeps the menu open.
             The values scroll in a q-scroll-area as tall as its content (up to a cap); Clear filters stays at the bottom. -->
        <q-menu class="kn-ws-menu kn-ws-filters-menu kn-ws-filters-menu--pinned" anchor="bottom left" self="top left" :offset="[0, 4]" no-route-dismiss>
            <q-scroll-area class="kn-ws-filters-menu__scroll" :style="{ height: `min(${listHeight}px, var(--kn-ws-menu-list-max-height))` }" :thumb-style="thumbStyle">
                <div class="kn-ws-menu__list">
                    <template v-for="(group, groupIndex) in groups" :key="group.id">
                        <div v-if="groupIndex > 0" class="kn-ws-menu__separator"></div>
                        <div class="kn-ws-menu__header">{{ $t(group.labelKey) }}</div>
                        <MainMenuPopupRow v-for="option in group.options" :key="option.value" class="kn-ws-menu__value" :style="option.indent ? { paddingLeft: 10 + option.indent * 16 + 'px' } : undefined" :icon="option.icon" :label="option.label" :meta="option.count !== undefined ? String(option.count) : ''" :checked="option.selected" :data-ws-option="group.id + ':' + option.value" @activate="emit('toggle', group.id, option.value)" />
                        <div v-if="!group.options.length" class="kn-ws-menu__empty">{{ $t('common.info.noDataFound') }}</div>
                        <template v-if="group.actions?.length">
                            <div class="kn-ws-menu__separator"></div>
                            <MainMenuPopupRow v-for="action in group.actions" :key="action.id" v-close-popup :icon="action.icon" :label="$t(action.labelKey)" @activate="action.run()" />
                        </template>
                    </template>
                    <q-resize-observer :debounce="0" @resize="(size) => size.height > 0 && (listHeight = Math.ceil(size.height))" />
                </div>
            </q-scroll-area>
            <div class="kn-ws-menu__footer">
                <q-btn flat dense no-caps :disable="activeCount === 0" :label="$t('workspace.clearFilters')" data-ws="clear-filters" @click="emit('clear')" />
            </div>
        </q-menu>
    </q-btn>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MainMenuPopupRow from '@/modules/mainMenu/MainMenuPopupRow.vue'

export interface WsFilterOption {
    value: string
    label: string
    // the icon the table shows for this value (Type, Kind), so the menu and the rows look alike
    icon?: string
    count?: number
    indent?: number
    selected: boolean
}

export interface WsFilterGroup {
    id: string
    labelKey: string
    single?: boolean
    // the value of the "nothing chosen" option of a single-choice group (it does not count as a filter)
    noneValue?: string
    options: WsFilterOption[]
    actions?: { id: string; icon: string; labelKey: string; run: () => void }[]
}

const props = defineProps<{ groups: WsFilterGroup[] }>()
const emit = defineEmits<{ toggle: [groupId: string, value: string]; clear: [] }>()

// the list height, measured: the scroll area needs a height and should not be taller than its rows
const listHeight = ref(0)
const thumbStyle = { width: '5px', right: '2px', borderRadius: '3px', opacity: '0.45' }

const activeCount = computed(() => props.groups.reduce((sum, group) => sum + group.options.filter((option) => option.selected && option.value !== group.noneValue).length, 0))
</script>
