import { IHighchartsSeriesLabelsSetting } from '../../../interfaces/highcharts/DashboardHighchartsWidget'
import { hexToRgba } from '../../FormattingHelpers'
import { getMaximumNumberOfSeries } from '../CommonChartCompatibilityHelper'
import * as highchartsDefaultValues from '../../../widget/WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'

export const getFormattedSerieLabelsSettings = (widget: any) => {
    const formattedSerieSettings = widget.content.chartTemplate.CHART.type !== 'PIE' ? highchartsDefaultValues.getDefaultSeriesSettings() : ([] as IHighchartsSeriesLabelsSetting[])
    if (widget.content.chartTemplate.CHART.type === 'GAUGE') {
        formattedSerieSettings[0].dial = highchartsDefaultValues.getDefaultSerieDialSettings()
        formattedSerieSettings[0].pivot = highchartsDefaultValues.getDefaultSeriePivotSettings()
    }
    let endIndex = getMaximumNumberOfSeries('highcharts', widget.content.chartTemplate.CHART.type, widget) ?? widget.content.chartTemplate.CHART.VALUES.SERIE.length
    if (endIndex > widget.content.chartTemplate.CHART.VALUES.SERIE.length) endIndex = widget.content.chartTemplate.CHART.VALUES.SERIE.length
    for (let i = 0; i < endIndex; i++) {
        const oldModelSerie = widget.content.chartTemplate.CHART.VALUES.SERIE[i]
        const formattedSettings = { names: [oldModelSerie.name] } as IHighchartsSeriesLabelsSetting
        setFormattedSerieLabelSettings(oldModelSerie, formattedSettings)
        setSerieSettingsForGaugeChart(oldModelSerie, formattedSettings, widget)
        if (widget.content.chartTemplate.CHART.type === 'RADAR') formattedSettings.type = oldModelSerie.type
        formattedSerieSettings.push(formattedSettings)
    }
    return formattedSerieSettings
}

const setFormattedSerieLabelSettings = (oldModelSerie: any, formattedSettings: IHighchartsSeriesLabelsSetting) => {
    formattedSettings.label = {
        enabled: oldModelSerie.showValue,
        style: {
            fontFamily: '',
            fontSize: '',
            fontWeight: '',
            color: '',
        },
        backgroundColor: 'rgba(246,246,246, 1)',
        prefix: oldModelSerie.prefixChar ?? '',
        suffix: oldModelSerie.postfixChar ?? '',
        scale: oldModelSerie.scaleFactor ?? 'empty',
        precision: oldModelSerie.precision ?? 2,
        absolute: oldModelSerie.showAbsValue,
        percentage: oldModelSerie.showPercentage
    }
    setFormattedSerieStyle(oldModelSerie, formattedSettings)
}

const setFormattedSerieStyle = (oldModelSerie: any, formattedSettings: IHighchartsSeriesLabelsSetting) => {
    let labelsStyle = null as any
    if (oldModelSerie.dataLabels?.style) labelsStyle = oldModelSerie.dataLabels.style
    else if (oldModelSerie.TOOLTIP?.style) labelsStyle = oldModelSerie.TOOLTIP.style
    if (!labelsStyle) return
    formattedSettings.label.style = {
        fontFamily: labelsStyle.fontFamily ?? '',
        fontSize: labelsStyle.fontSize ?? '',
        fontWeight: labelsStyle.fontWeight ?? '',
        color: labelsStyle.color ? hexToRgba(labelsStyle.color) : '',
    }
}

const setSerieSettingsForGaugeChart = (oldModelSerie: any, formattedSettings: IHighchartsSeriesLabelsSetting, widget: any) => {
    if (widget.content.chartTemplate.CHART.type === 'GAUGE') {
        formattedSettings.dial = highchartsDefaultValues.getDefaultSerieDialSettings()
        formattedSettings.pivot = highchartsDefaultValues.getDefaultSeriePivotSettings()
        if (oldModelSerie.DIAL?.backgroundColor && formattedSettings.dial) formattedSettings.dial.backgroundColor = hexToRgba(oldModelSerie.DIAL.backgroundColor)
    }
}