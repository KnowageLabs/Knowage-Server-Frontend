import { IDashboardDriver, IWidgetInteractionParameter, IWidgetPreview } from "../../Dashboard";
import { IChartInteractionValues } from "../../interfaces/chartJS/DashboardChartJSWidget";
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { getActiveSelectionByDatasetAndColumn } from "./InteractionHelper";

export const formatParameterForPreview = (event: any, parameter: any, widgetType: string, dashboardId: string) => {
    parameter.value = parameter.defaultValue ?? ''
    // console.log("---------- formatParameterForPreview() - event: ", event)
    // console.log("---------- formatParameterForPreview() - parameter: ", parameter)
    switch (widgetType) {
        case 'highcharts':
            executeChartPreview(parameter, event.formattedChartValues, event.previewSettings, dashboardId)
    }
}

export const executeChartPreview = (parameter: any, formattedChartValues: IChartInteractionValues, previewSettings: IWidgetPreview, dashboardId: string) => {
    console.log("---------- executeChartPreview() - formattedChartValues: ", formattedChartValues)
    console.log("---------- executeChartPreview() - previewSettings: ", previewSettings)
    const parameterSettings = previewSettings.parameters.find((tempParameter: IWidgetInteractionParameter) => tempParameter.name === parameter.name)
    if (!parameterSettings) return
    updateParameterValue(parameter, parameterSettings, null, formattedChartValues, dashboardId)
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
        // case 'dynamic':
        //     if (formattedColumnRow) formattedParametersUrl += getFormattedTableDynamicParameterUrl(tempParameter, formattedColumnRow, useAsResource)
        //     else if (formattedChartValues) formattedParametersUrl += getFormattedChartDynamicParameterUrl(tempParameter, formattedChartValues, useAsResource)
        //     break
        // case 'driver':
        //     formattedParametersUrl += getFormattedDriverParameterUrl(tempParameter, driversValuesMap, useAsResource)
        //   break
        case 'selection':
            updateParameterValueFromSelections(parameter, dashboardId)

    }
}

const updateStaticParameterValue = (parameter: any, parameterSettings: IWidgetInteractionParameter) => {
    parameter.value = parameterSettings.value
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

export const executeTablePreview = (formattedRow: any, previewSettings: IWidgetPreview) => {
    console.log("---------- executeTablePreview() - formattedRow: ", formattedRow)
    console.log("---------- executeTablePreview() - previewSettings: ", previewSettings)
}


export const executeHTMLWidgetPreview = (datasetLabel: string, previewSettings: IWidgetPreview) => {
    console.log("---------- executeHTMLWidgetPreview() - datasetLabel: ", datasetLabel)
    console.log("---------- executeHTMLWidgetPreview() - previewSettings: ", previewSettings)
}

export const executeCustomChartPreview = (columnValue: string | number, previewSettings: IWidgetPreview, dashboardId: string) => {
    console.log('---------- executeCustomChartPreview() - columnValue: ', columnValue)
    console.log('---------- executeCustomChartPreview() - previewSettings: ', previewSettings)
    console.log('---------- executeCustomChartPreview() - dashboardId: ', dashboardId)
}
