import { IDashboardDataset, IWidget, ISelection, IDashboardConfiguration } from '../../Dashboard'
import { addDataToCache, addDriversToData, addParametersToData, addSelectionsToData, showGetDataError } from '../../DashboardDataProxy'
import { clearDatasetInterval } from '../../helpers/datasetRefresh/DatasetRefreshHelpers'
import { md5 } from 'js-md5'
import { indexedDB } from '@/idb'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import moment from 'moment'
import { DataType } from '../ChartWidget/classes/highcharts/helpers/setData/HighchartsSetDataHelpers'

const dashStore = dashboardStore()

export const getSelectorWidgetData = async (dashboardId: any, dashboardConfig: IDashboardConfiguration, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const datasetIndex = datasets.findIndex((dataset: any) => widget.dataset === dataset.id)
    const selectedDataset = datasets[datasetIndex]

    if (selectedDataset) {
        const url = `/restful-services/2.0/datasets/${selectedDataset.dsLabel}/data?offset=-1&size=-1&nearRealtime=${!selectedDataset.cache}`

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
    const dataType = getDataType(tempResponse.rows, 'column_2')
    if (!dataType) return

    const grouped = groupData(tempResponse.rows, sortingOrder, dataType)
    if (!grouped) return

    const sortedRows = formatAndSortData(grouped, sortingOrder, dataType)
    tempResponse.rows = sortedRows

    return tempResponse
}

export const getDataType = (rows: any, sortingColmnIndex: string): DataType | null => {
    if (!rows || !rows[0] || !rows[0][sortingColmnIndex]) return null

    const dateFormats = [DataType.DATE_LONG, DataType.DATE_SHORT]
    for (const format of dateFormats) {
        if (moment(rows[0][sortingColmnIndex], format, true).isValid()) {
            return format === DataType.DATE_LONG ? DataType.DATE_LONG : DataType.DATE_SHORT
        }
    }

    if (!isNaN(Number(rows[0][sortingColmnIndex]))) {
        return DataType.NUMBER
    }

    return DataType.STRING
}

const groupData = (data: any, sortingOrder: 'ASC' | 'DESC' = 'ASC', dataType: DataType) => {
    const grouped: { [key: string]: any } = {}

    data.forEach((item: any) => {
        const group = item.column_1
        const value = parseValue(item.column_2, dataType)

        if (value === null) return

        if (!grouped[group]) {
            grouped[group] = value
        } else {
            grouped[group] = compareValues(grouped[group], value, sortingOrder, dataType)
        }
    })

    return grouped
}

const formatAndSortData = (groupedData: any, sortingOrder: 'ASC' | 'DESC' = 'ASC', dataType: DataType) => {
    const dataArray = Object.keys(groupedData).map((key) => ({
        column_1: key,
        column_2: groupedData[key]
    }))

    const sortedDataArray = dataArray.sort((a, b) => compareValuesForSort(a.column_2, b.column_2, sortingOrder, dataType))
    return sortedDataArray
}

const parseValue = (value: string, dataType: DataType) => {
    switch (dataType) {
        case DataType.DATE_LONG:
        case DataType.DATE_SHORT:
            return isValidDate(value, dataType) ? moment(value, dataType) : null
        case DataType.NUMBER:
            return !isNaN(Number(value)) ? Number(value) : null
        default:
            return value
    }
}

export const compareValues = (currentValue: any, newValue: any, sortingOrder: 'ASC' | 'DESC', dataType: DataType) => {
    switch (dataType) {
        case DataType.DATE_LONG:
        case DataType.DATE_SHORT:
            return sortingOrder === 'ASC' ? moment.min(currentValue, newValue) : moment.max(currentValue, newValue)
        case DataType.NUMBER:
            return sortingOrder === 'ASC' ? Math.min(currentValue, newValue) : Math.max(currentValue, newValue)
        default:
            return sortingOrder === 'ASC' ? (currentValue < newValue ? currentValue : newValue) : currentValue > newValue ? currentValue : newValue
    }
}

const compareValuesForSort = (currentValue: any, newValue: any, sortingOrder: 'ASC' | 'DESC', dataType: DataType): number => {
    switch (dataType) {
        case DataType.DATE_LONG:
        case DataType.DATE_SHORT:
            return sortingOrder === 'ASC' ? moment(currentValue).diff(moment(newValue)) : moment(newValue).diff(moment(currentValue))

        case DataType.NUMBER:
            return sortingOrder === 'ASC' ? currentValue - newValue : newValue - currentValue

        default:
            return sortingOrder === 'ASC' ? (currentValue < newValue ? -1 : currentValue > newValue ? 1 : 0) : currentValue > newValue ? -1 : currentValue < newValue ? 1 : 0
    }
}

const isValidDate = (dateString: string, format: string): boolean => {
    return moment(dateString, format, true).isValid()
}
