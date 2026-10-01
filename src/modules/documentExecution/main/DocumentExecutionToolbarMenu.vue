<template>
    <q-btn flat round dense icon="more_vert" :aria-label="$t('common.menu')" data-test="toolbar-menu-button">
        <q-tooltip v-if="!open" anchor="bottom middle" self="top middle" :delay="300">{{ $t('common.menu') }}</q-tooltip>
        <q-menu v-model="open" class="kn-toolbar-menu" anchor="bottom right" self="top right" :offset="[0, 4]" @before-show="$emit('before-show')" @hide="closeSubmenu">
            <div class="kn-toolbar-menu__list">
                <template v-for="(item, index) in items" :key="item.label + index">
                    <div v-if="item.items" class="kn-toolbar-menu__group" @mouseenter="onGroupEnter(index)" @mouseleave="onGroupLeave(index)" @keydown.left="openSubmenu = index" @keydown.right="closeSubmenu">
                        <MainMenuPopupRow :icon="item.icon" :label="item.label" :active="openSubmenu === index" show-chevron @activate="toggleSubmenu(index)" />
                        <q-menu :model-value="openSubmenu === index" class="kn-toolbar-menu" anchor="top left" self="top right" :offset="[4, -4]" no-parent-event @update:model-value="(value) => onSubmenuUpdate(index, value)" @mouseenter="onGroupEnter(index)" @mouseleave="onGroupLeave(index)">
                            <div class="kn-toolbar-menu__list">
                                <MainMenuPopupRow v-for="(child, childIndex) in item.items" :key="child.label + childIndex" :icon="child.icon" :label="child.label" @activate="onItemActivate(child)" />
                            </div>
                        </q-menu>
                    </div>
                    <MainMenuPopupRow v-else :icon="item.icon" :label="item.label" @activate="onItemActivate(item)" />
                </template>
            </div>
        </q-menu>
    </q-btn>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import MainMenuPopupRow from '@/modules/mainMenu/MainMenuPopupRow.vue'

export interface IToolbarMenuItem {
    label: string
    icon?: string
    command?: () => void
    items?: IToolbarMenuItem[]
}

const SUBMENU_OPEN_DELAY = 120
const SUBMENU_CLOSE_DELAY = 220

export default defineComponent({
    name: 'document-execution-toolbar-menu',
    components: { MainMenuPopupRow },
    props: {
        items: { type: Array as PropType<IToolbarMenuItem[]>, default: () => [] }
    },
    emits: ['before-show'],
    data() {
        return {
            open: false,
            openSubmenu: null as number | null,
            hoverTimer: null as ReturnType<typeof setTimeout> | null
        }
    },
    beforeUnmount() {
        this.clearHoverTimer()
    },
    methods: {
        clearHoverTimer() {
            if (this.hoverTimer) clearTimeout(this.hoverTimer)
            this.hoverTimer = null
        },
        onGroupEnter(index: number) {
            this.clearHoverTimer()
            if (this.openSubmenu === index) return
            this.hoverTimer = setTimeout(() => (this.openSubmenu = index), this.openSubmenu === null ? SUBMENU_OPEN_DELAY : 0)
        },
        onGroupLeave(index: number) {
            this.clearHoverTimer()
            this.hoverTimer = setTimeout(() => {
                if (this.openSubmenu === index) this.openSubmenu = null
            }, SUBMENU_CLOSE_DELAY)
        },
        toggleSubmenu(index: number) {
            this.clearHoverTimer()
            this.openSubmenu = this.openSubmenu === index ? null : index
        },
        closeSubmenu() {
            this.clearHoverTimer()
            this.openSubmenu = null
        },
        onSubmenuUpdate(index: number, value: boolean) {
            if (value) this.openSubmenu = index
            else if (this.openSubmenu === index) this.openSubmenu = null
        },
        onItemActivate(item: IToolbarMenuItem) {
            this.open = false
            this.closeSubmenu()
            item.command?.()
        }
    }
})
</script>

<style lang="scss">
// Unscoped on purpose: the q-menu is teleported to the body and its root never gets this component's scope attribute.
.kn-toolbar-menu {
    min-width: 220px;
    border-radius: 8px;
}
.kn-toolbar-menu__list {
    padding: 4px;
}
// Slightly larger than the shared popup row, with the same space left and right of the content:
// the icon sits close to the left edge of the highlight, like the chevron does on the right.
.q-menu.kn-toolbar-menu .kn-toolbar-menu__list .kn-popup-row {
    height: 38px;
    gap: 12px;
    padding: 0 8px 0 6px;
}
.q-menu.kn-toolbar-menu .kn-toolbar-menu__list .kn-popup-row__icon {
    flex: 0 0 20px;
    width: 20px;
}
.q-menu.kn-toolbar-menu .kn-toolbar-menu__list .kn-popup-row__icon .q-icon,
.q-menu.kn-toolbar-menu .kn-toolbar-menu__list .kn-popup-row__chevron {
    font-size: 20px !important;
}
.q-menu.kn-toolbar-menu .kn-toolbar-menu__list .kn-popup-row__label {
    font-size: 15px;
}
</style>
