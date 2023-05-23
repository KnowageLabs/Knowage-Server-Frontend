import { IHighchartsChartModel } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { getFormattedLabels, getFormattedLegend, getFormattedNoDataConfiguration, getFormattedSeries, getFormattedTooltipSettings, setFormattedAxisLabels, setFormattedAxisTitle } from './KnowageHighchartsCommonUpdater'
import { hexToRgba } from '@/modules/documentExecution/dashboard/helpers/FormattingHelpers'
import * as highchartsDefaultValues from '../../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'

export const updateSunburstChartModel = (oldModel: any, newModel: IHighchartsChartModel) => {
    getFormattedNoDataConfiguration(oldModel, newModel)
    getFormattedAxisSettings(oldModel, newModel, 'x')
    getFormattedAxisSettings(oldModel, newModel, 'y')
    getFormattedLegend(oldModel, newModel)
    getFormattedLabels(oldModel, newModel)
    getFormattedSeries(oldModel, newModel, null)
    getFormattedTooltipSettings(oldModel, newModel)

    return newModel
}


const getFormattedAxisSettings = (oldModel: any, newModel: IHighchartsChartModel, axis: 'x' | 'y') => {
    const oldAxis = axis === 'x' ? oldModel.CHART.AXES_LIST.AXIS[1] : oldModel.CHART.AXES_LIST.AXIS[0]
    const newModelAxis = axis === 'x' ? highchartsDefaultValues.getDefaultBarXAxis() : highchartsDefaultValues.getDefaultBarYAxis()
    if (!oldAxis) return
    setFormattedAxisLabels(oldAxis, newModelAxis)
    setFormattedAxisTitle(oldAxis, newModelAxis)
    setAxisGridSettings(oldAxis, newModelAxis)

    axis === 'x' ? setXAxisSpecificValues(newModelAxis) : setYAxisSpecificValues(newModelAxis)
    axis === 'x' ? newModel.xAxis = newModelAxis : newModel.yAxis = newModelAxis
}

const setXAxisSpecificValues = (newModelAxis: any) => {
    newModelAxis.type = "category"
    newModelAxis.plotBands = []
    newModelAxis.plotLines = []
}

const setYAxisSpecificValues = (newModelAxis: any) => {
    newModelAxis.min = 0
    newModelAxis.plotBands = []
    newModelAxis.plotLines = []
}


const setAxisGridSettings = (oldAxis: any, newModelAxis: any) => {
    if (oldAxis.MAJORGRID) {
        newModelAxis.tickInterval = oldAxis.MAJORGRID.interval && oldAxis.MAJORGRID.interval !== '' ? oldAxis.MAJORGRID.interval : null
        newModelAxis.gridLineDashStyle = getFormattedGridLineStyle(oldAxis.MINORGRID.style?.typeline) ? '' : ''
        newModelAxis.gridLineColor = oldAxis.MAJORGRID.style?.color ? hexToRgba(oldAxis.MAJORGRID.style.color) : ''
    }

    if (oldAxis.MINORGRID) {
        newModelAxis.minorTickInterval = oldAxis.MINORGRID.interval && oldAxis.MINORGRID.interval !== '' ? oldAxis.MINORGRID.interval : null
        newModelAxis.minorGridLineDashStyle = getFormattedGridLineStyle(oldAxis.MINORGRID.style?.typeline) ? '' : ''
        newModelAxis.minorGridLineColor = oldAxis.MINORGRID.style?.color ? hexToRgba(oldAxis.MINORGRID.style.color) : ''
    }
}

const getFormattedGridLineStyle = (type: string) => {
    switch (type) {
        case 'solid':
            return 'Solid';
        case "dashed":
            return 'Dash'
        case "dotted":
            return 'Dot';
        default:
            return ''
    }
}