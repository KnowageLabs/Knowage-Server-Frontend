// import { AxiosResponse } from 'axios'
import { IDashboardDataset, IWidget, IWidgetSearch, ISelection, IDashboardConfiguration } from '../../Dashboard'
import { addDataToCache, addDriversToData, addParametersToData, addSelectionsToData, showGetDataError } from '../../DashboardDataProxy'
import { clearDatasetInterval } from '../../helpers/datasetRefresh/DatasetRefreshHelpers'
import { indexedDB } from '@/idb'
import { md5 } from 'js-md5'
import deepcopy from 'deepcopy'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

const dashStore = dashboardStore()

export const getTableWidgetData = async (dashboardId: any, dashboardConfig: IDashboardConfiguration, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], searchParams: IWidgetSearch, associativeResponseSelections?: any) => {
    const datasetIndex = datasets.findIndex((dataset: IDashboardDataset) => widget.dataset === dataset.id)
    const selectedDataset = datasets[datasetIndex] as IDashboardDataset

    const datasetLabel = selectedDataset?.dsLabel as string

    if (selectedDataset) {
        let url = ''
        const pagination = widget.settings.pagination
        if (pagination && pagination?.enabled) url = `/restful-services/2.0/datasets/${selectedDataset.dsLabel}/data?offset=${pagination.properties.offset}&size=${pagination.properties.itemsNumber}&nearRealtime=true`
        else url = `/restful-services/2.0/datasets/${selectedDataset.dsLabel}/data?offset=-1&size=-1&nearRealtime=true`

        const postData = formatTableWidgetModelForService(dashboardId, widget, selectedDataset, initialCall, selections, associativeResponseSelections)
        const formattedSelections = getLikeSelections(searchParams, datasetLabel)
        if (formattedSelections != null) postData.likeSelections = formattedSelections
        let tempResponse = null as any

        if (widget.dataset || widget.dataset === 0) clearDatasetInterval(widget.dataset)

        const postDataForHash = deepcopy(postData) // making a deepcopy so we can delete options which are used for solr datasets only
        delete postDataForHash.options
        if (pagination?.enabled) postDataForHash.pagination = deepcopy(pagination) // adding pagination in case its being used so we save data for each page

        //1. using the payload: postData we make a unique hash for that postData called dataHash
        const dataHash = md5(JSON.stringify(postDataForHash))
        //2. we attempt to grab stored data from indexedDB using dataHash, if there is non we get null
        const cachedData = await indexedDB.widgetData.get(dataHash)

        //3. in store we should have a dataProxyQueue object. here we check if dataHash is present.
        if (dashStore.dataProxyQueue[dataHash]) {
            //3a. if its present, it means a widget already made the call with identical payload, we wait until its resolved
            const response = await dashStore.dataProxyQueue[dataHash]
            //3a. already in progress, wait for completion, we can return response form the promise and break the method here
            return response.data
        }

        //4. in step 2. we checked if indexedDB contained dataHash, if it did
        if (dashboardConfig.menuWidgets?.enableCaching && cachedData && cachedData.data) {
            //4a. cachedData should be populated, if it is we simply return cachded data form indexedDB
            return cachedData.data
        } else {
            // 5. if we have no cached data, we call the service with postData and add the promise to dataProxyQueue object
            dashStore.dataProxyQueue[dataHash] = $http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + url, postData, { headers: { 'X-Disable-Errors': 'true' } })
            try {
                const response = await dashStore.dataProxyQueue[dataHash]
                tempResponse = response.data

                // 6. after getting said data, we add it to indexedDB cache using defined dataHash
                if (dashboardConfig.menuWidgets?.enableCaching) addDataToCache(dataHash, tempResponse)
                if (pagination && pagination?.enabled) widget.settings.pagination.properties.totalItems = response.data.results
            } catch (error) {
                console.error(error)
                showGetDataError(error, selectedDataset.dsLabel)
            } finally {
                // 7. finally, we need to resolve the promise from step 3 and remove it from the queue object
                delete dashStore.dataProxyQueue[dataHash]
            }

            //Keep this as a temporary backup
            // await $http
            //     .post(import.meta.env.VITE_KNOWAGE_CONTEXT + url, postData, { headers: { 'X-Disable-Errors': 'true' } })
            //     .then((response: AxiosResponse<any>) => {
            //         tempResponse = response.data
            //         if (pagination && pagination?.enabled) widget.settings.pagination.properties.totalItems = response.data.results
            //     })
            //     .catch((error: any) => {
            //         showGetDataError(error, selectedDataset.dsLabel)
            //     })
            //     .finally(async () => {
            //         // TODO - uncomment when realtime dataset example is ready
            //         // resetDatasetInterval(widget)
            //         if (dashboardConfig.menuWidgets?.enableCaching) addDataToCache(dataHash, tempResponse)
            //     })
        }

        return tempResponse
    }
}

const formatTableWidgetModelForService = (dashboardId: any, widget: IWidget, dataset: IDashboardDataset, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
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

    if (widget.type === 'table') {
        if (widget.settings.configuration.summaryRows.enabled) dataToSend.summaryRow = getSummaryRow(widget)
        dataToSend.options = { solrFacetPivot: true } //if dataset is table solr, it needs this option
    }

    widget.columns.forEach((column) => {
        if (column.fieldType === 'MEASURE') {
            const measureToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, funct: column.aggregation, orderColumn: column.alias, orderType: widget.settings?.sortingOrder } as any
            column.formula ? (measureToPush.formula = column.formula) : ''
            dataToSend.aggregations.measures.push(measureToPush)
        } else {
            const attributeToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, orderType: '', funct: 'NONE' } as any
            //sort logic - if column is set as sorting column, change order type
            column.id === widget.settings.sortingColumn ? (attributeToPush.orderType = widget.settings.sortingOrder) : ''

            dataToSend.aggregations.categories.push(attributeToPush)
        }
    })

    return dataToSend
}

const getSummaryRow = (widget: IWidget) => {
    const summaryArray = [] as any
    const columns = widget.columns

    for (const k in widget.settings.configuration.summaryRows.list) {
        const measures = [] as any
        if (columns) {
            for (let i = 0; i < columns.length; i++) {
                const col = columns[i]
                if (col.fieldType != 'ATTRIBUTE') {
                    const obj = {}
                    obj['id'] = col.columnName || col.alias
                    obj['alias'] = col.alias || col.alias

                    if (widget.settings.configuration.summaryRows.list[k].aggregation == 'Columns Default Aggregation') obj['funct'] = col.aggregation
                    else obj['funct'] = widget.settings.configuration.summaryRows.list[k].aggregation || col.aggregation

                    if (col.formula) obj['formula'] = col.formula
                    else obj['columnName'] = col.columnName

                    measures.push(obj)
                }
            }
        }
        const result = {} as any
        result['measures'] = measures
        result['dataset'] = widget.dataset
        summaryArray.push(result)
    }

    return summaryArray
}

const getLikeSelections = (searchParams: IWidgetSearch, datasetLabel: string) => {
    if (searchParams && searchParams?.searchText != '' && searchParams?.searchColumns.length > 0) {
        const formattedLikeSelections = searchParams.searchColumns.toString()
        return { [datasetLabel]: { [formattedLikeSelections]: searchParams.searchText } }
    } else return null
}
