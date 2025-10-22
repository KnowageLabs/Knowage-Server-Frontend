import { IDashboardDataset, IWidget, ISelection, IDashboardConfiguration, IWidgetFunctionColumn } from '../../Dashboard'
import { addDriversToData, addParametersToData, addSelectionsToData, maxRow, showGetDataError, getAggregationsModel, addDataToCache, addVariablesToFormula, addFunctionColumnToTheMeasuresForThePostData } from '../../DashboardDataProxy'
import { md5 } from 'js-md5'
import { indexedDB } from '@/idb'
import deepcopy from 'deepcopy'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

export const getWebComponentWidgetData = async (widgetType: 'html' | 'text', dashboardId: any, dashboardConfig: IDashboardConfiguration, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const dashStore = dashboardStore()

    const datasetIndex = datasets.findIndex((dataset: any) => widget.dataset === dataset.id)
    const selectedDataset = datasets[datasetIndex]

    if (selectedDataset && widget.settings.editor[widgetType]) {
        const valueToParse = widget.settings.editor[widgetType]
        const numOfRowsToGet = maxRow(widget)
        const url = `/restful-services/2.0/datasets/${selectedDataset.dsLabel}/data?offset=0&size=${numOfRowsToGet}&nearRealtime=${!selectedDataset.cache}&limit=${numOfRowsToGet}`

        const aggregationsModel = getAggregationsModel(widget, valueToParse)
        let aggregationDataset = null as any
        if (aggregationsModel) {
            const aggregationsPostData = formatWebComponentModelForService(dashboardId, dashboardConfig, aggregationsModel, selectedDataset, initialCall, selections, associativeResponseSelections)

            const postDataForHash = deepcopy(aggregationsPostData) // making a deepcopy so we can delete options which are used for solr datasets only
            if (numOfRowsToGet) postDataForHash.numOfRowsToGet = numOfRowsToGet // adding pagination in case its being used so we save data for each page
            const dataHash = md5(JSON.stringify(postDataForHash))
            const cachedData = await indexedDB.widgetData.get(dataHash)

            if (dashStore.dataProxyQueue[dataHash]) {
                const response = await dashStore.dataProxyQueue[dataHash]
                return response.data
            }

            if (dashboardConfig.menuWidgets?.enableCaching && cachedData && cachedData.data && (Number(selectedDataset.frequency) === 0 || !selectedDataset.frequency)) {
                aggregationDataset = cachedData.data
            } else {
                dashStore.dataProxyQueue[dataHash] = $http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + url, aggregationsPostData, { headers: { 'X-Disable-Errors': 'true' } })
                try {
                    const response = await dashStore.dataProxyQueue[dataHash]
                    aggregationDataset = response.data

                    if (dashboardConfig.menuWidgets?.enableCaching && (Number(selectedDataset.frequency) === 0 || !selectedDataset.frequency)) addDataToCache(dataHash, aggregationDataset)
                } catch (error) {
                    console.error(error)
                    showGetDataError(error, selectedDataset.dsLabel)
                } finally {
                    delete dashStore.dataProxyQueue[dataHash]
                }
            }
        }

        const postData = formatWebComponentModelForService(dashboardId, dashboardConfig, widget, selectedDataset, initialCall, selections, associativeResponseSelections)
        let tempResponse = null as any

        const dataHash = md5(JSON.stringify(postData))
        const cachedData = await indexedDB.widgetData.get(dataHash)

        if (dashStore.dataProxyQueue[dataHash]) {
            const response = await dashStore.dataProxyQueue[dataHash]
            return response.data
        }

        if (dashboardConfig.menuWidgets?.enableCaching && cachedData && cachedData.data && (Number(selectedDataset.frequency) === 0 || !selectedDataset.frequency)) {
            tempResponse = cachedData.data
        } else {
            dashStore.dataProxyQueue[dataHash] = $http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + url, postData, { headers: { 'X-Disable-Errors': 'true' } })
            try {
                const response = await dashStore.dataProxyQueue[dataHash]
                tempResponse = response.data

                if (dashboardConfig.menuWidgets?.enableCaching && (Number(selectedDataset.frequency) === 0 || !selectedDataset.frequency)) addDataToCache(dataHash, tempResponse)
            } catch (error) {
                console.error(error)
                showGetDataError(error, selectedDataset.dsLabel)
            } finally {
                delete dashStore.dataProxyQueue[dataHash]
            }
        }

        return { tempResponse: tempResponse, aggregationDataset: aggregationDataset }
    }
}

const formatWebComponentModelForService = (dashboardId: any, dashboardConfig: IDashboardConfiguration, widget: IWidget, dataset: IDashboardDataset, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
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

    for (let i = 0; i < widget.columns.length; i++) {
        const column = widget.columns[i]

        if (column.fieldType === 'MEASURE') {
            if (column.type === 'pythonFunction') {
                addFunctionColumnToTheMeasuresForThePostData(dataToSend.aggregations.measures, column as IWidgetFunctionColumn)
                continue
            }

            const measureToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, funct: column.aggregation, orderColumn: column.alias, orderType: widget.settings?.sortingOrder ?? '' } as any
            if (column.formula) measureToPush.formula = addVariablesToFormula(column, dashboardConfig)

            dataToSend.aggregations.measures.push(measureToPush)
        } else {
            const attributeToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, orderType: '', funct: 'NONE' } as any
            column.id === widget.settings.sortingColumn ? (attributeToPush.orderType = widget.settings?.sortingOrder ?? '') : ''

            dataToSend.aggregations.categories.push(attributeToPush)
        }
    }

    return dataToSend
}
