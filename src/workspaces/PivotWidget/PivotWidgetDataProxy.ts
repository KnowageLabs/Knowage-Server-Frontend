import { addDataToCache, addDriversToData, addFunctionColumnToTheMeasuresForThePostData, addParametersToData, addSelectionsToData, addVariablesToFormula, hasFields, showGetDataError } from '@/modules/documentExecution/dashboard/DashboardDataProxy'
import { IDashboardDataset, IWidget, ISelection, IDashboardConfiguration, IWidgetFunctionColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { md5 } from 'js-md5'
import { indexedDB } from '@/idb'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

const dashStore = dashboardStore()

export const getPivotData = async (dashboardId: any, dashboardConfig: IDashboardConfiguration, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const datasetIndex = datasets.findIndex((dataset: IDashboardDataset) => widget.dataset === dataset.id)
    const selectedDataset = datasets[datasetIndex]

    if (selectedDataset && hasFields(widget)) {
        const url = `/restful-services/2.0/datasets/${selectedDataset.dsLabel}/data?offset=-1&size=-1&nearRealtime=${!selectedDataset.cache}`

        const postData = formatPivotModelForGet(dashboardId, dashboardConfig, widget, selectedDataset, initialCall, selections, associativeResponseSelections)
        let tempResponse = null as any

        const dataHash = md5(JSON.stringify(postData))
        const cachedData = await indexedDB.widgetData.get(dataHash)

        if (dashStore.dataProxyQueue[dataHash]) {
            const response = await dashStore.dataProxyQueue[dataHash]
            return response.data
        }

        if (dashboardConfig.menuWidgets.enableCaching && cachedData && cachedData.data) {
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

const formatPivotModelForGet = (dashboardId: any, dashboardConfig: IDashboardConfiguration, propWidget: IWidget, dataset: IDashboardDataset, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
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
    dataToSend.options = { solrFacetPivot: true }

    for (const fieldsName in propWidget.fields) {
        const fields = propWidget.fields[fieldsName]
        fields.forEach((field) => {
            if (field.fieldType === 'MEASURE') {
                if (field.type === 'pythonFunction') {
                    addFunctionColumnToTheMeasuresForThePostData(dataToSend.aggregations.measures, field as IWidgetFunctionColumn)
                    return
                }
                const measureToPush = { id: field.alias, alias: field.alias, columnName: field.columnName, funct: field.aggregation, orderColumn: field.alias } as any
                if (field.formula) measureToPush.formula = addVariablesToFormula(field, dashboardConfig)

                dataToSend.aggregations.measures.push(measureToPush)
            } else {
                const attributeToPush = { id: field.alias, alias: field.alias, columnName: field.columnName, orderType: '', funct: 'NONE' } as any
                dataToSend.aggregations.categories.push(attributeToPush)
            }
        })
    }

    return dataToSend
}
