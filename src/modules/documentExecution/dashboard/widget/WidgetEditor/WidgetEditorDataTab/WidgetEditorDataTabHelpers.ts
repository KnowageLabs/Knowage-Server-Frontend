import { IWidget } from '../../../Dashboard'
import { createChartJSModel, createNewChartJSSettings } from '../helpers/chartWidget/chartJS/ChartJSHelpers'
import { createNewHighchartsModel, createNewHighchartsSettings } from '../helpers/chartWidget/highcharts/HighchartsHelpers'
import { createNewVegaSettings, createVegaModel } from '../helpers/chartWidget/vega/VegaHelpers'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { applyStylesToWidget } from '../../../generalSettings/themes/ThemesHelper'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { IDashboardTheme } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import descriptor from '../WidgetEditorSettingsTab/ChartWidget/common/ChartColorSettingsDescriptor.json'
import useStore from '@/App.store'

const store = useStore()
const dashStore = dashboardStore()

export const changeChartType = (chartType: string, widget: IWidget, isEnterprise: boolean) => {
    const selectedThemeId = widget.settings?.style?.themeId ?? null
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

    if (store.isEnterprise) widget.settings.style.themeId = selectedThemeId
    widget.settings.style = originalChartStyle
    if (store.isEnterprise) reapplyThemeToChartWidget(widget, selectedThemeId)

    emitter.emit('chartTypeChanged', widget)
    emitter.emit('refreshWidgetWithData', widget.id)
}

const reapplyThemeToChartWidget = (widget: IWidget, selectedThemeId: number | null) => {
    const themes = dashStore.getAllThemes()
    const selectedTheme = themes.find((theme: IDashboardTheme) => theme.id === selectedThemeId)
    if (!selectedTheme) return
    applyStylesToWidget(widget.settings.style, selectedTheme, selectedTheme.config['chart'])
}
