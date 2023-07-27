import { IDashboard, IDashboardConfiguration, IDashboardOutputParameter, IDashboardSheet, IDashboardView, IDataset, IVariable, IWidget, IWidgetColumn, IWidgetSheetItem } from './Dashboard'
import { formatWidgetForSave, recreateKnowageChartModel } from './widget/WidgetEditor/helpers/WidgetEditorHelpers'
import { setVariableValueFromDataset } from './generalSettings/VariablesHelper'
import mitt from 'mitt'
export const emitter = mitt()
import cryptoRandomString from 'crypto-random-string'
import deepcopy from 'deepcopy'
import { formatChartJSWidget } from './widget/WidgetEditor/helpers/chartWidget/chartJS/ChartJSHelpers'
import { formatHighchartsWidget } from './widget/WidgetEditor/helpers/chartWidget/highcharts/HighchartsHelpers'
import { AxiosResponse } from 'axios'
import mainStore from '@/App.store'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'
import { formatVegaWidget } from './widget/WidgetEditor/helpers/chartWidget/vega/VegaHelpers'

const store = mainStore()

export const createNewDashboardModel = () => {
    const dashboardModel = {
        sheets: [],
        widgets: [],
        configuration: {
            id: cryptoRandomString({ length: 16, type: 'base64' }),
            name: '',
            label: '',
            description: '',
            cssToRender: '',
            associations: [],
            datasets: [],
            variables: [],
            themes: {},
            selections: [],
            background: {
                sheetsBackgroundColor: '',
                imageBackgroundUrl: '',
                imageBackgroundSize: ''
            },
            menuWidgets: {
                showExcelExport: true,
                showScreenshot: true,
                showSelectionButton: true
            }
        },
        version: '8.2.0'
    } as IDashboard

    return dashboardModel
}

export const updateWidgetHelper = (dashboardId: string, widget: IWidget, dashboards: any) => {
    for (let i = 0; i < dashboards[dashboardId].widgets.length; i++) {
        if (widget.id === dashboards[dashboardId].widgets[i].id) {
            const tempWidget = deepcopy(widget)
            recreateKnowageChartModel(tempWidget)
            dashboards[dashboardId].widgets[i] = tempWidget
            emitter.emit('widgetUpdatedFromStore', widget)
        }
    }
}

export const deleteWidgetHelper = (dashboardId: string, widget: IWidget, dashboards: any) => {
    if (!dashboards[dashboardId]) return
    const index = dashboards[dashboardId].widgets.findIndex((tempWidget: IWidget) => tempWidget.id === widget.id)
    if (index !== -1) {
        dashboards[dashboardId].widgets.splice(index, 1)
        deleteWidgetFromSheets(dashboards[dashboardId], widget.id as string)
    }
}

const deleteWidgetFromSheets = (dashboard: IDashboard, widgetId: string) => {
    const sheets = dashboard.sheets as any
    for (let i = sheets.length - 1; i >= 0; i--) {
        const widgets = sheets[i].widgets.lg
        for (let j = widgets.length - 1; j >= 0; j--) {
            if (widgets[j].id === widgetId) {
                widgets.splice(j, 1)
            }
        }
    }
}

export const formatDashboardForSave = (dashboard: IDashboard) => {
    for (let i = 0; i < dashboard.widgets.length; i++) {
        dashboard.widgets[i] = formatWidgetForSave(dashboard.widgets[i]) as IWidget
    }
    formatVariablesForSave(dashboard.configuration)
    delete dashboard.allDatasetsLoaded
}

const formatVariablesForSave = (dashboardConfiguration: IDashboardConfiguration) => {
    if (!dashboardConfiguration || !dashboardConfiguration.variables) return
    dashboardConfiguration.variables.forEach((variable: IVariable) => delete variable.pivotedValues)
}

export const formatNewModel = async (dashboard: IDashboard, datasets: IDataset[], $http: any) => {
    for (let i = 0; i < dashboard.configuration.variables.length; i++) {
        if (dashboard.configuration.variables[i].type === 'dataset') await setVariableValueFromDataset(dashboard.configuration.variables[i], datasets, $http)
    }

    for (let i = 0; i < dashboard.widgets.length; i++) {
        formatWidget(dashboard.widgets[i])
    }
    return dashboard
}

const formatWidget = (widget: IWidget) => {
    addColumnIdsToWidgetColumns(widget)
    switch (widget.type) {
        case 'chartJS':
            formatChartJSWidget(widget)
            break
        case 'highcharts':
            formatHighchartsWidget(widget)
            break
        case 'vega':
            formatVegaWidget(widget)
    }
}

const addColumnIdsToWidgetColumns = (widget: IWidget) => {
    widget.columns.forEach((column: IWidgetColumn) => column.id = cryptoRandomString({ length: 16, type: 'base64' }))
}

export const loadDatasets = async (dashboardModel: IDashboard | any, appStore: any, setAllDatasets: Function, $http: any) => {
    appStore.setLoading(true)
    let url = `/restful-services/2.0/datasets/?asPagedList=true&seeTechnical=true`
    if (dashboardModel) {
        const datasetIdsAsString = getDatasetIdsFromDashboardModel(dashboardModel)
        if (!datasetIdsAsString) {
            appStore.setLoading(false)
            return []
        }
        url += `&ids=${datasetIdsAsString}`
    }
    let datasets = []
    await $http
        .get(import.meta.env.VITE_KNOWAGE_CONTEXT + url)
        .then((response: AxiosResponse<any>) => (datasets = response.data ? response.data.item : []))
        .catch(() => { })
    setAllDatasets(datasets)
    appStore.setLoading(false)
    return datasets
}

const getDatasetIdsFromDashboardModel = (dashboardModel: IDashboard | any) => {
    const datasetIds = [] as string[]
    dashboardModel.configuration?.datasets?.forEach((dataset: any) => datasetIds.push(dataset.id ?? dataset.dsId))

    return datasetIds.join(',')
}

export const canEditDashboard = (document): boolean => {
    if (!store.user || !document) return false
    return store.user.functionalities?.includes(UserFunctionalitiesConstants.DOCUMENT_ADMIN_MANAGEMENT) || document.creationUser === store.user.userId
}

export const getFormattedOutputParameters = (documentOutputParameters: IDashboardOutputParameter[]) => {
    if (!documentOutputParameters) return []
    return documentOutputParameters.map((documentOutputParameter: IDashboardOutputParameter) => {
        return {
            enabled: true,
            name: documentOutputParameter.name,
            type: documentOutputParameter.type
        }
    })
}

export const applyDashboardViewToModel = (dashboardModel: IDashboard, view: IDashboardView | null) => {
    if (!view) return
    if (view.settings.selections) dashboardModel.configuration.selections = view.settings.selections
    if (view.settings.states) setStatesForWidgets(dashboardModel, view.settings.states)
}

const setStatesForWidgets = (dashboardModel: IDashboard, states: any) => {
    dashboardModel.widgets.forEach((widget: IWidget) => {
        if (widget.id && states[widget.id]) {
            widget.state = states[widget.id].state
            widget.search = states[widget.id].search
        }
    })
}

export const addNewWidgetToSheets = (dashboardModel: IDashboard, selectedSheetIndex: number, widget: IWidget) => {
    console.log("-------------- createNewWidget() - dashboardModel: ", dashboardModel)
    console.log("-------------- createNewWidget() - widget: ", widget)
    console.log("-------------- createNewWidget() -  widget responsive", widget?.settings?.responsive)
    if (!widget.settings.responsive) return
    const sizes = Object.keys(widget.settings.responsive)
    console.log("-------------- createNewWidget() -  sizes", sizes)
    if (!dashboardModel.sheets[selectedSheetIndex].widgets) dashboardModel.sheets[selectedSheetIndex].widgets = { lg: [], md: [], sm: [], xs: [], xxs: [] }
    sizes.forEach((size: string) => {
        if (widget.settings.responsive[size]) {
            if (dashboardModel.sheets[selectedSheetIndex].widgets[size]) {
                dashboardModel.sheets[selectedSheetIndex].widgets[size].push({ id: widget.id, h: 10, i: cryptoRandomString({ length: 16, type: 'base64' }), w: 10, x: 0, y: 0, moved: false })
            } else {
                dashboardModel.sheets[selectedSheetIndex].widgets[size] = [{ id: widget.id, h: 10, i: cryptoRandomString({ length: 16, type: 'base64' }), w: 10, x: 0, y: 0, moved: false }]
            }
        }
    })
}

export const moveWidgetToSheet = (widgetToAdd: IWidgetSheetItem | null, dashboard: IDashboard, selectedSheet: IDashboardSheet, widget: IWidget) => {
    const selectedSheetInDashboard = dashboard.sheets.find((sheet: IDashboardSheet) => sheet.id === selectedSheet.id)
    const sheetWidgets = selectedSheetInDashboard?.widgets
    if (!widgetToAdd || !sheetWidgets) return
    widgetToAdd.x = 0
    widgetToAdd.y = 0
    let overlap = false
    let maxWidth = 50;
    for (let i = 0; i < sheetWidgets.lg.length; i++) {
        const existingItem = sheetWidgets.lg[i];
        if (widgetToAdd.x < existingItem.x + existingItem.w && widgetToAdd.x + widgetToAdd.w > existingItem.x && widgetToAdd.y < existingItem.y + existingItem.h && widgetToAdd.y + widgetToAdd.h > existingItem.y) {
            overlap = true;
            break;
        }

        if (existingItem.x + existingItem.w > maxWidth) maxWidth = existingItem.x + existingItem.w;

    }
    if (overlap) {
        const newX = Math.max(maxWidth + 1, widgetToAdd.x);
        const newY = Math.max(widgetToAdd.y, sheetWidgets.lg.reduce((maxY, item) => item.y + item.h > maxY ? item.y + item.h : maxY, 0));
        widgetToAdd.x = newX;
        widgetToAdd.y = newY;
    }

    if (sheetWidgets && widgetToAdd) sheetWidgets.lg.push({ id: widget.id ?? '', h: widgetToAdd.h, i: cryptoRandomString({ length: 16, type: 'base64' }), w: widgetToAdd.w, x: widgetToAdd.x, y: widgetToAdd.y, moved: false })
}