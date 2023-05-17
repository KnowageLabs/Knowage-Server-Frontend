<template>
    <grid-item :id="`widget${item.id}`" :ref="`widget${item.id}`" :key="item.id" class="p-d-flex widget-grid-item" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i" drag-allow-from=".drag-handle" :class="{ canEdit: canEditDashboard(document) }" @resized="resizedEvent">
        <div v-if="initialized" class="drag-handle"></div>
        <ProgressSpinner v-if="loading || customChartLoading" class="kn-progress-spinner" />
        <Skeleton v-if="!initialized" shape="rectangle" height="100%" border-radius="0" />
        <WidgetRenderer
            v-if="!loading"
            :widget="widget"
            :widget-data="widgetData"
            :widget-initial-data="widgetInitialData"
            :datasets="datasets"
            :dashboard-id="dashboardId"
            :selection-is-locked="selectionIsLocked"
            :prop-active-selections="activeSelections"
            :variables="variables"
            :widget-loading="widgetLoading"
            @reload-data="reloadWidgetData"
            @launch-selection="launchSelection"
            @mouseover="toggleFocus"
            @mouseleave="startUnfocusTimer(500)"
            @loading="customChartLoading = $event"
            @contextmenu="onWidgetRightClick"
        ></WidgetRenderer>
        <WidgetButtonBar
            :widget="widget"
            :play-selection-button-visible="playSelectionButtonVisible"
            :selection-is-locked="selectionIsLocked"
            :dashboard-id="dashboardId"
            :in-focus="inFocus"
            :menu-items="items"
            @edit-widget="toggleEditMode"
            @unlock-selection="unlockSelection"
            @launch-selection="launchSelection"
            @change-focus="changeFocus"
        ></WidgetButtonBar>
        <ContextMenu v-if="canEditDashboard(document)" ref="contextMenu" :model="items" />
    </grid-item>

    <QuickWidgetDialog v-if="showQuickDialog" @close="toggleQuickDialog" />
    <WidgetSearchDialog v-if="searchDialogVisible" :visible="searchDialogVisible" :widget="widget" :prop-search="search" @close="searchDialogVisible = false" @search="onSearch"></WidgetSearchDialog>
</template>

<script lang="ts">
/**
 * ! this component will be in charge of managing the widget behaviour related to data and interactions, not related to view elements.
 */
import { defineComponent, PropType } from 'vue'
import { IDataset, IMenuItem, ISelection, IVariable, IWidget } from '../Dashboard'
import { emitter, canEditDashboard } from '../DashboardHelpers'
import { mapState, mapActions } from 'pinia'
import { getWidgetData } from '../DataProxyHelper'
import store from '../Dashboard.store'
import mainStore from '@/App.store'
import WidgetRenderer from './WidgetRenderer.vue'
import WidgetButtonBar from './WidgetButtonBar.vue'
import Skeleton from 'primevue/skeleton'
import ProgressSpinner from 'primevue/progressspinner'
import deepcopy from 'deepcopy'
import { ISelectorWidgetSettings } from '../interfaces/DashboardSelectorWidget'
import { datasetIsUsedInAssociations } from './interactionsHelpers/DatasetAssociationsHelper'
import { loadAssociativeSelections } from './interactionsHelpers/InteractionHelper'
import ContextMenu from 'primevue/contextmenu'
import QuickWidgetDialog from './commonComponents/QuickWidgetDialog.vue'
import WidgetSearchDialog from './WidgetSearchDialog/WidgetSearchDialog.vue'

export default defineComponent({
    name: 'widget-manager',
    components: { ContextMenu, Skeleton, WidgetButtonBar, WidgetRenderer, ProgressSpinner, QuickWidgetDialog, WidgetSearchDialog },
    inject: ['dHash'],
    props: {
        model: { type: Object },
        item: { required: true, type: Object },
        activeSheet: { type: Boolean },
        document: { type: Object },
        widget: { type: Object as PropType<IWidget>, required: true },
        datasets: { type: Array as PropType<IDataset[]>, required: true },
        dashboardId: { type: String, required: true },
        variables: { type: Array as PropType<IVariable[]>, required: true }
    },
    data() {
        return {
            loading: false,
            showQuickDialog: false,
            initialized: true,
            widgetModel: null as any,
            widgetInitialData: {} as any,
            widgetData: {} as any,
            selectedWidgetId: '' as string,
            selectedDataset: {} as any,
            widgetEditorVisible: false,
            activeSelections: [] as ISelection[],
            pagination: {
                offset: 0,
                itemsNumber: 15,
                totalItems: 0
            },
            inFocus: false,
            selectionIsLocked: false,
            playDisabledButtonTimeout: null as any,
            widgetLoading: false,
            customChartLoading: false,
            canEditDashboard,
            items: [
                { label: this.$t('dashboard.widgetEditor.map.qMenu.edit'), icon: 'fa-solid fa-pen-to-square', command: () => this.toggleEditMode(), visible: true },
                { label: this.$t('dashboard.widgetEditor.map.qMenu.expand'), icon: 'fa-solid fa-expand', command: () => this.expandWidget(this.widget), visible: true },
                { label: this.$t('dashboard.widgetEditor.map.qMenu.changeType'), icon: 'fa-solid fa-chart-column', command: () => this.cloneWidget(this.widget), visible: this.widget.type === 'highcharts' },
                { label: this.$t('dashboard.widgetEditor.map.qMenu.xor'), icon: 'fa-solid fa-arrow-right', command: () => this.searchOnWidget(this.widget), visible: this.widget.type === 'map' },
                { label: this.$t('dashboard.widgetEditor.map.qMenu.search'), icon: 'fas fa-magnifying-glass', command: () => this.searchOnWidget(this.widget), visible: this.widget.type === 'table' },
                { label: this.$t('dashboard.widgetEditor.map.qMenu.clone'), icon: 'fa-solid fa-clone', command: () => this.cloneWidget(this.widget), visible: true },
                { label: this.$t('dashboard.widgetEditor.map.qMenu.quickWidget'), icon: 'fas fa-magic', command: () => this.toggleQuickDialog(), visible: true },
                { label: this.$t('dashboard.widgetEditor.map.qMenu.delete'), icon: 'fa-solid fa-trash', command: () => this.deleteWidget(this.dashboardId, this.widget), visible: true }
            ] as IMenuItem[],
            searchDialogVisible: false,
            search: { searchText: '', searchColumns: [] } as { searchText: string; searchColumns: string[] }
        }
    },
    computed: {
        ...mapState(store, ['dashboards']),
        ...mapState(mainStore, ['user']),
        playSelectionButtonVisible(): boolean {
            if (!this.widget || !this.widget.settings.configuration || !this.widget.settings.configuration.selectorType) return false
            return this.widget.type === 'selector' && ['multiValue', 'multiDropdown', 'dateRange'].includes(this.widget.settings.configuration.selectorType.modality) && !this.selectionIsLocked
        }
    },
    watch: {
        widget: {
            async handler() {
                this.loadWidget(this.widget)
            },
            deep: true
        }
    },
    async created() {
        this.setWidgetLoading(true)

        this.setEventListeners()
        this.loadWidget(this.widget)
        this.widget.type !== 'selection' ? await this.loadInitalData() : await this.loadActiveSelections()

        this.setWidgetLoading(false)
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        ...mapActions(store, ['getDashboard', 'getSelections', 'setSelections', 'removeSelection', 'deleteWidget', 'getCurrentDashboardView']),
        setEventListeners() {
            emitter.on('selectionsChanged', this.loadActiveSelections)
            emitter.on('selectionsDeleted', this.onSelectionsDeleted)
            emitter.on('widgetUpdatedFromStore', this.onWidgetUpdated)
            emitter.on('associativeSelectionsLoaded', this.onAssociativeSelectionsLoaded)
            emitter.on('datasetRefreshed', this.onDatasetRefresh)
            emitter.on('setWidgetLoading', this.setWidgetLoading)
        },
        removeEventListeners() {
            emitter.off('selectionsChanged', this.loadActiveSelections)
            emitter.off('selectionsDeleted', this.onSelectionsDeleted)
            emitter.off('widgetUpdatedFromStore', this.onWidgetUpdated)
            emitter.off('associativeSelectionsLoaded', this.onAssociativeSelectionsLoaded)
            emitter.off('datasetRefreshed', this.onDatasetRefresh)
            emitter.off('setWidgetLoading', this.setWidgetLoading)
        },
        onWidgetRightClick(event) {
            console.log(event)
            // TODO: I dont think we need this anymore, remove?
            // const contextMenu = this.$refs.contextMenu as any
            // contextMenu?.show(event)
        },
        loadWidget(widget: IWidget) {
            this.widgetModel = widget
            this.loadWidgetSearch()
        },
        loadWidgetSearch() {
            if (this.widgetModel.search) {
                this.search = { ...this.widgetModel.search }
                this.reloadWidgetData(null)
            }
            delete this.widgetModel.search
        },
        setWidgetLoading(loading: any) {
            this.loading = loading
        },
        onWidgetUpdated(widget: any) {
            if (this.widget.id !== widget.id) return
            this.loadWidget(widget)
            this.loadInitalData()
        },
        async loadInitalData() {
            if (!this.widgetModel || this.widgetModel.type === 'selection') return

            this.setWidgetLoading(true)

            this.widgetInitialData = await getWidgetData(this.dashboardId, this.widgetModel, this.model?.configuration?.datasets, this.$http, true, this.activeSelections, this.search)
            this.widgetData = this.widgetInitialData
            await this.loadActiveSelections()

            this.setWidgetLoading(false)
        },
        async loadActiveSelections() {
            this.getSelectionsFromStore()
            if (this.widgetModel.type === 'selection') return
            if (this.widgetUsesSelections(this.activeSelections)) await this.reloadWidgetData(null)
        },
        getSelectionsFromStore() {
            this.activeSelections = deepcopy(this.getSelections(this.dashboardId))
            this.checkIfSelectionIsLocked()
        },
        async onSelectionsDeleted(deletedSelections: any) {
            const associations = this.dashboards[this.dashboardId]?.configuration.associations ?? []
            this.getSelectionsFromStore()
            if (this.widgetUsesSelections(deletedSelections) || (this.widget.dataset && datasetIsUsedInAssociations(this.widget.dataset, associations))) this.reloadWidgetData(null)
        },
        widgetUsesDeletedSelectionsDataset(deletedSelections: ISelection[]) {
            let widgetUsesSelection = false
            if (!this.widgetModel.dataset) return widgetUsesSelection
            for (let i = 0; i < deletedSelections.length; i++) {
                if (deletedSelections[i].datasetId === this.widgetModel.dataset) {
                    widgetUsesSelection = true
                    break
                }
            }
            return widgetUsesSelection
        },
        async reloadWidgetData(associativeResponseSelections: any) {
            this.loading = true
            this.widgetLoading = true
            this.widgetData = await getWidgetData(this.dashboardId, this.widgetModel, this.model?.configuration?.datasets, this.$http, false, this.activeSelections, this.search, associativeResponseSelections)
            this.widgetLoading = false
            this.loading = false
        },
        widgetUsesSelections(selections: ISelection[]) {
            let widgetUsesSelection = false
            if (!this.widgetModel.dataset) return widgetUsesSelection
            for (let i = 0; i < selections.length; i++) {
                if (selections[i].datasetId === this.widgetModel.dataset) {
                    widgetUsesSelection = true
                    break
                }
            }

            return widgetUsesSelection
        },
        toggleEditMode() {
            emitter.emit('openWidgetEditor', this.widget)
        },
        checkIfSelectionIsLocked() {
            if (this.widgetModel.type !== 'selector' || (this.widgetModel.settings as ISelectorWidgetSettings).configuration.valuesManagement.enableAll) return false
            const index = this.activeSelections.findIndex((selection: ISelection) => selection.datasetId === this.widgetModel.dataset && selection.columnName === this.widgetModel.columns[0].columnName)
            this.selectionIsLocked = index !== -1
        },
        unlockSelection() {
            const payload = {
                datasetId: this.widgetModel.dataset as number,
                columnName: this.widgetModel.columns[0].columnName
            }
            emitter.emit('widgetUnlocked', this.widgetModel.id)
            this.removeSelection(payload, this.dashboardId)
        },
        launchSelection() {
            this.setSelections(this.dashboardId, this.activeSelections, this.$http)
        },
        async onAssociativeSelectionsLoaded(response: any) {
            this.getSelectionsFromStore()
            if (!response) return
            const datasets = Object.keys(response)
            const dataset = this.datasets.find((dataset: IDataset) => dataset.id.dsId === this.widgetModel.dataset)
            const index = datasets.findIndex((datasetLabel: string) => datasetLabel === dataset?.label)
            if (index !== -1) await this.reloadWidgetData(response)
        },
        async onDatasetRefresh(modelDatasetId: any) {
            if (this.widgetModel.dataset !== modelDatasetId) return
            if (this.activeSelections.length > 0 && datasetIsUsedInAssociations(modelDatasetId, this.dashboards[this.dashboardId].configuration.associations)) {
                loadAssociativeSelections(this.dashboards[this.dashboardId], this.datasets, this.activeSelections, this.$http)
            } else {
                await this.reloadWidgetData(null)
            }
        },
        startUnfocusTimer(milliseconds: number) {
            this.playDisabledButtonTimeout = setTimeout(() => {
                this.inFocus = false
            }, milliseconds)
        },
        toggleFocus() {
            clearTimeout(this.playDisabledButtonTimeout)
            this.inFocus = true
        },
        changeFocus(value: boolean) {
            clearTimeout(this.playDisabledButtonTimeout)
            if (value) {
                this.inFocus = true
                this.startUnfocusTimer(3000)
            } else {
                this.inFocus = false
            }
        },
        resizedEvent: function (newHPx) {
            emitter.emit('widgetResized', newHPx)
        },
        expandWidget(widget) {
            const widgetElement = this.$refs[`widget${widget.id}`] as any
            widgetElement.$el.requestFullscreen()
        },
        toggleQuickDialog() {
            this.showQuickDialog = !this.showQuickDialog
        },
        searchOnWidget(widget) {
            console.log('widget', widget)
            this.searchDialogVisible = true
        },
        cloneWidget(widget) {
            console.log('widget', widget)
        },
        onSearch(payload: { searchText: string; searchColumns: string[] }) {
            this.search = payload
            console.log('-------- ON SEARCH PAYLOAD: ', this.search)
            this.searchDialogVisible = false
            const currentState = this.getCurrentDashboardView(this.dashboardId)
            if (currentState && this.widgetModel.id) currentState.settings.states[this.widgetModel.id] = { type: this.widgetModel.type, search: this.search }
            this.reloadWidgetData(null)
        }
    }
})
</script>
<style lang="scss">
.widget-grid-item {
    &.vue-grid-item > .vue-resizable-handle {
        display: none;
    }
    &:hover {
        &.vue-grid-item > .vue-resizable-handle {
            display: block;
        }
        &.canEdit {
            outline: 1px solid var(--kn-color-borders);
            .drag-widget-icon {
                display: block;
            }
        }
        .widgetButtonBarContainer {
            display: block;
        }
    }
}

.editorEnter-enter-active,
.editorEnter-leave-active {
    transition: opacity 0.5s ease;
}

.editorEnter-enter-from,
.editorEnter-leave-to {
    opacity: 0;
}

.vue-resizable-handle {
    z-index: 9999;
}
</style>
