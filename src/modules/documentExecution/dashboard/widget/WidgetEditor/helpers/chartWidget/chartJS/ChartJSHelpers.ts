import { IWidget, IWidgetHelpSettings } from '@/modules/documentExecution/dashboard/Dashboard'
import { IChartJSWidgetSettings } from '@/modules/documentExecution/dashboard/interfaces/chartJS/DashboardChartJSWidget'
import { KnowageChartJSPieChart } from '../../../../ChartWidget/classes/chartJS/KnowageChartJSPieChart'
import * as widgetCommonDefaultValues from '../../common/WidgetCommonDefaultValues'
import * as chartJSDefaultValues from '../chartJS/ChartJSDefaultValues'
import descriptor from '../../../WidgetEditorSettingsTab/ChartWidget/common/ChartColorSettingsDescriptor.json'
import { KnowageChartJSBarChart } from '../../../../ChartWidget/classes/chartJS/KnowageChartJSBarChart'
import { KnowageChartJSLineChart } from '../../../../ChartWidget/classes/chartJS/KnowageChartJSLineChart'

export const createNewChartJSSettings = () => {
    const settings = {
        updatable: true,
        clickable: true,
        chartModel: null,
        configuration: { exports: { showExcelExport: true, showScreenshot: true } },
        interactions: {
            crossNavigation: widgetCommonDefaultValues.getDefaultCrossNavigation(),
            link: widgetCommonDefaultValues.getDefaultLinks(),
            preview: widgetCommonDefaultValues.getDefaultPreview(),
            selection: chartJSDefaultValues.getDefaultChartJSSelections()
        },
        chart: { colors: descriptor.defaultColors },
        style: {
            themeId: null,
            title: widgetCommonDefaultValues.getDefaultTitleStyle(),
            padding: widgetCommonDefaultValues.getDefaultPaddingStyle(),
            borders: widgetCommonDefaultValues.getDefaultBordersStyle(),
            shadows: widgetCommonDefaultValues.getDefaultShadowsStyle(),
            background: widgetCommonDefaultValues.getDefaultBackgroundStyle()
        },
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes(),
        help: widgetCommonDefaultValues.getDefaultHelpSettings() as IWidgetHelpSettings
    } as IChartJSWidgetSettings
    settings.chartModel = null
    return settings
}

export const formatChartJSWidget = (widget: IWidget) => {
    const chartModel = widget.settings.chartModel.model ?? widget.settings.chartModel
    const chartType = chartModel.chart.type

    switch (chartType) {
        case 'pie':
            widget.settings.chartModel = new KnowageChartJSPieChart(chartModel)
            break
        case 'bar':
            widget.settings.chartModel = new KnowageChartJSBarChart(chartModel)
            break
        case 'line':
            widget.settings.chartModel = new KnowageChartJSLineChart(chartModel)
            break
    }
}

export const createChartJSModel = (chartType: string) => {
    switch (chartType) {
        case 'pie':
            return new KnowageChartJSPieChart(null)
        case 'bar':
            return new KnowageChartJSBarChart(null)
        case 'line':
            return new KnowageChartJSLineChart(null)
        default:
            return null
    }
}
