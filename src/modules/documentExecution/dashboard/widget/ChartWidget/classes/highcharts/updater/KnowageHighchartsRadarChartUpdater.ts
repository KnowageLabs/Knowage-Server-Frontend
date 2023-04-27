import { IHighchartsChartModel } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { getFormattedLegend, getFormattedNoDataConfiguration, getFormattedSeries, setFormattedAxisLabels, setFormattedAxisTitle } from './KnowageHighchartsCommonUpdater'
import * as highchartsDefaultValues from '../../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'
import { hexToRgba } from '@/modules/documentExecution/dashboard/helpers/FormattingHelpers'

export const updateRadarChartModel = (oldModel: any, newModel: IHighchartsChartModel) => {
    console.log('   ----- OLD CHART MODEL: ', oldModel)
    getFormattedNoDataConfiguration(oldModel, newModel)
    getFormattedAxisSettings(oldModel, newModel, 'x')
    getFormattedAxisSettings(oldModel, newModel, 'y')
    getFormattedLegend(oldModel, newModel)
    getFormattedSeries(oldModel, newModel, null)

    console.log('   ----- NEW CHART MODEL: ', newModel)
    return newModel
}


const getFormattedAxisSettings = (oldModel: any, newModel: IHighchartsChartModel, axis: 'x' | 'y') => {
    const oldAxis = axis === 'x' ? oldModel.CHART.AXES_LIST.AXIS[1] : oldModel.CHART.AXES_LIST.AXIS[0]
    const newModelAxis = axis === 'x' ? highchartsDefaultValues.getDefaultRadarXAxis() : highchartsDefaultValues.getDefaultRadarYAxis()
    if (!oldAxis) return
    setFormattedAxisLabels(oldAxis, newModelAxis)
    setFormattedAxisTitle(oldAxis, newModelAxis)
    if (axis === 'y') setYAxisGridSettings(oldAxis, newModelAxis)

    axis === 'x' ? setXAxisSpecificValues(newModelAxis) : setYAxisSpecificValues(newModelAxis)
    axis === 'x' ? newModel.xAxis = newModelAxis : newModel.yAxis = newModelAxis
}

const setXAxisSpecificValues = (newModelAxis: any) => {
    newModelAxis.type = "category"
}

const setYAxisSpecificValues = (newModelAxis: any) => {
    newModelAxis.plotBands = []
    newModelAxis.plotLines = []
    newModelAxis.min = 0
}


const setYAxisGridSettings = (oldAxis: any, newModelAxis: any) => {
    if (oldAxis.MAJORGRID) {
        newModelAxis.tickInterval = oldAxis.MAJORGRID.interval ?? null
        newModelAxis.gridLineDashStyle = getFormattedGridLineStyle(oldAxis.MINORGRID.style?.typeline) ? '' : ''
        newModelAxis.gridLineColor = oldAxis.MAJORGRID.style?.color ? hexToRgba(oldAxis.MAJORGRID.style.color) : ''
    }

    if (oldAxis.MINORGRID) {
        newModelAxis.minorTickInterval = oldAxis.MINORGRID.interval ?? null
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