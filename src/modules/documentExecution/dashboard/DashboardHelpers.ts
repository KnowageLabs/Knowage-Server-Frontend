import { getDefaultDashboardThemeConfig } from './../../managers/dashboardThemeManagement/DashboardThemeHelper';
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
import descriptor from './DashboardDescriptor.json'
import { formatDashboardTableWidgetAfterLoading } from './widget/WidgetEditor/helpers/tableWidget/TableWidgetFunctions'

const store = mainStore()

export const SHEET_WIDGET_SIZES = ['xxs', 'xs', 'sm', 'md', 'lg'] as string[]

export const createNewDashboardModel = () => {
    const dashboardModel = deepcopy(descriptor.newDashboardModel) as IDashboard
    dashboardModel.configuration.id = cryptoRandomString({ length: 16, type: 'base64' });

    return dashboardModel
}

export const addNewWidgetToSheets = (dashboardModel: IDashboard, selectedSheetIndex: number, widget: IWidget, originalWidget: IWidget | null = null) => {
    if (!widget.settings.responsive) return
    const SHEET_WIDGET_SIZES = Object.keys(widget.settings.responsive)
    if (!dashboardModel.sheets[selectedSheetIndex].widgets) dashboardModel.sheets[selectedSheetIndex].widgets = { lg: [], md: [], sm: [], xs: [], xxs: [] }
    if (SHEET_WIDGET_SIZES.includes('fullGrid')) addNewFullGridWidgetToSheetsWidgetSizeArray(dashboardModel, selectedSheetIndex, widget,)
    else SHEET_WIDGET_SIZES.forEach((size: string) => addNewWidgetToSheetsWidgetSizeArray(dashboardModel, size, selectedSheetIndex, widget, originalWidget))
}

const addNewFullGridWidgetToSheetsWidgetSizeArray = (dashboardModel: IDashboard, selectedSheetIndex: number, widget: IWidget) => {
    SHEET_WIDGET_SIZES.forEach((size: string) => dashboardModel.sheets[selectedSheetIndex].widgets[size].push(createDashboardSheetWidgetItem(widget)))
    disableOtherWidgetFullGridInASheet(dashboardModel, widget)
}

const disableOtherWidgetFullGridInASheet = (dashboardModel: IDashboard, widget: IWidget) => {
    dashboardModel.widgets.forEach((tempWidget: IWidget) => {
        if (tempWidget.id !== widget.id && tempWidget.settings.responsive.fullGrid) tempWidget.settings.responsive.fullGrid = false
    })
}

const addNewWidgetToSheetsWidgetSizeArray = (dashboardModel: IDashboard, size: string, selectedSheetIndex: number, widget: IWidget, originalWidget: IWidget | null = null) => {
    const originalWidgetSheetItem = originalWidget ? findOriginalWidgetInSheet(originalWidget, dashboardModel.sheets[selectedSheetIndex]) : null
    if (widget.settings.responsive[size]) {
        const sheetWidgetItem = createDashboardSheetWidgetItem(widget)
        if (originalWidgetSheetItem) updateClonedWidgetSheetItemWithOriginalDimensions(sheetWidgetItem, originalWidgetSheetItem)
        if (!dashboardModel.sheets[selectedSheetIndex].widgets[size]) dashboardModel.sheets[selectedSheetIndex].widgets[size] = []
        moveWidgetItemToSpecificSizeArray(sheetWidgetItem, size, dashboardModel.sheets[selectedSheetIndex].widgets)
    }
}

export const moveWidgetToSheet = (widgetToAdd: IWidgetSheetItem | null, dashboard: IDashboard, selectedSheet: IDashboardSheet) => {
    const selectedSheetInDashboard = dashboard.sheets.find((sheet: IDashboardSheet) => sheet.id === selectedSheet.id)
    const sheetWidgets = selectedSheetInDashboard?.widgets as { xxs: IWidgetSheetItem[]; xs: IWidgetSheetItem[]; sm: IWidgetSheetItem[]; md: IWidgetSheetItem[]; lg: IWidgetSheetItem[] }
    if (!widgetToAdd || !sheetWidgets) return
    SHEET_WIDGET_SIZES.forEach((size: string) => moveWidgetItemToSpecificSizeArray(widgetToAdd, size, sheetWidgets))
}

const moveWidgetItemToSpecificSizeArray = (widgetToAdd: IWidgetSheetItem, size: string, sheetWidgets: { xxs: IWidgetSheetItem[]; xs: IWidgetSheetItem[]; sm: IWidgetSheetItem[]; md: IWidgetSheetItem[]; lg: IWidgetSheetItem[] }) => {
    widgetToAdd.x = 0
    widgetToAdd.y = 0
    let overlap = false
    let maxWidth = getMaxWidthForSpecificSize(size)

    for (let i = 0; i < sheetWidgets[size].length; i++) {
        const existingItem = sheetWidgets[size][i]
        if (widgetToAdd.x < existingItem.x + existingItem.w && widgetToAdd.x + widgetToAdd.w > existingItem.x && widgetToAdd.y < existingItem.y + existingItem.h && widgetToAdd.y + widgetToAdd.h > existingItem.y) {
            overlap = true
            break
        }
        if (existingItem.x + existingItem.w > maxWidth) maxWidth = existingItem.x + existingItem.w
    }

    if (overlap) updateWidgetCoordinatesIfOverlaping(widgetToAdd, maxWidth, sheetWidgets[size])
    if (sheetWidgets && widgetToAdd) sheetWidgets[size].push({ id: widgetToAdd.id ?? '', h: widgetToAdd.h, i: cryptoRandomString({ length: 16, type: 'base64' }), w: widgetToAdd.w, x: widgetToAdd.x, y: widgetToAdd.y, moved: false })
}

const getMaxWidthForSpecificSize = (size: string) => {
    switch (size) {
        case 'xxs':
            return 10
        case 'xs':
            return 20
        case 'md':
            return 100
        default:
            return 50
    }
}

const updateWidgetCoordinatesIfOverlaping = (widgetToAdd: IWidgetSheetItem, maxWidth: number, sheetWidgets: IWidgetSheetItem[]) => {
    const newX = Math.max(maxWidth + 1, widgetToAdd.x)
    const newY = Math.max(
        widgetToAdd.y,
        sheetWidgets.reduce((maxY, item) => (item.y + item.h > maxY ? item.y + item.h : maxY), 0)
    )
    widgetToAdd.x = newX
    widgetToAdd.y = newY
}

export const cloneWidgetInSheet = (widget: IWidget, dashboard: IDashboard, selectedSheet: IDashboardSheet) => {
    const clonedWidget = deepcopy(widget)
    clonedWidget.id = cryptoRandomString({ length: 16, type: 'base64' })
    recreateKnowageChartModel(clonedWidget)
    const originalWidgetSheetItem = findOriginalWidgetInSheet(widget, selectedSheet)
    const clonedWidgetSheetItem = createDashboardSheetWidgetItem(clonedWidget)
    if (originalWidgetSheetItem) updateClonedWidgetSheetItemWithOriginalDimensions(clonedWidgetSheetItem, originalWidgetSheetItem)
    dashboard.widgets.push(clonedWidget)
    if (selectedSheet && clonedWidget.settings.responsive) {
        Object.keys(clonedWidget.settings.responsive).forEach((size: string) => {
            if (size !== 'fullGrid') moveWidgetItemToSpecificSizeArray(clonedWidgetSheetItem, size, selectedSheet.widgets)
        })
    }
}

const findOriginalWidgetInSheet = (widget: IWidget, selectedSheet: IDashboardSheet) => {
    let originalWidgetActiveSize = Object.keys(widget.settings.responsive).find((size: string) => widget.settings.responsive[size])
    originalWidgetActiveSize = originalWidgetActiveSize === 'fullGrid' ? 'lg' : originalWidgetActiveSize
    if (!originalWidgetActiveSize) return null
    const originalWidgetInSheet = selectedSheet.widgets[originalWidgetActiveSize].find(((widgetInSheet: IWidgetSheetItem) => widgetInSheet.id === widget.id))
    return originalWidgetInSheet
}

const updateClonedWidgetSheetItemWithOriginalDimensions = (clonedWidgetSheetItem: IWidgetSheetItem, originalWidgetSheetItem: IWidgetSheetItem) => {
    clonedWidgetSheetItem.h = originalWidgetSheetItem.h
    clonedWidgetSheetItem.w = originalWidgetSheetItem.w
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
    updateWidgetInSheets(dashboards[dashboardId], widget)
}

const updateWidgetInSheets = (dashboardModel: IDashboard, widget: IWidget) => {
    if (!widget.settings.responsive) return
    const SHEET_WIDGET_SIZES = Object.keys(widget.settings.responsive)
    dashboardModel.sheets.forEach((sheet: IDashboardSheet) => {
        if (SHEET_WIDGET_SIZES.includes('fullGrid')) updateFullGridWidgetToSheetsWidgetSizeArray(dashboardModel, sheet, widget)
        else SHEET_WIDGET_SIZES.forEach((size: string) => updateSheetInWidgetSizeArray(sheet, size, widget))
    })
}

const updateFullGridWidgetToSheetsWidgetSizeArray = (dashboardModel: IDashboard, sheet: IDashboardSheet, widget: IWidget) => {
    SHEET_WIDGET_SIZES.forEach((size: string) => updateSheetInWidgetSizeArray(sheet, size, widget))
    disableOtherWidgetFullGridInASheet(dashboardModel, widget)
}

const updateSheetInWidgetSizeArray = (sheet: IDashboardSheet, size: string, widget: IWidget) => {
    if (!sheet.widgets[size]) return
    const index = sheet.widgets[size].findIndex((widgetInSheet: IWidgetSheetItem) => widgetInSheet.id === widget.id)
    if (index === -1 && (widget.settings.responsive[size] || widget.settings.responsive.fullGrid)) {
        sheet.widgets[size].push(createDashboardSheetWidgetItem(widget))
    } else if (index !== -1 && !widget.settings.responsive[size] && !widget.settings.responsive.fullGrid) {
        sheet.widgets[size].splice(index, 1)
    }
}

const createDashboardSheetWidgetItem = (widget: IWidget) => {
    return { id: widget.id ?? cryptoRandomString({ length: 16, type: 'base64' }), h: 10, i: cryptoRandomString({ length: 16, type: 'base64' }), w: 10, x: 0, y: 0, moved: false }
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
        SHEET_WIDGET_SIZES.forEach((size: string) => {
            const widgetsInSheet = sheets[i].widgets[size]
            if (widgetsInSheet) {
                for (let j = widgetsInSheet.length - 1; j >= 0; j--) {
                    if (widgetsInSheet[j].id === widgetId) widgetsInSheet.splice(j, 1)
                }
            }
        })
    }
}

export const formatDashboardForSave = (dashboard: IDashboard) => {
    for (let i = 0; i < dashboard.widgets.length; i++) {
        dashboard.widgets[i] = formatWidgetForSave(dashboard.widgets[i]) as IWidget
    }
    formatVariablesForSave(dashboard.configuration)
    const propertiesForDelete = ['allDatasetsLoaded', 'htmlGallery', 'pythonGallery', 'customChartGallery', 'currentView', 'associations', 'drivers', 'crossNavigations', 'document', 'outputParameters']
    propertiesForDelete.forEach((property: string) => delete dashboard[property])
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

    if (!dashboard.configuration.theme || !dashboard.configuration.theme.config) dashboard.configuration.theme = { config: getDefaultDashboardThemeConfig() }

    return dashboard
}

const formatWidget = (widget: IWidget) => {
    addColumnIdsToWidgetColumns(widget)
    switch (widget.type) {
        case 'table':
            formatDashboardTableWidgetAfterLoading(widget);
            break
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
    widget.columns.forEach((column: IWidgetColumn) => {
        if (!column.id) column.id = cryptoRandomString({ length: 16, type: 'base64' })
    })
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

export const loadHtmlGallery = async ($http: any) => {
    store.setLoading(true)
    let galleryItems = []
    await $http
        .get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/1.0/widgetgallery/widgets/html`)
        .then((response: AxiosResponse<any>) => (galleryItems = response.data))
        .catch(() => { })
    store.setLoading(false)
    return galleryItems
}

export const loadPythonGallery = async ($http: any) => {
    store.setLoading(true)
    let galleryItems = []
    await $http
        .get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/1.0/widgetgallery/widgets/python`)
        .then((response: AxiosResponse<any>) => (galleryItems = response.data))
        .catch(() => { })
    store.setLoading(false)
    return galleryItems
}

export const loadCustomChartGallery = async ($http: any) => {
    store.setLoading(true)
    let galleryItems = []
    await $http
        .get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/1.0/widgetgallery/widgets/chart`)
        .then((response: AxiosResponse<any>) => (galleryItems = response.data))
        .catch(() => { })
    store.setLoading(false)
    return galleryItems
}