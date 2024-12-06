import { IWidget } from '../../../Dashboard'
import { createChartJSModel, createNewChartJSSettings } from '../helpers/chartWidget/chartJS/ChartJSHelpers'
import { createNewHighchartsModel, createNewHighchartsSettings } from '../helpers/chartWidget/highcharts/HighchartsHelpers'
import { createNewVegaSettings, createVegaModel } from '../helpers/chartWidget/vega/VegaHelpers'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { applyStylesToWidget } from '../../../generalSettings/themes/ThemesHelper'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { IDashboardTheme } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import descriptor from '../WidgetEditorSettingsTab/ChartWidget/common/ChartColorSettingsDescriptor.json'

const dashStore = dashboardStore()

export const changeChartType = (chartType: string, widget: IWidget, isEnterprise: boolean) => {
    const selectedThemeName = widget.settings?.style?.themeName ?? ''
    delete widget.invalid
    const tempWidgetColors = widget.settings.chartModel?.model?.colors ? [...widget.settings.chartModel.model.colors] : [...descriptor.defaultColors]
    const originalChartStyle = widget.settings.style

    if (chartType === 'wordcloud') {
        widget.type = 'vega'
        widget.settings = createNewVegaSettings()
        widget.settings.chart.colors = tempWidgetColors
        widget.settings.chartModel = createVegaModel(widget, chartType)
    } else if (isEnterprise) {
        const oldChartModel = widget.settings.chartModel?.model
        const type = chartType.replace('Stacked', '')
        widget.type = 'highcharts'
        widget.settings = createNewHighchartsSettings()
        widget.settings.chart.colors = tempWidgetColors
        widget.settings.chartModel = createNewHighchartsModel(widget, type, oldChartModel, chartType.endsWith('Stacked'), chartType.endsWith('Inverted'), chartType.endsWith('Jitter'))
        widget.settings.chartModel.updateChartColorSettings(widget)
    } else {
        widget.type = 'chartJS'
        widget.settings = createNewChartJSSettings()
        widget.settings.chart.colors = tempWidgetColors
        widget.settings.chartModel = createChartJSModel(chartType)
    }

    widget.settings.style.themeName = selectedThemeName
    widget.settings.style = originalChartStyle
    reapplyThemeToChartWidget(widget, selectedThemeName)

    emitter.emit('chartTypeChanged', widget)
    emitter.emit('refreshWidgetWithData', widget.id)
}

const reapplyThemeToChartWidget = (widget: IWidget, selectedThemeName: string) => {
    const themes = dashStore.getAllThemes()
    const selectedTheme = themes.find((theme: IDashboardTheme) => theme.themeName === selectedThemeName)
    if (!selectedTheme) return
    applyStylesToWidget(widget.settings.style, selectedThemeName, selectedTheme.config['chart'])
}
