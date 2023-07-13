import { IWidget } from "../../../Dashboard"
import { hexToRgba } from "../../../helpers/FormattingHelpers"
import { IHighchartsChartModel } from "../../../interfaces/highcharts/DashboardHighchartsWidget"
import { getRGBColorFromString } from '../../WidgetEditor/helpers/WidgetEditorHelpers'
import Highcharts from 'highcharts'

export const formatActivityGauge = (formattedChartModel: IHighchartsChartModel, widgetModel: IWidget) => {
    formattedChartModel.chart.type = 'solidgauge'
    const colors = widgetModel.settings.chart.colors
    if (!formattedChartModel.pane) return
    formattedChartModel.pane.background = []
    for (let i = 0; i < formattedChartModel.series.length; i++) {
        const serieData = formattedChartModel.series[i].data[0]
        if (!serieData) continue
        const temp = {
            outerRadius: serieData.radius,
            innerRadius: serieData.innerRadius,
            backgroundColor: serieData.color !== '' ? serieData.color : colors[i],
            borderWidth: 0
        }
        temp.backgroundColor = reduceOpacityFromColorString(temp.backgroundColor, 0.3)
        formattedChartModel.pane.background.push(temp)
    }

}

const reduceOpacityFromColorString = (colorString: string | null, newOpacity: number) => {
    if (!colorString) return null
    const color = colorString.startsWith('#') ? hexToRgba(colorString) : colorString
    const rgbaColor = getRGBColorFromString(color)
    if (rgbaColor.a) rgbaColor.a = newOpacity
    return rgbaColor ? `rgba(${rgbaColor.r}, ${rgbaColor.g}, ${rgbaColor.b}, ${rgbaColor.a})` : 'none'
}

export const formatHeatmap = (formattedChartModel: IHighchartsChartModel) => {
    formatHeatmapTooltip(formattedChartModel)
    formatHeatmapColors(formattedChartModel)
}

const formatHeatmapTooltip = (formattedChartModel: IHighchartsChartModel) => {
    const tooltip = formattedChartModel.tooltip as any
    const prefix = tooltip.valuePrefix ?? ''
    const suffix = tooltip.valueSuffix ?? ''
    tooltip.formatter = function (this: Highcharts.TooltipFormatterContextObject) {
        return this.point.options.value ? this.series.name + '<br/><b>' + this.point.options.id + ': </b>' + prefix + Highcharts.numberFormat(this.point.options.value, tooltip.valueDecimals) + suffix : this.series.name;
    }
}

const formatHeatmapColors = (formattedChartModel: IHighchartsChartModel) => {
    const colors = formattedChartModel.colors
    const increment = 100 / (colors.length - 1) / 100
    formattedChartModel.colorAxis = { stops: [] }
    for (let i = 0; i < colors.length; i++) {
        formattedChartModel.colorAxis.stops.push([i * increment, colors[i]])
    }
}

export const formatRadar = (formattedChartModel: IHighchartsChartModel) => {
    formattedChartModel.chart.type = 'line'
    formattedChartModel.chart.polar = true
}

export const formatBubble = (formattedChartModel: IHighchartsChartModel) => {
    formatBubbleTooltips(formattedChartModel)
}

const formatBubbleTooltips = (formattedChartModel: IHighchartsChartModel) => {
    const tooltip = formattedChartModel.tooltip as any
    const prefix = tooltip.valuePrefix ?? ''
    const suffix = tooltip.valueSuffix ?? ''
    tooltip.formatter = function (this: Highcharts.TooltipFormatterContextObject) {
        return this.point.options.y ? this.point.options.name + '<br/><b>' + this.series.name + ': </b>' + prefix + Highcharts.numberFormat(this.point.options.y, tooltip.valueDecimals) + suffix : this.series.name;
    }
}

export const formatSplineChart = (formattedChartModel: IHighchartsChartModel, widgetModel: IWidget) => {
    formattedChartModel.chart.parallelCoordinates = true
    formattedChartModel.chart.parallelAxes = { lineWidth: 2 }
    formatSplineChartVerticalAxisLines(formattedChartModel, widgetModel.settings.configuration?.axisLines)
}

const formatSplineChartVerticalAxisLines = (formattedChartModel: IHighchartsChartModel, axisLinesSettings: any) => {
    if (!axisLinesSettings || !formattedChartModel.yAxis) return
    formattedChartModel.xAxis.forEach((xAxis: any) => {
        xAxis.crosshair = { color: axisLinesSettings.crosshairColor, width: axisLinesSettings.crosshairWidth }
    })
    formattedChartModel.yAxis.forEach((yAxis: any) => {
        yAxis.lineColor = axisLinesSettings.color ? axisLinesSettings.color : 'black'
        yAxis.crosshair = { color: axisLinesSettings.crosshairColor, width: axisLinesSettings.crosshairWidth }
    })
}

export const formatPictorialChart = (formattedChartModel: IHighchartsChartModel, widgetModel: IWidget) => {
    if (formattedChartModel.tooltip) formattedChartModel.tooltip.headerFormat = ''
    formatPictorialPlotOptions(formattedChartModel)
    formatPictorialSVGPath(formattedChartModel, widgetModel)
}

const formatPictorialPlotOptions = (formattedChartModel: IHighchartsChartModel) => {
    formattedChartModel.plotOptions.series.stacking = 'percent'
    formattedChartModel.plotOptions.series.dataLabels = { enabled: true, align: 'center', }
}

const formatPictorialSVGPath = (formattedChartModel: IHighchartsChartModel, widgetModel: IWidget) => {
    if (!formattedChartModel.plotOptions.series || !widgetModel.settings.configuration.svgSettings) return
    formattedChartModel.plotOptions.series.paths = [{ definition: widgetModel.settings.configuration.svgSettings.definition }]
}