import { IDashboardConfiguration, IDashboardDataset, ISelection, IWidget, IWidgetFunctionColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { addDriversToData, addParametersToData, addSelectionsToData, showGetDataError, addVariablesToFormula, addFunctionColumnToTheMeasuresForThePostData } from '../../DashboardDataProxy'
import { AxiosResponse } from 'axios'
import { clearDatasetInterval } from '../../helpers/datasetRefresh/DatasetRefreshHelpers'
import { IMapWidgetLayer, IWidgetMapLayerColumn } from '../../interfaces/mapWidget/DashboardMapWidget'
import axios from 'axios'
import mockedDataset from './mockedDataset.json'
import mockedPolygonDataset from './mockedPolygonDataset.json'

export const getMapWidgetData = async (dashboardId: any, dashboardConfig: any, widget: IWidget, datasets: IDashboardDataset[], initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const tempResponse = {}
    const datasetOnly = widget.layers.filter((e) => e.type === 'dataset')
    const datasetsInWidget = datasetOnly.map((e) => e.name)
    const usedDatasets = datasets.filter((e) => datasetsInWidget.includes(e.dsLabel))

    for (const selectedDataset of usedDatasets) {
        const url = `/restful-services/2.0/datasets/${selectedDataset.dsLabel}/data?offset=0&size=-1&nearRealtime=true`

        const postData = formatMapModelForService(dashboardId, dashboardConfig, widget, selectedDataset, initialCall, selections, associativeResponseSelections)

        if (widget.dataset || widget.dataset === 0) clearDatasetInterval(widget.dataset)
        // TODO - Remove mock and uncomment BE call
        await axios
            .post(import.meta.env.VITE_KNOWAGE_CONTEXT + url, postData, { headers: { 'X-Disable-Errors': 'true' } })
            .then((response: AxiosResponse<any>) => {
                if (selectedDataset.dsLabel) tempResponse[selectedDataset.dsLabel] = response.data
            })
            .catch((error: any) => {
                showGetDataError(error, selectedDataset.dsLabel)
            })
            .finally(() => {
                // TODO - uncomment when realtime dataset example is ready
                // resetDatasetInterval(widget)
            })

        // if (selectedDataset.dsLabel) tempResponse[selectedDataset.dsLabel] = mockedDataset
        // if (selectedDataset.dsLabel) tempResponse[selectedDataset.dsLabel] = mockedPolygonDataset
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

    addSelectionsToData(dataToSend, widget, dataset.dsLabel!, initialCall, selections, associativeResponseSelections)
    addDriversToData(dataset, dataToSend)
    addParametersToData(dataset, dashboardId, dataToSend, associativeResponseSelections)

    const datasetWithColumns = widget.layers.find((layer: IMapWidgetLayer) => layer.name === dataset.dsLabel)

    for (let i = 0; i < datasetWithColumns.columns.length; i++) {
        const column = datasetWithColumns.columns[i]

        if (column.fieldType === 'MEASURE') {
            if (column.type === 'pythonFunction') {
                addFunctionColumnToTheMeasuresForThePostData(dataToSend.aggregations.measures, column as any)
                continue
            }
            const measureToPush = { id: column.alias, alias: column.alias, columnName: column.name, funct: column.aggregationSelected, orderColumn: column.alias, orderType: widget.settings?.sortingOrder } as any
            if (column.formula) measureToPush.formula = addVariablesToFormula(column, dashboardConfig)

            dataToSend.aggregations.measures.push(measureToPush)
        } else {
            const attributeToPush = { id: column.alias, alias: column.alias, columnName: column.name, orderType: '', funct: 'NONE' } as any
            column.id === widget.settings.sortingColumn ? (attributeToPush.orderType = widget.settings.sortingOrder) : ''

            dataToSend.aggregations.categories.push(attributeToPush)
        }
    }

    return dataToSend
}

export const getLayerData = async (layer: IMapWidgetLayer) => {
    let tempResponse = null as any
    const type = layer.layerType === 'wkt' ? 'wkt' : 'file'
    await axios
        .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/layers/${layer.id}/download/${type}`, { headers: { 'X-Disable-Errors': 'true' } })
        .then((response: AxiosResponse<any>) => (tempResponse = response.data))
        .catch((error: any) => {
            showGetDataError(error, '' + layer.id)
        })
    return tempResponse
}

export const getPropertiesByLayerId = async (layerId: number) => {
    let properties = [] as any[]
    await axios
        .get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/layers/getFilter?id=${layerId}`)
        .then((response: AxiosResponse<any>) => (properties = response.data))
        .catch((error: any) => {
            showGetDataError(error, '' + layerId)
        })
    return properties
}
