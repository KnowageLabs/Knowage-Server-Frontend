import { IDashboardDataset, IWidget, ISelection, IDashboardConfiguration, IWidgetFunctionColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { addDataToCache, addDriversToData, addFunctionColumnToTheMeasuresForThePostData, addParametersToData, addSelectionsToData, addVariablesToFormula, showGetDataError } from '@/modules/documentExecution/dashboard/DashboardDataProxy'
import { md5 } from 'js-md5'
import { indexedDB } from '@/idb'
import deepcopy from 'deepcopy'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { ISortingColumn } from '../HighchartsDataProxy'

const dashStore = dashboardStore()

export const getHighchartsBarData = async (dashboardId, dashboardConfig: IDashboardConfiguration, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], sortingColumn: ISortingColumn | null, associativeResponseSelections?: any) => {
    const datasetIndex = datasets.findIndex((dataset: IDashboardDataset) => widget.dataset === dataset.id)
    const selectedDataset = datasets[datasetIndex]

    if (selectedDataset) {
        const itemsLimit = widget.settings.configuration.limit
        const url = `/restful-services/2.0/datasets/${selectedDataset.dsLabel}/data?offset=-1&size=${itemsLimit && itemsLimit.enabled && itemsLimit.itemsNumber ? itemsLimit.itemsNumber : '-1'}&nearRealtime=${!selectedDataset.cache}`

        const postData = formatChartWidgetForGet(dashboardId, dashboardConfig, widget, selectedDataset, initialCall, selections, sortingColumn, associativeResponseSelections)
        let tempResponse = null as any

        const postDataForHash = deepcopy(postData) // making a deepcopy so we can delete options which are used for solr datasets only
        if (itemsLimit && itemsLimit?.enabled) postDataForHash.itemsLimit = itemsLimit // adding pagination in case its being used so we save data for each page
        const dataHash = md5(JSON.stringify(postDataForHash))
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
        return tempResponse
    }
}

const formatChartWidgetForGet = (dashboardId: any, dashboardConfig: IDashboardConfiguration, widget: IWidget, dataset: IDashboardDataset, initialCall: boolean, selections: ISelection[], sortingColumn: ISortingColumn | null, associativeResponseSelections?: any) => {
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
    dataToSend.options = { solrFacetPivot: true }

    addSelectionsToData(dataToSend, widget, dataset.dsLabel!, initialCall, selections, associativeResponseSelections)
    addDriversToData(dataset, dataToSend)
    addParametersToData(dataset, dashboardId, dataToSend, associativeResponseSelections)

    if (widget.settings.configuration?.grouping?.enabled) {
        addMeasuresAndCategoriesByCount(widget, dashboardConfig, dataToSend, 2, -1, false, sortingColumn)
    } else if (widget.settings.configuration?.grouping?.secondSeries.enabled) {
        addMeasuresAndCategoriesByCount(widget, dashboardConfig, dataToSend, 1, 2, false, sortingColumn)
    } else if (widget.settings.configuration?.grouping?.secondDimension.enabled) {
        addMeasuresAndCategoriesByCount(widget, dashboardConfig, dataToSend, 2, -1, true, sortingColumn)
    } else {
        addMeasuresAndCategoriesByCount(widget, dashboardConfig, dataToSend, 1, -1, false, sortingColumn)
    }

    return dataToSend
}

const addMeasuresAndCategoriesByCount = (widget: IWidget, dashboardConfig: IDashboardConfiguration, dataToSend: any, noOfCategories: number, noOfMeasures: number, specificMeasure: boolean, sortingColumn: ISortingColumn | null) => {
    const measures = widget.columns.filter((column) => column.fieldType === 'MEASURE')
    const measureLength = noOfMeasures == -1 ? measures.length : noOfMeasures

    if (measures.length >= measureLength && !specificMeasure) {
        for (let index = 0; index < measureLength; index++) {
            const measure = measures[index]
            if (measure.type === 'pythonFunction') {
                addFunctionColumnToTheMeasuresForThePostData(dataToSend.aggregations.measures, measure as IWidgetFunctionColumn)
                continue
            }
            const measureToPush = { id: `${measure.alias}_${measure.aggregation}`, alias: `${measure.alias}_${measure.aggregation}`, columnName: measure.columnName, funct: measure.aggregation, orderColumn: measure.alias, orderType: measure.orderType } as any
            if (measure.formula) measureToPush.formula = addVariablesToFormula(measure, dashboardConfig)

            dataToSend.aggregations.measures.push(measureToPush)
        }
    } else if (measures.length >= 1 && specificMeasure) {
        const specificMeasure = widget.settings.configuration.grouping.secondDimension.serie
        const measure = measures.filter((measure) => measure.columnName === specificMeasure)[0]
        if (measure) {
            if (measure.type === 'pythonFunction') {
                addFunctionColumnToTheMeasuresForThePostData(dataToSend.aggregations.measures, measure as IWidgetFunctionColumn)
                return
            }
            const measureToPush = { id: `${measure.alias}_${measure.aggregation}`, alias: `${measure.alias}_${measure.aggregation}`, columnName: measure.columnName, funct: measure.aggregation, orderColumn: measure.alias, orderType: measure.orderType } as any
            if (measure.formula) measureToPush.formula = addVariablesToFormula(measure, dashboardConfig)

            dataToSend.aggregations.measures.push(measureToPush)
        }
    }

    const categories = widget.columns.filter((column) => column.fieldType !== 'MEASURE')
    const categoryLength = noOfCategories == -1 ? categories.length : noOfCategories

    if (categories.length >= categoryLength) {
        for (let index = 0; index < categoryLength; index++) {
            const category = categories[index]
            const categoryToPush = { id: category.alias, alias: category.alias, columnName: category.columnName, orderColumn: category.alias, orderType: category.orderType, funct: 'NONE' } as any
            dataToSend.aggregations.categories.push(categoryToPush)
        }
    }

    if (sortingColumn && sortingColumn.sortingOrder && sortingColumn.datasetColumn) {
        if (sortingColumn.datasetColumn.fieldType === 'ATTRIBUTE' && dataToSend.aggregations.categories[0]) {
            dataToSend.aggregations.categories[0].orderColumn = sortingColumn.datasetColumn.name
            dataToSend.aggregations.categories[0].orderType = sortingColumn.sortingOrder
        } else {
            dataToSend.aggregations.measures.push({
                id: sortingColumn.datasetColumn.name,
                alias: sortingColumn.datasetColumn.name,
                columnName: sortingColumn.datasetColumn.name,
                orderColumn: sortingColumn.datasetColumn.name,
                orderType: sortingColumn.sortingOrder,
                funct: sortingColumn.sortingColumnAggregation || 'SUM'
            })
        }
    }
}
