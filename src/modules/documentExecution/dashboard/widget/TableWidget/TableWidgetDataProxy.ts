import { AxiosResponse } from 'axios'
import { IDashboardDataset, IWidget, IWidgetSearch, ISelection } from '../../Dashboard'
import { addDriversToData, addParametersToData, addSelectionsToData, showGetDataError } from '../../DashboardDataProxy'
import { clearDatasetInterval } from '../../helpers/datasetRefresh/DatasetRefreshHelpers'

export const getTableWidgetData = async (dashboardId: any, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], searchParams: IWidgetSearch, associativeResponseSelections?: any) => {
    const datasetIndex = datasets.findIndex((dataset: IDashboardDataset) => widget.dataset === dataset.id)
    const selectedDataset = datasets[datasetIndex] as IDashboardDataset

    const datasetLabel = selectedDataset.dsLabel as string

    const formattedLikeSelections = searchParams.searchColumns.toString()
    const formattedSelections = { [datasetLabel]: { [formattedLikeSelections]: searchParams.searchText } }

    if (selectedDataset) {
        let url = ''
        const pagination = widget.settings.pagination
        if (pagination.enabled) {
            url = `2.0/datasets/${selectedDataset.dsLabel}/data?offset=${pagination.properties.offset}&size=${pagination.properties.itemsNumber}&nearRealtime=true`
        } else url = `2.0/datasets/${selectedDataset.dsLabel}/data?offset=0&size=-1&nearRealtime=true`

        const postData = formatTableWidgetModelForService(dashboardId, widget, selectedDataset, initialCall, selections, associativeResponseSelections)
        if (searchParams.searchText != '' && searchParams.searchColumns.length > 0) postData.likeSelections = formattedSelections
        let tempResponse = null as any

        if (widget.dataset || widget.dataset === 0) clearDatasetInterval(widget.dataset)
        await $http
            .post(import.meta.env.VITE_RESTFUL_SERVICES_PATH + url, postData, { headers: { 'X-Disable-Errors': 'true' } })
            .then((response: AxiosResponse<any>) => {
                tempResponse = response.data
                if (pagination.enabled) widget.settings.pagination.properties.totalItems = response.data.results
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

const formatTableWidgetModelForService = (dashboardId: any, widget: IWidget, dataset: IDashboardDataset, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
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

    if (widget.settings.configuration.summaryRows.enabled) dataToSend.summaryRow = getSummaryRow(widget)
    if (widget.type === 'table') dataToSend.options = { solrFacetPivot: true } //if dataset is table solr, it needs this option

    widget.columns.forEach((column) => {
        if (column.fieldType === 'MEASURE') {
            const measureToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, funct: column.aggregation, orderColumn: column.alias, orderType: widget.settings?.sortingOrder } as any
            column.formula ? (measureToPush.formula = column.formula) : ''
            dataToSend.aggregations.measures.push(measureToPush)
        } else {
            const attributeToPush = { id: column.alias, alias: column.alias, columnName: column.columnName, orderType: '', funct: 'NONE' } as any
            //sort logic - if column is set as sorting column, change order type
            column.id === widget.settings.sortingColumn ? (attributeToPush.orderType = widget.settings.sortingOrder) : ''

            dataToSend.aggregations.categories.push(attributeToPush)
        }
    })

    return dataToSend
}

const getSummaryRow = (widget: IWidget) => {
    const summaryArray = [] as any
    const columns = widget.columns

    for (const k in widget.settings.configuration.summaryRows.list) {
        const measures = [] as any
        if (columns) {
            for (let i = 0; i < columns.length; i++) {
                const col = columns[i]
                if (col.fieldType != 'ATTRIBUTE') {
                    const obj = {}
                    obj['id'] = col.columnName || col.alias
                    obj['alias'] = col.alias || col.alias

                    if (widget.settings.configuration.summaryRows.list[k].aggregation == 'Columns Default Aggregation') obj['funct'] = col.aggregation
                    else obj['funct'] = widget.settings.configuration.summaryRows.list[k].aggregation || col.aggregation

                    if (col.formula) obj['formula'] = col.formula
                    else obj['columnName'] = col.columnName

                    measures.push(obj)
                }
            }
        }
        const result = {} as any
        result['measures'] = measures
        result['dataset'] = widget.dataset
        summaryArray.push(result)
    }

    return summaryArray
}
