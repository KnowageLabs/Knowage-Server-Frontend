import { IDashboardDataset, IWidget, ISelection, IDashboardConfiguration } from '../../../Dashboard'
import { getHighchartsBarData } from './dataProxy/HighchartsBarDataProxy'
import { getHighchartsBubbleData } from './dataProxy/HighchartsBubbleDataProxy'
import { getHighchartsGaugeData } from './dataProxy/HighchartsGaugeDataProxy'
import { getHighchartsPieData } from './dataProxy/HighchartsPieDataProxy'
import { getHighchartsScatterData } from './dataProxy/HighchartsScatterDataProxy'
import { getHighchartsSunburstData } from './dataProxy/HighchartsSunburstDataProxy'

export const getHighchartsWidgetData = async (dashboardId, dashboardConfig: IDashboardConfiguration, widget: IWidget, datasets: IDashboardDataset[], $http: any, initialCall: boolean, selections: ISelection[], associativeResponseSelections?: any) => {
    const chartType = widget.settings.chartModel?.model?.chart.type
    switch (chartType) {
        case 'area':
        case 'bar':
        case 'column':
        case 'line':
        case 'radar':
            return await getHighchartsBarData(dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'scatter':
            return await getHighchartsScatterData(dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'sunburst':
        case 'treemap':
        case 'heatmap':
        case 'wordcloud':
        case 'spline':
        case 'dependencywheel':
        case 'pictorial':
        case 'sankey':
        case 'funnel':
            return await getHighchartsSunburstData(dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'pie':
            return await getHighchartsPieData(dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'gauge':
        case 'activitygauge':
        case 'solidgauge':
            return await getHighchartsGaugeData(dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        case 'bubble':
            return await getHighchartsBubbleData(dashboardId, dashboardConfig, widget, datasets, $http, initialCall, selections, associativeResponseSelections)
        default:
            return ''
    }
}
