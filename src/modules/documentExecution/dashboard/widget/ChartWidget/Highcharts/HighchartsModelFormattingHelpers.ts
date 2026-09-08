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

const DEFAULT_LEFT_AXIS_LABEL_GAP = 12

const getAxisLabelFontSize = (axis: any) => {
    const parsedFontSize = Number.parseInt(`${axis?.labels?.style?.fontSize ?? ''}`, 10)
    return Number.isFinite(parsedFontSize) ? parsedFontSize : 12
}

const getEstimatedLeftAlignedAxisMargin = (axes: any[]) => {
    const estimatedMargin = axes.reduce((maxMargin: number, axis: any) => {
        const categories = Array.isArray(axis?.categories) ? axis.categories : []
        const longestLabelLength = categories.reduce((maxLength: number, category: any) => Math.max(maxLength, `${category ?? ''}`.length), 0)
        if (!longestLabelLength) return maxMargin

        const estimatedLabelWidth = Math.ceil((longestLabelLength * getAxisLabelFontSize(axis) * 11) / 20)
        return Math.max(maxMargin, estimatedLabelWidth + DEFAULT_LEFT_AXIS_LABEL_GAP)
    }, 0)

    return Math.max(estimatedMargin, DEFAULT_LEFT_AXIS_LABEL_GAP * 2)
}

/**
 * For left-side axes, the default bar-label offset `x = -12` is correct as long as labels use
 * the default alignment. The problem appears only when the user explicitly sets `labels.align = 'left'`:
 * in that case Highcharts anchors the LEFT edge of the text at `x`, so the default `-12` offset
 * leaves part of the label inside the plot area.
 *
 * Which axis is on the LEFT depends on the chart type:
 *  - bar charts (`chart.type === 'bar'`) and other inverted charts: **xAxis** holds the
 *    categories and is displayed on the left side.
 *  - all other chart types: **yAxis** is on the left side.
 *
 * Fix strategy:
 *  1. Restore the standard `-12` gap for older saved models that still have the previous
 *     zero/empty default on the left-side axis.
 *  2. Keep the default `-12` offset untouched unless the axis is explicitly left-aligned.
 *  3. For explicit `align: 'left'`, estimate the longest label width from the axis categories
 *     and move the label anchor left by `estimatedWidth + 12`, preserving the usual 12 px gap.
 *  4. Apply the same value to `chart.marginLeft` only when the chart does not already define it.
 */
export const normalizeYAxisLabelsAlignment = (formattedChartModel: IHighchartsChartModel) => {
    const chartObj = formattedChartModel.chart as any

    // For bar (and other inverted) charts the left-side labels live on xAxis;
    // for all other chart types they live on yAxis.
    const isInverted = chartObj?.type === 'bar' || chartObj?.inverted === true
    const leftSideAxes: any[] = (isInverted ? formattedChartModel.xAxis : formattedChartModel.yAxis) as any[] ?? []

    if (!leftSideAxes.length) return

    const axesToRestoreDefaultGap = leftSideAxes.filter((axis: any) => axis?.labels && (axis.labels.align == null || axis.labels.align === '') && (axis.labels.x == null || Number(axis.labels.x) === 0))
    axesToRestoreDefaultGap.forEach((axis: any) => {
        axis.labels.x = -DEFAULT_LEFT_AXIS_LABEL_GAP
    })

    const axesToAutoNormalize = leftSideAxes.filter(
        (axis: any) => axis?.labels?.align === 'left' && (axis.labels.x == null || axis.labels.x >= 0 || Number(axis.labels.x) === -DEFAULT_LEFT_AXIS_LABEL_GAP)
    )
    if (!axesToAutoNormalize.length) return

    const requiredLeftMargin = getEstimatedLeftAlignedAxisMargin(axesToAutoNormalize)

    if (chartObj.marginLeft == null) {
        chartObj.marginLeft = requiredLeftMargin
    }

    axesToAutoNormalize.forEach((axis: any) => {
        axis.labels.x = -requiredLeftMargin
    })
}

export const normalizeTooltipSettings = (formattedChartModel: IHighchartsChartModel) => {
    const tooltip = formattedChartModel.tooltip as any
    if (!tooltip) return

    if (!['activitygauge', 'bubble'].includes(formattedChartModel.chart?.type)) delete tooltip.pointFormat
    if (!tooltip.style) tooltip.style = {}
    if (!tooltip.style.color) tooltip.style.color = 'contrast'
}

export const normalizeCategoryXAxisLabels = (formattedChartModel: IHighchartsChartModel) => {
    const chart = formattedChartModel.chart as any
    if (chart?.polar || chart?.inverted || chart?.type === 'bar' || !formattedChartModel.xAxis) return

    formattedChartModel.xAxis.forEach((axis: any) => {
        if (axis?.type !== 'category' || axis?.visible === false) return

        axis.labels = axis.labels ?? {}
        axis.labels.style = axis.labels.style ?? {}
        axis.labels.style.textOverflow = 'ellipsis'
        axis.labels.overflow = 'justify'

        if (axis.labels.rotation == null) axis.labels.autoRotation = []
    })
}

const CATEGORY_X_AXIS_LABEL_ATTRIBUTE = 'data-highcharts-category-label'
const CATEGORY_X_AXIS_TOOLTIP_CLASS = 'highcharts-category-axis-label-tooltip'

interface ICategoryXAxisTooltipState {
    element: HTMLDivElement
    destroy: () => void
}

interface IChartWithCategoryXAxisTooltip extends Highcharts.Chart {
    categoryXAxisTooltip?: ICategoryXAxisTooltipState
}

export const addCategoryXAxisLabelTooltips = (chart: Highcharts.Chart) => {
    let hasCategoryLabels = false

    chart.xAxis.forEach((axis: any) => {
        if (!axis.horiz || axis.options.type !== 'category') return

        Object.values(axis.ticks ?? {}).forEach((tick: any) => {
            const labelElement = tick?.label?.element as Element | undefined
            const category = axis.categories?.[tick?.pos] ?? tick?.label?.textStr
            if (!labelElement || category == null) return

            hasCategoryLabels = true
            labelElement.setAttribute(CATEGORY_X_AXIS_LABEL_ATTRIBUTE, `${category}`)
            labelElement.setAttribute('aria-label', `${category}`)
            labelElement.querySelector('title')?.remove()
        })
    })

    if (hasCategoryLabels) addCategoryXAxisTooltip(chart)
}

const addCategoryXAxisTooltip = (chart: Highcharts.Chart) => {
    const chartWithTooltip = chart as IChartWithCategoryXAxisTooltip
    if (chartWithTooltip.categoryXAxisTooltip || !chart.container) return

    const chartContainer = chart.container
    const tooltip = document.createElement('div')
    tooltip.className = CATEGORY_X_AXIS_TOOLTIP_CLASS
    const tooltipColor = chart.options.tooltip?.style?.color
    Object.assign(tooltip.style, {
        backgroundColor: chart.options.tooltip?.backgroundColor ?? 'rgba(247, 247, 247, 0.95)',
        border: `1px solid ${chart.options.tooltip?.borderColor ?? '#cccccc'}`,
        borderRadius: `${chart.options.tooltip?.borderRadius ?? 3}px`,
        boxSizing: 'border-box',
        color: tooltipColor && tooltipColor !== 'contrast' ? tooltipColor : '#333333',
        display: 'none',
        fontSize: chart.options.tooltip?.style?.fontSize ?? '0.8em',
        maxHeight: 'calc(100vh - 16px)',
        maxWidth: 'min(32rem, calc(100vw - 16px))',
        overflowY: 'auto',
        overflowWrap: 'anywhere',
        padding: '8px',
        pointerEvents: 'auto',
        position: 'fixed',
        whiteSpace: 'pre-wrap',
        zIndex: '10000'
    })
    document.body.appendChild(tooltip)

    const hideTooltip = () => {
        tooltip.style.display = 'none'
    }

    const showTooltip = (event: MouseEvent) => {
        const target = event.target instanceof Element ? event.target.closest(`[${CATEGORY_X_AXIS_LABEL_ATTRIBUTE}]`) : null
        const category = target?.getAttribute(CATEGORY_X_AXIS_LABEL_ATTRIBUTE)
        if (category == null) return

        tooltip.textContent = category
        tooltip.style.display = 'block'

        const labelBounds = target.getBoundingClientRect()
        const left = Math.max(8, Math.min(labelBounds.left, window.innerWidth - tooltip.offsetWidth - 8))
        const top = Math.max(8, labelBounds.top - tooltip.offsetHeight - 8)
        tooltip.style.left = `${left}px`
        tooltip.style.top = `${top}px`
    }

    const onMouseOut = (event: MouseEvent) => {
        const target = event.target instanceof Element ? event.target.closest(`[${CATEGORY_X_AXIS_LABEL_ATTRIBUTE}]`) : null
        const relatedTarget = event.relatedTarget as Node | null
        if (!target || target.contains(relatedTarget) || tooltip.contains(relatedTarget)) return
        hideTooltip()
    }

    chartContainer.addEventListener('mouseover', showTooltip)
    chartContainer.addEventListener('mousemove', showTooltip)
    chartContainer.addEventListener('mouseout', onMouseOut)
    tooltip.addEventListener('mouseleave', hideTooltip)

    const destroy = () => {
        chartContainer.removeEventListener('mouseover', showTooltip)
        chartContainer.removeEventListener('mousemove', showTooltip)
        chartContainer.removeEventListener('mouseout', onMouseOut)
        tooltip.removeEventListener('mouseleave', hideTooltip)
        tooltip.remove()
        delete chartWithTooltip.categoryXAxisTooltip
    }
    chartWithTooltip.categoryXAxisTooltip = { element: tooltip, destroy }
    Highcharts.addEvent(chart, 'destroy', destroy)
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
