import { IDashboardDataset, IWidget, ISelection } from '../../../Dashboard'
import { getPieChartData } from '../../../DataProxyHelper'
import { getHighchartsBarData } from './dataProxy/HighchartsBarDataProxy'
import { getHighchartsBubbleData } from './dataProxy/HighchartsBubbleDataProxy'
import { getHighchartsGaugeData } from './dataProxy/HighchartsGaugeDataProxy'
import { getHighchartsScatterData } from './dataProxy/HighchartsScatterDataProxy'
import { getHighchartsSunburstData } from './dataProxy/HighchartsSunburstDataProxy'

export const getHighchartsWidgetData = async (dashboardId, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const chartType = widget.settings.chartModel?.model?.chart.type
    console.log('CHART', widget)
    switch (chartType) {
        case 'area':
        case 'bar':
        case 'column':
        case 'line':
        case 'radar':
            return await getHighchartsBarData(dashboardId, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'scatter':
            return await getHighchartsScatterData(dashboardId, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'sunburst':
        case 'treemap':
        case 'heatmap':
        case 'wordcloud':
        case 'spline':
        case 'dependencywheel':
        case 'pictorial':
        case 'sankey':
            return await getHighchartsSunburstData(dashboardId, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'pie':
            return await getPieChartData(widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'gauge':
        case 'activitygauge':
        case 'solidgauge':
            return await getHighchartsGaugeData(dashboardId, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'bubble':
            return await getHighchartsBubbleData(dashboardId, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        default:
            return ''
    }
}
