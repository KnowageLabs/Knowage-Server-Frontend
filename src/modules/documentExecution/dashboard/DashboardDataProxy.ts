/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * this component serves as a hub for all widget's data proxies
 * it also serves to store common methods shared between different widgets
 * TODO: add the hash manager and the indexedDB manager (dexie?)
 */

import i18n from '@/App.i18n'
import deepcopy from 'deepcopy'
import store from '@/App.store.js'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { aggregationRegex, aggregationsRegex, limitRegex, rowsRegex } from './helpers/common/DashboardRegexHelper'
import { ISelection, IWidget, IDashboardDataset, IDashboardDatasetDriver, IWidgetSearch, IDashboardConfiguration, IWidgetFunctionColumn } from './Dashboard'
import { getTableWidgetData } from './widget/TableWidget/TableWidgetDataProxy'
import { getSelectorWidgetData } from './widget/SelectorWidget/SelectorWidgetDataProxy'
import { getWebComponentWidgetData } from './widget/WebComponent/WebComponentDataProxy'
import { getHighchartsWidgetData } from './widget/ChartWidget/Highcharts/HighchartsDataProxy'
import { getMapWidgetData } from './widget/MapWidget/MapWidgetDataProxy'
import { getPivotData } from '@/workspaces/PivotWidget/PivotWidgetDataProxy'
import { getDiscoveryWidgetData } from './widget/DiscoveryWidget/DiscoveryWidgetDataProxy'
import { getChartJSWidgetData } from './widget/ChartWidget/ChartJS/ChartJSDataProxy'
import { getCePivotData } from './widget/cePivotWidget/cePivotWidgetDataProxy'
import { getPythonData } from './widget/PythonWidget/PythonWidgetDataProxy'
import { indexedDB } from '@/idb'
import { luxonFormatDate } from '@/helpers/commons/localeHelper'

const { t } = i18n.global
const mainStore = store()

export const getData = (item) =>
    new Promise((resolve) => {
        setTimeout(() => {
            resolve({ item, ...new Date() })
        }, 1000)
    })

export const getWidgetData = async (dashboardId: any, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], searchParams: IWidgetSearch, dashboardConfig: IDashboardConfiguration, associativeResponseSelections?: any, resetPagination?: boolean) => {
    switch (widget.type) {
        case 'table':
            return await getTableWidgetData(dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, searchParams, associativeResponseSelections, resetPagination)
        case 'selector':
            return await getSelectorWidgetData(dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'html':
            return await getWebComponentWidgetData('html', dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'text':
            return await getWebComponentWidgetData('text', dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'highcharts':
            return await getHighchartsWidgetData(dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'chartJS':
            return await getChartJSWidgetData(dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'customchart':
            return await getTableWidgetData(dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'static-pivot-table':
            return await getPivotData(dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'ce-pivot-table':
            return await getCePivotData(dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'discovery':
            return await getDiscoveryWidgetData(dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'vega':
            return await getHighchartsWidgetData(dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'python':
            return await getPythonData(dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'map':
            return await getMapWidgetData(dashboardId, dashboardConfig, widget, datasets, initialCall, selections, associativeResponseSelections)
        default:
            break
    }
}

export const showGetDataError = (error: any, datasetLabel: string | undefined) => {
    let message = error.message
    if (error.message === '100') {
        message = t('dashboard.getDataError', { datasetLabel: datasetLabel })
    }
    mainStore.setError({ title: t('common.toast.errorTitle'), msg: message })
}

export const addDriversToData = (dataset, dataToSend) => {
    if (dataset.drivers && dataset.drivers.length > 0) {
        dataset.drivers.forEach((driver: IDashboardDatasetDriver) => {
            dataToSend.drivers[`${driver.urlName}`] = driver.parameterValue
        })
    }
}

const getFormattedDateParameter = (date: any, useDefaultFormat?: boolean): string => {
    const knowageStore = store()
    console.log('knowageStore', knowageStore)
    console.log('knowageStore.configurations', knowageStore.configurations)
    console.log('date format', knowageStore.configurations?.['SPAGOBI.DATE-FORMAT-SERVER.format'])

    const format = date instanceof Date ? undefined : 'dd/MM/yyyy'
    const formattedDate = luxonFormatDate(date, format, useDefaultFormat ? undefined : knowageStore.configurations?.['SPAGOBI.DATE-FORMAT-SERVER.format'])
    if (formattedDate === 'Invalid DateTime') {
        return luxonFormatDate(new Date(date), undefined, useDefaultFormat ? undefined : knowageStore.configurations?.['SPAGOBI.DATE-FORMAT-SERVER.format'])
    } else return formattedDate
}

export const addParametersToData = (dataset, dashboardId, dataToSend, associativeResponseSelections?) => {
    const dashStore = dashboardStore()

    if (dataset.parameters && dataset.parameters.length > 0) {
        const paramRegex = /[^$P{]+(?=\})/
        dataset.parameters.forEach((param: any) => {
            const matched = paramRegex.exec(param.value) //check if param is wrapped in $P{}, if it is, grab the value from drivers
            if (matched && matched[0]) {
                const documentDrivers = dashStore.dashboards[dashboardId].drivers || []
                for (let index = 0; index < documentDrivers.length; index++) {
                    const driver = documentDrivers[index]
                    if (driver.urlName == matched[0]) {
                        if (driver.type === 'DATE' && driver.value) driver.value = getFormattedDateParameter(driver.value)
                        if (typeof driver.value === 'string' && driver.multivalue) dataToSend.parameters[`${param.name}`] = driver.value.split(',').map((val) => val.trim())
                        else dataToSend.parameters[`${param.name}`] = driver.value
                    }
                }
            } else dataToSend.parameters[`${param.name}`] = param.value

            if (associativeResponseSelections && associativeResponseSelections[dataset.dsLabel]) {
                //associative selections should overwrite anything else, even drivers
                const paramKey = `$P{${param.name}}`
                if (associativeResponseSelections[dataset.dsLabel][paramKey]) {
                    const rawValue = associativeResponseSelections[dataset.dsLabel][paramKey][0]
                    const cleanValue = rawValue.replace(/[()'\s]/g, '')

                    dataToSend.parameters[param.name] = cleanValue
                }
            }
        })
    }
}

export const addVariablesToFormula = (column, dashboardConfig) => {
    const variableRegex = /\$V{([^}]+)}/g

    if (dashboardConfig.variables && dashboardConfig.variables.length > 0) {
        const parsedFormula = column.formula.replace(variableRegex, (match, p1) => {
            const matchObj = dashboardConfig.variables.find((obj) => obj.name === p1)
            // If matchObj exists, return its value; otherwise, return the original match
            return matchObj ? matchObj.value : match
        })
        return parsedFormula
    } else return column.formula
}

export const addSelectionsToData = (dataToSend: any, propWidget: IWidget, datasetLabel: string, initialCall: boolean, selections: ISelection[], associativeResponseSelections: any) => {
    if (associativeResponseSelections) dataToSend.selections = getFormattedAssociativeSelections(associativeResponseSelections, datasetLabel)
    else dataToSend.selections = getFormattedSelections(selections)

    if (datasetLabel) addFiltersToPostData(propWidget, dataToSend.selections, datasetLabel)
}

const getFormattedSelections = (selections: ISelection[]) => {
    const formattedSelections = {}
    selections?.forEach((selection: ISelection) => {
        const formattedFilterValues = selection.value.map((value: string | number) => "('" + value + "')")
        if (formattedSelections[selection.datasetLabel]) formattedSelections[selection.datasetLabel][selection.columnName] = formattedFilterValues
        else {
            const key = selection.columnName
            formattedSelections[selection.datasetLabel] = { [key]: formattedFilterValues }
        }
    })
    return formattedSelections
}

const getFormattedAssociativeSelections = (associativeResponseSelections: any, datasetLabel: string) => {
    if (!associativeResponseSelections || !associativeResponseSelections[datasetLabel]) return {}

    const datasetSelections = associativeResponseSelections[datasetLabel]
    const filteredSelections = {}

    Object.keys(datasetSelections).forEach((columnName) => {
        if (!columnName.startsWith('$P{')) filteredSelections[columnName] = datasetSelections[columnName]
    })

    return { [datasetLabel]: filteredSelections }
}

const addFiltersToPostData = (propWidget: IWidget, selectionsToSend: any, datasetLabel: string) => {
    const filters = getFilters(propWidget, datasetLabel)
    const filterKeys = filters ? Object.keys(filters) : []
    filterKeys.forEach((key: string) => {
        if (selectionsToSend[key]) {
            addFilterToSelection(selectionsToSend[key], filters[key])
        } else {
            selectionsToSend[key] = filters[key]
        }
    })
}
const getFilters = (propWidget: IWidget, datasetLabel: string) => {
    let columns = [] as any
    if (propWidget.type === 'static-pivot-table') {
        const modelFields = propWidget.fields
        columns = modelFields?.columns.concat(modelFields.rows, modelFields.data, modelFields.filters)
    } else columns = propWidget.columns

    const activeFilters = {} as any

    columns.forEach((column) => {
        if (column.filter && column.filter.enabled && column.filter.operator) {
            const filterData = { filterOperator: column.filter.operator, filterVals: [`('${column.filter.value}')`] }
            if (column.filter?.value2) filterData.filterVals.push(`('${column.filter.value2}')`)
            createNestedObject(activeFilters, [datasetLabel, column.columnName], filterData)
        }
    })

    return activeFilters
}
const createNestedObject = function (base, names, value) {
    const lastName = arguments.length === 3 ? names.pop() : false

    for (let i = 0; i < names.length; i++) {
        base = base[names[i]] = base[names[i]] || {}
    }
    if (lastName) base = base[lastName] = value

    return base
}
const addFilterToSelection = (selection: any, filter: any) => {
    const filterColumnKeys = filter ? Object.keys(filter) : []
    filterColumnKeys.forEach((key: string) => {
        if (selection[key]) {
            // Check if the same filter object already exists
            const isFilterObjectAlreadyPresent = selection[key].some((item: any) => {
                // Only check objects (filter objects), skip strings (selections)
                if (typeof item === 'object' && item.filterOperator && item.filterVals) {
                    return item.filterOperator === filter[key].filterOperator && JSON.stringify(item.filterVals) === JSON.stringify(filter[key].filterVals)
                }
                return false
            })

            // Only add the filter object if it's not already present
            if (!isFilterObjectAlreadyPresent) selection[key].push(filter[key])
        } else {
            selection[key] = filter[key]
        }
    })
}

export const maxRow = (widgetModel) => {
    if (!widgetModel) return

    const str = widgetModel.type == 'html' ? widgetModel.settings.editor.css + widgetModel.settings.editor.html : widgetModel.settings.editor.text
    let tempMaxRow = 1
    const repeaters = str.replace(limitRegex, function (match: string, p1: any) {
        if (parseInt(p1) == -1) tempMaxRow = -1
        else if (p1 > tempMaxRow) tempMaxRow = parseInt(p1) + 1
    })
    const occurrencies = str.replace(rowsRegex, function (match: string, p1: any, p2: any) {
        if (p2 >= tempMaxRow) tempMaxRow = parseInt(p2) + 1
    })
    return tempMaxRow
}

export const getAggregationsModel = (widgetModel, rawHtml) => {
    const aggregationsReg = rawHtml.match(aggregationsRegex)
    if (aggregationsReg) {
        const modelToSend = deepcopy(widgetModel)
        const tempModel = deepcopy(widgetModel)
        delete modelToSend.settings
        modelToSend.columns = []

        for (const a in aggregationsReg) {
            const aggregationReg = aggregationRegex.exec(aggregationsReg[a])
            for (const m in tempModel.columns) {
                if (aggregationReg && aggregationReg[1] && tempModel.columns[m].columnName == aggregationReg[1]) {
                    tempModel.columns[m].alias = aggregationReg[1] + '_' + aggregationReg[3]
                    tempModel.columns[m].fieldType = 'MEASURE'
                    tempModel.columns[m].aggregation = aggregationReg[3]
                    let exists = false
                    for (const c in modelToSend.columns) {
                        if (modelToSend.columns[c].alias == aggregationReg[1] + '_' + aggregationReg[3]) exists = true
                    }
                    if (!exists) modelToSend.columns.push(deepcopy(tempModel.columns[m]))
                }
            }
        }
        return modelToSend
    } else return null
}

export const hasFields = (propWidget: IWidget) => {
    const fields = propWidget.fields || ({} as any)

    if (fields.columns.length > 0 && fields.rows.length > 0 && fields.data.length > 0) return true
    else return false
}

export const addDataToCache = async (dataHash, tempResponse) => {
    try {
        const newDbData = { id: dataHash, data: tempResponse }
        await indexedDB.widgetData.add({ ...newDbData })
    } catch (error) {
        console.group('%c Failed to create IndexDB item.', 'color: red; background-color: #61dbfb')
        console.error(error)
        console.groupEnd()
    }
}

export const clearIndexedDBCache = () => {
    indexedDB.widgetData.clear()
}

export const addFunctionColumnToTheMeasuresForThePostData = (measures: any[], functionColumn: IWidgetFunctionColumn) => {
    const functionDataForPost = {
        id: functionColumn.id,
        alias: functionColumn.alias,
        catalogFunctionId: functionColumn.catalogFunctionId,
        catalogFunctionConfig: {
            inputColumns: functionColumn.catalogFunctionConfig?.inputColumns ?? [],
            inputVariables: functionColumn.catalogFunctionConfig?.inputVariables ?? [],
            outputColumns: functionColumn.catalogFunctionConfig?.outputColumns ?? [],
            environment: functionColumn.catalogFunctionConfig?.environment ?? ''
        },
        columnName: functionColumn.columnName,
        orderType: functionColumn.orderType ?? '',
        funct: functionColumn.funct,
        orderColumn: functionColumn.orderColumn
    }

    measures.push(functionDataForPost)
}
