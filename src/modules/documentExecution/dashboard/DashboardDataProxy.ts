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
import { AxiosResponse } from 'axios'
import { setDatasetInterval, clearDatasetInterval } from './helpers/datasetRefresh/DatasetRefreshHelpers'
import { aggregationRegex, aggregationsRegex, limitRegex, rowsRegex } from './helpers/common/DashboardRegexHelper'
import { IDataset, ISelection, IVariable, IWidget, IDashboardDataset, IDashboardDatasetDriver, IWidgetSearch } from './Dashboard'
import { getTableWidgetData } from './widget/TableWidget/TableWidgetDataProxy'
import { getSelectorWidgetData } from './widget/SelectorWidget/SelectorWidgetDataProxy'
import { getWebComponentWidgetData } from './widget/WebComponent/WebComponentDataProxy'

const { t } = i18n.global
const mainStore = store()
const dashStore = dashboardStore()

export const getData = (item) =>
    new Promise((resolve) => {
        setTimeout(() => {
            resolve({ item, ...new Date() })
        }, 1000)
    })

export const getWidgetData = async (dashboardId: any, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], searchParams: IWidgetSearch, associativeResponseSelections?: any) => {
    console.group('getWidgetData ---------------------')
    console.log('dashboardId', dashboardId)
    console.log('widget', widget)
    console.log('datasets', datasets)
    // console.log('$http', $http)
    console.log('initialCall', initialCall)
    console.log('selections', selections)
    console.log('searchParams', searchParams)
    console.log('associativeResponseSelections', associativeResponseSelections)
    console.groupEnd()
    switch (widget.type) {
        case 'table':
            return await getTableWidgetData(dashboardId, widget, datasets, $http, initialCall, selections, searchParams, associativeResponseSelections)
        case 'selector':
            return await getSelectorWidgetData(dashboardId, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'html':
            return await getWebComponentWidgetData('html', dashboardId, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'text':
            return await getWebComponentWidgetData('text', dashboardId, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
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

export const addParametersToData = (dataset, dashboardId, dataToSend) => {
    if (dataset.parameters && dataset.parameters.length > 0) {
        const paramRegex = /[^$P{]+(?=\})/
        dataset.parameters.forEach((param: any) => {
            const matched = paramRegex.exec(param.value)
            if (matched && matched[0]) {
                const documentDrivers = dashStore.dashboards[dashboardId].drivers
                for (let index = 0; index < documentDrivers.length; index++) {
                    const driver = documentDrivers[index]
                    if (driver.urlName == matched[0]) {
                        dataToSend.parameters[`${param.name}`] = driver.value
                    }
                }
            } else dataToSend.parameters[`${param.name}`] = param.value
        })
    }
}

export const addSelectionsToData = (dataToSend: any, propWidget: IWidget, datasetLabel: string | undefined, initialCall: boolean, selections: ISelection[], associativeResponseSelections: any) => {
    if (associativeResponseSelections) {
        dataToSend.selections = associativeResponseSelections
    } else if (!initialCall) {
        dataToSend.selections = getFormattedSelections(selections)
    }
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
        if (column.filter.enabled && column.filter.operator) {
            const filterData = { filterOperator: column.filter.operator, filterVals: [`('${column.filter.value}')`] }
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
            selection[key].push(filter[key])
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
