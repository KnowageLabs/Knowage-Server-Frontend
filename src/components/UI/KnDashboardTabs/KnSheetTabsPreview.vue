<template>
    <div class="kn-sheet-tabs kn-sheet-tabs--preview" :style="tabsStyle.vars" :data-indicator="tabsStyle.indicator" :data-tab-width="tabsStyle.tabWidth" :data-icons="tabsStyle.showIcons ? 'on' : 'off'" aria-hidden="true">
        <div class="kn-sheet-tabs__list">
            <div v-for="(tab, index) in tabs" :key="index" class="kn-sheet-tabs__tab" :class="{ 'kn-sheet-tabs__tab--active': index === activeIndex, 'kn-sheet-tabs__tab--plain': !showMenu }">
                <q-icon v-if="tab.icon" :name="tab.icon" class="kn-sheet-tabs__icon" />
                <span class="kn-sheet-tabs__label">{{ tab.label }}</span>
                <q-icon v-if="showMenu" name="more_vert" size="16px" class="kn-sheet-tabs__more" />
            </div>
        </div>
        <span v-if="showAdd" class="kn-sheet-tabs__add kn-sheet-tabs__add--static"><q-icon name="sym_o_add" size="18px" /></span>
        <div v-if="$slots.end" class="kn-sheet-tabs__end"><slot name="end"></slot></div>
    </div>
</template>

<script setup lang="ts">
import type { ISheetTabsStyle } from '@/modules/documentExecution/dashboard/sheetTabs/SheetTabsHelper'

// A static sheet tab bar with the same styles as the dashboard one (_knSheetTabs.scss), for previews.
withDefaults(
    defineProps<{
        tabsStyle: ISheetTabsStyle
        tabs: { label: string; icon?: string }[]
        activeIndex?: number
        showMenu?: boolean
        showAdd?: boolean
    }>(),
    { activeIndex: 0, showMenu: false, showAdd: false }
)
</script>

<style lang="scss" scoped>
.kn-sheet-tabs--preview {
    pointer-events: none;
}
.kn-sheet-tabs__add--static {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 26px;
}
</style>
