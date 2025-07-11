<template>
    <div class="sheets-container">
        <div v-if="(edit && sheets && sheets.length >= 1) || (!edit && sheets && sheets.length > 1)" class="sheets-list" :class="labelPosition" role="tablist">
            <a v-for="(sheet, index) in sheets" :key="index" class="sheet-label" :class="{ active: currentPage === index, hidden: sheets.length <= 1 }" @touchstart.passive="setPage(index)" @click="setPage(index)" @dblclick.stop="renameSheet(index)">
                <slot name="label" v-bind="sheet">
                    <template v-if="sheet.icon">
                        <i v-if="sheet.icon.className" :class="sheet.icon.className" class="p-mr-1"></i>
                        <div v-if="sheet.icon.category === 'custom'" class="custom-image" :style="{ 'background-image': `url(${sheet.icon.image})` }"></div>
                    </template>

                    <input v-if="index === sheetToRenameIndex" v-model="tempLabel" :ref="`input_${index}`" type="text" @click.stop="" @blur="saveRename(index, $event)" @keyup.enter="saveRename(index, $event)" />
                    <span v-else class="kn-truncated sheet-label-text" :title="sheet.label" :class="{ hasIcon: sheet.icon }">{{ sheet.label }}</span>
                    <Button v-if="edit" icon="fa-solid fa-ellipsis-vertical" class="p-button-text p-button-rounded p-button-plain" :class="`sheet_menu_${index}`" @click="toggleMenu($event, index)" />
                    <q-menu :ref="`menu_${index}`" :target="`.sheet_menu_${index}`" data-test="menu">
                        <q-list style="min-width: 100px" dense>
                            <q-item clickable v-close-popup @click="renameSheet(index)">
                                <q-item-section>
                                    <div>
                                        <i class="p-mr-3 fa-solid fa-edit" />
                                        <label>{{ $t('dashboard.sheets.rename') }}</label>
                                    </div>
                                </q-item-section>
                            </q-item>
                            <q-item clickable v-close-popup @click="manageIcon(index)">
                                <q-item-section>
                                    <div>
                                        <i class="p-mr-3 fa-solid fa-icons" />
                                        <label>{{ $t('dashboard.sheets.manageIcon') }}</label>
                                    </div>
                                </q-item-section>
                            </q-item>
                            <q-item v-if="sheets.length > 1 && index !== sheets.length - 1" clickable v-close-popup @click="move('right', index)">
                                <q-item-section>
                                    <div>
                                        <i class="p-mr-3 fa-solid fa-arrow-right" />
                                        <label>{{ $t('dashboard.sheets.moveRight') }}</label>
                                    </div>
                                </q-item-section>
                            </q-item>
                            <q-item v-if="sheets.length > 1 && index !== 0" clickable v-close-popup @click="move('left', index)">
                                <q-item-section>
                                    <div>
                                        <i class="p-mr-3 fa-solid fa-arrow-left" />
                                        <label>{{ $t('dashboard.sheets.moveLeft') }}</label>
                                    </div>
                                </q-item-section>
                            </q-item>
                            <q-separator v-if="sheets.length > 1" />
                            <q-item v-if="sheets.length > 1" clickable v-close-popup @click="deleteSheet(index)">
                                <q-item-section>
                                    <div>
                                        <i class="p-mr-3 fa-solid fa-trash" />
                                        <label>{{ $t('dashboard.sheets.delete') }}</label>
                                    </div>
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                </slot>
            </a>
            <a v-if="edit" class="sheet-label" :title="$t('dashboard.sheets.add')" @click="addSheet"><i class="fa-solid fa-circle-plus"></i></a>
        </div>
        <kn-icon-picker v-if="iconPickerVisible" :enable-base64="true" :current-icon="sheets[iconPickerVisible - 1].icon" @save="saveIcon" @close="closeIcon"></kn-icon-picker>

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
import deepcopy from 'deepcopy'

export default defineComponent({
    name: 'kn-dashboard-tabs-panel',
    components: { KnIconPicker },
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
        }
    },
    emits: ['sheetChange', 'update:sheets', 'sheetDeleted'],
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
        toggleMenu(e, index) {
            e.preventDefault()
            e.stopImmediatePropagation()
            // eslint-disable-next-line
            // @ts-ignore
            this.$refs[`menu_${index}`][0].show()
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
        position: relative;
        height: 35px;
        margin: 0;
        padding: 0 4px;
        border-bottom: 1px solid #ccc;
        list-style: none;
        display: inline-flex;
        order: 0;
        background-color: #f1f1f1;
        &.bottom {
            order: 2;
            border-top: 1px solid #e4e4e4;
            border-bottom: 0;
        }
        .sheet-label {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: auto;
            max-width: 250px;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
            height: 100%;
            position: relative;
            padding: 0 16px;
            background: white;
            color: #999;
            cursor: pointer;
            text-decoration: none;
            &:hover {
                background-color: #999;
                color: #000;
            }
            &:focus {
                outline: none;
            }
            &.active {
                color: #000;
                font-weight: 900;
                border-top: 2px solid var(--kn-toolbar-primary-background-color);
            }
        }
    }
}

@media all and (max-width: 600px) {
    .sheets-container {
        .sheets-list {
            height: 50px;
            max-width: calc(100vw - var(--kn-mainmenu-width));
        }
        .sheet-label {
            flex: 1 0 0;
            max-width: unset;
            i {
                font-size: 2rem;
            }
            .sheet-label-text.hasIcon {
                display: none;
            }
        }
    }
}
</style>
