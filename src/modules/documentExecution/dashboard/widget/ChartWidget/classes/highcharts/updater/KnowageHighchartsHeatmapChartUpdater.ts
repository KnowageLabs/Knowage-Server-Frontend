import { hexToRgba } from '@/modules/documentExecution/dashboard/helpers/FormattingHelpers';
import { IHighchartsChartModel } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { getFormattedNoDataConfiguration, getFormattedSeries, setFormattedAxisLabels, setFormattedAxisTitle } from './KnowageHighchartsCommonUpdater'
import * as highchartsDefaultValues from '../../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'

export const updateHeatmapChartModel = (oldModel: any, newModel: IHighchartsChartModel) => {
    getFormattedNoDataConfiguration(oldModel, newModel)
    getFormattedAxisSettings(oldModel, newModel, 'x')
    getFormattedAxisSettings(oldModel, newModel, 'y')
    getFormattedSeries(oldModel, newModel, 1)
    getFormattedTooltipSettings(oldModel, newModel)
    return newModel
}

const getFormattedAxisSettings = (oldModel: any, newModel: IHighchartsChartModel, axis: 'x' | 'y') => {
    const oldAxis = axis === 'x' ? oldModel.CHART.AXES_LIST.AXIS[1] : oldModel.CHART.AXES_LIST.AXIS[0]
    const newModelAxis = axis === 'x' ? highchartsDefaultValues.getDefaultHeatmapXAxis() : highchartsDefaultValues.getDefaultHeatmapYAxis()
    if (!oldAxis) return
    setFormattedAxisLabels(oldAxis, newModelAxis)
    setFormattedAxisTitle(oldAxis, newModelAxis)
    axis === 'x' ? newModel.xAxis = newModelAxis : newModel.yAxis = newModelAxis
}


const getFormattedTooltipSettings = (oldModel: any, newModel: IHighchartsChartModel) => {
    if (!oldModel.CHART) return
    const oldTooltipSettings = oldModel.CHART.TOOLTIP
    newModel.tooltip = {
        enabled: true,
        valueDecimals: 0,
        valuePrefix: '',
        valueSuffix: '',
        style: {
            fontFamily: oldTooltipSettings.style.fontFamily,
            fontSize: oldTooltipSettings.style.fontSize,
            fontWeight: oldTooltipSettings.style.fontWeight,
            color: oldTooltipSettings.style.color ? hexToRgba(oldTooltipSettings.style.color) : ''
        },
        backgroundColor: oldTooltipSettings.backgroundColor ? hexToRgba(oldTooltipSettings.backgroundColor) : ''
    }

    const oldSerie = oldModel.CHART.VALUES?.SERIE ? oldModel.CHART?.VALUES?.SERIE[0] : null
    if (!oldSerie) return
    newModel.tooltip.valueDecimals = oldSerie.precision
    newModel.tooltip.valuePrefix = oldSerie.prefixChar + ' '
    newModel.tooltip.valueSuffix = ' ' + oldSerie.postfixChar

}