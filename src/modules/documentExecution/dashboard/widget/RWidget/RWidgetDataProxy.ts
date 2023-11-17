import { AxiosResponse } from 'axios'
import { addDriversToData, addParametersToData, addSelectionsToData, showGetDataError } from '@/modules/documentExecution/dashboard/DashboardDataProxy'
import { clearDatasetInterval } from '@/modules/documentExecution/dashboard/helpers/datasetRefresh/DatasetRefreshHelpers'
import { IDashboardDataset, IWidget, ISelection, IDashboardConfiguration } from '@/modules/documentExecution/dashboard/Dashboard'

export const getRData = async (dashboardId: any, dashboardConfig: IDashboardConfiguration, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const datasetIndex = datasets.findIndex((dataset: IDashboardDataset) => widget.dataset === dataset.id)
    const selectedDataset = datasets[datasetIndex]

    if (selectedDataset) {
        const url = `/restful-services/2.0/datasets/${selectedDataset.dsLabel}/data?offset=-1&size=-1&nearRealtime=true`

        const postData = formatRModelForGet(dashboardId, widget, selectedDataset, initialCall, selections, associativeResponseSelections)
        let tempResponse = null as any

        if (widget.dataset || widget.dataset === 0) clearDatasetInterval(widget.dataset)
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
            })

        const imgPostData = {
            dataset: selectedDataset.dsLabel,
            r_environment: widget.settings.editor.environment,
            output_variable: widget.settings.editor.outputName,
            drivers: JSON.stringify(postData.drivers), // sends stringified drivers, but Python doesnt?
            aggregations: JSON.stringify(postData.aggregations),
            parameters: JSON.stringify(postData.parameters),
            selections: JSON.stringify(postData.selections),
            script: widget.settings.editor.script
        }

        await $http
            .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/backendservices/widgets/RWidget/edit/${widget.settings.editor.outputType == 'img' ? 'img' : 'html'}`, imgPostData, { headers: { 'X-Disable-Errors': 'true' } })
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

const formatRModelForGet = (dashboardId: any, propWidget: IWidget, dataset: IDashboardDataset, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
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

    addSelectionsToData(dataToSend, propWidget, dataset.dsLabel, initialCall, selections, associativeResponseSelections)
    addDriversToData(dataset, dataToSend)
    addParametersToData(dataset, dashboardId, dataToSend)

    dataToSend.aggregations.dataset = dataset.dsLabel

    propWidget.columns.forEach((column) => {
        if (column.fieldType === 'MEASURE') {
            const measureToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, funct: column.aggregation, orderColumn: column.alias } as any
            column.formula ? (measureToPush.formula = column.formula) : ''
            dataToSend.aggregations.measures.push(measureToPush)
        } else {
            const attributeToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, orderType: '', funct: 'NONE' } as any
            dataToSend.aggregations.categories.push(attributeToPush)
        }
    })

    return dataToSend
}
