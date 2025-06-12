import { IMapDialogSettings, IMapDialogSettingsProperty, IMapTooltipSettings, IMapTooltipSettingsLayer, IMapWidgetLayer, IMapWidgetLayerProperty, IMapWidgetSelection, IMapWidgetSelectionConfiguration, IMapWidgetVisualizationType, IMapWidgetVisualizationTypeLegendSettings, IWidgetMapLayerColumn } from './../../../interfaces/mapWidget/DashboardMapWidget'
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
    tooltipSettings.layers = tooltipSettings.layers.filter((tooltipLayerSettings: IMapTooltipSettingsLayer) => tooltipLayerSettings.name !== layer.layerId)
}

const removeLayerFromDialog = (layer: IMapWidgetLayer, widgetModel: IWidget) => {
    if (!widgetModel.settings || !widgetModel.settings.dialog) return
    const dialogSettings = widgetModel.settings.dialog as IMapDialogSettings
    dialogSettings.layers = dialogSettings.layers.filter((dialogLayerSettings: IMapDialogSettingsProperty) => dialogLayerSettings.name !== layer.layerId)
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
    removeColumnFromSelections(selectedLayer, column, widgetModel)

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
    tooltipSettings.layers.forEach((tooltipLayerSettings: IMapTooltipSettingsLayer) => {
        if (tooltipLayerSettings.name !== layer.layerId) return
        tooltipLayerSettings.columns = tooltipLayerSettings.columns.filter((columnName: string) => columnName !== column.name)
    })
}

const removeColumnFromTooltips = (layer: IMapWidgetLayer, column: IWidgetMapLayerColumn, widgetModel: IWidget) => {
    if (!widgetModel.settings || !widgetModel.settings.dialog) return
    const dialogSettings = widgetModel.settings.dialog as IMapDialogSettings
    dialogSettings.layers.forEach((dialogSettingsLayerSettings: IMapTooltipSettingsLayer) => {
        if (dialogSettingsLayerSettings.name !== layer.layerId) return
        dialogSettingsLayerSettings.columns = dialogSettingsLayerSettings.columns.filter((columnName: string) => columnName !== column.name)
    })
}

const removeColumnFromSelections = (layer: IMapWidgetLayer, column: IWidgetMapLayerColumn, widgetModel: IWidget) => {
    if (!widgetModel.settings || !widgetModel.settings.interactions?.selection) return
    const selectionConfiguration = widgetModel.settings.interactions.selection as IMapWidgetSelectionConfiguration
    selectionConfiguration.selections.forEach((selectionConfig: IMapWidgetSelection) => {
        if (selectionConfig.vizualizationType?.target !== layer.layerId) return
        if (selectionConfig.column === column.name) selectionConfig.column = ''
    })
}
