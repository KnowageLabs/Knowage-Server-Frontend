import { IWidget, IWidgetExports, IWidgetInteractions } from '../../../Dashboard'
import { IHighchartsWidgetConfiguration, IHighchartsWidgetSettings } from '../../../interfaces/highcharts/DashboardHighchartsWidget'
import { KnowageHighchartsPieChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsPieChart'
import { getFormattedInteractions } from '../../common/WidgetInteractionsHelper'
import { getFiltersForColumns } from '../../DashboardBackwardCompatibilityHelper'
import { getFormattedWidgetColumns, getFormattedColorSettings } from '../CommonChartCompatibilityHelper'
import { getFormattedStyle } from './HighchartsWidgetStyleHelper'
import { hexToRgba } from '../../FormattingHelpers'
import { KnowageHighchartsGaugeSeriesChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsGaugeSeriesChart'
import { KnowageHighchartsSolidGaugeChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsSolidGaugeChart'
import { KnowageHighchartsActivityGaugeChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsActivityGaugeChart'
import { getFormattedSerieLabelsSettings } from './HighchartsSeriesSettingsCompatibilityHelper'
import { KnowageHighchartsHeatmapChart } from './../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsHeatmapChart';
import { KnowageHighchartsRadarChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsRadarChart';
import { KnowageHighchartsBarChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsBarChart'
import { KnowageHighchartsBubbleChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsBubbleChart'
import { KnowageHighchartsLineChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsLineChart'
import { KnowageHighchartsScatterChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsScatterChart'
import { KnowageHighchartsTreemapChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsTreemapChart'
import { KnowageHighchartsSunburstChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsSunburstChart'
import { KnowageHighchartsChordChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsChordChart'
import { KnowageHighchartsParallelChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsParallelChart'
import * as widgetCommonDefaultValues from '../../../widget/WidgetEditor/helpers/common/WidgetCommonDefaultValues'
import * as highchartsDefaultValues from '../../../widget/WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'

const columnNameIdMap = {}

export const formatHighchartsWidget = (widget: any) => {
    console.log('----------- OLD WIDGET: ', widget)

    const oldChart = widget.content?.chartTemplate?.CHART
    const formattedWidget = {
        id: widget.id,
        dataset: widget.dataset.dsId ?? null,
        type: 'highcharts',
        columns: getFormattedWidgetColumns(widget, 'highcharts'),
        theme: '',
        settings: {} as IHighchartsWidgetSettings
    } as IWidget

    formattedWidget.settings = getFormattedWidgetSettings(widget, oldChart?.type) as IHighchartsWidgetSettings
    getFiltersForColumns(formattedWidget, widget)
    formattedWidget.settings.chartModel = createChartModel(widget, oldChart?.type, oldChart?.seriesStacking)

    console.log('----------- FORMATTED WIDGET: ', formattedWidget)
    return formattedWidget
}

const getFormattedWidgetSettings = (widget: any, chartType: string) => {
    const formattedSettings = {
        updatable: widget.updateble,
        clickable: widget.cliccable,
        chartModel: null,
        configuration: getFormattedConfiguration(widget, chartType),
        accesssibility: { seriesAccesibilitySettings: getFormattedSeriesAccesibilitySettings(widget) },
        series: { seriesSettings: getFormattedSerieLabelsSettings(widget) },
        interactions: getFormattedInteractions(widget) as IWidgetInteractions,
        style: getFormattedStyle(widget),
        chart: { colors: getFormattedColorSettings(widget) as any },
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes()
    } as IHighchartsWidgetSettings
    if (['BAR', "LINE", 'RADAR', 'BUBBLE', 'PIE'].includes(chartType)) formattedSettings.series.conditionalStyles = { enabled: false, conditions: [widgetCommonDefaultValues.getDefaultConditionalStyles()] } as any
    return formattedSettings
}

const getFormattedConfiguration = (widget: any, chartType: string) => {
    const formattedConfiguration = { exports: { showExcelExport: widget.style?.showExcelExport ?? false, showScreenshot: widget.style?.showScreenshot ?? false } as IWidgetExports } as IHighchartsWidgetConfiguration
    if (['HEATMAP', 'RADAR', 'BAR', 'LINE', 'BUBBLE', "SCATTER", "TREEMAP", "SUNBURST", "CHORD", "PARALLEL"].includes(chartType)) formattedConfiguration.datetypeSettings = getFormmatedDatetypeSettings(widget)
    if (['BAR', "LINE", 'RADAR', 'BUBBLE'].includes(chartType)) formattedConfiguration.grouping = getFormmatedGroupingSettings(widget)
    if (['SUNBURST', 'TREEMAP'].includes(chartType)) formattedConfiguration.centerText = getFormattedCenterTextSettings(widget)
    formattedConfiguration.limit = getFormmatedLimitSettings(widget)
    if (['PARALLEL'].includes(chartType)) formattedConfiguration.axisLines = getFormmatedAxisLinesSettings(widget)
    return formattedConfiguration
}

const getFormmatedDatetypeSettings = (widget: any) => {
    const formattedDatetypeSettings = highchartsDefaultValues.getDefaultDateTypeSettings()
    const oldChartModel = widget.content?.chartTemplate?.CHART
    if (oldChartModel) {
        formattedDatetypeSettings.enabled = oldChartModel.dateTime
        formattedDatetypeSettings.format = getProperDateTimeFormat(oldChartModel.dateFormat)
    }
    return formattedDatetypeSettings
}

const getFormmatedGroupingSettings = (widget: any) => {
    const groupingSettings = { enabled: false, secondSeries: { enabled: false }, secondDimension: { enabled: false, serie: '' } }
    const oldChartModel = widget.content?.chartTemplate?.CHART
    if (oldChartModel) {
        groupingSettings.enabled = oldChartModel.groupCategories
        groupingSettings.secondSeries.enabled = oldChartModel.groupSeries
        groupingSettings.secondDimension.enabled = oldChartModel.groupSeriesCateg
        groupingSettings.secondDimension.serie = oldChartModel.groupedSerie
    }
    return groupingSettings
}

const getFormattedCenterTextSettings = (widget: any) => {
    const formattedCenterText = { text: '', style: { 'font-family': '', 'font-size': '14px', 'font-weight': '', color: '', 'font-style': '' } }
    const oldChartModelTipSettings = widget.content.chartTemplate?.CHART?.TIP
    if (!oldChartModelTipSettings) return formattedCenterText
    formattedCenterText.text = oldChartModelTipSettings.text
    formattedCenterText.style['font-family'] = oldChartModelTipSettings.style.fontFamily
    formattedCenterText.style['font-size'] = oldChartModelTipSettings.style.fontSize
    formattedCenterText.style['font-weight'] = oldChartModelTipSettings.style.fontWeight
    formattedCenterText.style.color = oldChartModelTipSettings.style.color
    return formattedCenterText
}

const getFormmatedLimitSettings = (widget: any) => {
    const formattedLimitSettings = { enabled: true, itemsNumber: 5 }
    const oldChartModel = widget.content?.chartTemplate?.CHART
    if (oldChartModel && oldChartModel.LIMIT && oldChartModel.LIMIT.style) {
        formattedLimitSettings.itemsNumber = oldChartModel.LIMIT.style.maxNumberOfLines
    }
    return formattedLimitSettings
}

const getFormmatedAxisLinesSettings = (widget: any) => {
    const formattedAxisLinesSettings = { color: '', crosshairColor: '', crosshairWidth: 8 }
    const oldChartModel = widget.content?.chartTemplate?.CHART
    if (oldChartModel && oldChartModel.AXES_LIST && oldChartModel.AXES_LIST.style) {
        formattedAxisLinesSettings.color = oldChartModel.AXES_LIST.style.axisColor ? hexToRgba(oldChartModel.AXES_LIST.style.axisColor) : ''
        formattedAxisLinesSettings.crosshairColor = oldChartModel.AXES_LIST.style.brushColor ? hexToRgba(oldChartModel.AXES_LIST.style.brushColor) : ''
        formattedAxisLinesSettings.crosshairWidth = oldChartModel.AXES_LIST.style.brushWidth
    }
    return formattedAxisLinesSettings
}



const getProperDateTimeFormat = (oldDateFormat: string) => {
    switch (oldDateFormat) {
        case 'minus':
            return 'DD-MM-YYYY';
        case 'slash':
            return 'DD/MM/YYYY';
        case 'year':
            return 'YYYY';
        case 'month':
            return 'MMMM YYYY';
        case 'day':
            return 'dddd, MMM D, YYYY';
        case 'hour':
            return 'dddd, MMM D, YYYY hh';
        case 'minute':
            return 'dddd, MMM D, YYYY hh:mm';
        case 'second':
            return 'dddd, MMM D, YYYY hh:mm:ss';
        case 'millisecond':
            return 'dddd, MMM D, YYYY hh:mm:ss sss';
        default:
            return ''
    }
}

const getFormattedSeriesAccesibilitySettings = (widget: any) => {
    return widget.content.chartTemplate.CHART.type !== 'PIE' ? highchartsDefaultValues.getDefaultAllSeriesAccessibilitySettings() : []
}

export const getColumnId = (widgetColumnName: string) => {
    return columnNameIdMap[widgetColumnName]
}

const createChartModel = (widget: any, chartType: string, isStacking: boolean) => {
    const widgetContentChartTemplate = widget.content.chartTemplate
    switch (chartType) {
        case 'PIE':
            return new KnowageHighchartsPieChart(widgetContentChartTemplate)
        case 'GAUGE':
            return createGaugeChartInstance(widgetContentChartTemplate)
        case 'HEATMAP':
            return new KnowageHighchartsHeatmapChart(widgetContentChartTemplate)
        case "RADAR":
            return new KnowageHighchartsRadarChart(widgetContentChartTemplate)
        case "AREA":
            return new KnowageHighchartsBarChart(widgetContentChartTemplate, 'area', isStacking)
        case "BAR":
            return new KnowageHighchartsBarChart(widgetContentChartTemplate, 'bar', isStacking)
        case "COLUMN":
            return new KnowageHighchartsBarChart(widgetContentChartTemplate, 'column', isStacking)
        case "BUBBLE":
            return new KnowageHighchartsBubbleChart(widgetContentChartTemplate)
        case "SCATTER":
            return new KnowageHighchartsScatterChart(widgetContentChartTemplate)
        case "LINE":
            return new KnowageHighchartsLineChart(widgetContentChartTemplate)
        case "TREEMAP":
            return new KnowageHighchartsTreemapChart(widgetContentChartTemplate)
        case "SUNBURST":
            return new KnowageHighchartsSunburstChart(widgetContentChartTemplate)
        case "CHORD":
            return new KnowageHighchartsChordChart(widgetContentChartTemplate)
        case "PARALLEL":
            return new KnowageHighchartsParallelChart(widgetContentChartTemplate)
        default:
            return null
    }
}

const createGaugeChartInstance = (widgetContentChartTemplate: any) => {
    switch (widgetContentChartTemplate.CHART.subtype) {
        case 'activity':
            return new KnowageHighchartsActivityGaugeChart(widgetContentChartTemplate)
        case 'solid':
            return new KnowageHighchartsSolidGaugeChart(widgetContentChartTemplate)
        case 'simple':
        default:
            return new KnowageHighchartsGaugeSeriesChart(widgetContentChartTemplate)

    }
}