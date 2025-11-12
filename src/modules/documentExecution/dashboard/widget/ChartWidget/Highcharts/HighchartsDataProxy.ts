import { IDashboardDataset, IWidget, ISelection, IDashboardConfiguration, IDatasetColumn, IWidgetFunctionColumn } from '../../../Dashboard'
import { addFunctionColumnToTheMeasuresForThePostData, addVariablesToFormula, addDataToCache, addDriversToData, addParametersToData, addSelectionsToData, showGetDataError } from '../../../DashboardDataProxy'
import { md5 } from 'js-md5'
import { indexedDB } from '@/idb'
import deepcopy from 'deepcopy'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

interface ChartDataConfig {
    categoriesCount: number
    measuresCount: number
    useSpecificMeasure: boolean
}

const CHART_CONFIGURATIONS: Record<string, ChartDataConfig> = {
    scatter: { categoriesCount: 1, measuresCount: -1, useSpecificMeasure: false },

    pie: { categoriesCount: 1, measuresCount: 1, useSpecificMeasure: false },

    gauge: { categoriesCount: 0, measuresCount: -1, useSpecificMeasure: false },
    activitygauge: { categoriesCount: 0, measuresCount: -1, useSpecificMeasure: false },
    solidgauge: { categoriesCount: 0, measuresCount: -1, useSpecificMeasure: false },

    // Bubble and complex charts (all use all available measures/categories)
    bubble: { categoriesCount: -1, measuresCount: -1, useSpecificMeasure: false },
    sunburst: { categoriesCount: -1, measuresCount: -1, useSpecificMeasure: false },
    treemap: { categoriesCount: -1, measuresCount: -1, useSpecificMeasure: false },
    heatmap: { categoriesCount: -1, measuresCount: -1, useSpecificMeasure: false },
    wordcloud: { categoriesCount: -1, measuresCount: -1, useSpecificMeasure: false },
    spline: { categoriesCount: -1, measuresCount: -1, useSpecificMeasure: false },
    dependencywheel: { categoriesCount: -1, measuresCount: -1, useSpecificMeasure: false },
    pictorial: { categoriesCount: -1, measuresCount: -1, useSpecificMeasure: false },
    sankey: { categoriesCount: -1, measuresCount: -1, useSpecificMeasure: false },
    funnel: { categoriesCount: -1, measuresCount: -1, useSpecificMeasure: false },
    streamgraph: { categoriesCount: -1, measuresCount: -1, useSpecificMeasure: false },
    packedbubble: { categoriesCount: -1, measuresCount: -1, useSpecificMeasure: false }
}

// Charts that support complex grouping configurations
const GROUPING_SUPPORTED_CHARTS = ['area', 'bar', 'column', 'line', 'radar', 'dumbbell', 'waterfall']

export const getHighchartsWidgetData = async (dashboardId: any, dashboardConfig: IDashboardConfiguration, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any, likeSelections?: any, drillLevel?: number) => {
    const dashStore = dashboardStore()
    const chartType = widget.settings.chartModel?.model?.chart.type

    const datasetIndex = datasets.findIndex((dataset: IDashboardDataset) => widget.dataset === dataset.id)
    const selectedDataset = datasets[datasetIndex]

    if (!selectedDataset) {
        return null
    }

    const itemsLimit = widget.settings.configuration.limit
    const url = `/restful-services/2.0/datasets/${selectedDataset.dsLabel}/data?offset=-1&size=${itemsLimit && itemsLimit.enabled && itemsLimit.itemsNumber ? itemsLimit.itemsNumber : '-1'}&nearRealtime=${!selectedDataset.cache}`

    const postData = formatChartWidgetForGet(dashboardId, dashboardConfig, widget, selectedDataset, initialCall, selections, associativeResponseSelections, drillLevel, chartType)
    let tempResponse = null as any

    if (likeSelections) postData.likeSelections = likeSelections

    const postDataForHash = deepcopy(postData)
    if (itemsLimit && itemsLimit?.enabled) postDataForHash.itemsLimit = itemsLimit
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

const formatChartWidgetForGet = (dashboardId: any, dashboardConfig: IDashboardConfiguration, widget: IWidget, dataset: IDashboardDataset, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any, drillLevel?: number, chartType?: string) => {
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

    // Handle special grouping logic for supported chart types
    if (GROUPING_SUPPORTED_CHARTS.includes(chartType || 'bar')) {
        if (widget.settings.configuration?.grouping?.enabled) {
            addMeasuresAndCategoriesByCount(widget, dashboardConfig, dataToSend, 2, -1, false, drillLevel)
        } else if (widget.settings.configuration?.grouping?.secondSeries.enabled) {
            addMeasuresAndCategoriesByCount(widget, dashboardConfig, dataToSend, 1, 2, false, drillLevel)
        } else if (widget.settings.configuration?.grouping?.secondDimension.enabled) {
            addMeasuresAndCategoriesByCount(widget, dashboardConfig, dataToSend, 2, -1, true, drillLevel)
        } else {
            addMeasuresAndCategoriesByCount(widget, dashboardConfig, dataToSend, 1, -1, false, drillLevel)
        }
    } else {
        // Use chart-specific configuration for charts that don't support grouping
        const config = CHART_CONFIGURATIONS[chartType || '']
        if (config) addMeasuresAndCategoriesByCount(widget, dashboardConfig, dataToSend, config.categoriesCount, config.measuresCount, config.useSpecificMeasure, drillLevel)
        else addMeasuresAndCategoriesByCount(widget, dashboardConfig, dataToSend, 1, -1, false, drillLevel)
    }

    return dataToSend
}

export const addMeasuresAndCategoriesByCount = (widget: IWidget, dashboardConfig: IDashboardConfiguration, dataToSend: any, noOfCategories: number, noOfMeasures: number, specificMeasure: boolean, drillLevel?: number) => {
    const measures = widget.columns.filter((column) => column.fieldType === 'MEASURE')
    const measureLength = noOfMeasures == -1 ? measures.length : noOfMeasures

    if (measures.length >= measureLength && !specificMeasure) {
        for (let index = 0; index < measureLength; index++) {
            const measure = measures[index]
            if (measure.type === 'pythonFunction') {
                addFunctionColumnToTheMeasuresForThePostData(dataToSend.aggregations.measures, measure as IWidgetFunctionColumn)
                continue
            }
            const measureToPush = { id: `${measure.alias}`, alias: `${measure.alias}`, columnName: measure.columnName, funct: measure.aggregation, orderColumn: measure?.orderColumn ?? measure.columnName, orderType: measure.orderType ?? '' } as any
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
            const measureToPush = { id: `${measure.alias}`, alias: `${measure.alias}`, columnName: measure.columnName, funct: measure.aggregation, orderColumn: measure?.orderColumn ?? measure.columnName, orderType: measure.orderType ?? '' } as any
            if (measure.formula) measureToPush.formula = addVariablesToFormula(measure, dashboardConfig)

            dataToSend.aggregations.measures.push(measureToPush)
        }
    }

    const categories = widget.columns.filter((column) => column.fieldType !== 'MEASURE')
    const categoryLength = noOfCategories == -1 ? categories.length : noOfCategories

    if (categories.length >= categoryLength) {
        for (let index = 0; index < categoryLength; index++) {
            const category = categories[drillLevel ?? index]
            const categoryToPush = { id: category.alias, alias: category.alias, columnName: category.columnName, orderColumn: category.orderColumn ?? category.columnName, orderType: category.orderType ?? '', funct: 'NONE' } as any

            dataToSend.aggregations.categories.push(categoryToPush)
        }
    }
}
