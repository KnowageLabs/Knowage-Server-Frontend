import { IHighchartsChartModel } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import { getFormatted3DConfiguration, getFormattedLabels, getFormattedLegend, getFormattedNoDataConfiguration, getFormattedSeries, getFormattedTooltipSettings } from './KnowageHighchartsCommonUpdater'

export const updatePieChartModel = (oldModel: any, newModel: IHighchartsChartModel) => {
    getFormatted3DConfiguration(oldModel, newModel)
    getFormattedNoDataConfiguration(oldModel, newModel)
    getFormattedLegend(oldModel, newModel)
    getFormattedLabels(oldModel, newModel)
    getFormattedSeries(oldModel, newModel, 1)
    getFormattedTooltipSettings(oldModel, newModel)

    return newModel
}