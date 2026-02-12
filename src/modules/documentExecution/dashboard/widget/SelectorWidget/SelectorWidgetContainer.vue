<template>
    <div class="selector-widget-container">
        <GridLayout v-model:layout="gridLayout" :cols="4" :row-height="30" :is-draggable="true" :is-resizable="true" :vertical-compact="false" :use-css-transforms="false" :margin="[0, 0]" :responsive="false" :auto-size="false">
            <template #item="{ item }">
                <div class="selector-column-wrapper">
                    <SelectorWidget :prop-widget="getSingleColumnWidget(getColumnByName(item.columnName))" :data-to-show="getColumnData(item.columnName)" :widget-initial-data="getColumnInitialData(item.columnName)" :prop-active-selections="getColumnSelections(item.columnName)" :editor-mode="false" :dashboard-id="dashboardId" :datasets="datasets" :selection-is-locked="selectionIsLocked" :local-mode="true" @selection-changed="onColumnSelectionChanged" />
                </div>
            </template>
        </GridLayout>
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
import { getWidgetData } from '../../DashboardDataProxy'
import { emitter } from '../../DashboardHelpers'

export default defineComponent({
    name: 'selector-widget-container',
    components: { SelectorWidget },
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
            gridLayout: [] as any[],
            localWidgetData: {} as any
        }
    },
    computed: {
        ...mapState(dashboardStore, {
            dashboards: 'dashboards'
        })
    },
    watch: {
        async propActiveSelections() {
            this.loadActiveSelectionsIntoLocal()
            // Refresh data to reflect store selection changes from other widgets
            await this.refreshLocalWidgetData()
        },
        propWidget() {
            this.initializeGridLayout()
        },
        dataToShow() {
            // Update local widget data when external data changes (e.g., from store)
            this.localWidgetData = deepcopy(this.dataToShow)
        }
    },
    created() {
        this.setEventListeners()
        this.loadActiveSelectionsIntoLocal()
        this.initializeGridLayout()
        this.localWidgetData = deepcopy(this.dataToShow)

        console.group('[SelectorWidgetContainer] Created with widget:', this.propWidget)
        console.log('Initial active selections:', this.propActiveSelections)
        console.log('localSelections initialized to:', this.localSelections)
        console.groupEnd()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        ...mapActions(store, ['setSelections']),
        setEventListeners() {
            emitter.on('applySelectionsForMultiColumnSelector', this.onPlayClicked)
        },
        removeEventListeners() {
            emitter.off('applySelectionsForMultiColumnSelector', this.onPlayClicked)
        },
        initializeGridLayout() {
            this.gridLayout = this.propWidget.columns.map((col: any, index: number) => ({
                x: (index % 2) * 2,
                y: Math.floor(index / 2) * 2,
                w: 2,
                h: 2,
                i: col.columnName,
                columnName: col.columnName,
                static: false
            }))
        },
        getColumnByName(columnName: string): any {
            return this.propWidget.columns.find((col: any) => col.columnName === columnName)
        },
        getSingleColumnWidget(column: any): IWidget {
            const singleColumnWidget = deepcopy(this.propWidget)
            singleColumnWidget.columns = [column]
            return singleColumnWidget
        },
        getColumnData(columnName: string): any {
            return this.localWidgetData[columnName] || { rows: [] }
        },
        getColumnInitialData(columnName: string): any {
            return this.widgetInitialData[columnName] || { rows: [] }
        },
        getColumnSelections(columnName: string): ISelection[] {
            const selection = this.localSelections[columnName]
            return selection ? [selection] : []
        },
        loadActiveSelectionsIntoLocal() {
            // Initialize localSelections from propActiveSelections
            this.localSelections = {}
            this.propActiveSelections?.forEach((selection: ISelection) => {
                if (selection.datasetId === this.propWidget.dataset) {
                    this.localSelections[selection.columnName] = selection
                }
            })
        },
        async onColumnSelectionChanged(selection: ISelection | any) {
            // Check if this is an "apply" signal from child's local play button
            if (selection?.isApplyClick) {
                // Child widget's local play button was clicked
                // Refresh local data based on accumulated selections
                // But do NOT update dashboard selections
                await this.refreshLocalWidgetData()
                return
            }

            // Regular selection change - update local selection
            this.localSelections[selection.columnName] = selection
            const selectorType = this.propWidget.settings?.configuration?.selectorType?.modality?.toLowerCase()
            const isMultiValueType = ['multivalue', 'multidropdown', 'daterange', 'range'].includes(selectorType)

            if (!isMultiValueType) {
                // Only refresh for single-value selectors to update dependent column options
                await this.refreshLocalWidgetData()
            }
        },
        async refreshLocalWidgetData() {
            try {
                const selectionsArray = Object.values(this.localSelections).filter((sel: any) => sel !== undefined) as any as ISelection[]
                const dashboard = this.dashboards[this.dashboardId]
                if (!dashboard) return

                this.localWidgetData = await getWidgetData(this.dashboardId, this.propWidget, dashboard.configuration?.datasets, this.$http, false, selectionsArray, { searchText: '', searchColumns: [] }, dashboard.configuration, null, false)
            } catch (error) {
                console.error('[SelectorWidgetContainer] Error refreshing widget data:', error)
            }
        },
        async onPlayClicked() {
            const selectionsArray = Object.values(this.localSelections).filter((sel: any) => sel !== undefined) as any as ISelection[]
            if (selectionsArray.length > 0) {
                await this.setSelections(this.dashboardId, selectionsArray, this.$http)
            }
        }
    }
})
</script>

<style lang="scss" scoped>
.selector-widget-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    overflow-y: auto;

    :deep(.vgl-layout) {
        // background-color: #eee;
        // min-width: 500px;
        overflow-y: auto;
    }

    // :deep(.vgl-item:not(.vgl-item--placeholder)) {
    //     background-color: #fff;
    //     border: 1px solid #e0e0e0;
    //     border-radius: 4px;
    //     padding: 12px;
    //     box-sizing: border-box;
    //     touch-action: auto;
    // }

    :deep(.vgl-item--placeholder) {
        background-color: rgba(25, 118, 210, 0.1);
        border: 2px dashed #1976d2;
    }

    .selector-column-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: auto;
    }

    .play-button-container {
        display: flex;
        justify-content: flex-end;
        padding: 12px;
        background-color: #fff;
        border-top: 1px solid #e0e0e0;
        flex-shrink: 0;

        .play-button {
            background-color: #1976d2;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background-color 0.2s;

            &:hover:not(:disabled) {
                background-color: #1565c0;
            }

            &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            i {
                font-size: 0.875rem;
            }
        }
    }
}
</style>
