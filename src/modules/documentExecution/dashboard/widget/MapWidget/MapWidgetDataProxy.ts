import { IDashboardConfiguration, IDashboardDataset, ISelection, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { addDriversToData, addParametersToData, addSelectionsToData, showGetDataError, addVariablesToFormula } from '../../DashboardDataProxy'
import { AxiosResponse } from 'axios'
import { clearDatasetInterval } from '../../helpers/datasetRefresh/DatasetRefreshHelpers'
import { IMapWidgetLayer } from '../../interfaces/mapWidget/DashboardMapWidget'

export const getMapWidgetData = async (dashboardId: any, dashboardConfig: any, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const tempResponse = {}
    const datasetOnly = widget.layers.filter((e) => e.type === 'dataset')
    const datasetsInWidget = datasetOnly.map((e) => e.name)
    const usedDatasets = datasets.filter((e) => datasetsInWidget.includes(e.dsLabel))

    for (const selectedDataset of usedDatasets) {
        const url = `/restful-services/2.0/datasets/${selectedDataset.dsLabel}/data?offset=0&size=-1&nearRealtime=true`

        const postData = formatMapModelForService(dashboardId, dashboardConfig, widget, selectedDataset, initialCall, selections, associativeResponseSelections)

        if (widget.dataset || widget.dataset === 0) clearDatasetInterval(widget.dataset)
        await $http
            .post(import.meta.env.VITE_KNOWAGE_CONTEXT + url, postData, { headers: { 'X-Disable-Errors': 'true' } })
            .then((response: AxiosResponse<any>) => {
                tempResponse[selectedDataset.dsLabel] = response.data
            })
            .catch((error: any) => {
                showGetDataError(error, selectedDataset.dsLabel)
            })
            .finally(() => {
                // TODO - uncomment when realtime dataset example is ready
                // resetDatasetInterval(widget)
            })
    }

    return tempResponse
}

const formatMapModelForService = (dashboardId: any, dashboardConfig: IDashboardConfiguration, widget: IWidget, dataset: IDashboardDataset, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
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
            if (column.formula) measureToPush.formula = addVariablesToFormula(column, dashboardConfig)

            dataToSend.aggregations.measures.push(measureToPush)
        } else {
            const attributeToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, orderType: '', funct: 'NONE' } as any
            column.id === widget.settings.sortingColumn ? (attributeToPush.orderType = widget.settings.sortingOrder) : ''

            dataToSend.aggregations.categories.push(attributeToPush)
        }
    })

    return dataToSend
}

// TODO - Function for retrieving layer Data
export const getLayerData = async (layer: IMapWidgetLayer, $http: any) => {
    const url = `/restful-services/layers/${layer.id}/download/${layer.layerType}`

    await $http
        .get(import.meta.env.VITE_KNOWAGE_CONTEXT + url, { headers: { 'X-Disable-Errors': 'true' } })
        .then((response: AxiosResponse<any>) => {
            console.log('-------- RESPONSE: ', response)
        })
        .catch((error: any) => {
            showGetDataError(error, '' + layer.id)
        })
}
