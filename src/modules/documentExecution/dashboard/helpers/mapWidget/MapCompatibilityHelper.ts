import { IWidget, IWidgetResponsive, IWidgetExports, IWidgetInteractions, IDashboard, IDashboardDriver, IWidgetHelpSettings } from './../../Dashboard.d'
import { IMapTooltipSettings, IMapWidgetConditionalStyles, IMapWidgetCrossNavigation, IMapWidgetLayer, IMapWidgetLegend, IMapWidgetSelectionConfiguration, IMapWidgetSettings, IMapWidgetStyle, IMapWidgetVisualizationType } from './../../interfaces/mapWidget/DashboardMapWidget.d'
import { getFormattedStyle } from './MapStyleHelper'
import { hexToRgba } from '../FormattingHelpers'
import { getFormattedInteractions } from '../common/WidgetInteractionsHelper'
import { getFormattedLegendSettingsFromOldLayers, getFormattedSettingsFromLayers } from './MapLayersCompatibilityHelper'
import * as mapWidgetDefaultValues from '../../widget/WidgetEditor/helpers/mapWidget/MapWidgetDefaultValues'
import * as widgetCommonDefaultValues from '../../widget/WidgetEditor/helpers/common/WidgetCommonDefaultValues'

export const formatMapWidget = (widget: any, formattedDashboardModel: IDashboard, drivers: IDashboardDriver[]) => {
    const formattedWidget = {
        id: '' + widget.id,
        dataset: null,
        type: widget.type,
        columns: [],
        layers: getFormattedLayers(widget) as IMapWidgetLayer[],
        theme: '',
        settings: {} as IMapWidgetSettings
    } as IWidget
    formattedWidget.settings = getFormattedWidgetSettings(widget)
    getFormattedSettingsFromLayers(widget, formattedWidget, formattedDashboardModel, drivers)
    getFormattedLegendSettingsFromOldLayers(widget, formattedWidget)

    return formattedWidget
}

const getFormattedWidgetSettings = (widget: any) => {
    const formattedSettings = {
        configuration: getFormattedConfiguration(widget),
        visualizations: [] as IMapWidgetVisualizationType[],
        conditionalStyles: { enabled: false, conditions: [] } as IMapWidgetConditionalStyles,
        legend: mapWidgetDefaultValues.getDefaultLegendSettings() as IMapWidgetLegend,
        dialog: getFormattedDialogSettings(widget),
        interactions: { selection: { enabled: true, selections: [] } as IMapWidgetSelectionConfiguration, crossNavigation: { enabled: false, name: '', crossNavigationVizualizationTypes: [] } as IMapWidgetCrossNavigation },
        style: getFormattedStyle(widget) as IMapWidgetStyle,
        responsive: widgetCommonDefaultValues.getDefaultResponsivnes() as IWidgetResponsive,
        tooltips: mapWidgetDefaultValues.getDefaultMapTooltips() as IMapTooltipSettings,
        help: widgetCommonDefaultValues.getDefaultHelpSettings() as IWidgetHelpSettings
    } as IMapWidgetSettings
    return formattedSettings
}

const getFormattedLayers = (widget: any) => {
    return widget.content.layers
}

const getFormattedConfiguration = (widget: any) => {
    return {
        map: getFormattedMapLayer(widget),
        controlPanel: getFormattedControlPanel(widget),
        exports: { showExcelExport: widget.style?.showExcelExport ?? false, showScreenshot: widget.style?.showScreenshot ?? false } as IWidgetExports
    }
}

const getFormattedMapLayer = (widget: any) => {
    const formattedBaseLayer = mapWidgetDefaultValues.getDefaultMapLayerSettings()
    if (!widget.content) return formattedBaseLayer
    formattedBaseLayer.zoom = widget.content.zoom
    formattedBaseLayer.showScale = widget.content.showScale
    formattedBaseLayer.autoCentering = widget.content.autoCentering
    return formattedBaseLayer
}

const getFormattedControlPanel = (widget: any) => {
    const formattedControlPanel = mapWidgetDefaultValues.getDefaultControlPanelSettings()
    formattedControlPanel.alwaysShow = widget.controlPanelAlwaysOpen
    if (widget.style?.controlPanel) formattedControlPanel.dimension = widget.style.controlPanel.width
    return formattedControlPanel
}

const getFormattedDialogSettings = (widget: any) => {
    const formattedDialogSettings = mapWidgetDefaultValues.getDefaultDialogSettings()
    if (!widget.style || !widget.style.tooltip) return formattedDialogSettings

    if (widget.style.tooltip.text) {
        formattedDialogSettings.style['font-size'] = widget.style.tooltip.text['font-size']
        formattedDialogSettings.style.color = widget.style.tooltip.text.color ? hexToRgba(widget.style.tooltip.text.color) : ''
    }
    return formattedDialogSettings
}
