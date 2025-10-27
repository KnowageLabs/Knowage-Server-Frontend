import {
    IMapDialogSettings,
    IMapTooltipSettings,
    IMapTooltipSettingsVisualizations,
    IMapWidgetCrossNavigation,
    IMapWidgetLayer,
    IMapWidgetLayerProperty,
    IMapWidgetLinkConfiguration,
    IMapWidgetLinkVisualizationTypeConfig,
    IMapWidgetPreview,
    IMapWidgetPreviewVisualizationTypeConfig,
    IMapWidgetSelection,
    IMapWidgetSelectionConfiguration,
    IMapWidgetVisualizationType,
    IMapWidgetVisualizationTypeLegendSettings,
    IWidgetMapLayerColumn
} from './../../../interfaces/mapWidget/DashboardMapWidget'
import { IWidget } from '../../../Dashboard'
import * as mapWidgetDefaultValues from '../helpers/mapWidget/MapWidgetDefaultValues'

export const removeLayerFromModel = (layer: IMapWidgetLayer, widgetModel: IWidget) => {
    removeLayerFromVizualizationTypes(layer, widgetModel)
    removeLayerFromLegend(layer, widgetModel)
    removeLayerFromTooltips(layer, widgetModel)
    removeLayerFromDialog(layer, widgetModel)
    removeLayerFromSelections(layer, widgetModel)
    layer.columns?.forEach((column: IWidgetMapLayerColumn) => removeColumnFromModel(layer, column, widgetModel))
}

const removeLayerFromVizualizationTypes = (layer: IMapWidgetLayer, widgetModel: IWidget) => {
    const visualizationTypes = (widgetModel.settings?.visualizations ?? []) as IMapWidgetVisualizationType[]
    widgetModel.settings.visualizations = visualizationTypes.filter((visType: IMapWidgetVisualizationType) => visType.target !== layer.layerId)
}
const removeLayerFromLegend = (layer: IMapWidgetLayer, widgetModel: IWidget) => {
    const visualizationTypes = (widgetModel.settings?.legend?.visualizationTypes ?? []) as IMapWidgetVisualizationTypeLegendSettings[]
    widgetModel.settings.legend.visualizationTypes = visualizationTypes.filter((visTypeLegend: IMapWidgetVisualizationTypeLegendSettings) => visTypeLegend.visualizationType?.target !== layer.layerId)
}

const removeLayerFromTooltips = (layer: IMapWidgetLayer, widgetModel: IWidget) => {
    if (!widgetModel.settings || !widgetModel.settings.tooltips) return
    const tooltipSettings = widgetModel.settings?.tooltips as IMapTooltipSettings
    console.log({ tooltipSettings })
    tooltipSettings.visualizations = tooltipSettings.visualizations.filter((tooltipLayerSettings: any) => (tooltipLayerSettings.target ?? tooltipLayerSettings.name) !== layer.layerId)
}

const removeLayerFromDialog = (layer: IMapWidgetLayer, widgetModel: IWidget) => {
    if (!widgetModel.settings || !widgetModel.settings.dialog) return
    const dialogSettings = widgetModel.settings.dialog as IMapDialogSettings
    dialogSettings.visualizations = dialogSettings.visualizations.filter((dialogWidgetSettings: any) => (dialogWidgetSettings.target ?? dialogWidgetSettings.name) !== layer.layerId)
}

export const removeLayerFromSelections = (layer: IMapWidgetLayer, widgetModel: IWidget) => {
    if (!widgetModel.settings || !widgetModel.settings.interactions?.selection) return
    const selectionConfiguration = widgetModel.settings.interactions.selection as IMapWidgetSelectionConfiguration
    selectionConfiguration.selections = selectionConfiguration.selections.filter((selectionConfig: IMapWidgetSelection) => selectionConfig.vizualizationType?.target !== layer.layerId)
}

export const removeColumnFromModel = (selectedLayer: IMapWidgetLayer | null, column: IWidgetMapLayerColumn, widgetModel: IWidget | null) => {
    if (!selectedLayer || !widgetModel) return
    removeColumnFromVizualizationTypes(selectedLayer, column, widgetModel)
    removeColumnFromLegend(selectedLayer, column, widgetModel)
    removeColumnFromDialogs(selectedLayer, column, widgetModel)
    removeColumnFromTooltips(selectedLayer, column, widgetModel)
    removeColumnFromInteractions(selectedLayer, column, widgetModel)

    if (widgetModel.settings.visualizations.length === 0) {
        widgetModel.settings.visualizations.push(mapWidgetDefaultValues.getDefaultVisualizationSettings()[0])
    }
}

const removeColumnFromVizualizationTypes = (layer: IMapWidgetLayer, column: IWidgetMapLayerColumn, widgetModel: IWidget) => {
    const visualizationTypes = (widgetModel.settings?.visualizations ?? []) as IMapWidgetVisualizationType[]
    visualizationTypes.forEach((visType: IMapWidgetVisualizationType) => {
        removeColumnFromVizualizationType(layer, column, visType)
    })
}
const removeColumnFromLegend = (layer: IMapWidgetLayer, column: IWidgetMapLayerColumn, widgetModel: IWidget) => {
    const visualizationTypes = (widgetModel.settings?.legend?.visualizationTypes ?? []) as IMapWidgetVisualizationTypeLegendSettings[]
    visualizationTypes.forEach((visType: IMapWidgetVisualizationTypeLegendSettings) => {
        if (!visType.visualizationType || visType.visualizationType.target !== layer.layerId) return
        removeColumnFromVizualizationType(layer, column, visType.visualizationType)
    })
}

const removeColumnFromVizualizationType = (layer: IMapWidgetLayer, column: IWidgetMapLayerColumn, visType: IMapWidgetVisualizationType) => {
    if (visType.target !== layer.layerId) return
    if (visType.properties) visType.properties = visType.properties.filter((tempProperty: IMapWidgetLayerProperty) => tempProperty.property !== column.name)
    if (visType.targetMeasure && visType.targetMeasure === column.name) visType.targetMeasure = ''
    if (visType.chartMeasures) visType.chartMeasures = visType.chartMeasures.filter((chartMeasure: string) => chartMeasure !== column.name)
}

const removeColumnFromDialogs = (layer: IMapWidgetLayer, column: IWidgetMapLayerColumn, widgetModel: IWidget) => {
    if (!widgetModel.settings || !widgetModel.settings.tooltips) return
    const tooltipSettings = widgetModel.settings?.tooltips as IMapTooltipSettings
    tooltipSettings.visualizations.forEach((tooltipLayerSettings: IMapTooltipSettingsVisualizations) => {
        if (((tooltipLayerSettings as any).target ?? (tooltipLayerSettings as any).name) !== layer.layerId) return
        tooltipLayerSettings.columns = tooltipLayerSettings.columns.filter((columnName: string) => columnName !== column.name)
    })
}

const removeColumnFromTooltips = (layer: IMapWidgetLayer, column: IWidgetMapLayerColumn, widgetModel: IWidget) => {
    if (!widgetModel.settings || !widgetModel.settings.dialog) return
    const dialogSettings = widgetModel.settings.dialog as IMapDialogSettings
    dialogSettings.visualizations.forEach((dialogSettingsLayerSettings: IMapTooltipSettingsVisualizations) => {
        if (((dialogSettingsLayerSettings as any).target ?? (dialogSettingsLayerSettings as any).name) !== layer.layerId) return
        dialogSettingsLayerSettings.columns = dialogSettingsLayerSettings.columns.filter((columnName: string) => columnName !== column.name)
    })
}

const removeColumnFromInteractions = (layer: IMapWidgetLayer, column: IWidgetMapLayerColumn, widgetModel: IWidget) => {
    removeColumnFromSelections(layer, column, widgetModel)
    removeColumnFromCrossNavigation(layer, column, widgetModel)
    removeColumnFromLinks(layer, column, widgetModel)
    removeColumnFromPreview(layer, column, widgetModel)
}

const removeColumnFromSelections = (layer: IMapWidgetLayer, column: IWidgetMapLayerColumn, widgetModel: IWidget) => {
    if (!widgetModel.settings || !widgetModel.settings.interactions?.selection) return
    const selectionConfiguration = widgetModel.settings.interactions.selection as IMapWidgetSelectionConfiguration
    selectionConfiguration.selections.forEach((selectionConfig: IMapWidgetSelection) => {
        if (selectionConfig.vizualizationType?.target !== layer.layerId) return
        if (selectionConfig.column === column.name) selectionConfig.column = ''
    })
}

const removeColumnFromCrossNavigation = (layer: IMapWidgetLayer, column: IWidgetMapLayerColumn, widgetModel: IWidget) => {
    if (!widgetModel.settings || !widgetModel.settings.interactions?.interactions) return
    const crossNavigationConfiguration = (widgetModel?.settings?.interactions?.crossNavigation ?? null) as IMapWidgetCrossNavigation | null
    crossNavigationConfiguration?.crossNavigationVizualizationTypes.forEach((cfg: any) => {
        if (cfg.vizualizationType?.target !== layer.layerId) return
        if (cfg.column === column.name) cfg.column = ''
    })
}

const removeColumnFromLinks = (layer: IMapWidgetLayer, column: IWidgetMapLayerColumn, widgetModel: IWidget) => {
    if (!widgetModel.settings || !widgetModel.settings.interactions?.link) return
    const linkConfiguration = (widgetModel?.settings?.interactions?.link ?? null) as IMapWidgetLinkConfiguration | null
    linkConfiguration?.linkVizualizationTypes.forEach((linkConfig: IMapWidgetLinkVisualizationTypeConfig) => {
        if (linkConfig.vizualizationType?.target !== layer.layerId) return
        if (linkConfig.column === column.name) linkConfig.column = ''
    })
}

const removeColumnFromPreview = (layer: IMapWidgetLayer, column: IWidgetMapLayerColumn, widgetModel: IWidget) => {
    if (!widgetModel.settings || !widgetModel.settings.interactions?.preview) return
    const previewConfiguration = widgetModel.settings.interactions.preview as IMapWidgetPreview | null
    previewConfiguration?.previewVizualizationTypes.forEach((previewConfig: IMapWidgetPreviewVisualizationTypeConfig) => {
        if (previewConfig.vizualizationType?.target !== layer.layerId) return
        if (previewConfig.column === column.name) previewConfig.column = ''
    })
}
