import { AxiosResponse } from 'axios'
import { addDriversToData, addParametersToData, addSelectionsToData, showGetDataError } from '@/modules/documentExecution/dashboard/DashboardDataProxy'
import { clearDatasetInterval } from '@/modules/documentExecution/dashboard/helpers/datasetRefresh/DatasetRefreshHelpers'
import { IDashboardDataset, IWidget, ISelection } from '@/modules/documentExecution/dashboard/Dashboard'

export const getDiscoveryWidgetData = async (dashboardId, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const datasetIndex = datasets.findIndex((dataset: IDashboardDataset) => widget.dataset === dataset.id)
    const selectedDataset = datasets[datasetIndex]

    if (selectedDataset) {
        let url = ''
        if (!widget.settings.pagination) {
            const pagination = { enabled: true, properties: { offset: 0, itemsNumber: 10, totalItems: null } }
            widget.settings.pagination = pagination
        }

        url = `2.0/datasets/${selectedDataset.dsLabel}/data?offset=${widget.settings.pagination.properties.offset}&size=${widget.settings.pagination.properties.itemsNumber}&nearRealtime=true`

        const postData = formatDiscoveryModelForGet(dashboardId, widget, selectedDataset, initialCall, selections, associativeResponseSelections)
        let tempResponse = null as any

        if (widget.dataset || widget.dataset === 0) clearDatasetInterval(widget.dataset)
        await $http
            .post(import.meta.env.VITE_RESTFUL_SERVICES_PATH + url, postData, { headers: { 'X-Disable-Errors': 'true' } })
            .then((response: AxiosResponse<any>) => {
                tempResponse = response.data
                if (widget.settings.pagination.enabled) widget.settings.pagination.properties.totalItems = response.data.results
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

const formatDiscoveryModelForGet = (dashboardId, propWidget: IWidget, dataset: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const dataToSend = {
        aggregations: {
            dataset: '',
            measures: [],
            categories: []
        },
        parameters: {},
        selections: {},
        drivers: {},
        indexes: [],
        likeSelections: {}
    } as any

    dataToSend.likeSelections[dataset.dsLabel] = {}
    dataToSend.aggregations.dataset = dataset.dsLabel

    addSelectionsToData(dataToSend, propWidget, dataset.dsLabel, initialCall, selections, associativeResponseSelections)
    addDriversToData(dataset, dataToSend)
    addParametersToData(dataset, dashboardId, dataToSend)

    propWidget.columns.forEach((column) => {
        if (column.fieldType === 'MEASURE') {
            const measureToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, funct: 'NONE', orderColumn: column.alias, functColumn: column.alias, orderType: '' } as any
            column.formula ? (measureToPush.formula = column.formula) : ''
            dataToSend.aggregations.measures.push(measureToPush)
        } else {
            const attributeToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, orderType: '', funct: 'COUNT', functColumn: column.alias } as any
            dataToSend.aggregations.categories.push(attributeToPush)
        }
    })

    const searchWordSettings = propWidget.settings.search
    if (searchWordSettings.enabled && searchWordSettings.searchWord && searchWordSettings.columns.length > 0) {
        const searchPropName = searchWordSettings.columns.join(',')
        dataToSend.likeSelections[dataset.dsLabel][searchPropName] = searchWordSettings.searchWord.trim()
    }

    const facetSearchParams = propWidget.settings.search.facetSearchParams
    if (facetSearchParams) {
        const facetKeys = Object.keys(facetSearchParams)
        if (facetKeys.length > 0) {
            facetKeys.forEach((facetName) => {
                dataToSend.likeSelections[dataset.dsLabel][facetName] = facetSearchParams[facetName][0]
            })
        }
    }

    return dataToSend
}
