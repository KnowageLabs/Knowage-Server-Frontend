<template>
    <GridItem :id="`widget${item.id}`" :ref="`widget${item.id}`" :key="item.id" class="p-d-flex widget-grid-item" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i" :static="widget?.settings?.locked" drag-allow-from=".drag-handle" :class="{ canEdit: canEditDashboard(document) && !widget?.settings?.locked, 'full-grid-widget': widget?.settings.responsive.fullGrid }" @resized="onWidgetResize">
        <div v-if="initialized" class="drag-handle"></div>
        <q-spinner-grid v-if="loading || customChartLoading || widgetLoading" color="primary" size="3rem" class="widgetSpinner" />
        <q-skeleton v-if="!initialized" height="100%" width="100%" square />
        <WidgetRenderer
            v-if="!loading && widget"
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
            @dataset-interaction-preview="previewInteractionDataset"
        ></WidgetRenderer>
        <WidgetButtonBar v-if="items.filter((i) => i.visible).length > 0 || playSelectionButtonVisible" :document="document" :widget="widget" :play-selection-button-visible="playSelectionButtonVisible" :selection-is-locked="selectionIsLocked" :dashboard-id="dashboardId" :in-focus="inFocus" :menu-items="items" @edit-widget="toggleEditMode" @unlock-selection="unlockSelection" @launch-selection="launchSelection" @change-focus="changeFocus"></WidgetButtonBar>
        <ContextMenu v-if="canEditDashboard(document)" ref="contextMenu" :model="items" />
    </GridItem>

    <QuickWidgetDialog v-if="showQuickDialog" @close="toggleQuickDialog" @chartTypeSelected="onChartSelectedForQuickWidgetChange" />
    <ChangeWidgetDialog v-if="showChangeDialog" :widget-model="widgetModel" :widget-data="widgetData" @close="toggleChangeDialog" />
    <WidgetSearchDialog v-if="searchDialogVisible" :visible="searchDialogVisible" :widget="widget" :prop-search="search" @close="searchDialogVisible = false" @search="onSearch"></WidgetSearchDialog>
    <SheetPickerDialog v-if="sheetPickerDialogVisible" :visible="sheetPickerDialogVisible" :prop-sheets="dashboards && dashboards[dashboardId] ? dashboards[dashboardId].sheets : []" :active-sheet="activeSheet" @close="sheetPickerDialogVisible = false" @sheetSelected="onSheetSelected"></SheetPickerDialog>
    <DatasetEditorPreview v-if="datasetPreviewShown" :visible="datasetPreviewShown" :prop-dataset="datasetToPreview" :dashboard-id="dashboardId" @close="datasetPreviewShown = false" />
</template>

<script lang="ts">
/**
 * ! this component will be in charge of managing the widget behaviour related to data and interactions, not related to view elements.
 */
import { defineComponent, PropType } from 'vue'
import { IDashboardSheet, IDataset, IMenuItem, ISelection, IVariable, IWidget, IWidgetPreview, IWidgetSearch, SelectorDataMap } from '../Dashboard'
import { emitter, canEditDashboard } from '../DashboardHelpers'
import { mapState, mapActions } from 'pinia'
import { getWidgetData } from '../DashboardDataProxy'
import store from '../Dashboard.store'
import mainStore from '@/App.store'
import WidgetRenderer from './WidgetRenderer.vue'
import WidgetButtonBar from './WidgetButtonBar.vue'
import deepcopy from 'deepcopy'
import { ISelectorWidgetSettings } from '../interfaces/DashboardSelectorWidget'
import { datasetIsUsedInAssociations } from './interactionsHelpers/DatasetAssociationsHelper'
import { loadAssociativeSelections } from './interactionsHelpers/InteractionHelper'
import ContextMenu from 'primevue/contextmenu'
import QuickWidgetDialog from './commonComponents/QuickWidgetDialog.vue'
import ChangeWidgetDialog from './commonComponents/ChangeWidgetDialog.vue'
import WidgetSearchDialog from './WidgetSearchDialog/WidgetSearchDialog.vue'
import SheetPickerDialog from './SheetPickerDialog/SheetPickerDialog.vue'
import domtoimage from 'dom-to-image-more'
import { AxiosResponse } from 'axios'
import { downloadDirectFromResponse } from '@/helpers/commons/fileHelper'
import DatasetEditorPreview from '../dataset/DatasetEditorDataTab/DatasetEditorPreview.vue'
import { formatParameterForPreview } from '@/modules/documentExecution/dashboard/widget/interactionsHelpers/PreviewHelper'
import { quickWidgetCreateChartFromTable, quickWidgetCreateTableFromChart } from './WidgetControllerHelpers'

export default defineComponent({
    name: 'widget-manager',
    components: { ContextMenu, WidgetButtonBar, WidgetRenderer, QuickWidgetDialog, WidgetSearchDialog, ChangeWidgetDialog, SheetPickerDialog, DatasetEditorPreview },
    inject: ['dHash', 'selectorWidgetsInitialData'],
    props: {
        model: { type: Object },
        item: { required: true, type: Object },
        activeSheet: { type: Object as PropType<IDashboardSheet>, required: true },
        document: { type: Object, required: true },
        widget: { type: Object as PropType<IWidget>, required: true },
        datasets: { type: Array as PropType<IDataset[]>, required: true },
        dashboardId: { type: String, required: true },
        variables: { type: Array as PropType<IVariable[]>, required: true }
    },

    setup() {
        const dashStore = store()
        return { dashStore }
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
            showChangeDialog: false,
            canEditDashboard,
            items: [] as IMenuItem[],
            searchDialogVisible: false,
            search: { searchText: '', searchColumns: [] } as IWidgetSearch,
            sheetPickerDialogVisible: false,
            datasetToPreview: {} as any,
            datasetPreviewShown: false
        }
    },
    computed: {
        ...mapState(store, ['dashboards']),
        ...mapState(mainStore, ['user', 'setInfo', 'setLoading']),
        playSelectionButtonVisible(): boolean {
            const isSelectorWidget = this.widget.type === 'selector' && ['multiValue', 'multiDropdown', 'dateRange'].includes(this.widget.settings.configuration.selectorType.modality) && !this.selectionIsLocked
            if (this.document.seeAsFinalUser && isSelectorWidget) return true
            if (!this.widget || !this.widget.settings.configuration || !this.widget.settings.configuration.selectorType) return false
            return isSelectorWidget
        },
        dashboardSheets() {
            return this.dashboards[this.dashboardId]?.sheets ?? []
        },
        updateFromSelections() {
            return this.widgetModel.settings?.configuration?.updateFromSelections
        },
        widgetLocked() {
            return this.widget?.settings?.locked
        }
    },
    watch: {
        widget: {
            async handler() {
                this.loadWidget(this.widget)
                this.loadMenuItems()
            },
            deep: true
        },
        'document.seeAsFinalUser': {
            handler() {
                this.loadMenuItems()
            }
        },
        item() {
            this.loadMenuItems()
        },
        dashboardSheets() {
            this.loadMenuItems()
        },
        widgetLocked() {
            this.item.static = this.widget?.settings?.locked
        }
    },
    async created() {
        this.setWidgetLoading(true)
        this.loadMenuItems()
        this.setEventListeners()
        this.loadWidget(this.widget)

        this.widget?.type !== 'selection' ? await this.loadInitialData() : await this.loadActiveSelections()

        this.setWidgetLoading(false)
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        //#region ===================== EventListeners/Emitters & Store  ============================================
        ...mapActions(store, ['getDashboard', 'getSelections', 'setSelections', 'removeSelection', 'removeSelections', 'createNewWidget', 'deleteWidget', 'getCurrentDashboardView', 'moveWidget', 'cloneWidget', 'getAssociations']),
        ...mapActions(mainStore, ['setError']),
        setEventListeners() {
            emitter.on('selectionsChanged', this.loadActiveSelections)
            emitter.on('selectionsDeleted', this.onSelectionsDeleted)
            emitter.on('widgetUpdatedFromStore', this.onWidgetUpdated)
            emitter.on('associativeSelectionsLoaded', this.onAssociativeSelectionsLoaded)
            emitter.on('datasetRefreshed', this.onDatasetRefresh)
            emitter.on('setWidgetLoading', this.setWidgetLoading)
            emitter.on('chartTypeChanged', this.onWidgetUpdated)
            emitter.on('refreshAfterGeneralSettingsChange', this.loadInitialData)
            emitter.on('mapDatasetInteractionPreview', this.onMapDatasetInteractionPreview)
            emitter.on('lockAllWidgets', this.onLockAllWidgets)
            emitter.on('unlockAllWidgets', this.onUnlockAllWidgets)
        },
        removeEventListeners() {
            emitter.off('selectionsChanged', this.loadActiveSelections)
            emitter.off('selectionsDeleted', this.onSelectionsDeleted)
            emitter.off('widgetUpdatedFromStore', this.onWidgetUpdated)
            emitter.off('associativeSelectionsLoaded', this.onAssociativeSelectionsLoaded)
            emitter.off('datasetRefreshed', this.onDatasetRefresh)
            emitter.off('setWidgetLoading', this.setWidgetLoading)
            emitter.off('chartTypeChanged', this.onWidgetUpdated)
            emitter.off('refreshAfterGeneralSettingsChange', this.loadInitialData)
            emitter.off('mapDatasetInteractionPreview', this.onMapDatasetInteractionPreview)
            emitter.off('lockAllWidgets', this.onLockAllWidgets)
            emitter.off('unlockAllWidgets', this.onUnlockAllWidgets)
        },
        //#endregion ================================================================================================

        //#region ===================== Menu Functions  ============================================
        loadMenuItems() {
            this.items = [
                { label: this.$t('dashboard.qMenu.edit'), icon: 'fa-solid fa-pen-to-square', command: () => this.toggleEditMode(), visible: canEditDashboard(this.document) },
                { label: this.$t('dashboard.qMenu.expand'), icon: 'fa-solid fa-expand', command: () => this.expandWidget(this.widget), visible: this.document.seeAsFinalUser || !['html', 'image', 'text', 'selector'].includes(this.widget?.type) },
                { label: this.$t('dashboard.qMenu.screenshot'), icon: 'fa-solid fa-camera-retro', command: () => this.captureScreenshot(this.widget), visible: this.document.seeAsFinalUser || !['html', 'image', 'text', 'selector'].includes(this.widget?.type) },
                { label: this.$t('dashboard.qMenu.changeType'), icon: 'fa-solid fa-chart-column', command: () => this.toggleChangeDialog(), visible: ['highcharts'].includes(this.widget?.type) },
                { label: this.$t('dashboard.qMenu.xor'), icon: 'fa-solid fa-arrow-right', command: () => this.searchOnWidget(), visible: this.widget?.type === 'map' },
                { label: this.$t('dashboard.qMenu.search'), icon: 'fas fa-magnifying-glass', command: () => this.searchOnWidget(), visible: this.widget?.type === 'table' },
                {
                    label: this.$t(this.widget.settings.locked ? 'dashboard.qMenu.unlock' : 'dashboard.qMenu.lock'),
                    icon: this.widget.settings.locked ? 'fas fa-lock-open' : 'fas fa-lock',
                    command: () => this.toggleWidgetLock(),
                    visible: canEditDashboard(this.document)
                },
                { label: this.$t('dashboard.qMenu.clone'), icon: 'fa-solid fa-clone', command: () => this.onCloneWidgetClicked(), visible: canEditDashboard(this.document) },
                { label: this.$t('dashboard.qMenu.moveWidget'), icon: 'fa fa-arrows-h', command: () => this.moveWidgetToAnotherSheet(), visible: canEditDashboard(this.document) && this.dashboards ? this.dashboards[this.dashboardId]?.sheets?.length > 1 : false },
                { label: this.$t('dashboard.qMenu.quickWidget'), icon: 'fas fa-magic', command: () => this.toggleQuickDialog(), visible: this.quickWidgetChangeEnabled() },
                { label: this.$t('dashboard.qMenu.xlsExport'), icon: 'fa-solid fa-file-excel', command: () => this.widgetExport('spreadsheet'), visible: this.widget?.settings?.configuration?.exports?.showExcelExport },
                { label: this.$t('dashboard.qMenu.pdfExport'), icon: 'fa-solid fa-file-pdf', command: () => this.widgetExport('pdf'), visible: this.widget?.settings?.configuration?.exports?.pdf?.enabled },
                { label: this.$t('dashboard.qMenu.delete'), icon: 'fa-solid fa-trash', command: () => this.deleteWidgetConfirm(), visible: canEditDashboard(this.document) }
            ]
        },
        async captureScreenshot(widget) {
            let targetElement = document.getElementById(`widget${widget.id}`)
            const escapedSelector = `#widget${widget.id} iframe`.replace('+', '\\+')

            if (document.querySelector(escapedSelector)) {
                if (widget.type === 'customchart') {
                    const container = document.getElementById(`widget${widget.id}`) as HTMLElement
                    const iframe = document.querySelector(escapedSelector) as any
                    const iframeDoc = iframe?.contentWindow?.document

                    if (!iframeDoc) {
                        this.setError({
                            title: this.$t('common.toast.errorTitle'),
                            msg: this.$t('dashboard.errors.screenshotError')
                        })
                        return
                    }

                    try {
                        const titleDiv = container.querySelector('.widget-container > div:first-child') as HTMLElement
                        let titleCanvas = null
                        let titleHeight = 0

                        if (titleDiv && titleDiv.textContent) {
                            titleCanvas = await domtoimage.toPng(titleDiv)
                            titleHeight = titleDiv.offsetHeight
                        }

                        const iframeHtml = iframeDoc.getElementsByTagName('html')[0]
                        const contentDataUrl = await domtoimage.toPng(iframeHtml)

                        const canvas = document.createElement('canvas')
                        const ctx = canvas.getContext('2d')
                        canvas.width = container.offsetWidth
                        canvas.height = container.offsetHeight

                        const contentImg = new Image()
                        contentImg.src = contentDataUrl

                        await new Promise((resolve) => {
                            contentImg.onload = () => {
                                if (titleCanvas) {
                                    const titleImg = new Image()
                                    titleImg.src = titleCanvas
                                    titleImg.onload = () => {
                                        ctx.drawImage(titleImg, 0, 0)
                                        ctx.drawImage(contentImg, 0, titleHeight)
                                        resolve(null)
                                    }
                                } else {
                                    ctx.drawImage(contentImg, 0, 0)
                                    resolve(null)
                                }
                            }
                        })

                        const link = document.createElement('a')
                        link.download = `${widget.type}-widget.png`
                        link.href = canvas.toDataURL()
                        link.click()
                        return
                    } catch (error) {
                        this.setError({
                            title: this.$t('common.toast.errorTitle'),
                            msg: `${this.$t('dashboard.errors.screenshotError')}: ${error}`
                        })
                        return
                    }
                } else {
                    targetElement = (document.querySelector(escapedSelector) as any)?.contentWindow.document.getElementsByTagName('html')[0]
                }
            }

            domtoimage
                .toPng(targetElement)
                .then((dataUrl) => {
                    const link = document.createElement('a')
                    link.download = `${widget.type}-widget.png`
                    link.href = dataUrl
                    link.click()
                })
                .catch((error) => {
                    this.setError({
                        title: this.$t('common.toast.errorTitle'),
                        msg: `${this.$t('dashboard.errors.screenshotError')}: ${error}`
                    })
                })
        },
        toggleEditMode() {
            emitter.emit('openWidgetEditor', { widget: this.widget, dashboardId: this.dashboardId })
        },
        expandWidget(widget) {
            const widgetElement = this.$refs[`widget${widget.id}`] as any
            widgetElement.$el.requestFullscreen()
        },
        toggleChangeDialog() {
            this.showChangeDialog = !this.showChangeDialog
        },
        searchOnWidget() {
            this.searchDialogVisible = true
        },
        toggleWidgetLock() {
            this.widgetModel.settings.locked = !this.widgetModel.settings.locked
        },
        onCloneWidgetClicked() {
            this.cloneWidget(this.dashboardId, this.widgetModel, this.activeSheet)
        },
        moveWidgetToAnotherSheet() {
            this.sheetPickerDialogVisible = true
        },
        toggleQuickDialog() {
            if (this.widgetModel.type === 'table') this.showQuickDialog = !this.showQuickDialog
            else quickWidgetCreateTableFromChart(this.widgetModel, this.dashboardId)
        },
        async widgetExport(type: string) {
            this.setLoading(true)
            const dataset = this.dashboards[this.dashboardId].configuration.datasets.find((i) => i.id === this.widgetModel.dataset)
            const parameters = dataset ? dataset.parameters : []

            let body = { ...this.widgetModel, parameters: parameters, selections: this.dashStore.$state.dashboards[this.dashboardId].selections, drivers: this.dashStore.$state.dashboards[this.dashboardId].drivers }
            if (dataset && dataset.drivers) {
                body.datasetDrivers = dataset.drivers
            }
            body.variables = this.dashboards[this.dashboardId]?.configuration?.variables
            body.creationUser = this.document?.creationUser
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/dashboardExport/${type}`, body, {
                    responseType: 'blob',
                    headers: { Accept: 'text/html,application/xhtml+xml,application/xml;application/pdf;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' }
                })
                .then((response) => {
                    downloadDirectFromResponse(response)
                })
                .finally(() => this.setLoading(false))
        },

        deleteWidgetConfirm() {
            this.$confirm.require({
                message: this.$t('dashboard.confirm.deleteWidget'),
                header: this.$t('dashboard.qMenu.delete'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.deleteWidget(this.dashboardId, this.widget)
                }
            })
        },
        quickWidgetChangeEnabled() {
            if (!this.widget || !['table', 'highcharts'].includes(this.widget.type)) return false
            if (this.widget.type === 'table' && !this.checkIfTableHasBothAttributeAndMeasureColumns()) return false
            return canEditDashboard(this.document)
        },
        checkIfTableHasBothAttributeAndMeasureColumns() {
            let attributeColumnFound = false
            let measureColumnFound = false
            for (let i = 0; i < this.widget.columns.length; i++) {
                if (this.widget.columns[i].fieldType === 'ATTRIBUTE') attributeColumnFound = true
                else measureColumnFound = true
                if (attributeColumnFound && measureColumnFound) return true
            }
            return false
        },
        //#endregion ================================================================================================

        setWidgetLoading(loading: any) {
            this.loading = loading
        },
        loadWidget(widget: IWidget | null) {
            this.widgetModel = widget
            if (!this.widgetModel) return
            this.loadWidgetSearch()
        },
        loadWidgetSearch() {
            if (this.widgetModel.search) {
                this.search = { ...this.widgetModel.search }
                this.reloadWidgetData(null)
            }
            delete this.widgetModel.search
        },
        onWidgetUpdated(widget: any) {
            if (this.widget.id !== widget.id) return
            this.loadWidget(widget)
            this.loadInitialData()
        },
        async loadSelectorInitialData() {
            const widgetId = this.widgetModel?.id
            const selectorWidgetsData = this.selectorWidgetsInitialData as SelectorDataMap

            if (selectorWidgetsData[widgetId]?.initialData) {
                this.widgetInitialData = selectorWidgetsData[widgetId].initialData
                return selectorWidgetsData[widgetId].initialData
            } else {
                const fetchedData = await getWidgetData(this.dashboardId, this.widgetModel, this.model?.configuration?.datasets, this.$http, true, [], this.search, this.dashboards[this.dashboardId].configuration, null, false)
                this.widgetInitialData = fetchedData
                return fetchedData
            }
        },
        async loadInitialData() {
            if (!this.widgetModel || this.widgetModel.type === 'selection') return

            this.setWidgetLoading(true)
            const widgetId = this.widgetModel?.id
            const selectorWidgetsData = this.selectorWidgetsInitialData as SelectorDataMap
            let isInitialCall = true

            if (this.widgetModel.type === 'selector') {
                this.widgetData = await this.loadSelectorInitialData()
                isInitialCall = false

                if (this.getSelections(this.dashboardId).length === 0) {
                    this.setWidgetLoading(false)
                    return
                }
            }

            if (this.updateFromSelections) {
                this.getSelectionsFromStore()
                const associativeSelections = this.getAssociativeSelectionsFromStoreIfDatasetIsBeingUsedInAssociation()

                if (selectorWidgetsData[widgetId]?.initialData) this.widgetData = selectorWidgetsData[widgetId].widgetData
                else this.widgetData = await getWidgetData(this.dashboardId, this.widgetModel, this.model?.configuration?.datasets, this.$http, isInitialCall, this.activeSelections, this.search, this.dashboards[this.dashboardId].configuration, associativeSelections, false)
            } else {
                if (selectorWidgetsData[widgetId]?.initialData) this.widgetData = selectorWidgetsData[widgetId].widgetData
                else this.widgetData = await getWidgetData(this.dashboardId, this.widgetModel, this.model?.configuration?.datasets, this.$http, isInitialCall, [], this.search, this.dashboards[this.dashboardId].configuration, null, false)
            }

            this.setWidgetLoading(false)
        },
        async loadActiveSelections() {
            if (!this.updateFromSelections) return
            this.getSelectionsFromStore()
            if (this.widgetModel.type === 'selection') return
            const associativeSelectionsFromStore = this.getAssociativeSelectionsFromStoreIfDatasetIsBeingUsedInAssociation()
            if (this.widgetUsesSelections(this.activeSelections) || associativeSelectionsFromStore) await this.reloadWidgetData(associativeSelectionsFromStore ?? null)
        },
        getSelectionsFromStore() {
            if (!this.updateFromSelections) {
                this.activeSelections = []
                return
            }
            this.activeSelections = deepcopy(this.getSelections(this.dashboardId))
            this.checkIfSelectionIsLocked()
        },
        async onSelectionsDeleted(deletedSelections: any) {
            if (!this.updateFromSelections) return
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
        async reloadWidgetData(associativeResponseSelections: any, resetPagination?: boolean) {
            this.widgetLoading = true
            let associativeSelectionsFromStore = null
            if (!associativeResponseSelections) {
                this.getSelectionsFromStore()
                if (this.widgetModel.type === 'selection') return
                associativeSelectionsFromStore = this.getAssociativeSelectionsFromStoreIfDatasetIsBeingUsedInAssociation()
            }
            this.widgetData = await getWidgetData(this.dashboardId, this.widgetModel, this.model?.configuration?.datasets, this.$http, false, this.activeSelections, this.search, this.dashboards[this.dashboardId].configuration, associativeResponseSelections ?? associativeSelectionsFromStore, resetPagination)
            this.widgetLoading = false
        },
        widgetUsesSelections(selections: ISelection[]) {
            if (this.widget.type === 'map') return this.checkIfMapWidgetUsesSelection(selections)
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
        checkIfMapWidgetUsesSelection(selections: ISelection[]) {
            let widgetUsesSelection = false
            if (!this.widgetModel.layers || this.widgetModel.layers.length === 0) return widgetUsesSelection
            for (let i = 0; i < selections.length; i++) {
                for (let j = 0; j < this.widgetModel.layers.length; j++) {
                    if (this.widgetModel.layers[j].type === 'dataset' && selections[i].datasetId === this.widgetModel.layers[j].id) {
                        widgetUsesSelection = true
                        break
                    }
                }
            }

            return widgetUsesSelection
        },
        checkIfSelectionIsLocked() {
            if (this.widgetModel.type !== 'selector' || (this.widgetModel.settings as ISelectorWidgetSettings).configuration.valuesManagement.enableAll) return false
            const index = this.activeSelections.findIndex((selection: ISelection) => selection.datasetId === this.widgetModel.dataset && selection.columnName === this.widgetModel.columns[0].columnName)
            this.selectionIsLocked = index !== -1
        },
        getAssociativeSelectionsFromStoreIfDatasetIsBeingUsedInAssociation() {
            const associativeSelections = this.getAssociations(this.dashboardId)
            this.getSelectionsFromStore()
            if (!associativeSelections) return
            const datasets = Object.keys(associativeSelections)
            const dataset = this.datasets.find((dataset: IDataset) => dataset.id.dsId === this.widgetModel.dataset)
            const index = datasets.findIndex((datasetLabel: string) => datasetLabel === dataset?.label)
            return index !== -1 ? associativeSelections : null
        },
        async onAssociativeSelectionsLoaded() {
            if (!this.updateFromSelections) return
            const associativeSelectionsFromStore = this.getAssociativeSelectionsFromStoreIfDatasetIsBeingUsedInAssociation()
            if (associativeSelectionsFromStore) await this.reloadWidgetData(associativeSelectionsFromStore)
        },
        async onDatasetRefresh(modelDatasetId: any) {
            if (this.widgetModel.dataset !== modelDatasetId) return
            if (this.activeSelections.length > 0 && datasetIsUsedInAssociations(modelDatasetId, this.dashboards[this.dashboardId].configuration.associations)) {
                loadAssociativeSelections(this.dashboardId, this.dashboards[this.dashboardId], this.datasets, this.activeSelections, this.$http)
            } else {
                await this.reloadWidgetData(null)
            }
        },

        //#region ===================== onEvent Handlers  ============================================
        onWidgetResize: function (newHPx) {
            emitter.emit('widgetResized', newHPx)
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
        startUnfocusTimer(milliseconds: number) {
            this.playDisabledButtonTimeout = setTimeout(() => {
                this.inFocus = false
            }, milliseconds)
        },

        launchSelection() {
            this.setSelections(this.dashboardId, this.activeSelections, this.$http)
        },
        unlockSelection() {
            const payload = {
                datasetId: this.widgetModel.dataset as number,
                columnName: this.widgetModel.columns[0].columnName
            }
            emitter.emit('widgetUnlocked', [payload])
            this.removeSelections([payload], this.dashboardId, this.$http)
        },

        onChartSelectedForQuickWidgetChange(chartType: string) {
            this.showQuickDialog = false
            quickWidgetCreateChartFromTable(chartType, this.widgetModel, this.dashboardId)
        },

        async onSearch(payload: { searchText: string; searchColumns: string[] }) {
            this.search = payload
            this.searchDialogVisible = false
            const currentState = this.getCurrentDashboardView(this.dashboardId)
            if (currentState && this.widgetModel.id) currentState.settings.states[this.widgetModel.id] = { type: this.widgetModel.type, search: this.search }

            this.widgetModel.settings.pagination.properties.offset = 0
            await this.reloadWidgetData(null, true)
        },
        onSheetSelected(sheet: IDashboardSheet | null) {
            this.sheetPickerDialogVisible = false
            if (!sheet) return

            this.moveWidget(this.dashboardId, this.widgetModel, sheet, this.activeSheet)
        },
        //#endregion ================================================================================================

        //#region ===================== DatasetPreview  ============================================
        onMapDatasetInteractionPreview(event: any) {
            if (event.widgetId !== this.widget.id) return
            this.previewInteractionDataset(event)
        },
        async previewInteractionDataset(event: any) {
            const previewSettings = event.previewSettings as IWidgetPreview

            if (!previewSettings.dataset || previewSettings.dataset < 0) return

            this.selectedDataset = deepcopy(this.datasets.find((dataset) => dataset.id.dsId === previewSettings.dataset))

            const storeDashboardDatasets = this.dashStore.$state.dashboards[this.dashboardId].configuration.datasets
            const storeDashboardDataset = storeDashboardDatasets.find((dataset) => dataset.id === previewSettings.dataset)

            if (this.selectedDataset.id.dsId === storeDashboardDataset.id) {
                this.selectedDataset.modelParams = storeDashboardDataset.parameters
                this.selectedDataset.modelDrivers = storeDashboardDataset.drivers ? storeDashboardDataset.drivers : []
                this.selectedDataset.modelCache = storeDashboardDataset.cache
                this.selectedDataset.modelIndexes = storeDashboardDataset.indexes
            }

            if (this.selectedDataset.parameters.length > 0) {
                this.selectedDataset.parameters.forEach((parameter) => formatParameterForPreview(event, parameter, this.widget.type, this.dashboardId))
            }

            if (this.selectedDataset.drivers && this.selectedDataset.modelDrivers) {
                this.selectedDataset.formattedDrivers = this.selectedDataset.modelDrivers
            }
            if (previewSettings.directDownload) {
                this.directDownloadDataset(previewSettings.dataset)
                return
            }

            await this.loadDatasetToPreview(this.selectedDataset.label)

            this.datasetToPreview.drivers = this.getPreviewDrivers()
            this.datasetToPreview.pars = [...this.selectedDataset.parameters]

            setTimeout(() => {
                this.datasetPreviewShown = !this.datasetPreviewShown
            }, 100)
        },
        async loadDatasetToPreview(datasetLabel: string) {
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/datasets/${datasetLabel}`)
                .then((response: AxiosResponse<any>) => {
                    this.datasetToPreview = response.data[0]
                })
                .catch(() => {})
        },
        getPreviewDrivers() {
            if (this.selectedDataset.modelDrivers) return [...this.selectedDataset.modelDrivers]
            else if (this.selectedDataset.formattedDrivers) return [...this.selectedDataset.formattedDrivers]
            else return []
        },
        async directDownloadDataset(datasetId: number) {
            let tempParams = {} as any
            const dsDrivers = this.getPreviewDrivers()
            const dsParams = [...this.selectedDataset.parameters]
            if (dsDrivers?.length > 0) tempParams.drivers = dsDrivers
            if (dsParams?.length > 0)
                tempParams.parameters = dsParams.map((i) => {
                    return {
                        name: i.name,
                        multiValue: i.multiValue,
                        value: i.value
                    }
                })
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/export/dataset/${datasetId}/csv`, tempParams, { headers: { Accept: 'application/json, text/plain, */*', 'Content-Type': 'application/json;charset=UTF-8' } })
                .then(() => this.setInfo({ title: this.$t('common.toast.updateTitle'), msg: this.$t('workspace.myData.exportSuccess') }))
                .catch(() => {})
        },
        onLockAllWidgets() {
            this.widgetModel.settings.locked = true
        },
        onUnlockAllWidgets() {
            this.widgetModel.settings.locked = false
        }

        //#endregion ================================================================================================
    }
})
</script>
<style lang="scss">
.widget-grid-item {
    &.full-grid-widget {
        width: 100% !important;
        height: 100% !important;
        top: 0 !important;
        left: 0 !important;
    }
    &.vue-grid-item > .vue-resizable-handle {
        display: none;
    }
    &:hover {
        &.vue-grid-item > .vue-resizable-handle {
            display: block;
        }
        &.canEdit {
            outline: 1px solid var(--kn-color-borders);
            z-index: 10;
            .drag-widget-icon {
                display: block;
            }
        }
        .widgetButtonBarContainer {
            display: flex;
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

.widgetSpinner {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}
</style>
