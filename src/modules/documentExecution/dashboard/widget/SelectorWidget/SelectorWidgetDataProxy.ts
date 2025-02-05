import { IDashboardDataset, IWidget, ISelection, IDashboardConfiguration } from '../../Dashboard'
import { addDataToCache, addDriversToData, addParametersToData, addSelectionsToData, showGetDataError } from '../../DashboardDataProxy'
import { clearDatasetInterval } from '../../helpers/datasetRefresh/DatasetRefreshHelpers'
import { md5 } from 'js-md5'
import { indexedDB } from '@/idb'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import moment from 'moment'

const dashStore = dashboardStore()

export const getSelectorWidgetData = async (dashboardId: any, dashboardConfig: IDashboardConfiguration, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const datasetIndex = datasets.findIndex((dataset: any) => widget.dataset === dataset.id)
    const selectedDataset = datasets[datasetIndex]

    if (selectedDataset) {
        const url = `/restful-services/2.0/datasets/${selectedDataset.dsLabel}/data?offset=-1&size=-1&nearRealtime=true`

        const postData = formatSelectorWidgetModelForService(dashboardId, dashboardConfig, widget, selectedDataset, initialCall, selections, associativeResponseSelections)
        let tempResponse = null as any

        if (widget.dataset || widget.dataset === 0) clearDatasetInterval(widget.dataset)

        const dataHash = md5(JSON.stringify(postData))
        const cachedData = await indexedDB.widgetData.get(dataHash)

        if (dashStore.dataProxyQueue[dataHash]) {
            const response = await dashStore.dataProxyQueue[dataHash]
            return response.data
        }

        if (dashboardConfig.menuWidgets?.enableCaching && cachedData && cachedData.data) {
            tempResponse = cachedData.data
            tempResponse.initialCall = initialCall
        } else {
            dashStore.dataProxyQueue[dataHash] = $http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + url, postData, { headers: { 'X-Disable-Errors': 'true' } })
            try {
                const response = await dashStore.dataProxyQueue[dataHash]
                tempResponse = response.data
                tempResponse.initialCall = initialCall

                if (dashboardConfig.menuWidgets?.enableCaching) addDataToCache(dataHash, tempResponse)
            } catch (error) {
                console.error(error)
                showGetDataError(error, selectedDataset.dsLabel)
            } finally {
                delete dashStore.dataProxyQueue[dataHash]
            }
        }

        if (widget.settings?.sortingColumn && tempResponse?.metaData?.fields?.length > 2) tempResponse = formatReponseWithTheExternalSortingColumn(tempResponse, widget.settings.sortingOrder)

        console.log('----- FINAL RESPONSE: ', tempResponse)
        return tempResponse
    }
}

const formatSelectorWidgetModelForService = (dashboardId: any, dashboardConfig: IDashboardConfiguration, widget: IWidget, dataset: IDashboardDataset, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
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

    let sortingColumn = null as any
    if (widget.settings?.sortingColumn) sortingColumn = findSortingColumn(widget)

    widget.columns.forEach((column) => {
        if (column.fieldType === 'ATTRIBUTE') {
            const attributeToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, orderColumn: widget.settings?.sortingColumn ?? '', orderType: widget.settings?.sortingOrder ?? '', funct: 'NONE' } as any
            attributeToPush.orderType = widget.settings.sortingOrder

            dataToSend.aggregations.categories.push(attributeToPush)
        }
    })

    if (sortingColumn) dataToSend.aggregations.categories.push(sortingColumn)

    return dataToSend
}

const findSortingColumn = (widget: IWidget) => {
    const sortingColumnName = widget.settings.sortingColumn
    return { id: sortingColumnName, alias: sortingColumnName, columnName: sortingColumnName, orderColumn: sortingColumnName ?? '', orderType: widget.settings.sortingOrder ?? '' }
}

const formatReponseWithTheExternalSortingColumn = (tempResponse: any, sortingOrder: 'ASC' | 'DESC' = 'ASC') => {
    console.log('------------ tempResponse: ', tempResponse)

    const grouped = groupDates(tempResponse.rows, sortingOrder)
    if (!grouped) return

    const sortedRows = formatAndSortData(grouped)
    tempResponse.rows = sortedRows

    return tempResponse
}

const groupDates = (data: any, sortingOrder: 'ASC' | 'DESC' = 'ASC') => {
    const grouped = {}
    data.forEach((item) => {
        if (isValidDate(item.column_2)) {
            const group = item.column_1
            const date = moment(item.column_2, 'DD/MM/YYYY HH:mm:ss.SSS')
            if (!grouped[group]) {
                grouped[group] = date
            } else {
                grouped[group] = sortingOrder === 'ASC' ? moment.min(grouped[group], date) : moment.max(grouped[group], date)
            }
        }
    })

    for (const group in grouped) {
        grouped[group] = grouped[group].format('DD/MM/YYYY HH:mm:ss.SSS')
    }

    console.log('----- GROUPED: ', grouped)

    return grouped
}

const formatAndSortData = (groupedData: any, sortingOrder: 'ASC' | 'DESC' = 'ASC') => {
    const dataArray = Object.keys(groupedData).map((key) => ({
        column_1: key,
        column_2: groupedData[key]
    }))

    const sortedDataArray = dataArray.sort((a, b) => {
        if (sortingOrder === 'ASC') {
            return moment.min(moment(a.column_2, 'DD/MM/YYYY HH:mm:ss.SSS'), moment(b.column_2, 'DD/MM/YYYY HH:mm:ss.SSS')).isSame(moment(a.column_2, 'DD/MM/YYYY HH:mm:ss.SSS')) ? -1 : 1
        } else {
            return moment.max(moment(a.column_2, 'DD/MM/YYYY HH:mm:ss.SSS'), moment(b.column_2, 'DD/MM/YYYY HH:mm:ss.SSS')).isSame(moment(a.column_2, 'DD/MM/YYYY HH:mm:ss.SSS')) ? -1 : 1
        }
    })

    console.log('----- sortedDataArray: ', sortedDataArray)
    return sortedDataArray
}

const isValidDate = (dateString) => {
    return moment(dateString, 'DD/MM/YYYY HH:mm:ss.SSS', true).isValid()
}
