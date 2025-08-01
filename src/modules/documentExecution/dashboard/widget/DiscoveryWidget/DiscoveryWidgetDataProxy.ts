import { addDataToCache, addDriversToData, addParametersToData, addSelectionsToData, showGetDataError, addVariablesToFormula, addFunctionColumnToTheMeasuresForThePostData } from '@/modules/documentExecution/dashboard/DashboardDataProxy'
import { IDashboardDataset, IWidget, ISelection, IDashboardConfiguration, IWidgetFunctionColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { md5 } from 'js-md5'
import { indexedDB } from '@/idb'
import deepcopy from 'deepcopy'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

const dashStore = dashboardStore()

export const getDiscoveryWidgetData = async (dashboardId, dashboardConfig: IDashboardConfiguration, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const datasetIndex = datasets.findIndex((dataset: IDashboardDataset) => widget.dataset === dataset.id)
    const selectedDataset = datasets[datasetIndex]

    if (selectedDataset) {
        let url = ''
        if (!widget.settings.pagination) {
            const pagination = { enabled: true, properties: { offset: 0, itemsNumber: 10, totalItems: null } }
            widget.settings.pagination = pagination
        }

        url = `/restful-services/2.0/datasets/${selectedDataset.dsLabel}/data?offset=${widget.settings.pagination.properties.offset}&size=${widget.settings.pagination.properties.itemsNumber}&nearRealtime=${!selectedDataset.cache}`

        const postData = formatDiscoveryModelForGet(dashboardId, dashboardConfig, widget, selectedDataset, initialCall, selections, associativeResponseSelections)
        let tempResponse = null as any

        const postDataForHash = deepcopy(postData) // making a deepcopy so we can delete options which are used for solr datasets only
        delete postDataForHash.options
        if (widget.settings.pagination.enabled) postDataForHash.pagination = deepcopy(widget.settings.pagination) // adding pagination in case its being used so we save data for each page
        const dataHash = md5(JSON.stringify(postDataForHash))
        const cachedData = (await indexedDB.widgetData.get(dataHash)) as any

        if (dashStore.dataProxyQueue[dataHash]) {
            const response = await dashStore.dataProxyQueue[dataHash]
            return response.data
        }

        if (dashboardConfig.menuWidgets?.enableCaching && cachedData && cachedData.data && (Number(selectedDataset.frequency) === 0 || !selectedDataset.frequency)) {
            tempResponse = cachedData.data
            if (widget.settings.pagination.enabled) widget.settings.pagination.properties.totalItems = tempResponse.results
        } else {
            dashStore.dataProxyQueue[dataHash] = $http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + url, postData, { headers: { 'X-Disable-Errors': 'true' } })
            try {
                const response = await dashStore.dataProxyQueue[dataHash]
                tempResponse = response.data

                if (dashboardConfig.menuWidgets?.enableCaching && (Number(selectedDataset.frequency) === 0 || !selectedDataset.frequency)) addDataToCache(dataHash, tempResponse)
                if (widget.settings.pagination.enabled) widget.settings.pagination.properties.totalItems = response.data.results
            } catch (error) {
                console.error(error)
                showGetDataError(error, selectedDataset.dsLabel)
            } finally {
                delete dashStore.dataProxyQueue[dataHash]
            }
        }

        return tempResponse
    }
}

const formatDiscoveryModelForGet = (dashboardId, dashboardConfig: IDashboardConfiguration, propWidget: IWidget, dataset: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const dataToSend = {
        aggregations: {
            dataset: '',
            measures: [],
            categories: []
        },
        parameters: {},
        selections: {},
        drivers: {},
        indexes: [],
        likeSelections: {}
    } as any

    dataToSend.likeSelections[dataset.dsLabel] = {}
    dataToSend.aggregations.dataset = dataset.dsLabel

    addSelectionsToData(dataToSend, propWidget, dataset.dsLabel!, initialCall, selections, associativeResponseSelections)
    addDriversToData(dataset, dataToSend)
    addParametersToData(dataset, dashboardId, dataToSend, associativeResponseSelections)

    for (let i = 0; i < propWidget.columns.length; i++) {
        const column = propWidget.columns[i]
        if (column.fieldType === 'MEASURE') {
            if (column.type === 'pythonFunction') {
                addFunctionColumnToTheMeasuresForThePostData(dataToSend.aggregations.measures, column as IWidgetFunctionColumn)
                continue
            }
            const measureToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, funct: 'NONE', orderColumn: column.columnName, functColumn: column.columnName, orderType: '' } as any
            column.id === propWidget.settings.sortingColumn ? (measureToPush.orderType = propWidget.settings.sortingOrder) : ''
            if (column.formula) measureToPush.formula = addVariablesToFormula(column, dashboardConfig)

            dataToSend.aggregations.measures.push(measureToPush)
        } else {
            const attributeToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, orderType: '', funct: column.aggregation, functColumn: column.aggregationColumn } as any
            dataToSend.aggregations.categories.push(attributeToPush)

            column.id === propWidget.settings.sortingColumn ? (attributeToPush.orderType = propWidget.settings.sortingOrder) : ''
        }
    }

    const searchWordSettings = propWidget.settings.search
    if (searchWordSettings.enabled && searchWordSettings.searchWord && searchWordSettings.columns.length > 0) {
        const searchPropName = searchWordSettings.columns.join(',')
        dataToSend.likeSelections[dataset.dsLabel][searchPropName] = searchWordSettings.searchWord.trim()
    }

    const facetSearchParams = propWidget.settings.search.facetSearchParams
    if (facetSearchParams) {
        const facetKeys = Object.keys(facetSearchParams)
        if (facetKeys.length > 0) {
            facetKeys.forEach((facetName) => {
                dataToSend.likeSelections[dataset.dsLabel][facetName] = facetSearchParams[facetName][0]
            })
        }
    }

    return dataToSend
}
