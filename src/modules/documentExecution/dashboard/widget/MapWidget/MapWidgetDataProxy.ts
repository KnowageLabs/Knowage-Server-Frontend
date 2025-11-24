import { IDashboardConfiguration, IDashboardDataset, ISelection, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { addDriversToData, addParametersToData, addSelectionsToData, showGetDataError, addVariablesToFormula, addFunctionColumnToTheMeasuresForThePostData, addDataToCache } from '../../DashboardDataProxy'
import { AxiosResponse } from 'axios'
import { clearDatasetInterval } from '../../helpers/datasetRefresh/DatasetRefreshHelpers'
import { IMapWidgetLayer } from '../../interfaces/mapWidget/DashboardMapWidget'
import axios from 'axios'
import { indexedDB } from '@/idb'
import { md5 } from 'js-md5'
import deepcopy from 'deepcopy'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

export const getMapWidgetData = async (dashboardId: any, dashboardConfig: IDashboardConfiguration, widget: IWidget, datasets: IDashboardDataset[], initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const tempResponse = {} as Record<string | number, any>
    const datasetOnly = widget.layers.filter((e) => e.type === 'dataset')
    const datasetsInWidget = datasetOnly.map((e) => e.label)
    const usedDatasets = datasets.filter((e) => datasetsInWidget.includes(e.dsLabel))
    const dashStore = dashboardStore()

    for (const selectedDataset of usedDatasets) {
        const url = `/restful-services/2.0/datasets/${selectedDataset.dsLabel}/data?offset=0&size=-1&nearRealtime=${!selectedDataset.cache}`
        const postData = formatMapModelForService(dashboardId, dashboardConfig, widget, selectedDataset, initialCall, selections, associativeResponseSelections)

        const postDataForHash = deepcopy(postData)
        delete postDataForHash.options
        const dataHash = md5(JSON.stringify(postDataForHash))

        if (dashStore.dataProxyQueue[dataHash]) {
            try {
                const existingResponse: AxiosResponse<any> = await dashStore.dataProxyQueue[dataHash]
                if (selectedDataset.id) tempResponse[selectedDataset.id] = existingResponse.data
            } catch (error: any) {
                showGetDataError(error, selectedDataset.dsLabel)
            }
            continue
        }

        const cachedData = dashboardConfig?.menuWidgets?.enableCaching ? await indexedDB.widgetData.get(dataHash) : null
        const canCache = dashboardConfig?.menuWidgets?.enableCaching && (Number(selectedDataset.frequency) === 0 || !selectedDataset.frequency)
        if (canCache && cachedData && cachedData.data) {
            if (selectedDataset.id) tempResponse[selectedDataset.id] = cachedData.data
            continue
        }

        if (widget.dataset || widget.dataset === 0) clearDatasetInterval(widget.dataset)
        dashStore.dataProxyQueue[dataHash] = axios.post(import.meta.env.VITE_KNOWAGE_CONTEXT + url, postData, { headers: { 'X-Disable-Errors': 'true' } })

        try {
            const response: AxiosResponse<any> = await dashStore.dataProxyQueue[dataHash]
            if (selectedDataset.id) tempResponse[selectedDataset.id] = response.data
            if (canCache) addDataToCache(dataHash, response.data)
        } catch (error: any) {
            showGetDataError(error, selectedDataset.dsLabel)
        } finally {
            delete dashStore.dataProxyQueue[dataHash]
        }
    }

    return tempResponse
}

const formatMapModelForService = (dashboardId: any, dashboardConfig: IDashboardConfiguration, widget: IWidget, dataset: IDashboardDataset, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const dataToSend = {
        aggregations: {
            dataset: '',
            measures: [],
            categories: []
        },
        parameters: {},
        selections: {},
        drivers: {},
        indexes: []
    } as any

    dataToSend.aggregations.dataset = dataset.dsLabel

    addSelectionsToData(dataToSend, widget, dataset.dsLabel!, initialCall, selections, associativeResponseSelections)
    addDriversToData(dataset, dataToSend)
    addParametersToData(dataset, dashboardId, dataToSend, associativeResponseSelections)

    const datasetWithColumns = widget.layers.find((layer: IMapWidgetLayer) => layer.label === dataset.dsLabel)
    for (let i = 0; i < datasetWithColumns.columns.length; i++) {
        const column = datasetWithColumns.columns[i]

        if (column.deleted) continue

        if (column.fieldType === 'MEASURE') {
            if (column.type === 'pythonFunction') {
                addFunctionColumnToTheMeasuresForThePostData(dataToSend.aggregations.measures, column as any)
                continue
            }
            const measureToPush = { id: column.alias, alias: column.alias, columnName: column.name, funct: column.aggregationSelected, orderColumn: column.alias, orderType: widget.settings?.sortingOrder } as any
            if (column.formula) measureToPush.formula = addVariablesToFormula(column, dashboardConfig)

            dataToSend.aggregations.measures.push(measureToPush)
        } else {
            const attributeToPush = { id: column.alias, alias: column.alias, columnName: column.name, orderType: '', funct: 'NONE' } as any
            column.id === widget.settings.sortingColumn ? (attributeToPush.orderType = widget.settings.sortingOrder) : ''

            dataToSend.aggregations.categories.push(attributeToPush)
        }
    }

    return dataToSend
}

export const getLayerData = async (layer: IMapWidgetLayer, dashboardConfig?: IDashboardConfiguration) => {
    const dashStore = dashboardStore()
    const url = import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/layers/${layer.label}/downloadByLabel/${layer.layerType}`
    const dataHash = md5(url)
    const canCache = dashboardConfig?.menuWidgets?.enableCaching

    if (dashStore.dataProxyQueue[dataHash]) {
        try {
            const existing: AxiosResponse<any> = await dashStore.dataProxyQueue[dataHash]
            return existing.data
        } catch (error: any) {
            showGetDataError(error, layer.label)
            return null
        }
    }

    if (canCache) {
        const cached = await indexedDB.layerData.get(dataHash)
        if (cached?.data) return cached.data
    }

    dashStore.dataProxyQueue[dataHash] = axios.get(url, { headers: { 'X-Disable-Errors': 'true' } })
    try {
        const response: AxiosResponse<any> = await dashStore.dataProxyQueue[dataHash]
        if (canCache) await indexedDB.layerData.put({ id: dataHash, data: response.data })
        return response.data
    } catch (error: any) {
        showGetDataError(error, layer.label)
        return null
    } finally {
        delete dashStore.dataProxyQueue[dataHash]
    }
}

export const getPropertiesByLayerLabel = async (layerLabel: string, dashboardId?: any) => {
    const dashStore = dashboardStore()
    const dashboardConfig = dashStore.getDashboard(dashboardId) as IDashboardConfiguration
    const url = import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/layers/getFilter?label=${layerLabel}`
    const dataHash = md5(url)
    const canCache = dashboardConfig?.menuWidgets?.enableCaching

    if (dashStore.dataProxyQueue[dataHash]) {
        try {
            const existing: AxiosResponse<any> = await dashStore.dataProxyQueue[dataHash]
            return existing.data
        } catch (error: any) {
            showGetDataError(error, '' + layerLabel)
            return []
        }
    }

    if (canCache) {
        const cached = await indexedDB.layerData.get(dataHash)
        if (cached?.data) return cached.data
    }

    dashStore.dataProxyQueue[dataHash] = axios.get(url, { headers: { 'X-Disable-Errors': 'true' } })
    try {
        const response: AxiosResponse<any> = await dashStore.dataProxyQueue[dataHash]
        if (canCache) await indexedDB.layerData.put({ id: dataHash, data: response.data })
        return response.data
    } catch (error: any) {
        showGetDataError(error, '' + layerLabel)
        return []
    } finally {
        delete dashStore.dataProxyQueue[dataHash]
    }
}
