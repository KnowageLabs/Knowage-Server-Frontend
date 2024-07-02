import { IDashboardDataset, IWidget, ISelection, IDashboardConfiguration } from '../../../Dashboard'
import { getChartJSBarData } from './dataProxy/ChartJSBarDataProxy'

export const getChartJSWidgetData = async (dashboardId, dashboardConfig: IDashboardConfiguration, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const chartType = widget.settings.chartModel?.model?.chart.type
    switch (chartType) {
        case 'line':
        case 'area':
        case 'bar':
        case 'column':
        case 'pie':
            return await getChartJSBarData(dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        default:
            return ''
    }
}
