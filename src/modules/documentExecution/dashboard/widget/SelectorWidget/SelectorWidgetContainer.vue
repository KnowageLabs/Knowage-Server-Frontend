<template>
    <div class="selector-widget-container">
        <GridLayout :key="gridLayoutKey" v-model:layout="responsiveLayouts[currentScreenSize]" :responsive-layouts="responsiveLayouts" :cols="colSizes" :row-height="30" :is-draggable="!isFinalUser" :is-resizable="!isFinalUser" :vertical-compact="false" :use-css-transforms="false" :margin="[0, 0]" :responsive="true" :auto-size="false" @breakpoint-changed="onBreakpointChanged" @layout-updated="onLayoutUpdated">
            <template #item="{ item }">
                <div class="selector-column-wrapper" @mouseenter="onColumnMouseEnter(item.columnName)" @mouseleave="onColumnMouseLeave(item.columnName)" @mousemove="onColumnMouseMove(item.columnName)" @scroll.capture="onColumnScroll(item.columnName)" @contextmenu.prevent="onColumnRightClick(item.columnName)">
                    <SelectorWidget :prop-widget="getSingleColumnWidget(item.columnName)" :data-to-show="getColumnData(item.columnName)" :widget-initial-data="getColumnInitialData(item.columnName)" :prop-active-selections="getColumnSelections(item.columnName)" :editor-mode="false" :dashboard-id="dashboardId" :datasets="datasets" :selection-is-locked="selectionIsLocked" :local-mode="true" @selection-changed="onColumnSelectionChanged" />
                    <transition name="column-overlay-fade">
                        <div v-if="isColumnOverlayVisible(item.columnName)" class="column-clear-overlay" @mousemove.stop @click.self="hideOverlay">
                            <q-btn v-if="getColumnImpossibleValues(item.columnName).length > 0" flat color="warning" icon="warning" size="lg" @click.stop="clearImpossibleColumnValues(item.columnName)">
                                <q-tooltip>{{ $t('dashboard.selectorWidget.clearImpossibleValues') }}</q-tooltip>
                            </q-btn>
                            <q-btn flat color="info" icon="lock_open" size="lg" @click.stop="clearColumnSelection(item.columnName)">
                                <q-tooltip>{{ $t('dashboard.selectorWidget.clearSelection') }}</q-tooltip>
                            </q-btn>
                        </div>
                    </transition>
                </div>
            </template>
        </GridLayout>

        <q-inner-loading :showing="loading">
            <q-spinner-grid color="primary" size="3rem" />
        </q-inner-loading>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IDataset, ISelection, IWidget } from '../../Dashboard'
import { mapActions, mapState } from 'pinia'
import SelectorWidget from './SelectorWidget.vue'
import store from '../../Dashboard.store'
import dashboardStore from '../../Dashboard.store'
import mainStore from '@/App.store'
import deepcopy from 'deepcopy'
import { getSelectorWidgetData } from './SelectorWidgetDataProxy'
import { emitter } from '../../DashboardHelpers'

export default defineComponent({
    name: 'selector-widget-container',
    components: { SelectorWidget },
    inject: ['document'],
    props: {
        propWidget: { type: Object as PropType<IWidget>, required: true },
        dataToShow: { type: Object as any, required: true },
        widgetInitialData: { type: Object as any, required: true },
        propActiveSelections: { type: Array as PropType<ISelection[]>, required: true },
        dashboardId: { type: String, required: true },
        datasets: { type: Array as PropType<IDataset[]>, required: true },
        selectionIsLocked: { type: Boolean, required: true }
    },
    emits: ['close'],
    data() {
        return {
            localSelections: {} as any,
            responsiveLayouts: { lg: [], md: [], sm: [], xs: [], xxs: [] } as any,
            currentScreenSize: 'lg' as string,
            colSizes: { lg: 120, md: 100, sm: 70, xs: 40, xxs: 20 } as any,
            gridLayoutKey: 0,
            localWidgetData: {} as any,
            unlockedColumnName: null as string | null,
            debounceTimers: {} as Record<string, ReturnType<typeof setTimeout>>,
            hoverTimers: {} as Record<string, ReturnType<typeof setTimeout>>,
            slowHoverColumn: null as string | null,
            rightClickColumn: null as string | null,
            ctrlPressed: false,
            loading: false
        }
    },
    computed: {
        ...mapState(dashboardStore, {
            dashboards: 'dashboards'
        }),
        isFinalUser(): boolean {
            return !!(this.document as any)?.seeAsFinalUser
        },
        gridItems(): { columnName: string; isTreeGroup: boolean; treeColumns: any[] }[] {
            const globalModality = this.propWidget.settings?.configuration?.selectorType?.modality
            const columnTypeConfigs = this.propWidget.settings?.configuration?.columnTypeConfigs ?? []
            const descColNames = new Set<string>(this.propWidget.columns.filter((c: any) => c.descriptionColumn).map((c: any) => c.descriptionColumn))

            if (globalModality === 'tree' || globalModality === 'multiTree') {
                const treeGroupCols: any[] = []
                const result: { columnName: string; isTreeGroup: boolean; treeColumns: any[] }[] = []

                for (const col of this.propWidget.columns) {
                    const matchingConfig = columnTypeConfigs.find((cfg: any) => cfg.columns?.includes(col.columnName))
                    if (matchingConfig && matchingConfig.selectorType !== 'tree' && matchingConfig.selectorType !== 'multiTree') {
                        result.push({ columnName: col.columnName, isTreeGroup: false, treeColumns: [] })
                    } else {
                        treeGroupCols.push(col)
                    }
                }

                if (treeGroupCols.length >= 2) {
                    result.push({ columnName: treeGroupCols[0].columnName, isTreeGroup: true, treeColumns: treeGroupCols })
                } else if (treeGroupCols.length === 1) {
                    // Fallback: single remaining column, render as regular (non-tree) single-value
                    result.push({ columnName: treeGroupCols[0].columnName, isTreeGroup: false, treeColumns: [] })
                }

                return result.filter((item: any) => !descColNames.has(item.columnName))
            }

            return this.propWidget.columns.map((col: any) => ({ columnName: col.columnName, isTreeGroup: false, treeColumns: [] })).filter((item: any) => !descColNames.has(item.columnName))
        }
    },
    watch: {
        async propActiveSelections() {
            this.loadActiveSelectionsIntoLocal()
            await this.refreshLocalWidgetData() // refresh data to reflect store selection changes from other widgets
        },
        propWidget() {
            this.initializeGridLayout()
            this.gridLayoutKey++
        },
        dataToShow() {
            this.localWidgetData = deepcopy(this.dataToShow)
        }
    },
    created() {
        this.setEventListeners()
        this.loadActiveSelectionsIntoLocal()
        this.currentScreenSize = this.getBreakpointFromWidth(window.innerWidth)
        this.initializeGridLayout()
        this.localWidgetData = deepcopy(this.dataToShow)
    },
    unmounted() {
        this.removeEventListeners()
        Object.values(this.debounceTimers).forEach((timer) => clearTimeout(timer))
        Object.values(this.hoverTimers).forEach((timer) => clearTimeout(timer))
    },
    methods: {
        ...mapActions(store, ['setSelections']),

        //#region ===================== EventListeners & Keyboard =================================
        setEventListeners() {
            emitter.on('applySelectionsForMultiColumnSelector', this.onPlayClicked)
            window.addEventListener('keydown', this.onCtrlKeyDown)
            window.addEventListener('keyup', this.onCtrlKeyUp)
        },
        removeEventListeners() {
            emitter.off('applySelectionsForMultiColumnSelector', this.onPlayClicked)
            window.removeEventListener('keydown', this.onCtrlKeyDown)
            window.removeEventListener('keyup', this.onCtrlKeyUp)
        },
        onCtrlKeyDown(e: KeyboardEvent) {
            if (e.key === 'Control') this.ctrlPressed = true
        },
        onCtrlKeyUp(e: KeyboardEvent) {
            if (e.key === 'Control') this.ctrlPressed = false
        },
        //#endregion =============================================================================

        //#region ===================== Overlay Visibility ========================================
        isColumnOverlayVisible(columnName: string): boolean {
            const item = this.gridItems.find((i: any) => i.columnName === columnName)
            if (item?.isTreeGroup) {
                const treeColNames = new Set(item.treeColumns.map((c: any) => c.columnName))
                const hasSelection = Object.keys(this.localSelections).some((k) => treeColNames.has(k))
                if (!hasSelection) return false
            } else if (!this.localSelections[columnName]) {
                return false
            }
            return this.ctrlPressed || this.slowHoverColumn === columnName || this.rightClickColumn === columnName
        },
        onColumnMouseEnter(columnName: string) {
            this.hoverTimers[columnName] = setTimeout(() => {
                this.slowHoverColumn = columnName
            }, 500)
        },
        onColumnMouseLeave(columnName: string) {
            if (this.hoverTimers[columnName]) {
                clearTimeout(this.hoverTimers[columnName])
                delete this.hoverTimers[columnName]
            }
            if (this.slowHoverColumn === columnName) this.slowHoverColumn = null
            if (this.rightClickColumn === columnName) this.rightClickColumn = null
        },
        onColumnMouseMove(columnName: string) {
            if (this.hoverTimers[columnName]) {
                clearTimeout(this.hoverTimers[columnName])
                delete this.hoverTimers[columnName]
            }
            if (this.slowHoverColumn === columnName) this.slowHoverColumn = null
            this.hoverTimers[columnName] = setTimeout(() => {
                this.slowHoverColumn = columnName
            }, 1000)
        },
        onColumnScroll(columnName: string) {
            if (this.hoverTimers[columnName]) {
                clearTimeout(this.hoverTimers[columnName])
                delete this.hoverTimers[columnName]
            }
            if (this.slowHoverColumn === columnName) this.slowHoverColumn = null
            if (this.rightClickColumn === columnName) this.rightClickColumn = null
        },
        onColumnRightClick(columnName: string) {
            this.rightClickColumn = columnName
        },
        hideOverlay() {
            this.slowHoverColumn = null
            this.rightClickColumn = null
        },
        //#endregion =============================================================================

        //#region ===================== Column Selection Actions ==================================
        async clearColumnSelection(columnName: string) {
            const item = this.gridItems.find((i: any) => i.columnName === columnName)
            if (item?.isTreeGroup) {
                item.treeColumns.forEach((col: any) => delete this.localSelections[col.columnName])
            } else {
                delete this.localSelections[columnName]
            }
            this.slowHoverColumn = null
            this.rightClickColumn = null
            this.unlockedColumnName = null
            await this.refreshLocalWidgetData()
        },
        getColumnImpossibleValues(columnName: string): any[] {
            const item = this.gridItems.find((i: any) => i.columnName === columnName)
            if (item?.isTreeGroup) return []
            const colWidget = this.getSingleColumnWidget(columnName)
            if (colWidget.settings.configuration.selectorType.modality === 'tree' || colWidget.settings.configuration.selectorType.modality === 'multiTree') return []
            const selection = this.localSelections[columnName]
            if (!selection) return []
            const availableSet = new Set((this.localWidgetData[columnName]?.rows || []).map((r: any) => String(r.column_1)))
            return selection.value.filter((v: any) => !availableSet.has(String(v)))
        },
        async clearImpossibleColumnValues(columnName: string) {
            const selection = this.localSelections[columnName]
            if (!selection) return
            const availableSet = new Set((this.localWidgetData[columnName]?.rows || []).map((r: any) => String(r.column_1)))
            const validValues = selection.value.filter((v: any) => availableSet.has(String(v)))
            if (validValues.length === 0) {
                delete this.localSelections[columnName]
            } else {
                this.localSelections[columnName] = { ...selection, value: validValues }
            }
            this.slowHoverColumn = null
            this.rightClickColumn = null
            await this.refreshLocalWidgetData()
        },
        //#endregion =============================================================================

        //#region ===================== Grid Layout ===============================================
        getBreakpointFromWidth(width: number): string {
            if (width >= 1200) return 'lg'
            else if (width >= 996) return 'md'
            else if (width >= 768) return 'sm'
            else if (width >= 480) return 'xs'
            else return 'xxs'
        },
        onBreakpointChanged(breakpoint: string) {
            this.currentScreenSize = breakpoint
        },
        onLayoutUpdated(newLayout: any[]) {
            if (!this.propWidget.settings?.responsive) return
            if (!this.propWidget.settings.responsive.columnLayouts) {
                this.propWidget.settings.responsive.columnLayouts = {}
            }
            const columnLayout: Record<string, { x: number; y: number; w: number; h: number }> = {}
            newLayout.forEach((item: any) => {
                if (item.columnName) {
                    columnLayout[item.columnName] = { x: item.x, y: item.y, w: item.w, h: item.h }
                }
            })
            this.propWidget.settings.responsive.columnLayouts[this.currentScreenSize] = columnLayout
        },
        initializeGridLayout() {
            const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'] as const
            const hasColumnLayouts = !!this.propWidget.settings?.responsive?.columnLayouts
            const legacyLayout = hasColumnLayouts ? null : (this.propWidget.settings?.responsive?.columnLayout ?? null)

            breakpoints.forEach((bp) => {
                const savedLayout = hasColumnLayouts ? (this.propWidget.settings?.responsive?.columnLayouts?.[bp] ?? null) : bp === 'lg' ? legacyLayout : null
                const halfCols = Math.floor(this.colSizes[bp] / 2)

                this.responsiveLayouts[bp] = this.gridItems.map((item: any, index: number) => {
                    const saved = savedLayout?.[item.columnName]
                    return {
                        x: saved?.x ?? (index % 2) * halfCols,
                        y: saved?.y ?? Math.floor(index / 2) * 2,
                        w: saved?.w ?? halfCols,
                        h: saved?.h ?? 2,
                        i: item.columnName,
                        columnName: item.columnName,
                        static: false,
                        dragIgnoreFrom: '.q-slider__thumb, .q-range__thumb'
                    }
                })
            })
        },
        //#endregion =============================================================================

        //#region ===================== Column Data Helpers =======================================
        getColumnByName(columnName: string): any {
            return this.propWidget.columns.find((col: any) => col.columnName === columnName)
        },
        getSingleColumnWidget(columnName: string): IWidget {
            const singleColumnWidget = deepcopy(this.propWidget)
            const item = this.gridItems.find((i: any) => i.columnName === columnName)

            if (item?.isTreeGroup) {
                // Tree group: use all tree columns preserving actual modality
                singleColumnWidget.columns = item.treeColumns
                singleColumnWidget.settings.configuration.selectorType = {
                    modality: this.propWidget.settings?.configuration?.selectorType?.modality ?? 'tree',
                    alignment: 'vertical',
                    columnSize: ''
                }
                return singleColumnWidget
            }

            // Single column: apply possible override config
            const column = this.propWidget.columns.find((c: any) => c.columnName === columnName)
            if (!column) return singleColumnWidget
            singleColumnWidget.columns = [column]

            const configs = this.propWidget.settings?.configuration?.columnTypeConfigs ?? []
            const matchingConfig = configs.find((cfg: any) => cfg.columns?.includes(column.columnName))
            if (matchingConfig) {
                singleColumnWidget.settings.configuration.selectorType = {
                    modality: matchingConfig.selectorType,
                    alignment: matchingConfig.alignment ?? 'vertical',
                    columnSize: matchingConfig.columnSize ?? ''
                }
            }

            return singleColumnWidget
        },
        getColumnData(columnName: string): any {
            return this.localWidgetData[columnName] || { rows: [] }
        },
        getColumnInitialData(columnName: string): any {
            return this.widgetInitialData[columnName] || { rows: [] }
        },
        getColumnSelections(columnName: string): ISelection[] {
            const item = this.gridItems.find((i: any) => i.columnName === columnName)
            if (item?.isTreeGroup) {
                const treeColNames = new Set(item.treeColumns.map((c: any) => c.columnName))
                return Object.values(this.localSelections).filter((sel: any) => sel && treeColNames.has(sel.columnName)) as ISelection[]
            }
            const selection = this.localSelections[columnName]
            return selection ? [selection] : []
        },
        loadActiveSelectionsIntoLocal() {
            this.localSelections = {}
            this.propActiveSelections?.forEach((selection: ISelection) => {
                if (selection.datasetId === this.propWidget.dataset) {
                    this.localSelections[selection.columnName] = selection
                }
            })
        },
        //#endregion =============================================================================

        //#region ===================== Selection Changes & Data Refresh ==========================
        async onColumnSelectionChanged(selection: ISelection | any) {
            // Store or remove based on whether any value is selected
            if (!selection.value || selection.value.length === 0) {
                delete this.localSelections[selection.columnName]
            } else {
                this.localSelections[selection.columnName] = selection
            }

            const globalModality = this.propWidget.settings?.configuration?.selectorType?.modality
            const selectorType = globalModality?.toLowerCase()
            const isMultiValueType = ['multivalue', 'multidropdown', 'daterange', 'range', 'multitree'].includes(selectorType)

            if (isMultiValueType) {
                if (this.debounceTimers[selection.columnName]) {
                    clearTimeout(this.debounceTimers[selection.columnName])
                }
                this.debounceTimers[selection.columnName] = setTimeout(async () => {
                    delete this.debounceTimers[selection.columnName]
                    this.unlockedColumnName = selection.columnName // mark this column as unlocked so it won't self-filter
                    await this.refreshLocalWidgetData()
                }, 1000)
            } else {
                this.unlockedColumnName = null
                await this.refreshLocalWidgetData()
            }
        },
        async refreshLocalWidgetData() {
            this.loading = true
            try {
                const selectionsArray = Object.values(this.localSelections).filter((sel: any) => sel !== undefined) as any as ISelection[]
                const dashboard = this.dashboards[this.dashboardId]
                if (!dashboard) return

                const storedAssociations = (dashboard as any).associations ?? {}
                let associativeResponseSelections: any = undefined

                if (Object.keys(storedAssociations).length > 0) {
                    const datasetConfig = dashboard.configuration?.datasets?.find((ds: any) => ds.id === this.propWidget.dataset)
                    if (datasetConfig?.dsLabel && storedAssociations[datasetConfig.dsLabel]) {
                        associativeResponseSelections = storedAssociations
                    }
                }

                this.localWidgetData = await getSelectorWidgetData(this.dashboardId, dashboard.configuration, this.propWidget, dashboard.configuration?.datasets, this.$http, false, selectionsArray, associativeResponseSelections, this.unlockedColumnName ?? undefined)
            } catch (error) {
                console.error('[SelectorWidgetContainer] Error refreshing widget data:', error)
            } finally {
                this.loading = false
            }
        },
        async onPlayClicked() {
            const selectionsArray = Object.values(this.localSelections).filter((sel: any) => sel !== undefined) as any as ISelection[]
            if (selectionsArray.length > 0) {
                await this.setSelections(this.dashboardId, selectionsArray, this.$http)
            }
        }
        //#endregion =============================================================================
    }
})
</script>

<style lang="scss" scoped>
.selector-widget-container {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    overflow-y: auto;

    :deep(.vgl-layout) {
        overflow-y: auto;
    }

    :deep(.vgl-item--placeholder) {
        background-color: rgba(25, 118, 210, 0.1);
        border: 2px dashed #1976d2;
    }

    .selector-column-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: auto;

        .column-clear-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            border-radius: 4px;
            pointer-events: auto;
        }
    }

    .column-overlay-fade-enter-active,
    .column-overlay-fade-leave-active {
        transition: opacity 0.15s ease;
    }

    .column-overlay-fade-enter-from,
    .column-overlay-fade-leave-to {
        opacity: 0;
    }
}
</style>
