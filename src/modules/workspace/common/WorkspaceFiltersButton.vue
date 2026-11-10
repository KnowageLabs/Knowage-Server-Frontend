<template>
    <q-btn flat no-caps class="kn-ws-control" :class="{ 'kn-ws-control--active': activeCount > 0 }" :data-ws="dataWs" :data-tour-id="tourId">
        <q-icon :name="icon" size="18px" class="kn-ws-control__icon" />
        <span class="ellipsis kn-ws-control__label">{{ activeLabel || label || $t('workspace.filters') }}</span>
        <span v-if="activeCount && !activeLabel" class="kn-ws-count">{{ activeCount }}</span>
        <q-icon name="sym_o_expand_more" size="18px" class="kn-ws-control__icon" />
        <!-- every value click writes the query (router.replace): no-route-dismiss keeps the menu open.
             The values scroll in a q-scroll-area as tall as its content (up to a cap); Clear filters stays at the bottom. -->
        <q-menu class="kn-ws-menu kn-ws-filters-menu kn-ws-filters-menu--pinned" anchor="bottom left" self="top left" :offset="[0, 4]" no-route-dismiss @hide="search = ''">
            <!-- optional search (long lists, e.g. 46 domains): filters the options by label or value -->
            <div v-if="searchable" class="kn-ws-filters-menu__search">
                <q-input v-model="search" outlined dense clearable autofocus :placeholder="searchPlaceholder || $t('common.search')" :aria-label="searchPlaceholder || $t('common.search')" data-ws="filters-search">
                    <template #prepend><q-icon name="sym_o_search" size="18px" /></template>
                </q-input>
            </div>
            <q-scroll-area class="kn-ws-filters-menu__scroll" :style="{ height: `min(${listHeight}px, var(--kn-ws-menu-list-max-height))` }" :thumb-style="thumbStyle">
                <div class="kn-ws-menu__list">
                    <template v-for="(group, groupIndex) in shownGroups" :key="group.id">
                        <div v-if="groupIndex > 0" class="kn-ws-menu__separator"></div>
                        <div class="kn-ws-menu__header">{{ $t(group.labelKey) }}</div>
                        <MainMenuPopupRow v-for="option in group.options" :key="option.value" class="kn-ws-menu__value" :style="option.indent ? { paddingLeft: 10 + option.indent * 16 + 'px' } : undefined" :icon="option.icon" :label="option.label" :highlight="search ?? ''" :meta="option.count !== undefined ? String(option.count) : ''" :checked="option.selected" :data-ws-option="group.id + ':' + option.value" @activate="emit('toggle', group.id, option.value)" />
                        <div v-if="!group.options.length" class="kn-ws-menu__empty">{{ $t('common.info.noDataFound') }}</div>
                        <template v-if="group.actions?.length">
                            <div class="kn-ws-menu__separator"></div>
                            <MainMenuPopupRow v-for="action in group.actions" :key="action.id" v-close-popup :icon="action.icon" :label="$t(action.labelKey)" @activate="action.run()" />
                        </template>
                    </template>
                    <q-resize-observer :debounce="0" @resize="(size) => size.height > 0 && (listHeight = Math.ceil(size.height))" />
                </div>
            </q-scroll-area>
            <div v-if="clearable" class="kn-ws-menu__footer">
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

// Filters by default; the Documents tab also uses it as the Collection button (spec 6.4): its own icon and label,
// the chosen value on the button instead of a count, and no Clear footer.
const props = withDefaults(defineProps<{ groups: WsFilterGroup[]; icon?: string; label?: string; activeLabel?: string; clearable?: boolean; dataWs?: string; tourId?: string; searchable?: boolean; searchPlaceholder?: string }>(), {
    icon: 'sym_o_filter_list',
    label: undefined,
    activeLabel: undefined,
    clearable: true,
    dataWs: 'filters',
    tourId: 'ws-filters',
    searchable: false,
    searchPlaceholder: undefined
})
const emit = defineEmits<{ toggle: [groupId: string, value: string]; clear: [] }>()

// the list height, measured: the scroll area needs a height and should not be taller than its rows
const listHeight = ref(0)
const thumbStyle = { width: '5px', right: '2px', borderRadius: '3px', opacity: '0.45' }

const activeCount = computed(() => props.groups.reduce((sum, group) => sum + group.options.filter((option) => option.selected && option.value !== group.noneValue).length, 0))

// Search: case and accent insensitive, on the label and the value. The "nothing chosen" option always stays.
const search = ref<string | null>('')
const normalize = (text: string) =>
    text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
const shownGroups = computed(() => {
    const term = normalize((search.value ?? '').trim())
    if (!props.searchable || !term) return props.groups
    return props.groups.map((group) => ({ ...group, options: group.options.filter((option) => option.value === group.noneValue || normalize(`${option.label} ${option.value}`).includes(term)) }))
})
</script>

<style scoped lang="scss">
.kn-ws-filters-menu__search {
    flex: none;
    padding: 8px 8px 4px;
}
</style>
