import { defineStore } from 'pinia'
import { deleteWidgetHelper, emitter, moveWidgetToSheet, updateWidgetHelper } from './DashboardHelpers'
import { IDashboardDriver, IDashboardSheet, IDashboardView, IDataset, ISelection, IWidget, IWidgetSheetItem } from './Dashboard'
import { selectionsUseDatasetWithAssociation } from './widget/interactionsHelpers/DatasetAssociationsHelper'
import { loadAssociativeSelections } from './widget/interactionsHelpers/InteractionHelper'
import { recreateKnowageChartModel } from './widget/WidgetEditor/helpers/WidgetEditorHelpers'
import cryptoRandomString from 'crypto-random-string'
import deepcopy from 'deepcopy'

const store = defineStore('dashboardStore', {
    state() {
        return {
            dashboards: {},
            selectedSheetIndex: 0,
            allDatasets: [] as IDataset[],
            internationalization: {},
            profileAttributes: [] as { name: string; value: string }[]
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
        createNewWidget(dashboardId: string, widget: IWidget) {
            recreateKnowageChartModel(widget)
            this.dashboards[dashboardId].widgets.push(widget)
            if (this.dashboards[dashboardId].sheets[this.selectedSheetIndex]) {
                this.dashboards[dashboardId].sheets[this.selectedSheetIndex].widgets.lg.push({ id: widget.id, h: 10, i: cryptoRandomString({ length: 16, type: 'base64' }), w: 10, x: 0, y: 0, moved: false })
            } else {
                this.dashboards[dashboardId].sheets[this.selectedSheetIndex] = { widgets: { lg: [{ id: widget.id, h: 10, i: cryptoRandomString({ length: 16, type: 'base64' }), w: 10, x: 0, y: 0, moved: false }] } }
            }
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
                const index = currentSheet.widgets.lg.findIndex((el: any) => el.id === widget.id)
                widgetInSheet = deepcopy(currentSheet.widgets.lg[index])
                if (index !== -1) {
                    currentSheet.widgets.lg.splice(index, 1)
                }
            }
            moveWidgetToSheet(widgetInSheet, this.dashboards[dashboardId], selectedSheet, widget)
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
                loadAssociativeSelections(this.dashboards[dashboardId], this.allDatasets, selections, $http)
            } else {
                emitter.emit('selectionsChanged', { dashboardId: dashboardId, selections: this.dashboards[dashboardId].selections })
            }
        },
        removeSelection(payload: { datasetId: number; columnName: string }, dashboardId: string) {
            const index = this.dashboards[dashboardId].selections?.findIndex((selection: ISelection) => selection.datasetId === payload.datasetId && selection.columnName === payload.columnName)
            if (index !== -1) {
                const tempSelection = deepcopy(this.dashboards[dashboardId].selections[index])
                this.dashboards[dashboardId].selections.splice(index, 1)

                emitter.emit('selectionsDeleted', [tempSelection])
                emitter.emit('selectionsChanged', { dashboardId: dashboardId, selections: this.dashboards[dashboardId].selections })
            }
        },
        removeSelections(selectionsToRemove: ISelection[], dashboardId: string) {
            const removedSelections = [] as ISelection[]
            selectionsToRemove?.forEach((selection: ISelection) => {
                const index = this.dashboards[dashboardId].selections.findIndex((activeSelection: ISelection) => activeSelection.datasetId === selection.datasetId && activeSelection.columnName === selection.columnName)
                if (index !== -1) {
                    this.dashboards[dashboardId].selections.splice(index, 1)
                    removedSelections.push(selection)
                }
            })
            if (removedSelections.length > 0) emitter.emit('selectionsDeleted', removedSelections)
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
        }
    }
})

export default store
