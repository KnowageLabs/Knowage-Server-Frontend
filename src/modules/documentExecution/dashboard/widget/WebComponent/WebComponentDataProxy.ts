import { AxiosResponse } from 'axios'
import { IDashboardDataset, IWidget, ISelection, IDashboardConfiguration } from '../../Dashboard'
import { addDriversToData, addParametersToData, addSelectionsToData, maxRow, showGetDataError, getAggregationsModel, addDataToCache } from '../../DashboardDataProxy'
import { clearDatasetInterval } from '../../helpers/datasetRefresh/DatasetRefreshHelpers'
import { md5 } from 'js-md5'
import { indexedDB } from '@/idb'
import deepcopy from 'deepcopy'

export const getWebComponentWidgetData = async (widgetType: 'html' | 'text', dashboardId: any, dashboardConfig: IDashboardConfiguration, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const datasetIndex = datasets.findIndex((dataset: any) => widget.dataset === dataset.id)
    const selectedDataset = datasets[datasetIndex]

    if (selectedDataset && widget.settings.editor[widgetType]) {
        const valueToParse = widget.settings.editor[widgetType]
        const numOfRowsToGet = maxRow(widget)
        const url = `/restful-services/2.0/datasets/${selectedDataset.dsLabel}/data?offset=0&size=${numOfRowsToGet}&nearRealtime=true&limit=${numOfRowsToGet}`

        const aggregationsModel = getAggregationsModel(widget, valueToParse)
        let aggregationDataset = null as any
        if (aggregationsModel) {
            const aggregationsPostData = formatWebComponentModelForService(dashboardId, aggregationsModel, selectedDataset, initialCall, selections, associativeResponseSelections)

            const postDataForHash = deepcopy(aggregationsPostData) // making a deepcopy so we can delete options which are used for solr datasets only
            if (numOfRowsToGet) postDataForHash.numOfRowsToGet = numOfRowsToGet // adding pagination in case its being used so we save data for each page
            const dataHash = md5(JSON.stringify(postDataForHash))
            const cachedData = await indexedDB.widgetData.get(dataHash)

            if (dashboardConfig.menuWidgets.enableCaching && cachedData && cachedData.data) {
                aggregationDataset = cachedData.data
            } else {
                await $http
                    .post(import.meta.env.VITE_KNOWAGE_CONTEXT + url, aggregationsPostData, { headers: { 'X-Disable-Errors': 'true' } })
                    .then((response: AxiosResponse<any>) => {
                        aggregationDataset = response.data
                    })
                    .catch((error: any) => {
                        showGetDataError(error, selectedDataset.dsLabel)
                    })
                    .finally(() => {
                        // TODO - uncomment when realtime dataset example is ready
                        // resetDatasetInterval(widget)
                        if (dashboardConfig.menuWidgets.enableCaching) addDataToCache(dataHash, aggregationDataset)
                    })
            }
        }

        const postData = formatWebComponentModelForService(dashboardId, widget, selectedDataset, initialCall, selections, associativeResponseSelections)
        let tempResponse = null as any
        if (widget.dataset || widget.dataset === 0) clearDatasetInterval(widget.dataset)

        const dataHash = md5(JSON.stringify(postData))
        const cachedData = await indexedDB.widgetData.get(dataHash)

        if (dashboardConfig.menuWidgets.enableCaching && cachedData && cachedData.data) {
            tempResponse = cachedData.data
        } else {
            await $http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + url, postData, { headers: { 'X-Disable-Errors': 'true' } })
                .then((response: AxiosResponse<any>) => {
                    tempResponse = response.data
                })
                .catch((error: any) => {
                    showGetDataError(error, selectedDataset.dsLabel)
                })
                .finally(() => {
                    // TODO - uncomment when realtime dataset example is ready
                    // resetDatasetInterval(widget)
                    if (dashboardConfig.menuWidgets.enableCaching) addDataToCache(dataHash, tempResponse)
                })
        }

        return { tempResponse: tempResponse, aggregationDataset: aggregationDataset }
    }
}

const formatWebComponentModelForService = (dashboardId: any, widget: IWidget, dataset: IDashboardDataset, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
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

    addSelectionsToData(dataToSend, widget, dataset.dsLabel, initialCall, selections, associativeResponseSelections)
    addDriversToData(dataset, dataToSend)
    addParametersToData(dataset, dashboardId, dataToSend)

    widget.columns.forEach((column) => {
        if (column.fieldType === 'MEASURE') {
            const measureToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, funct: column.aggregation, orderColumn: column.alias, orderType: widget.settings?.sortingOrder } as any
            column.formula ? (measureToPush.formula = column.formula) : ''
            dataToSend.aggregations.measures.push(measureToPush)
        } else {
            const attributeToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, orderType: '', funct: 'NONE' } as any
            column.id === widget.settings.sortingColumn ? (attributeToPush.orderType = widget.settings.sortingOrder) : ''

            dataToSend.aggregations.categories.push(attributeToPush)
        }
    })

    return dataToSend
}
