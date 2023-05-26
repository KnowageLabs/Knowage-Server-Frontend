// import { AxiosResponse } from 'axios'
// import { clearDatasetInterval } from '../../../helpers/datasetRefresh/DatasetRefreshHelpers'
import { IDashboardDataset, IWidget, ISelection } from '../../../Dashboard'
// import { addDriversToData, addParametersToData, addSelectionsToData, showGetDataError } from '../../../DashboardDataProxy'
import { getHighchartsBarData } from './dataProxy/HighchartsBarDataProxy'

export const getHighchartsWidgetData = async (dashboardId, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const chartType = widget.settings.chartModel?.model?.chart.type
    console.log('chartType', chartType)
    switch (chartType) {
        case 'line':
        case 'area':
        case 'bar':
        case 'column':
            return await getHighchartsBarData(dashboardId, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        default:
            return ''
    }
}

// export const getHighchartsWidgetData = async (dashboardId, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
//     const datasetIndex = datasets.findIndex((dataset: IDashboardDataset) => widget.dataset === dataset.id)
//     const selectedDataset = datasets[datasetIndex]

//     if (selectedDataset) {
//         const url = `2.0/datasets/${selectedDataset.dsLabel}/data?offset=-1&size=-1&nearRealtime=true`

//         const postData = formatChartWidgetForGet(dashboardId, widget, selectedDataset, initialCall, selections, associativeResponseSelections)
//         let tempResponse = null as any

//         if (widget.dataset || widget.dataset === 0) clearDatasetInterval(widget.dataset)
//         await $http
//             .post(import.meta.env.VITE_RESTFUL_SERVICES_PATH + url, postData, { headers: { 'X-Disable-Errors': 'true' } })
//             .then((response: AxiosResponse<any>) => {
//                 tempResponse = response.data
//                 tempResponse.initialCall = initialCall
//             })
//             .catch((error: any) => {
//                 showGetDataError(error, selectedDataset.dsLabel)
//             })
//             .finally(() => {
//                 // TODO - uncomment when realtime dataset example is ready
//                 // resetDatasetInterval(widget)
//             })
//         return tempResponse
//     }
// }

// const formatChartWidgetForGet = (dashboardId: any, widget: IWidget, dataset: IDashboardDataset, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
//     const dataToSend = {
//         aggregations: {
//             dataset: '',
//             measures: [],
//             categories: []
//         },
//         parameters: {},
//         selections: {},
//         drivers: {},
//         indexes: []
//     } as any

//     dataToSend.aggregations.dataset = dataset.dsLabel

//     addSelectionsToData(dataToSend, widget, dataset.dsLabel, initialCall, selections, associativeResponseSelections)
//     addDriversToData(dataset, dataToSend)
//     addParametersToData(dataset, dashboardId, dataToSend)

//     widget.columns.forEach((column) => {
//         if (column.fieldType === 'MEASURE') {
//             const measureToPush = { id: `${column.alias}_${column.aggregation}`, alias: `${column.alias}_${column.aggregation}`, columnName: column.columnName, funct: column.aggregation, orderColumn: column.alias } as any
//             column.formula ? (measureToPush.formula = column.formula) : ''
//             dataToSend.aggregations.measures.push(measureToPush)
//         } else {
//             const attributeToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, orderType: '', funct: 'NONE' } as any
//             dataToSend.aggregations.categories.push(attributeToPush)
//         }
//     })

//     return dataToSend
// }
