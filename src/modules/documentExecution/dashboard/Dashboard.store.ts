import { IGalleryItem } from './Dashboard.d';
import { defineStore } from 'pinia'
import { SHEET_WIDGET_SIZES, addNewWidgetToSheets, cloneWidgetInSheet, deleteWidgetHelper, emitter, loadCustomChartGallery, loadHtmlGallery, loadPythonGallery, moveWidgetToSheet, updateWidgetHelper } from './DashboardHelpers'
import { IDashboardDriver, IDashboardSheet, IDashboardView, IDataset, ISelection, IWidget, IWidgetSheetItem } from './Dashboard'
import { selectionsUseDatasetWithAssociation } from './widget/interactionsHelpers/DatasetAssociationsHelper'
import { loadAssociativeSelections } from './widget/interactionsHelpers/InteractionHelper'
import { recreateKnowageChartModel } from './widget/WidgetEditor/helpers/WidgetEditorHelpers'
import { IDashboardTheme } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import deepcopy from 'deepcopy'

const store = defineStore('dashboardStore', {
    state() {
        return {
            dashboards: {},
            selectedSheetIndex: 0,
            allDatasets: [] as IDataset[],
            internationalization: {},
            profileAttributes: [] as { name: string; value: string }[],
            allThemes: [] as IDashboardTheme[]
        }
    },
    actions: {
        removeDashboard(dashboard: any) {
            delete this.dashboards[dashboard.id]
        },
        getDashboard(dashboardId: string) {
            return this.dashboards[dashboardId]
        },
        setDashboard(id: string, dashboard: any) {
            this.dashboards[id] = dashboard
        },
        setDashboardSheet(dashboard: any) {
            this.dashboards[dashboard.id].sheet = dashboard.sheet
        },
        getDashboardDocument(dashboardId: string) {
            return this.dashboards[dashboardId].document
        },
        setDashboardDocument(dashboardId: string, document: any) {
            this.dashboards[dashboardId].document = document
        },
        createNewWidget(dashboardId: string, widget: IWidget, originalWidget: IWidget | null = null) {
            recreateKnowageChartModel(widget)
            this.dashboards[dashboardId].widgets.push(widget)
            addNewWidgetToSheets(this.dashboards[dashboardId], this.selectedSheetIndex, widget, originalWidget)
        },
        updateWidget(dashboardId: string, widget: IWidget) {
            updateWidgetHelper(dashboardId, widget, this.dashboards)
        },
        deleteWidget(dashboardId: string, widget: IWidget) {
            deleteWidgetHelper(dashboardId, widget, this.dashboards)
        },
        moveWidget(dashboardId: string, widget: IWidget, selectedSheet: IDashboardSheet, currentSheet: IDashboardSheet) {
            if (!this.dashboards[dashboardId]) return
            let widgetInSheet = null as IWidgetSheetItem | null
            if (currentSheet) {
                SHEET_WIDGET_SIZES.forEach((size: string) => {
                    const index = currentSheet.widgets[size].findIndex((el: any) => el.id === widget.id)
                    widgetInSheet = deepcopy(currentSheet.widgets[size][index])
                    if (index !== -1) currentSheet.widgets[size].splice(index, 1)
                })
            }
            moveWidgetToSheet(widgetInSheet, this.dashboards[dashboardId], selectedSheet)
        },
        cloneWidget(dashboardId: string, widget: IWidget, currentSheet: IDashboardSheet) {
            if (!this.dashboards[dashboardId]) return
            cloneWidgetInSheet(widget, this.dashboards[dashboardId], currentSheet)
        },
        setSelectedSheetIndex(index: number) {
            this.selectedSheetIndex = index
        },
        getDashboardSelectedDatasets(dashboardId: string) {
            const temp = this.dashboards[dashboardId]?.configuration?.datasets
            return temp ?? []
        },
        getCrossNavigations(dashboardId: string) {
            return this.dashboards[dashboardId] ? this.dashboards[dashboardId].crossNavigations : []
        },
        setCrossNavigations(dashboardId: string, crossNavigations: any[]) {
            if (this.dashboards[dashboardId]) this.dashboards[dashboardId].crossNavigations = crossNavigations
        },
        getOutputParameters(dashboardId: string) {
            return this.dashboards[dashboardId] ? this.dashboards[dashboardId].outputParameters : []
        },
        setOutputParameters(dashboardId: string, outputParameters: any) {
            if (this.dashboards[dashboardId]) this.dashboards[dashboardId].outputParameters = outputParameters
        },
        getSelections(dashboardId: string) {
            return this.dashboards[dashboardId].selections
        },
        setInternationalization(internationalization) {
            this.internationalization = internationalization
        },
        setSelections(dashboardId: string, selections: ISelection[], $http: any) {
            if (this.dashboards[dashboardId]) this.dashboards[dashboardId].selections = selections
            if (!this.dashboards[dashboardId]) return
            if (selections.length > 0 && selectionsUseDatasetWithAssociation(selections, this.dashboards[dashboardId].configuration.associations)) {
                loadAssociativeSelections(dashboardId, this.dashboards[dashboardId], this.allDatasets, selections, $http)
            } else {
                emitter.emit('selectionsChanged', { dashboardId: dashboardId, selections: this.dashboards[dashboardId].selections })
            }
        },
        removeSelection(payload: { datasetId: number; columnName: string }, dashboardId: string, $http: any) {
            const index = this.dashboards[dashboardId].selections?.findIndex((selection: ISelection) => selection.datasetId === payload.datasetId && selection.columnName === payload.columnName)
            if (index !== -1) {
                const tempSelection = deepcopy(this.dashboards[dashboardId].selections[index])
                this.dashboards[dashboardId].selections.splice(index, 1)
                if (selectionsUseDatasetWithAssociation([tempSelection], this.dashboards[dashboardId].configuration.associations)) {
                    loadAssociativeSelections(dashboardId, this.dashboards[dashboardId], this.allDatasets, this.dashboards[dashboardId].selections, $http)
                } else {
                    emitter.emit('selectionsChanged', { dashboardId: dashboardId, selections: this.dashboards[dashboardId].selections })
                }
                emitter.emit('selectionsDeleted', [tempSelection])
            }
        },
        removeSelections(selectionsToRemove: ISelection[], dashboardId: string, $http: any) {
            const removedSelections = [] as ISelection[]
            selectionsToRemove?.forEach((selection: ISelection) => {
                const index = this.dashboards[dashboardId].selections.findIndex((activeSelection: ISelection) => activeSelection.datasetId === selection.datasetId && activeSelection.columnName === selection.columnName)
                if (index !== -1) {
                    this.dashboards[dashboardId].selections.splice(index, 1)
                    removedSelections.push(selection)
                }
            })
            if (removedSelections.length > 0) {
                if (selectionsUseDatasetWithAssociation(removedSelections, this.dashboards[dashboardId].configuration.associations)) loadAssociativeSelections(dashboardId, this.dashboards[dashboardId], this.allDatasets, this.dashboards[dashboardId].selections, $http)
                emitter.emit('selectionsDeleted', removedSelections)
            }
        },
        getDashboardDatasets(dashboardId: number) {
            return this.dashboards[dashboardId]?.configuration?.datasets
        },
        getAllDatasets() {
            return this.allDatasets
        },
        getInternationalization() {
            return this.internationalization
        },
        setAllDatasets(datasets: IDataset[]) {
            this.allDatasets = datasets
        },
        getDatasetLabel(datasetId: number) {
            const index = this.allDatasets.findIndex((dataset: IDataset) => dataset.id.dsId == datasetId)
            return index !== -1 ? this.allDatasets[index].label : ''
        },
        getDashboardDrivers(dashboardId: string) {
            return this.dashboards[dashboardId]?.drivers
        },
        setDashboardDrivers(dashboardId: string, drivers: IDashboardDriver[]) {
            if (this.dashboards[dashboardId]) this.dashboards[dashboardId].drivers = drivers
        },
        getProfileAttributes() {
            return this.profileAttributes
        },
        setProfileAttributes(profileAttributes: { name: string; value: string }[]) {
            this.profileAttributes = profileAttributes
        },
        getCurrentDashboardView(dashboardId: string) {
            if (this.dashboards[dashboardId]) return this.dashboards[dashboardId].currentView
        },
        setCurrentDashboardView(dashboardId: string, currentDashboardView: IDashboardView) {
            if (this.dashboards[dashboardId]) this.dashboards[dashboardId].currentView = currentDashboardView
        },
        setAllThemes(themes: IDashboardTheme[]) {
            this.allThemes = themes
        },
        getAllThemes() {
            return this.allThemes
        },
        setAssociations(dashboardId: string, associationsToSet: any) {
            if (this.dashboards[dashboardId]) this.dashboards[dashboardId].associations = associationsToSet
        },
        getAssociations(dashboardId: string) {
            if (this.dashboards[dashboardId]) return this.dashboards[dashboardId].associations
        },
        async getHTMLGaleryItems(dashboardId: string, $http: any) {
            if (!this.dashboards[dashboardId]) return []
            if (!this.dashboards[dashboardId].htmlGallery) this.dashboards[dashboardId].htmlGallery = []
            if (this.dashboards[dashboardId].htmlGallery.length === 0) this.dashboards[dashboardId].htmlGallery = await loadHtmlGallery($http)
            return this.dashboards[dashboardId].htmlGallery
        },
        setHTMLGaleryItems(dashboardId: string, htmlGallery: IGalleryItem[]) {
            if (this.dashboards[dashboardId]) this.dashboards[dashboardId].htmlGallery = htmlGallery
        },
        async getPythonGaleryItems(dashboardId: string, $http: any) {
            if (!this.dashboards[dashboardId]) return []
            if (!this.dashboards[dashboardId].pythonGallery) this.dashboards[dashboardId].pythonGallery = []
            if (this.dashboards[dashboardId].pythonGallery.length === 0) this.dashboards[dashboardId].pythonGallery = await loadPythonGallery($http)
            return this.dashboards[dashboardId].pythonGallery
        },
        setPythonGaleryItems(dashboardId: string, pythonGallery: IGalleryItem[]) {
            if (this.dashboards[dashboardId]) this.dashboards[dashboardId].pythonGallery = pythonGallery
        },
        async getCustomChartGaleryItems(dashboardId: string, $http: any) {
            if (!this.dashboards[dashboardId]) return []
            if (!this.dashboards[dashboardId].customChartGallery) this.dashboards[dashboardId].customChartGallery = []
            if (this.dashboards[dashboardId].customChartGallery.length === 0) this.dashboards[dashboardId].customChartGallery = await loadCustomChartGallery($http)
            return this.dashboards[dashboardId].customChartGallery
        },
        setCustomChartGaleryItems(dashboardId: string, customChartGallery: IGalleryItem[]) {
            if (this.dashboards[dashboardId]) this.dashboards[dashboardId].customChartGallery = customChartGallery
        },
    }
})

export default store
