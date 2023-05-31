import { IDashboardDataset, IWidget, ISelection } from '../../../Dashboard'
import { getChartJSBarData } from './dataProxy/ChartJSBarDataProxy'

export const getChartJSWidgetData = async (dashboardId, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const chartType = widget.settings.chartModel?.model?.chart.type
    console.log('chartType', chartType)
    switch (chartType) {
        case 'line':
        case 'area':
        case 'bar':
        case 'column':
        case 'pie':
            console.log(' CHART JS DATA PROXY -----------')
            return await getChartJSBarData(dashboardId, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        default:
            return ''
    }
}
