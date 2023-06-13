import { IHighchartsChartModel } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { getFormatted3DConfiguration, getFormattedLabels, getFormattedLegend, getFormattedNoDataConfiguration, getFormattedSeries, getFormattedSonificationSettings, getFormattedTooltipSettings, setAxisGridSettings, setFormattedAxisLabels, setFormattedAxisTitle } from './KnowageHighchartsCommonUpdater'
import * as highchartsDefaultValues from '../../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'

export const updateBarChartModel = (oldModel: any, newModel: IHighchartsChartModel) => {
    getFormatted3DConfiguration(oldModel, newModel)
    getFormattedNoDataConfiguration(oldModel, newModel)
    getFormattedAxisSettings(oldModel, newModel, 'x')
    getFormattedAxisSettings(oldModel, newModel, 'y')
    getFormattedLegend(oldModel, newModel)
    getFormattedLabels(oldModel, newModel)
    getFormattedSeries(oldModel, newModel, null)
    getFormattedTooltipSettings(oldModel, newModel)
    getFormattedSonificationSettings(oldModel, newModel)

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
    axis === 'x' ? newModel.xAxis[0] = newModelAxis : newModel.yAxis[0] = newModelAxis
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