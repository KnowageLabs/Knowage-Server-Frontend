<template>
    <div class="sheets-container">
        <div v-if="(edit && sheets && sheets.length >= 1) || (!edit && sheets && sheets.length > 1)" class="sheets-list kn-sheet-tabs" :class="labelPosition" :style="tabsStyle?.vars" :data-indicator="tabsStyle?.indicator ?? 'short'" :data-tab-width="tabsStyle?.tabWidth ?? 'fit'" :data-icons="tabsStyle?.showIcons === false ? 'off' : 'on'" data-tour-id="dashboard-sheets">
            <div class="kn-sheet-tabs__list" role="tablist">
                <a v-for="(sheet, index) in sheets" :key="index" class="sheet-label kn-sheet-tabs__tab" :class="{ 'kn-sheet-tabs__tab--active': currentPage === index, 'kn-sheet-tabs__tab--plain': !edit, hidden: sheets.length <= 1 }" role="tab" :aria-selected="currentPage === index" tabindex="0" @touchstart.passive="setPage(index)" @click="setPage(index)" @keydown.enter="setPage(index)" @dblclick.stop="renameSheet(index)">
                    <slot name="label" v-bind="sheet">
                        <template v-if="sheet.icon">
                            <i v-if="sheet.icon.className" :class="sheet.icon.className" class="kn-sheet-tabs__icon"></i>
                            <div v-if="sheet.icon.category === 'custom'" class="kn-sheet-tabs__image" :style="{ 'background-image': `url(${sheet.icon.image})` }"></div>
                        </template>
                        <input v-if="index === sheetToRenameIndex" v-model="tempLabel" :ref="`input_${index}`" type="text" class="kn-sheet-tabs__rename" @click.stop="" @blur="saveRename(index, $event)" @keyup.enter="saveRename(index, $event)" />
                        <span v-else class="kn-sheet-tabs__label sheet-label-text" :title="sheet.label" :class="{ 'kn-sheet-tabs__label--has-icon': sheet.icon }">{{ sheet.label }}</span>
                        <q-btn v-if="edit" flat round dense size="sm" icon="more_vert" class="kn-sheet-tabs__more" :aria-label="$t('common.menu')" data-test="sheet-menu-button" @click.stop @dblclick.stop>
                            <q-menu class="kn-toolbar-menu" anchor="top right" self="bottom right" :offset="[0, 4]" data-test="menu">
                                <div class="kn-toolbar-menu__list">
                                    <MainMenuPopupRow v-close-popup icon="sym_o_edit" :label="$t('dashboard.sheets.rename')" @activate="renameSheet(index)" />
                                    <MainMenuPopupRow v-close-popup icon="sym_o_interests" :label="$t('dashboard.sheets.manageIcon')" @activate="manageIcon(index)" />
                                    <MainMenuPopupRow v-close-popup icon="sym_o_content_copy" :label="$t('dashboard.sheets.clone')" @activate="clone(index)" />
                                    <MainMenuPopupRow v-if="sheets.length > 1 && index !== 0" v-close-popup icon="sym_o_arrow_back" :label="$t('dashboard.sheets.moveLeft')" @activate="move('left', index)" />
                                    <MainMenuPopupRow v-if="sheets.length > 1 && index !== sheets.length - 1" v-close-popup icon="sym_o_arrow_forward" :label="$t('dashboard.sheets.moveRight')" @activate="move('right', index)" />
                                    <template v-if="sheets.length > 1">
                                        <q-separator class="q-my-xs" />
                                        <MainMenuPopupRow v-close-popup icon="sym_o_delete" :label="$t('dashboard.sheets.delete')" danger @activate="deleteSheet(index)" />
                                    </template>
                                </div>
                            </q-menu>
                        </q-btn>
                    </slot>
                </a>
            </div>
            <q-btn v-if="edit" flat dense class="kn-sheet-tabs__button kn-sheet-tabs__add" icon="sym_o_add" :aria-label="$t('dashboard.sheets.add')" data-test="add-sheet-button" @click="addSheet">
                <q-tooltip :delay="500">{{ $t('dashboard.sheets.add') }}</q-tooltip>
            </q-btn>
            <div v-if="$slots.end" class="kn-sheet-tabs__end"><slot name="end"></slot></div>
        </div>
        <kn-icon-picker v-if="iconPickerVisible" :enable-base64="true" :sets="['fontawesome']" :current-icon="sheets[iconPickerVisible - 1].icon" @save="saveIcon" @close="closeIcon"></kn-icon-picker>

        <div class="sheets-wrapper" @touchstart.passive="onTouchStart($event)" @touchmove.passive="onTouchMove($event)" @touchend.passive="onTouchEnd($event)">
            <div class="sheet-content" :style="{ transform: `translate3d(${translateX}px, 0, 0)` }">
                <slot />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { IDashboardSheet, ISheet } from '@/modules/documentExecution/dashboard/Dashboard'
import KnIconPicker from '@/components/UI/KnIconPicker/KnIconPicker.vue'
import MainMenuPopupRow from '@/modules/mainMenu/MainMenuPopupRow.vue'
import type { ISheetTabsStyle } from '@/modules/documentExecution/dashboard/sheetTabs/SheetTabsHelper'
import deepcopy from 'deepcopy'

export default defineComponent({
    name: 'kn-dashboard-tabs-panel',
    components: { KnIconPicker, MainMenuPopupRow },
    props: {
        edit: { type: Boolean, default: false },
        sheets: {
            type: Array as PropType<Array<ISheet>>,
            required: true
        },
        labelPosition: {
            type: String,
            default: 'bottom'
        },
        activeDashboardSheet: {
            type: Object as PropType<IDashboardSheet>
        },
        // From getSheetTabsStyle (SheetTabsHelper). Without it the bar uses the defaults of _knSheetTabs.scss.
        tabsStyle: {
            type: Object as PropType<ISheetTabsStyle | null>,
            default: null
        }
    },
    emits: ['sheetChange', 'update:sheets', 'sheetDeleted', 'sheetCloned'],
    data() {
        return {
            currentPage: 0,
            translateX: 0,
            dpr: 1,
            distance: {
                left: 0,
                top: 0
            },
            iconPickerVisible: null,
            touchPoint: {
                startLeft: 0,
                startTop: 0,
                startTime: 0
            },
            sheetToRenameIndex: null,
            startTranslateX: 0,
            startTime: 0,
            swipeType: 'init',
            tempLabel: '',
            initialLoad: true
        }
    },
    watch: {
        sheets() {
            this.loadActiveSheetFromQuery()
        },
        activeDashboardSheet() {
            this.setInitialSheetIndex()
        }
    },
    mounted() {
        this.initDPR()
        this.loadActiveSheetFromQuery()
    },
    methods: {
        addSheet(): void {
            this.$emit('update:sheets', [...this.sheets, { label: this.$t('dashboard.sheets.newSheet'), widgets: { lg: [], md: [], sm: [], xs: [], xxs: [] }, id: crypto.randomUUID() }])
        },
        renameSheet(index): void {
            if (this.edit) {
                this.sheetToRenameIndex = index
                this.tempLabel = this.sheets[index].label
                setTimeout(() => {
                    this.$refs[`input_${index}`][0].focus()
                }, 100)
            }
        },
        saveRename(index, event): void {
            if (this.edit) {
                const tempSheets = [...this.sheets]
                tempSheets[index].label = this.tempLabel
                this.$emit('update:sheets', tempSheets)
                this.sheetToRenameIndex = null
            }
        },
        clone(index): void {
            this.$emit('sheetCloned', index)
            this.setPage(index + 1)
        },
        deleteSheet(index): void {
            this.$confirm.require({
                message: this.$t('dashboard.sheets.confirmDeleteMessage'),
                header: this.$t('dashboard.sheets.delete'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    const tempSheet = [...this.sheets]
                    const sheetForDelete = deepcopy(tempSheet[index])
                    tempSheet.splice(index, 1)

                    if (index <= this.currentPage && this.currentPage > 0) this.prev()

                    this.$emit('update:sheets', tempSheet)
                    this.$emit('sheetDeleted', { sheetForDelete: sheetForDelete, currentPage: this.currentPage })
                }
            })
        },
        manageIcon(index) {
            this.iconPickerVisible = index + 1
        },
        closeIcon() {
            this.iconPickerVisible = null
        },
        saveIcon(event) {
            const tempSheets = [...this.sheets]
            tempSheets[this.iconPickerVisible - 1].icon = event
            this.$emit('update:sheets', tempSheets)
            this.iconPickerVisible = null
        },
        move(direction, index) {
            const tempSheets = [...this.sheets]
            const tempSheet = tempSheets.splice(index, 1)
            tempSheets.splice(direction == 'right' ? index + 1 : index - 1, 0, tempSheet[0])
            this.$emit('update:sheets', tempSheets)
        },
        setPage(index): void {
            this.$refs
            this.currentPage = index
            this.$emit('sheetChange', index)
            this.translateX = -this.sheets.reduce((total, item, i) => {
                return i > index - 1 ? total : total + document.querySelectorAll('#sheet_' + index)[0]?.clientWidth
            }, 0)
        },
        next() {
            let currentpage = this.currentPage
            currentpage < this.sheets.length - 1 && currentpage++
            this.setPage(currentpage)
        },
        prev() {
            let currentpage = this.currentPage
            currentpage > 0 && currentpage--
            this.setPage(currentpage)
        },
        reset() {
            this.setPage(this.currentPage)
        },
        onTouchStart(event) {
            if (event.target.classList.contains('drag-handle') || event.target.classList.contains('vue-resizable-handle')) return
            const touchPoint = event.changedTouches[0] || event.touches[0]
            const startLeft = touchPoint.pageX
            this.touchPoint.startLeft = startLeft
            const startTop = touchPoint.pageY
            this.touchPoint.startTop = startTop
            const startTranslateX = this.translateX
            this.startTranslateX = startTranslateX
            const touchTime = new Date().getTime()
            this.touchPoint.startTime = touchTime
        },
        onTouchMove(event) {
            if (event.target.classList.contains('drag-handle') || event.target.classList.contains('vue-resizable-handle')) return
            const touchPoint = event.changedTouches[0] || event.touches[0]
            const distanceLeft = touchPoint.pageX - this.touchPoint.startLeft
            this.distance.left = distanceLeft
            const distanceTop = Math.abs(touchPoint.pageY - this.touchPoint.startTop)
            this.distance.top = distanceTop
            switch (this.swipeType) {
                case 'init':
                    if (Math.abs(distanceLeft) / distanceTop > 1.5) {
                        this.swipeType = 'swipe'
                    } else {
                        this.swipeType = 'scroll'
                    }
                    break
                case 'scroll':
                    break
                case 'swipe':
                    this.translateX = this.startTranslateX + distanceLeft
                    break
            }
        },
        onTouchEnd() {
            const quick = new Date().getTime() - this.startTime < 1000
            if ((this.distance.left < -(200 * this.dpr) && this.distance.top < 100 * this.dpr) || (quick && this.distance.left < -15 && this.distance.top / this.distance.left > -6)) {
                this.next()
            } else if ((this.distance.left > 200 * this.dpr && this.distance.top < 100 * this.dpr) || (quick && this.distance.left > 15 && this.distance.top / this.distance.left < 6)) {
                this.prev()
            } else {
                this.reset()
            }
            this.distance.left = 0
            this.distance.top = 0
        },
        initDPR() {
            const win = window
            const isIPhone = win.navigator.appVersion.match(/iphone/gi)
            const devicePixelRatio = win.devicePixelRatio
            if (isIPhone) {
                if (devicePixelRatio >= 3 && this.dpr) {
                    this.dpr = 3
                } else if (devicePixelRatio >= 2 && this.dpr) {
                    this.dpr = 2
                } else {
                    this.dpr = 1
                }
            } else {
                this.dpr = 1
            }
        },
        loadActiveSheetFromQuery() {
            if (this.initialLoad && this.$route.query.sheet !== undefined && this.$route.query.sheet !== null && this.sheets?.length > +this.$route.query.sheet) {
                this.setPage(+this.$route.query.sheet)
                this.initialLoad = false
            }
        },
        setInitialSheetIndex() {
            if (this.sheets.length < 2) return
            let found = false
            this.sheets.findIndex((sheet, index) => {
                if (sheet.id === this.activeDashboardSheet?.id) {
                    this.setPage(index)
                    found = true
                }
            })
            if (!found) this.setPage(0)
        }
    }
})
</script>

<style lang="scss" scoped>
// The bar itself is styled by the global _knSheetTabs.scss (shared with the previews).
.sheets-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    .sheets-wrapper {
        width: 100%;
        flex: 1 0 0;
        order: 1;
        overflow: hidden;
        .sheet-content {
            width: 100%;
            height: 100%;
            display: flex;
            white-space: nowrap;
            transition: all 0.2s ease;
        }
    }

    .sheets-list {
        order: 0;
        &.bottom {
            order: 2;
        }
    }
}
</style>
