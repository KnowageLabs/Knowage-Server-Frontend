import { IHighchartsChartModel } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { getFormattedLabels, getFormattedLegend, getFormattedNoDataConfiguration, getFormattedSeries, getFormattedTooltipSettings, setAxisGridSettings, setFormattedAxisLabels, setFormattedAxisTitle } from './KnowageHighchartsCommonUpdater'
import * as highchartsDefaultValues from '../../../../WidgetEditor/helpers/chartWidget/highcharts/HighchartsDefaultValues'

export const updateBubbleChartModel = (oldModel: any, newModel: IHighchartsChartModel) => {
    console.log('------ OLD BUBBLE MODEL: ', oldModel)
    getFormattedNoDataConfiguration(oldModel, newModel)
    getFormattedAxisSettings(oldModel, newModel, 'x')
    getFormattedAxisSettings(oldModel, newModel, 'y')
    getFormattedLegend(oldModel, newModel)
    getFormattedLabels(oldModel, newModel)
    getFormattedSeries(oldModel, newModel, null)
    getFormattedTooltipSettings(oldModel, newModel)
    console.log('------ NEW BUBBLE MODEL: ', newModel)

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
