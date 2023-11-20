import { AxiosResponse } from 'axios'
import { clearDatasetInterval } from '@/modules/documentExecution/dashboard/helpers/datasetRefresh/DatasetRefreshHelpers'
import { IDashboardDataset, IWidget, ISelection, IDashboardConfiguration } from '@/modules/documentExecution/dashboard/Dashboard'
import { addDataToCache, addDriversToData, addParametersToData, addSelectionsToData, showGetDataError } from '@/modules/documentExecution/dashboard/DashboardDataProxy'
import { md5 } from 'js-md5'
import { indexedDB } from '@/idb'
import deepcopy from 'deepcopy'

export const getHighchartsBarData = async (dashboardId, dashboardConfig: IDashboardConfiguration, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const datasetIndex = datasets.findIndex((dataset: IDashboardDataset) => widget.dataset === dataset.id)
    const selectedDataset = datasets[datasetIndex]

    if (selectedDataset) {
        const itemsLimit = widget.settings.configuration.limit
        const url = `/restful-services/2.0/datasets/${selectedDataset.dsLabel}/data?offset=-1&size=${itemsLimit && itemsLimit.enabled && itemsLimit.itemsNumber ? itemsLimit.itemsNumber : '-1'}&nearRealtime=true`

        const postData = formatChartWidgetForGet(dashboardId, widget, selectedDataset, initialCall, selections, associativeResponseSelections)
        let tempResponse = null as any

        if (widget.dataset || widget.dataset === 0) clearDatasetInterval(widget.dataset)

        const postDataForHash = deepcopy(postData) // making a deepcopy so we can delete options which are used for solr datasets only
        if (itemsLimit.enabled) postDataForHash.itemsLimit = itemsLimit // adding pagination in case its being used so we save data for each page
        const dataHash = md5(JSON.stringify(postData))
        const cachedData = await indexedDB.widgetData.get(dataHash)

        if (dashboardConfig.menuWidgets.enableCaching && cachedData && cachedData.data) {
            tempResponse = cachedData.data
            tempResponse.initialCall = initialCall
        } else {
            await $http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + url, postData, { headers: { 'X-Disable-Errors': 'true' } })
                .then((response: AxiosResponse<any>) => {
                    tempResponse = response.data
                    tempResponse.initialCall = initialCall
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
        return tempResponse
    }
}

const formatChartWidgetForGet = (dashboardId: any, widget: IWidget, dataset: IDashboardDataset, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
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

    if (widget.settings.configuration?.grouping?.enabled) {
        addMeasuresAndCategoriesByCount(widget, dataToSend, 2, -1, false)
    } else if (widget.settings.configuration?.grouping?.secondSeries.enabled) {
        addMeasuresAndCategoriesByCount(widget, dataToSend, 1, 2, false)
    } else if (widget.settings.configuration?.grouping?.secondDimension.enabled) {
        addMeasuresAndCategoriesByCount(widget, dataToSend, 2, -1, true)
    } else {
        addMeasuresAndCategoriesByCount(widget, dataToSend, 1, -1, false)
    }

    return dataToSend
}

const addMeasuresAndCategoriesByCount = (widget: IWidget, dataToSend: any, noOfCategories: number, noOfMeasures: number, specificMeasure: boolean) => {
    const measures = widget.columns.filter((column) => column.fieldType === 'MEASURE')
    const measureLength = noOfMeasures == -1 ? measures.length : noOfMeasures

    if (measures.length >= measureLength && !specificMeasure) {
        for (let index = 0; index < measureLength; index++) {
            const measure = measures[index]
            const measureToPush = { id: `${measure.alias}_${measure.aggregation}`, alias: `${measure.alias}_${measure.aggregation}`, columnName: measure.columnName, funct: measure.aggregation, orderColumn: measure.alias } as any
            measure.formula ? (measureToPush.formula = measure.formula) : ''
            dataToSend.aggregations.measures.push(measureToPush)
        }
    } else if (measures.length >= 1 && specificMeasure) {
        const specificMeasure = widget.settings.configuration.grouping.secondDimension.serie
        const measure = measures.filter((measure) => measure.columnName === specificMeasure)[0]
        if (measure) {
            const measureToPush = { id: `${measure.alias}_${measure.aggregation}`, alias: `${measure.alias}_${measure.aggregation}`, columnName: measure.columnName, funct: measure.aggregation, orderColumn: measure.alias } as any
            measure.formula ? (measureToPush.formula = measure.formula) : ''
            dataToSend.aggregations.measures.push(measureToPush)
        }
    }

    const categories = widget.columns.filter((column) => column.fieldType !== 'MEASURE')
    const categoryLength = noOfCategories == -1 ? categories.length : noOfCategories

    if (categories.length >= categoryLength) {
        for (let index = 0; index < categoryLength; index++) {
            const category = categories[index]
            const categoryToPush = { id: category.alias, alias: category.alias, columnName: category.columnName, orderType: category.orderType, funct: 'NONE' } as any
            dataToSend.aggregations.categories.push(categoryToPush)
        }
    }
}
