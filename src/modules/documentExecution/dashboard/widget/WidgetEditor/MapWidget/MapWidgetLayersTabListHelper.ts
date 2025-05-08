import { IMapWidgetLayer, IMapWidgetLayerProperty, IMapWidgetVisualizationType, IMapWidgetVisualizationTypeLegendSettings, IWidgetMapLayerColumn } from './../../../interfaces/mapWidget/DashboardMapWidget'
import { IWidget } from '../../../Dashboard'

export const removeLayerFromModel = (layer: IMapWidgetLayer, widgetModel: IWidget) => {
    removeLayerFromVizualizationTypes(layer, widgetModel)
    removeLayerFromLegend(layer, widgetModel)
}

const removeLayerFromVizualizationTypes = (layer: IMapWidgetLayer, widgetModel: IWidget) => {
    const visualizationTypes = (widgetModel.settings?.visualizations ?? []) as IMapWidgetVisualizationType[]
    widgetModel.settings.visualizations = visualizationTypes.filter((visType: IMapWidgetVisualizationType) => visType.target !== layer.layerId)
}
const removeLayerFromLegend = (layer: IMapWidgetLayer, widgetModel: IWidget) => {
    const visualizationTypes = (widgetModel.settings?.legend?.visualizationTypes ?? []) as IMapWidgetVisualizationTypeLegendSettings[]
    widgetModel.settings.legend.visualizationTypes = visualizationTypes.filter((visTypeLegend: IMapWidgetVisualizationTypeLegendSettings) => visTypeLegend.visualizationType?.target !== layer.layerId)
}

export const removeColumnFromModel = (selectedLayer: IMapWidgetLayer | null, column: IWidgetMapLayerColumn, widgetModel: IWidget | null) => {
    if (!selectedLayer || !widgetModel) return
    removeColumnFromVizualizationTypes(selectedLayer, column, widgetModel)
    removeColumnFromLegend(selectedLayer, column, widgetModel)
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
