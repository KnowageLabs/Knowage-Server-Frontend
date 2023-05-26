import { AxiosResponse } from 'axios'
import { clearDatasetInterval } from '@/modules/documentExecution/dashboard/helpers/datasetRefresh/DatasetRefreshHelpers'
import { IDashboardDataset, IWidget, ISelection } from '@/modules/documentExecution/dashboard/Dashboard'
import { addDriversToData, addParametersToData, addSelectionsToData, showGetDataError } from '@/modules/documentExecution/dashboard/DashboardDataProxy'

export const getHighchartsBarData = async (dashboardId, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const datasetIndex = datasets.findIndex((dataset: IDashboardDataset) => widget.dataset === dataset.id)
    const selectedDataset = datasets[datasetIndex]

    if (selectedDataset) {
        const url = `2.0/datasets/${selectedDataset.dsLabel}/data?offset=-1&size=-1&nearRealtime=true`

        const postData = formatChartWidgetForGet(dashboardId, widget, selectedDataset, initialCall, selections, associativeResponseSelections)
        let tempResponse = null as any

        if (widget.dataset || widget.dataset === 0) clearDatasetInterval(widget.dataset)
        await $http
            .post(import.meta.env.VITE_RESTFUL_SERVICES_PATH + url, postData, { headers: { 'X-Disable-Errors': 'true' } })
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
            })
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
        // We take first measure, exactly 2 attribute/category
        console.log('COND 1 ---------------- first measure, exactly 2 attribute/category')
        addMeasuresAndCategoriesByCount(widget, dataToSend, 1, 2, false)
    } else if (widget.settings.configuration?.grouping?.secondSeries.enabled) {
        console.log('COND 2 ---------------- exactly 2 measures, exactly 1 attribute/category')
        // We take exactly 2 measures, exactly 1 attribute/category
        addMeasuresAndCategoriesByCount(widget, dataToSend, 2, 1, false)
    } else if (widget.settings.configuration?.grouping?.secondDimension.enabled) {
        console.log('COND 3 ---------------- exactly 1 measure (chosen from dropdown), exactly 2 attribute/category')
        // TODO - We take exactly 1 measure (chosen from dropdown), exactly 2 attribute/category
        addMeasuresAndCategoriesByCount(widget, dataToSend, 1, 2, true)
    } else {
        console.log('COND 4 ---------------- all measures, first attribute/category')
        // TODO - We take all measures, first attribute/category
        addMeasuresAndCategoriesByCount(widget, dataToSend, -1, 1, false)
    }

    return dataToSend
}

const addMeasuresAndCategoriesByCount = (widget: IWidget, dataToSend: any, noOfMeasures: number, noOfCategories: number, specificMeasure: boolean) => {
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

    console.group(`%c MEASURES `, 'background: #222; color: #bada55')
    console.log(dataToSend.aggregations.measures)
    console.groupEnd()

    const categories = widget.columns.filter((column) => column.fieldType !== 'MEASURE')
    const categoryLength = noOfCategories == -1 ? measures.length : noOfCategories

    if (categories.length >= categoryLength) {
        for (let index = 0; index < categoryLength; index++) {
            const category = categories[index]
            const categoryToPush = { id: category.alias, alias: category.alias, columnName: category.columnName, orderType: '', funct: 'NONE' } as any
            dataToSend.aggregations.categories.push(categoryToPush)
        }
    }

    console.group(`%c CATEGORIES `, 'background: #222; color: #bada55')
    console.log(dataToSend.aggregations.categories)
    console.groupEnd()
}
