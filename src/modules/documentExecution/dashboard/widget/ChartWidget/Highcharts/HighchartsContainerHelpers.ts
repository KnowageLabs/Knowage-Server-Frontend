import { IDashboardDriver, IVariable, IWidgetCrossNavigation, IWidgetInteractionParameter } from "../../../Dashboard";
import { IChartInteractionValues } from "../../../interfaces/chartJS/DashboardChartJSWidget";
import { IHighchartsAdvancedPropertySettings } from '@/modules/documentExecution/dashboard/interfaces/DashboardHighchartsWidget'
import i18n from '@/App.i18n'
import store from '@/App.store.js'
import { replaceDriversPlaceholdersByDriverUrlName, replaceVariablesPlaceholdersByVariableName } from "../../interactionsHelpers/InteractionsParserHelper";

const { t } = i18n.global
const mainStore = store()

export const formatForCrossNavigation = (chartEvent: any, crossNavigationOptions: IWidgetCrossNavigation, dataToShow: any, chartType: string) => {
    if (!chartEvent.point) return []
    const formattedChartValues = getFormattedChartValues(chartEvent, dataToShow, chartType)
    const formattedOutputParameters = getFormattedOutputParameters(formattedChartValues, crossNavigationOptions.parameters)
    return formattedOutputParameters

}

export const getFormattedChartValues = (chartEvent: any, dataToShow: any, chartType: string) => {
    const categoryName = dataToShow?.metaData?.fields[1] ? dataToShow.metaData.fields[1].header : ''
    const chartPoint = chartEvent.point

    const formattedChartValues = { serieName: getSerieNameForCrossNavigation(chartPoint, chartType, dataToShow), serieValue: getSerieValueForCrossNavigation(chartPoint, chartType), categoryName: categoryName, categoryValue: getCategoryValueForCrossNavigation(chartPoint, chartType) } as IChartInteractionValues
    if (chartType === 'heatmap') {
        const groupingName = dataToShow?.metaData?.fields[2] ? dataToShow.metaData.fields[2].header : ''
        formattedChartValues.groupingName = groupingName
        formattedChartValues.groupingValue = chartPoint.options.groupingValue
    }
    return formattedChartValues
}

const getSerieNameForCrossNavigation = (chartPoint: any, chartType: string, dataToShow: any) => {
    if (['pictorial'].includes(chartType)) return dataToShow?.metaData?.fields[2] ? dataToShow?.metaData?.fields[2].header : ''
    if (['spline'].includes(chartType)) return chartPoint.category
    else return chartPoint.series.name
}

const getSerieValueForCrossNavigation = (chartPoint: any, chartType: string,) => {
    if (['pie', 'radar', 'area', 'bar', 'column', 'line', 'bubble', 'spline', 'funnel'].includes(chartType)) return chartPoint.options.y
    else if (['dependencywheel', 'pictorial', 'sankey'].includes(chartType)) return chartPoint.options.y ?? chartPoint.options.weight
    else if (['treemap'].includes(chartType)) return chartPoint.value
    else if (['dumbbell'].includes(chartType)) return chartPoint.options.high
    else return chartPoint.options.value
}

const getCategoryValueForCrossNavigation = (chartPoint: any, chartType: string) => {
    if (['dependencywheel', 'sankey'].includes(chartType)) return chartPoint.options.id ?? chartPoint.options.from
    else if (['spline', 'pictorial'].includes(chartType)) return chartPoint.series.name
    else return chartPoint.options.name
}

const getFormattedOutputParameters = (formattedChartValues: IChartInteractionValues, outputParameters: IWidgetInteractionParameter[]) => {
    const formattedOutputParameters = [] as IWidgetInteractionParameter[]
    outputParameters.forEach((outputParameter: IWidgetInteractionParameter) => {
        if (outputParameter.type === 'dynamic') {
            formattedOutputParameters.push(getFormattedDynamicOutputParameter(formattedChartValues, outputParameter))
        } else {
            formattedOutputParameters.push(outputParameter)
        }
    })
    return formattedOutputParameters
}

export const getFormattedDynamicOutputParameter = (formattedChartValues: IChartInteractionValues, outputParameter: IWidgetInteractionParameter) => {
    let value = ''
    switch (outputParameter.column) {
        case "SERIE_NAME":
            value = formattedChartValues.serieName;
            break
        case "SERIE_VALUE":
            value = formattedChartValues.serieValue;
            break
        case "CATEGORY_NAME":
            value = formattedChartValues.categoryName;
            break
        case "CATEGORY_VALUE":
            value = formattedChartValues.categoryValue;
            break
        case "GROUPING_NAME":
            value = formattedChartValues.groupingName as string;
            break
        case "GROUPING_VALUE":
            value = formattedChartValues.groupingValue as string;
            break
    }
    return { ...outputParameter, value: value }
}

export const applyAdvancedSettingsToModelForRender = (modelToRender: any, advancedChartSettings: IHighchartsAdvancedPropertySettings[] | null) => {
    if (!advancedChartSettings) return
    advancedChartSettings.forEach((propertySettings: IHighchartsAdvancedPropertySettings) => {
        if (propertySettings.propertyPath) setPropertyValueToChartModel(modelToRender, propertySettings)
    })
}

const setPropertyValueToChartModel = (modelToRender: any, propertySettings: IHighchartsAdvancedPropertySettings) => {
    const properties = propertySettings.propertyPath.split(/\.|\[|\]/).filter(Boolean);
    let currentModelToRender = modelToRender

    for (let i = 0; i < properties.length; i++) {
        const property = properties[i];

        if (Array.isArray(currentModelToRender) && /^\d+$/.test(property)) {
            const index = parseInt(property, 10);
            if (index >= currentModelToRender.length) {
                mainStore.setError({ title: t('common.toast.errorTitle'), msg: t('dashboard.widgetEditor.highcharts.advancedSettingsErrorArrayIndexOutOfBounds', { property: properties }) })
                break;
            }
        }

        if (property in currentModelToRender) {
            if (i === properties.length - 1) {
                currentModelToRender[property] = getFormattedPropertyValue(propertySettings.propertyValue);
            } else {
                currentModelToRender = currentModelToRender[property];
            }
        } else {
            if (i === properties.length - 1) {
                currentModelToRender[property] = getFormattedPropertyValue(propertySettings.propertyValue);
            } else {
                currentModelToRender[property] = /^\d+$/.test(properties[i + 1]) ? [] : {};
                currentModelToRender = currentModelToRender[property];
            }
        }
    }
}

const getFormattedPropertyValue = (propertyValue: string) => {
    switch (propertyValue.trim()) {
        case 'true':
            return true;
        case 'false':
            return false;
        default:
            return propertyValue
    }
}

export const formatChartAnnotations = (modelToRender: any, variables: IVariable[], drivers: IDashboardDriver[]) => {
    for (let i = modelToRender.annotations[0].labels.length - 1; i >= 0; i--) {
        const label = modelToRender.annotations[0].labels[i]
        label.text = replaceVariablesPlaceholdersByVariableName(label.text, variables)
        label.text = replaceDriversPlaceholdersByDriverUrlName(label.text, drivers)
        if (!label.text?.trim()) modelToRender.annotations[0].labels.splice(i, 1)
    }
}
