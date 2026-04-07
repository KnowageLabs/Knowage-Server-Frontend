import { IWidget } from "@/modules/documentExecution/dashboard/Dashboard"
import { IHighchartsAdvancedPropertySettings, IHighchartsChartModel } from "@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget"

export const formatHighchartsWidgetForSave = (widget: IWidget) => {
    widget.settings.chartModel = widget.settings.chartModel.model
    if (!widget.settings.chartModel) return
    removeChartData(widget.settings.chartModel)
    formatPiePlotOptions(widget.settings.chartModel)
    formatLegendSettings(widget.settings.chartModel)
    formatTooltipSettings(widget.settings.chartModel, widget.settings.advancedSettings)
}

const removeChartData = (chartModel: IHighchartsChartModel) => {
    chartModel.series = []
    delete chartModel.seriesForRender
}

const formatPiePlotOptions = (chartModel: IHighchartsChartModel) => {
    if (!chartModel.plotOptions.pie) return
    delete chartModel.plotOptions.pie.dataLabels.formatterError
}

const formatLegendSettings = (chartModel: IHighchartsChartModel) => {
    delete chartModel.legend.labelFormatterError
}

const formatTooltipSettings = (chartModel: IHighchartsChartModel, advancedSettings: IHighchartsAdvancedPropertySettings[] = []) => {
    delete chartModel.tooltip.formatterError
    delete chartModel.tooltip.pointFormatterError

    const normalizedPaths = advancedSettings.map((s: IHighchartsAdvancedPropertySettings) => normalizePropertyPath(s.propertyPath))

    if (!normalizedPaths.includes('tooltip.pointFormat')) delete (chartModel.tooltip as any).pointFormat
    if (!normalizedPaths.includes('tooltip.shadow')) (chartModel.tooltip as any).shadow = true
    if (!normalizedPaths.includes('tooltip.backgroundColor') && !(chartModel.tooltip as any).backgroundColor) (chartModel.tooltip as any).backgroundColor = 'rgba(194,194,194, 1)'
}

const normalizePropertyPath = (propertyPath: string) => {
    return propertyPath.replace(/\[['"]?/g, '.').replace(/['"]?]/g, '').replace(/^\./, '').replace(/\s+/g, '')
}