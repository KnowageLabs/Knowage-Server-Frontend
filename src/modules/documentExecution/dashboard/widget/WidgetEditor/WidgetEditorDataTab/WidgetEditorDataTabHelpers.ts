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

export const changeChartType = (chartType: string, widget: IWidget, isEnterprise: boolean) => {
    const selectedThemeId = widget.settings?.style?.themeId ?? null
    delete widget.invalid
    const tempWidgetColors = widget.settings.chartModel?.model?.colors && widget.settings.chartModel.model.colors.length > 0 ? [...widget.settings.chartModel.model.colors] : [...descriptor.defaultColors]
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
        applyAxis(widget.settings.chartModel)
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
    const dashStore = dashboardStore()

    const themes = dashStore.getAllThemes()
    const selectedTheme = themes.find((theme: IDashboardTheme) => theme.id === selectedThemeId)
    if (!selectedTheme) return
    applyStylesToWidget(widget.settings.style, selectedTheme, selectedTheme.config['chart'])
}

const applyAxis = (chartModel: any) => {
    //bar
    if (typeof chartModel.setBarXAxis === 'function') {
        chartModel.setBarXAxis()
    }
    if (typeof chartModel.setBarYAxis === 'function') {
        chartModel.setBarYAxis()
    }
    //bubble
    if (typeof chartModel.setBubbleXAxis === 'function') {
        chartModel.setBubbleXAxis()
    }
    if (typeof chartModel.setBubbleYAxis === 'function') {
        chartModel.setBubbleYAxis()
    }
    //chord
    if (typeof chartModel.setChordXAxis === 'function') {
        chartModel.setChordXAxis()
    }
    if (typeof chartModel.setChordYAxis === 'function') {
        chartModel.setChordYAxis()
    }
    //dumbbell
    if (typeof chartModel.setDumbbellXAxis === 'function') {
        chartModel.setDumbbellXAxis()
    }
    if (typeof chartModel.setDumbbellYAxis === 'function') {
        chartModel.setDumbbellYAxis()
    }
    //gauge
    if (typeof chartModel.setGaugeYAxis === 'function') {
        chartModel.setGaugeYAxis()
    }
    //heatmap
    if (typeof chartModel.setHeatmapXAxis === 'function') {
        chartModel.setHeatmapXAxis()
    }
    if (typeof chartModel.setHeatmapYAxis === 'function') {
        chartModel.setHeatmapYAxis()
    }
    //line
    if (typeof chartModel.setLineXAxis === 'function') {
        chartModel.setLineXAxis()
    }
    if (typeof chartModel.setLineYAxis === 'function') {
        chartModel.setLineYAxis()
    }
    //packedBubble
    if (typeof chartModel.setPackedBubbleXAxis === 'function') {
        chartModel.setPackedBubbleXAxis()
    }
    if (typeof chartModel.setPackedBubbleYAxis === 'function') {
        chartModel.setPackedBubbleYAxis()
    }
    //parallel
    if (typeof chartModel.setParallelXAxis === 'function') {
        chartModel.setParallelXAxis()
    }
    if (typeof chartModel.setParallelYAxis === 'function') {
        chartModel.setParallelYAxis()
    }
    //pictorial
    if (typeof chartModel.setPictorialXAxis === 'function') {
        chartModel.setPictorialXAxis()
    }
    if (typeof chartModel.setPictorialYAxis === 'function') {
        chartModel.setPictorialYAxis()
    }
    //radar
    if (typeof chartModel.setRadarXAxis === 'function') {
        chartModel.setRadarXAxis()
    }
    if (typeof chartModel.setRadarYAxis === 'function') {
        chartModel.setRadarYAxis()
    }
    //scatter
    if (typeof chartModel.setScatterXAxis === 'function') {
        chartModel.setScatterXAxis()
    }
    if (typeof chartModel.setScatterYAxis === 'function') {
        chartModel.setScatterYAxis()
    }
    //streamGraph
    if (typeof chartModel.setStreamgraphXAxis === 'function') {
        chartModel.setStreamgraphXAxis()
    }
    if (typeof chartModel.setStreamgraphYAxis === 'function') {
        chartModel.setStreamgraphYAxis()
    }
    //sunburst
    if (typeof chartModel.setSunburstXAxis === 'function') {
        chartModel.setSunburstXAxis()
    }
    if (typeof chartModel.setSunburstYAxis === 'function') {
        chartModel.setSunburstYAxis()
    }
    //waterfall
    if (typeof chartModel.setWaterfallXAxis === 'function') {
        chartModel.setWaterfallXAxis()
    }
    if (typeof chartModel.setWaterfallYAxis === 'function') {
        chartModel.setWaterfallYAxis()
    }
}
