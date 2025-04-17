import { IWidget } from '../../../Dashboard'
import { IMapWidgetLayer, IMapWidgetVisualizationType, IMapWidgetVisualizationTypeLegendSettings } from '../../../interfaces/mapWidget/DashboardMapWidget'

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
