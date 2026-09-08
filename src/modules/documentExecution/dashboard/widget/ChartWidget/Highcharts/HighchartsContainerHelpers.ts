import { IDashboardDriver, IVariable, IWidget, IWidgetCrossNavigation, IWidgetInteractionParameter } from '../../../Dashboard'
import { IChartInteractionValues } from '../../../interfaces/chartJS/DashboardChartJSWidget'
import i18n from '@/App.i18n'
import store from '@/App.store.js'
import { replaceDriversPlaceholdersByDriverUrlName, replaceVariablesPlaceholdersByVariableName } from '../../interactionsHelpers/InteractionsParserHelper'
import { IHighchartsAdvancedPropertySettings } from '../../../interfaces/highcharts/DashboardHighchartsWidget'
import { showDashboardWidgetError } from '../../../helpers/DashboardToastHelper'

const { t } = i18n.global
const mainStore = store()

export const formatForCrossNavigation = (chartEvent: any, crossNavigationOptions: IWidgetCrossNavigation, dataToShow: any, chartType: string) => {
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
    if (['pictorial', 'scatter'].includes(chartType)) return dataToShow?.metaData?.fields[2] ? dataToShow?.metaData?.fields[2].header : ''
    else if (['spline'].includes(chartType)) return chartPoint.category
    else if (['packedbubble'].includes(chartType)) return chartPoint.options.name
    else return chartPoint.series.name
}

const getSerieValueForCrossNavigation = (chartPoint: any, chartType: string) => {
    if (['pie', 'radar', 'area', 'bar', 'column', 'line', 'bubble', 'spline', 'funnel', 'waterfall'].includes(chartType)) return chartPoint.options.y
    else if (['dependencywheel', 'pictorial', 'sankey', 'streamgraph', 'scatter'].includes(chartType)) return chartPoint.options.y ?? chartPoint.options.weight
    else if (['treemap'].includes(chartType)) return chartPoint.value
    else if (['dumbbell'].includes(chartType)) return chartPoint.options.high
    else return chartPoint.options.value
}

const getCategoryValueForCrossNavigation = (chartPoint: any, chartType: string) => {
    if (['dependencywheel', 'sankey'].includes(chartType)) return chartPoint.options.id ?? chartPoint.options.from
    else if (['spline', 'pictorial', 'packedbubble'].includes(chartType)) return chartPoint.series.name
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
        case 'SERIE_NAME':
            value = formattedChartValues.serieName
            break
        case 'SERIE_VALUE':
            value = formattedChartValues.serieValue
            break
        case 'CATEGORY_NAME':
            value = formattedChartValues.categoryName
            break
        case 'CATEGORY_VALUE':
            value = formattedChartValues.categoryValue
            break
        case 'GROUPING_NAME':
            value = formattedChartValues.groupingName as string
            break
        case 'GROUPING_VALUE':
            value = formattedChartValues.groupingValue as string
            break
    }
    return { ...outputParameter, value: value }
}

export const applyAdvancedSettingsToModelForRender = (modelToRender: any, advancedChartSettings: IHighchartsAdvancedPropertySettings[] | null, widget?: IWidget) => {
    if (!advancedChartSettings) return
    advancedChartSettings.forEach((propertySettings: IHighchartsAdvancedPropertySettings) => {
        if (propertySettings.propertyPath) setPropertyValueToChartModel(modelToRender, propertySettings, widget)
    })
}

const setPropertyValueToChartModel = (modelToRender: any, propertySettings: IHighchartsAdvancedPropertySettings, widget?: IWidget) => {
    const properties = propertySettings.propertyPath.replace(/\[['"]?([^'"\]]+)['"]?\]/g, '.$1').split('.').map((property) => property.trim()).filter(Boolean)
    let currentModelToRender = modelToRender

    for (let i = 0; i < properties.length; i++) {
        const property = properties[i]
        const nextProperty = properties[i + 1]

        if (Array.isArray(currentModelToRender)) {
            if (!/^\d+$/.test(property)) {
                showInvalidAdvancedPropertyError(widget, propertySettings.propertyPath)
                return
            }

            const index = parseInt(property, 10)
            if (index >= currentModelToRender.length) {
                showInvalidAdvancedPropertyError(widget, propertySettings.propertyPath)
                return
            }

            if (i === properties.length - 1) {
                currentModelToRender[index] = getFormattedPropertyValue(propertySettings.propertyValue)
                return
            }

            currentModelToRender = currentModelToRender[index]
            continue
        }

        if (typeof currentModelToRender !== 'object' || currentModelToRender === null) {
            showInvalidAdvancedPropertyError(widget, propertySettings.propertyPath)
            return
        }

        if (i === properties.length - 1) {
            currentModelToRender[property] = getFormattedPropertyValue(propertySettings.propertyValue)
            return
        }

        if (!(property in currentModelToRender)) {
            showInvalidAdvancedPropertyError(widget, propertySettings.propertyPath)
            return
        }

        currentModelToRender = currentModelToRender[property]
        if ((property === 'xAxis' || property === 'yAxis') && Array.isArray(currentModelToRender) && !/^\d+$/.test(nextProperty)) {
            if (!currentModelToRender.length) {
                showInvalidAdvancedPropertyError(widget, propertySettings.propertyPath)
                return
            }
            currentModelToRender = currentModelToRender[0]
        }
    }
}

const showInvalidAdvancedPropertyError = (widget: IWidget | undefined, propertyPath: string) => {
    showDashboardWidgetError(widget, t('dashboard.widgetEditor.highcharts.advancedSettingsErrorArrayIndexOutOfBounds', { property: propertyPath }))
}

const getFormattedPropertyValue = (propertyValue: string) => {
    switch (propertyValue.trim()) {
        case 'true':
            return true
        case 'false':
            return false
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
