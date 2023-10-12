import { getChartDynamicParameterValue } from './InteractionLinkHelper';
import { IDashboardDriver, IWidgetInteractionParameter } from "../../Dashboard";
import { IChartInteractionValues } from "../../interfaces/chartJS/DashboardChartJSWidget";
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { getActiveSelectionByDatasetAndColumn } from "./InteractionHelper";

export const formatParameterForPreview = (event: any, parameter: any, widgetType: string, dashboardId: string) => {
    parameter.value = parameter.defaultValue ?? ''
    const parameterSettings = event.previewSettings.parameters.find((tempParameter: IWidgetInteractionParameter) => tempParameter.name === parameter.name)
    if (!parameterSettings || !parameterSettings.enabled) return
    switch (widgetType) {
        case 'highcharts':
            formatChartParameterValue(parameter, parameterSettings, event.formattedChartValues, dashboardId)
            break
        case 'table':
        case 'discovery':
            formatTableParameterValue(parameter, parameterSettings, event.formattedRow, dashboardId)
            break
        case 'html':
            formatHTMLWidgetParameterValue(parameter, parameterSettings, event.datasetLabel, dashboardId)
            break;
        case 'customchart':
            formatCustomChartParameterValue(parameter, parameterSettings, event.columnValue, dashboardId)
    }
}

const formatChartParameterValue = (parameter: any, parameterSettings: IWidgetInteractionParameter, formattedChartValues: IChartInteractionValues, dashboardId: string) => {
    updateParameterValue(parameter, parameterSettings, null, formattedChartValues, dashboardId)
}


const formatTableParameterValue = (parameter: any, parameterSettings: IWidgetInteractionParameter, formattedRow: any, dashboardId: string) => {
    updateParameterValue(parameter, parameterSettings, formattedRow, null, dashboardId)
}

const formatHTMLWidgetParameterValue = (parameter: any, parameterSettings: IWidgetInteractionParameter, datasetLabel: string, dashboardId: string) => {
    updateParameterValue(parameter, parameterSettings, null, null, dashboardId)
}

const formatCustomChartParameterValue = (parameter: any, parameterSettings: IWidgetInteractionParameter, columnValue: string | number, dashboardId: string) => {
    updateParameterValue(parameter, parameterSettings, null, null, dashboardId)
}


const updateParameterValue = (parameter: any, parameterSettings: IWidgetInteractionParameter, formattedColumnRow: any, formattedChartValues: IChartInteractionValues | null, dashboardId: string) => {
    const dashStore = dashboardStore()
    const drivers = dashStore.getDashboardDrivers(dashboardId)
    const driversValuesMap = getFormattedDriverValuesMap(drivers)
    parameter.modelType = parameterSettings.type
    switch (parameterSettings.type) {
        case 'static':
            updateStaticParameterValue(parameter, parameterSettings)
            break
        case 'dynamic':
            parameter.columnName = parameterSettings.column
            if (formattedColumnRow) getFormattedTableDynamicParameterUrl(parameter, parameterSettings, formattedColumnRow)
            else if (formattedChartValues) getFormattedChartDynamicParameterUrl(parameter, parameterSettings, formattedChartValues)
            break
        case 'driver':
            updateParameterValueFromDriver(parameter, parameterSettings, driversValuesMap)
            break
        case 'selection':
            updateParameterValueFromSelections(parameter, dashboardId)

    }
}

const updateStaticParameterValue = (parameter: any, parameterSettings: IWidgetInteractionParameter) => {
    parameter.value = parameterSettings.value
}

const getFormattedTableDynamicParameterUrl = (parameter: IWidgetInteractionParameter, parameterSettings: IWidgetInteractionParameter, formattedRow: any) => {
    let columnValue = ''
    if (parameterSettings.column === 'column_name_mode') parameterSettings = formattedRow.columnName
    else if (parameterSettings.column) columnValue = formattedRow[parameterSettings.column].value
    parameter.value = columnValue ?? ''
}

const getFormattedChartDynamicParameterUrl = (parameter: IWidgetInteractionParameter, parameterSettings: IWidgetInteractionParameter, formattedChartValues: IChartInteractionValues | null) => {
    const columnValue = getChartDynamicParameterValue(formattedChartValues, parameter.column ?? '')
    parameter.value = columnValue ?? ''
}

const updateParameterValueFromDriver = (parameter: any, parameterSettings: IWidgetInteractionParameter, driversValuesMap: any) => {
    if (!parameterSettings.driver || !driversValuesMap[parameterSettings.driver]) return
    else parameter.value = driversValuesMap[parameter.driver].value
}


const updateParameterValueFromSelections = (parameter: any, dashboardId: string) => {
    const dashStore = dashboardStore()
    const activeSelections = dashStore.getSelections(dashboardId)
    const activeSelection = getActiveSelectionByDatasetAndColumn(parameter.dataset, parameter.column, activeSelections)
    parameter.value = activeSelection ? activeSelection.value : ''
}

const getFormattedDriverValuesMap = (drivers: IDashboardDriver[]) => {
    if (!drivers) return {}
    const driversValuesMap = {}
    drivers.forEach((driver: IDashboardDriver) => driversValuesMap[driver.urlName] = { value: driver.value, multivalue: driver.multivalue })
    return driversValuesMap
}