import { IWidget, IWidgetExports, IWidgetInteractions } from '../../../Dashboard'
import { IHighchartsWidgetConfiguration, IHighchartsWidgetSettings } from '../../../interfaces/highcharts/DashboardHighchartsWidget'
import { KnowageHighchartsPieChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsPieChart'
import { getFormattedInteractions } from '../../common/WidgetInteractionsHelper'
import { getFiltersForColumns } from '../../DashboardBackwardCompatibilityHelper'
import { getFormattedWidgetColumns, getFormattedColorSettings } from '../CommonChartCompatibilityHelper'
import { getFormattedStyle } from './HighchartsWidgetStyleHelper'
import { KnowageHighchartsGaugeSeriesChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsGaugeSeriesChart'
import { KnowageHighchartsSolidGaugeChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsSolidGaugeChart'
import { KnowageHighchartsActivityGaugeChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsActivityGaugeChart'
import { getFormattedSerieLabelsSettings } from './HighchartsSeriesSettingsCompatibilityHelper'
import { KnowageHighchartsHeatmapChart } from './../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsHeatmapChart';
import { KnowageHighchartsRadarChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsRadarChart';
import { KnowageHighchartsBarChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsBarChart'
import * as widgetCommonDefaultValues from '../../../widget/WidgetEditor/helpers/common/WidgetCommonDefaultValues'
import * as highchartsDefaultValues from '../../../widget/WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import { KnowageHighchartsBubbleChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsBubbleChart'
import { KnowageHighchartsLineChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsLineChart'
import { KnowageHighchartsScatterChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsScatterChart'
import { KnowageHighchartsTreemapChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsTreemapChart'
import { KnowageHighchartsSunburstChart } from '../../../widget/ChartWidget/classes/highcharts/KnowageHighchartsSunburstChart'

const columnNameIdMap = {}

export const formatHighchartsWidget = (widget: any) => {
    console.log('---------- ORIGINAL WIDGET: ', widget)

    const chartType = widget.content?.chartTemplate?.CHART?.type ?? ''
    const formattedWidget = {
        id: widget.id,
        dataset: widget.dataset.dsId ?? null,
        type: 'highcharts',
        columns: getFormattedWidgetColumns(widget, 'highcharts'),
        theme: '',
        settings: {} as IHighchartsWidgetSettings
    } as IWidget

    formattedWidget.settings = getFormattedWidgetSettings(widget, chartType) as IHighchartsWidgetSettings
    getFiltersForColumns(formattedWidget, widget)
    formattedWidget.settings.chartModel = createChartModel(widget, chartType)

    console.log('---------- FORMATTED WIDGET: ', formattedWidget)

    return formattedWidget
}

const getFormattedWidgetSettings = (widget: any, chartType: string) => {
    const formattedSettings = {
        updatable: widget.updateble,
        clickable: widget.cliccable,
        chartModel: null,
        configuration: getFormattedConfiguration(widget, chartType),
        accesssibility: { seriesAccesibilitySettings: getFormattedSeriesAccesibilitySettings(widget) },
        series: { seriesLabelsSettings: getFormattedSerieLabelsSettings(widget) },
        interactions: getFormattedInteractions(widget) as IWidgetInteractions,
        style: getFormattedStyle(widget),
        chart: { colors: getFormattedColorSettings(widget) as any },
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes()
    } as IHighchartsWidgetSettings
    return formattedSettings
}

const getFormattedConfiguration = (widget: any, chartType: string) => {
    const formattedConfiguration = { exports: { showExcelExport: widget.style?.showExcelExport ?? false, showScreenshot: widget.style?.showScreenshot ?? false } as IWidgetExports } as IHighchartsWidgetConfiguration
    if (['HEATMAP', 'RADAR', 'BAR', 'LINE', 'BUBBLE', "SCATTER", "TREEMAP", "SUNBURST"].includes(chartType)) formattedConfiguration.datetypeSettings = getFormmatedDatetypeSettings(widget)
    if (['RADAR'].includes(chartType)) formattedConfiguration.splitting = getFormmatedSplittingSettings(widget)
    if (['BAR', "LINE"].includes(chartType)) formattedConfiguration.grouping = getFormmatedGroupingSettings(widget)
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

const getFormmatedSplittingSettings = (widget: any) => {
    const splittingSettings = { enabled: false, groupedSerie: '' }
    const oldChartModel = widget.content?.chartTemplate?.CHART
    if (oldChartModel) {
        splittingSettings.enabled = oldChartModel.groupSeriesCateg
        splittingSettings.groupedSerie = oldChartModel.groupedSerie
    }
    return splittingSettings
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

const createChartModel = (widget: any, chartType: string) => {
    const widgetContentChartTemplate = widget.content.chartTemplate
    console.log('---------- CHART TYPE: ', chartType)
    switch (chartType) {
        case 'PIE':
            return new KnowageHighchartsPieChart(widgetContentChartTemplate)
        case 'GAUGE':
            return createGaugeChartInstance(widgetContentChartTemplate)
        case 'HEATMAP':
            return new KnowageHighchartsHeatmapChart(widgetContentChartTemplate)
        case "RADAR":
            return new KnowageHighchartsRadarChart(widgetContentChartTemplate)
        case "BAR":
            return new KnowageHighchartsBarChart(widgetContentChartTemplate)
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