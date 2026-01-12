import { IVariable, IWidget } from '../../../Dashboard'
import { hexToRgba } from '../../../helpers/FormattingHelpers'
import { IHighchartsChartModel } from '../../../interfaces/highcharts/DashboardHighchartsWidget'
import { replaceVariablesPlaceholdersByVariableName } from '../../interactionsHelpers/InteractionsParserHelper'
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
        return this.point.options.value ? this.series.name + '<br/><b>' + this.point.options.id + ': </b>' + prefix + Highcharts.numberFormat(this.point.options.value, tooltip.valueDecimals) + suffix : this.series.name
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
    if (formattedChartModel.yAxis[0]) delete formattedChartModel.yAxis[0].type
    formatBubbleTooltips(formattedChartModel)
}

const formatBubbleTooltips = (formattedChartModel: IHighchartsChartModel) => {
    const tooltip = formattedChartModel.tooltip as any
    const prefix = tooltip.valuePrefix ?? ''
    const suffix = tooltip.valueSuffix ?? ''
    if (!tooltip.formatterText) {
        tooltip.formatter = function (this: Highcharts.TooltipFormatterContextObject) {
            return this.point.options.y ? this.point.options.name + '<br/><b>' + this.series.name + ': </b>' + prefix + Highcharts.numberFormat(this.point.options.y, tooltip.valueDecimals) + suffix : this.series.name
        }
    }
}

export const formatPackedBubble = (formattedChartModel: IHighchartsChartModel) => {
    formatPackedBubbleTooltips(formattedChartModel)
}

const formatPackedBubbleTooltips = (formattedChartModel: IHighchartsChartModel) => {
    const tooltip = formattedChartModel.tooltip as any
    const prefix = tooltip.valuePrefix ?? ''
    const suffix = tooltip.valueSuffix ?? ''
    if (!tooltip.formatterText) {
        tooltip.formatter = function (this: Highcharts.TooltipFormatterContextObject) {
            return this.point.options.value ? this.series.name + '<br/><b>' + this.point.options.name + ': </b>' + prefix + Highcharts.numberFormat(this.point.options.value, tooltip.valueDecimals) + suffix : this.series.name
        }
    }
}

export const formatSplineChart = (formattedChartModel: IHighchartsChartModel, widgetModel: IWidget) => {
    formattedChartModel.chart.parallelCoordinates = true
    formattedChartModel.chart.parallelAxes = { lineWidth: 2 }
    formatSplineChartVerticalAxisLines(formattedChartModel, widgetModel.settings.configuration?.axisLines)
}

const formatSplineChartVerticalAxisLines = (formattedChartModel: IHighchartsChartModel, axisLinesSettings: any) => {
    if (!axisLinesSettings || !formattedChartModel.yAxis) return
    formatxAxisCrosshairSettings(formattedChartModel, axisLinesSettings)
    formattedChartModel.yAxis.forEach((yAxis: any) => {
        yAxis.lineColor = axisLinesSettings.color ? axisLinesSettings.color : 'black'
        yAxis.crosshair = { color: axisLinesSettings.crosshairColor, width: axisLinesSettings.crosshairWidth }
    })
}

const formatxAxisCrosshairSettings = (formattedChartModel: IHighchartsChartModel, axisLinesSettings: any) => {
    formattedChartModel.xAxis.forEach((xAxis: any) => {
        xAxis.crosshair = { color: axisLinesSettings.crosshairColor, width: axisLinesSettings.crosshairWidth }
    })
}

export const formatPictorialChart = (formattedChartModel: IHighchartsChartModel, widgetModel: IWidget) => {
    if (formattedChartModel.tooltip) formattedChartModel.tooltip.headerFormat = ''
    formatPictorialPlotOptions(formattedChartModel)
    formatPictorialSVGPath(formattedChartModel, widgetModel)
}

const formatPictorialPlotOptions = (formattedChartModel: IHighchartsChartModel) => {
    formattedChartModel.plotOptions.series.stacking = 'percent'
    formattedChartModel.plotOptions.series.dataLabels = { enabled: true, align: 'center' }
}

const formatPictorialSVGPath = (formattedChartModel: IHighchartsChartModel, widgetModel: IWidget) => {
    if (!formattedChartModel.plotOptions.series || !widgetModel.settings.configuration.svgSettings) return

    const definition = alignPathToViewBox(widgetModel.settings.configuration.svgSettings.definition)

    formattedChartModel.plotOptions.series.paths = [{ definition: definition }]
}

const alignPathToViewBox = (pathData: string) => {
    const { minX, minY } = findMinCoordinates(pathData)

    const translateX = -minX
    const translateY = -minY

    const alignedPath = translatePathData(pathData, translateX, translateY)

    return alignedPath
}

const findMinCoordinates = (pathData: string) => {
    const coordPattern = /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi
    const coordinates = [] as any

    pathData.replace(coordPattern, (match, command, coords) => {
        const coordPairs = coords
            .trim()
            .split(/[\s,]+/)
            .map(parseFloat)

        for (let i = 0; i < coordPairs.length; i += 2) {
            if (!isNaN(coordPairs[i])) {
                coordinates.push({ x: isNaN(coordPairs[i]) ? 0 : coordPairs[i], y: isNaN(coordPairs[i + 1]) ? 0 : coordPairs[i + 1] })
            }
        }

        return match
    })

    const xCoordinates = coordinates.map((coord) => coord.x)
    const yCoordinates = coordinates.map((coord) => coord.y)

    return {
        minX: xCoordinates.length > 0 ? Math.min(...xCoordinates) : 0,
        minY: yCoordinates.length > 0 ? Math.min(...yCoordinates) : 0
    }
}

const translatePathData = (pathData: string, translateX: number, translateY: number) => {
    const coordPattern = /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi

    let translatedPath = pathData.replace(coordPattern, (match, command, coordinates) => {
        if (!coordinates.trim()) return command

        const coordPairs = coordinates
            .trim()
            .split(/[\s,]+/)
            .map(parseFloat)

        for (let i = 0; i < coordPairs.length; i += 2) {
            if (!isNaN(coordPairs[i])) coordPairs[i] += translateX
            if (!isNaN(coordPairs[i + 1])) coordPairs[i + 1] += translateY
        }

        return `${command} ${coordPairs.join(' ')}`
    })

    return translatedPath
}

export const formatStreamgraphChart = (formattedChartModel: IHighchartsChartModel, widgetModel: IWidget) => {
    formatxAxisCrosshairSettings(formattedChartModel, widgetModel.settings.configuration?.axisLines)
}

export const formatVariables = (formattedChartModel: IHighchartsChartModel, variables: IVariable[]) => {
    formatVariablesForAxis(formattedChartModel, variables, 'xAxis')
    formatVariablesForAxis(formattedChartModel, variables, 'yAxis')
}

const formatVariablesForAxis = (formattedChartModel: IHighchartsChartModel, variables: IVariable[], axis: 'xAxis' | 'yAxis') => {
    if (!formattedChartModel[axis]) return
    formattedChartModel[axis].forEach((axisElement: any) => {
        if (axisElement.title?.text) axisElement.title.text = replaceVariablesPlaceholdersByVariableName(formattedChartModel[axis][0].title.text, variables)

        formatVariablesForPlotBands(axisElement, variables)
        formatVariablesForPlotLines(axisElement, variables)
    })
}

const formatVariablesForPlotBands = (axis: any, variables: IVariable[]) => {
    if (!axis || !axis.plotBands) return
    axis.plotBands.forEach((plotBand: any) => {
        plotBand.from = isNumberAndConvert(plotBand.from)
        plotBand.from = replaceVariablesPlaceholdersByVariableName(plotBand.from, variables)

        plotBand.to = isNumberAndConvert(plotBand.to)
        plotBand.to = replaceVariablesPlaceholdersByVariableName(plotBand.to, variables)
    })
}

const formatVariablesForPlotLines = (axis: any, variables: IVariable[]) => {
    if (!axis || !axis.plotLines) return
    axis.plotLines.forEach((plotLine: any) => {
        plotLine.value = isNumberAndConvert(plotLine.value)
        plotLine.value = replaceVariablesPlaceholdersByVariableName(plotLine.value, variables)
    })
}

const isNumberAndConvert = (value: any) => {
    const stringValue = typeof value === 'string' ? value : String(value)
    const trimmedValue = stringValue.trim()

    if (!isNaN(parseFloat(trimmedValue)) && isFinite(+trimmedValue)) {
        return parseFloat(trimmedValue)
    }

    return trimmedValue
}
