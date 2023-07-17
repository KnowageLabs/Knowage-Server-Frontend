import { IWidget } from "../../../Dashboard"
import { createChartJSModel, createNewChartJSSettings } from "../helpers/chartWidget/chartJS/ChartJSHelpers"
import { createNewHighchartsModel, createNewHighchartsSettings } from "../helpers/chartWidget/highcharts/HighchartsHelpers"
import { createNewVegaSettings, createVegaModel } from "../helpers/chartWidget/vega/VegaHelpers"
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

export const changeChartType = (chartType: string, widget: IWidget, isEnterprise: boolean) => {
    if (!widget) return

    delete widget.invalid

    // TODO widgetChange
    if (chartType === 'wordcloud') {
        widget.type = 'vega'
        widget.settings = createNewVegaSettings()
        widget.settings.chartModel = createVegaModel(widget, chartType)
    } else if (isEnterprise) {
        const oldChartModel = widget.settings.chartModel?.model
        const type = chartType.replace('Stacked', '')
        widget.type = 'highcharts'
        widget.settings = createNewHighchartsSettings()
        widget.settings.chartModel = createNewHighchartsModel(widget, type, oldChartModel, chartType.endsWith('Stacked'), chartType.endsWith('Inverted'))
    } else {
        widget.type = 'chartJS'
        widget.settings = createNewChartJSSettings()
        widget.settings.chartModel = createChartJSModel(chartType)
    }

    emitter.emit('chartTypeChanged', widget)
    emitter.emit('refreshWidgetWithData', widget.id)
}