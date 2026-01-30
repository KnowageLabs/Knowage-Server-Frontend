<template>
    <q-btn
        flat
        square
        size="sm"
        class="menu-btn"
        :to="link"
        :class="{ 'router-link-active': isActive(props.item) }"
        :data-tour-id="tourId"
        @click="onClick($event, props.item)"
    >
        <q-badge v-if="props.item.badge" color="accent" class="menuBadge">{{ props.item.badge }}</q-badge>
        <q-avatar square v-if="props.item.custIcon" size="20px">
            <img :src="props.item.custIcon" alt="" />
        </q-avatar>
        <q-avatar v-else-if="props.item.iconCls && props.item.command === 'languageSelection'" size="24px">
            <img :src="publicPath + '/images/flags/' + store.locale.toLowerCase().substring(3, 5) + '.svg'" alt="" />
        </q-avatar>
        <q-icon v-else :name="props.item.iconCls || 'insert_drive_file'" size="14px" />
        <q-tooltip :delay="500">{{ getInternationalizedValue(props.item) }}</q-tooltip>
        <q-menu
            v-if="props.item.items"
            :anchor="$q.screen.lt.md ? 'bottom left' : 'top right'"
            self="top left"
            :model-value="props.item.visible"
            @hide="props.item.visible = false"
        >
            <advanced-menu-sub-item :item="props.item" @click="onClick($event, props.item)" />
        </q-menu>
    </q-btn>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import AdvancedMenuSubItem from './AdvancedMenuSubItem.vue'
import useMainStore from '@/App.store'
import { computed } from 'vue'
import { getInternationalizedValue, cleanUrl } from './AdvancedMainMenuHelper'

const props = defineProps<{
    item: any
    badge: number | null
}>()

const emit = defineEmits(['click'])

const $q = useQuasar()
const route = useRoute()
const store = useMainStore()
const publicPath = import.meta.env.VITE_PUBLIC_PATH

const link = computed(() => {
    return cleanUrl(props.item)
})

function isActive(item): boolean {
    return route.path === item.to
}

function onClick(event, item): void {
    if (item.command || item.to) {
        emit('click', {
            originalEvent: event,
            item: item
        })
    }
}

const tourId = computed(() => {
    if (props.item?.command) return `menu-action-${props.item.command}`
    if (props.item?.conditionedView) return `menu-conditioned-${props.item.conditionedView}`
    return undefined
})
</script>
<style lang="scss">
.menu-btn.q-btn {
    width: 100%;
    height: 45px;
    color: var(--kn-mainmenu-icon-color);
    &.router-link-active {
        border-left: 3px solid var(--kn-mainmenu-highlight-color);
    }
    @media screen and (max-width: 1025px) {
        &.router-link-active {
            border-left: none;
            border-top: 3px solid var(--kn-mainmenu-highlight-color);
        }
    }
    .menuBadge {
        position: absolute;
        z-index: 9;
        top: 2px;
        right: 2px;
    }
}
</style>
