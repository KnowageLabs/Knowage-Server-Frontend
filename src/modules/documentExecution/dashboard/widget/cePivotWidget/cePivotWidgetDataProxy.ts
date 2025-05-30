import { AxiosResponse } from 'axios'
import { addDataToCache, addDriversToData, addParametersToData, addSelectionsToData, addVariablesToFormula, hasFields, showGetDataError } from '@/modules/documentExecution/dashboard/DashboardDataProxy'
import { IDashboardDataset, IWidget, ISelection, IWidgetColumn, IDashboardConfiguration } from '@/modules/documentExecution/dashboard/Dashboard'
import { md5 } from 'js-md5'
import { indexedDB } from '@/idb'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

const dashStore = dashboardStore()

export const getCePivotData = async (dashboardId: any, dashboardConfig: IDashboardConfiguration, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
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

        const formattedPivotData = {
            config: {
                type: 'pivot'
            },
            metadata: tempResponse.metaData,
            jsonData: tempResponse.rows,
            sortOptions: {},
            name: widget.id,
            crosstabDefinition: {
                measures: widget.fields?.data.map((data: IWidgetColumn) => {
                    return {
                        id: data.columnName,
                        alias: data.alias,
                        funct: data.aggregation,
                        containerType: 'MEASURE-PT',
                        iconCls: 'measure',
                        nature: 'measure',
                        values: '[]',
                        width: 0,
                        sorterByColumns: [''],
                        showSortingAlert: false,
                        style: getFieldStyleStringById(data.id, widget)
                    }
                }),
                rows: widget.fields?.rows.map((row: IWidgetColumn) => {
                    return {
                        id: row.columnName,
                        alias: row.alias,
                        containerType: 'ROWS',
                        iconCls: 'attribute',
                        nature: 'attribute',
                        values: '[]',
                        width: 0,
                        sorterByColumns: [''],
                        showSortingAlert: false,
                        style: getFieldStyleStringById(row.id, widget)
                    }
                }),
                columns: widget.fields?.columns.map((column: IWidgetColumn) => {
                    return {
                        id: column.columnName,
                        alias: column.alias,
                        containerType: 'COLUMNS',
                        iconCls: 'attribute',
                        nature: 'attribute',
                        values: '[]',
                        width: 0,
                        sorterByColumns: [''],
                        showSortingAlert: false,
                        style: getFieldStyleStringById(column.id, widget)
                    }
                }),
                config: {
                    measureson: 'columns',
                    percenton: 'no',
                    rowsubtotalLabel: widget.settings.configuration.rows.subTotalLabel,
                    rowtotalLabel: widget.settings.configuration.rows.grandTotalLabel,
                    columnsubtotalLabel: widget.settings.configuration.columns.subTotalLabel,
                    columntotalLabel: widget.settings.configuration.columns.grandTotalLabel,
                    expandCollapseRows: false,
                    calculatetotalsonrows: widget.settings.configuration.rows.grandTotal,
                    calculatetotalsoncolumns: widget.settings.configuration.columns.grandTotal,
                    calculatesubtotalsoncolumns: widget.settings.configuration.columns.subTotal,
                    calculatesubtotalsonrows: widget.settings.configuration.rows.subTotal,
                    hideZeroRows: 'false'
                }
            },
            style: {},
            variables: {}
        }

        await $http
            .post(import.meta.env.VITE_KNOWAGECOCKPITENGINE_CONTEXT + '/api/1.0/crosstab/update', formattedPivotData, { headers: { 'X-Disable-Errors': 'true' } })
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

    for (const fieldsName in propWidget.fields) {
        const fields = propWidget.fields[fieldsName]
        fields.forEach((field) => {
            if (field.fieldType === 'MEASURE') {
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

const getFieldStyleStringById = (fieldId, widget) => {
    const fieldStyle = widget.settings.style.fields.styles.find((fieldStyle) => fieldStyle.target.includes(fieldId))
    if (fieldStyle) return fieldStyle.properties
    else return widget.settings.style.fields.styles[0].properties
}
