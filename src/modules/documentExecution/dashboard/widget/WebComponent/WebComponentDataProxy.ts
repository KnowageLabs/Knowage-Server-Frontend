import { AxiosResponse } from 'axios'
import { IDashboardDataset, IWidget, ISelection } from '../../Dashboard'
import { addDriversToData, addParametersToData, addSelectionsToData, maxRow, showGetDataError, getAggregationsModel } from '../../DashboardDataProxy'
import { clearDatasetInterval } from '../../helpers/datasetRefresh/DatasetRefreshHelpers'

export const getWebComponentWidgetData = async (widgetType: 'html' | 'text', dashboardId: any, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const datasetIndex = datasets.findIndex((dataset: any) => widget.dataset === dataset.id)
    const selectedDataset = datasets[datasetIndex]

    if (selectedDataset && widget.settings.editor[widgetType]) {
        const valueToParse = widget.settings.editor[widgetType]
        const numOfRowsToGet = maxRow(widget)
        const url = `2.0/datasets/${selectedDataset.dsLabel}/data?offset=0&size=${numOfRowsToGet}&nearRealtime=true&limit=${numOfRowsToGet}`

        const aggregationsModel = getAggregationsModel(widget, valueToParse)
        let aggregationDataset = null as any
        if (aggregationsModel) {
            const aggregationsPostData = formatWebComponentModelForService(dashboardId, aggregationsModel, selectedDataset, initialCall, selections, associativeResponseSelections)
            await $http
                .post(import.meta.env.VITE_RESTFUL_SERVICES_PATH + url, aggregationsPostData, { headers: { 'X-Disable-Errors': 'true' } })
                .then((response: AxiosResponse<any>) => {
                    aggregationDataset = response.data
                })
                .catch((error: any) => {
                    showGetDataError(error, selectedDataset.dsLabel)
                })
        }

        const postData = formatWebComponentModelForService(null, widget, selectedDataset, initialCall, selections, associativeResponseSelections)
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
