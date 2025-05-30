import { AxiosResponse } from 'axios'
import { addDataToCache, addDriversToData, addFunctionColumnToTheMeasuresForThePostData, addParametersToData, addSelectionsToData, addVariablesToFormula, showGetDataError } from '@/modules/documentExecution/dashboard/DashboardDataProxy'
import { IDashboardDataset, IWidget, ISelection, IDashboardConfiguration, IWidgetFunctionColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { md5 } from 'js-md5'
import { indexedDB } from '@/idb'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

const dashStore = dashboardStore()

export const getPythonData = async (dashboardId: any, dashboardConfig: IDashboardConfiguration, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const datasetIndex = datasets.findIndex((dataset: IDashboardDataset) => widget.dataset === dataset.id)
    const selectedDataset = datasets[datasetIndex]

    if (selectedDataset) {
        const url = `/restful-services/2.0/datasets/${selectedDataset.dsLabel}/data?offset=-1&size=-1&nearRealtime=${!selectedDataset.cache}`

        const postData = formatPythonModelForGet(dashboardId, dashboardConfig, widget, selectedDataset, initialCall, selections, associativeResponseSelections)
        let tempResponse = null as any

        const dataHash = md5(JSON.stringify(postData))
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

        const imgPostData = {
            datasetLabel: selectedDataset.dsLabel,
            environmentLabel: widget.settings.editor.environment,
            outputVariable: widget.settings.editor.outputName,
            drivers: postData.drivers,
            aggregations: JSON.stringify(postData.aggregations),
            parameters: JSON.stringify(postData.parameters),
            selections: JSON.stringify(postData.selections),
            script: widget.settings.editor.script
        }

        await $http
            .post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/backendservices/widgets/python/edit/${widget.settings.editor.outputType == 'image' ? 'img' : 'html'}`, imgPostData, { headers: { 'X-Disable-Errors': 'true' } })
            .then((response: AxiosResponse<any>) => {
                tempResponse = response.data
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

const formatPythonModelForGet = (dashboardId: any, dashboardConfig: IDashboardConfiguration, propWidget: IWidget, dataset: IDashboardDataset, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
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

    addSelectionsToData(dataToSend, propWidget, dataset.dsLabel!, initialCall, selections, associativeResponseSelections)
    addDriversToData(dataset, dataToSend)
    addParametersToData(dataset, dashboardId, dataToSend, associativeResponseSelections)

    dataToSend.aggregations.dataset = dataset.dsLabel

    for (let i = 0; i < propWidget.columns.length; i++) {
        const column = propWidget.columns[i]
        if (column.fieldType === 'MEASURE') {
            if (column.type === 'pythonFunction') {
                addFunctionColumnToTheMeasuresForThePostData(dataToSend.aggregations.measures, column as IWidgetFunctionColumn)
                continue
            }
            const measureToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, funct: column.aggregation, orderColumn: column.alias } as any
            if (column.formula) measureToPush.formula = addVariablesToFormula(column, dashboardConfig)

            dataToSend.aggregations.measures.push(measureToPush)
        } else {
            const attributeToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, orderType: '', funct: 'NONE' } as any
            dataToSend.aggregations.categories.push(attributeToPush)
        }
    }

    return dataToSend
}
