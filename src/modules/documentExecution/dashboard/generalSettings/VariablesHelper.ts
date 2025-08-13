import { fallbackLocale, getFormattedDateTimeUsingToLocaleString, getLocale } from '@/helpers/commons/localeHelper'
import { IDashboardDriver, IDataset, ISelection, IVariable } from '../Dashboard'
import { getVariableData } from '../DataProxyHelper'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { DateTime } from 'luxon'

export const setVariableValueFromDataset = async (variable: IVariable, datasets: IDataset[], $http: any) => {
    const variableData = await getVariableData(variable, datasets, $http)
    if (!variableData) return (variable.value = '')
    variable.column ? setVariableValueFromColumn(variable, variableData) : setVariablePivotedValues(variable, variableData)
}

const setVariableValueFromColumn = (variable: IVariable, variableData: any) => {
    const index = variableData.metaData?.fields.findIndex((field: any) => field.header?.toLowerCase() === variable.column?.toLowerCase())
    if (index === -1) return (variable.value = '')
    const columnName = variableData.metaData.fields[index].name
    variable.value = variableData.rows[0] ? variableData.rows[0][columnName] : ''
}

export const setVariablePivotedValues = async (variable: IVariable, variableData: any) => {
    variable.pivotedValues = getPivotedDataset(variableData)
}

const getPivotedDataset = (variableData: any) => {
    const pivotedDataset = {}
    variableData.rows?.forEach((row: any) => (pivotedDataset[row.column_1] = row.column_2))
    return pivotedDataset
}

export const getSelectedVariable = (variableName: string, variables: IVariable[]) => {
    if (!variables) return null
    const index = variables.findIndex((variable: IVariable) => variable.name === variableName)
    return index !== -1 ? variables[index] : null
}

export const setVariableValueFromDriver = (variable: IVariable, drivers: IDashboardDriver[]) => {
    if (variable.type !== 'driver') return
    const driver = drivers.find((driver: IDashboardDriver) => driver.urlName === variable.driver)
    variable.value = driver ? driver.value : ''
}

export const setVariableExectuionTimeValue = (variable: IVariable, dashboardId: string) => {
    const dashStore = dashboardStore()

    const executionTime = dashStore.getExecutionTime(dashboardId) as Date
    if (!executionTime) return

    const baseLocale = getLocale()?.split('_')[0] ?? fallbackLocale
    const executionTimeValue = getFormattedDateTimeUsingToLocaleString(variable.dateTimeFormat ?? 'LTS', DateTime.fromJSDate(executionTime).setLocale(baseLocale))
    variable.value = executionTimeValue
    variable.executionTime = executionTimeValue
}

export const setVairableExecutionDateValue = (variable: IVariable, dashboardId: string) => {
    const dashStore = dashboardStore()

    const executionTime = dashStore.getExecutionTime(dashboardId) as Date
    if (!executionTime) return

    const baseLocale = getLocale()?.split('_')[0] ?? fallbackLocale
    const executionTimeValue = getFormattedDateTimeUsingToLocaleString(variable.dateTimeFormat ?? 'LL', DateTime.fromJSDate(executionTime).setLocale(baseLocale))
    variable.value = executionTimeValue
    variable.executionDate = executionTimeValue
}

export const setVairableLocaleValue = (variable: IVariable) => {
    const locale = getLocale()
    if (!locale) return

    variable.value = locale
    variable.locale = locale
}

export const setVariableActiveSelectionValue = (variable: IVariable, dashboardId: string) => {
    const dashStore = dashboardStore()

    const activeSelections = dashStore.getSelections(dashboardId)
    variable.value = ''
    if (!variable.activeSelectionColumn || !activeSelections) return
    const selection = activeSelections.find((activeSelection: ISelection) => activeSelection.datasetId === variable.activeSelectionDataset && activeSelection.columnName === variable.activeSelectionColumn)
    if (selection) variable.value = selection.value.join(', ')
}
