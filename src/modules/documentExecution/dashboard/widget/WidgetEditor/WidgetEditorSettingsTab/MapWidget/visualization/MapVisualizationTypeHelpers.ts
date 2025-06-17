import { IWidget } from '../../../../../Dashboard'
import { IMapWidgetCrossNavigation, IMapWidgetLegend, IMapWidgetLinkConfiguration, IMapWidgetPreview, IMapWidgetSelectionConfiguration, IMapWidgetVisualizationType, IMapWidgetVisualizationTypeLegendSettings } from '../../../../../interfaces/mapWidget/DashboardMapWidget'

export const removeVisualizationTypeFromModel = (visualizationType: IMapWidgetVisualizationType, widgetModel: IWidget) => {
    removeVisualizationTypeLegendOption(visualizationType, widgetModel)
    removeVisualizationTypeFromInteractions(visualizationType, widgetModel)
}

const removeVisualizationTypeLegendOption = (visualizationType: IMapWidgetVisualizationType, widgetModel: IWidget) => {
    const mapLegend = widgetModel?.settings?.legend as IMapWidgetLegend | undefined
    if (!mapLegend) return
    const index = mapLegend.visualizationTypes.findIndex((visualizationTypeLegendSettings: IMapWidgetVisualizationTypeLegendSettings) => visualizationTypeLegendSettings.visualizationType?.id === visualizationType.id)
    if (index !== -1) mapLegend.visualizationTypes.splice(index, 1)
}

const removeVisualizationTypeFromInteractions = (visualizationType: IMapWidgetVisualizationType, widgetModel: IWidget) => {
    removeVisualizationTypeFromSelections(visualizationType, widgetModel)
    removeVisualizationTypeFromCrossNavigation(visualizationType, widgetModel)
    removeVisualizationTypeFromLink(visualizationType, widgetModel)
    removeVisualizationTypeFromPreview(visualizationType, widgetModel)
}

const removeVisualizationTypeFromSelections = (visualizationType: IMapWidgetVisualizationType, widgetModel: IWidget) => {
    const selectionConfiguration = (widgetModel?.settings?.interactions?.selection ?? null) as IMapWidgetSelectionConfiguration | null
    if (!selectionConfiguration) return

    for (let i = selectionConfiguration.selections.length - 1; i >= 0; i--) {
        if (visualizationType.id === selectionConfiguration.selections[i].vizualizationType?.id) selectionConfiguration.selections.splice(i, 1)
    }
}

const removeVisualizationTypeFromCrossNavigation = (visualizationType: IMapWidgetVisualizationType, widgetModel: IWidget) => {
    const crossNavigationConfiguration = (widgetModel?.settings?.interactions?.crossNavigation ?? null) as IMapWidgetCrossNavigation | null
    if (!crossNavigationConfiguration) return

    for (let i = crossNavigationConfiguration.crossNavigationVizualizationTypes.length - 1; i >= 0; i--) {
        if (visualizationType.id === crossNavigationConfiguration.crossNavigationVizualizationTypes[i].vizualizationType?.id) crossNavigationConfiguration.crossNavigationVizualizationTypes.splice(i, 1)
    }
}

const removeVisualizationTypeFromLink = (visualizationType: IMapWidgetVisualizationType, widgetModel: IWidget) => {
    const linkConfiguration = (widgetModel?.settings?.interactions?.link ?? null) as IMapWidgetLinkConfiguration | null
    if (!linkConfiguration) return

    for (let i = linkConfiguration.linkVizualizationTypes.length - 1; i >= 0; i--) {
        if (visualizationType.id === linkConfiguration.linkVizualizationTypes[i].vizualizationType?.id) linkConfiguration.linkVizualizationTypes.splice(i, 1)
    }
}

const removeVisualizationTypeFromPreview = (visualizationType: IMapWidgetVisualizationType, widgetModel: IWidget) => {
    const previewConfiguration = (widgetModel?.settings?.interactions?.preview ?? null) as IMapWidgetPreview | null
    if (!previewConfiguration) return

    for (let i = previewConfiguration.previewVizualizationTypes.length - 1; i >= 0; i--) {
        if (visualizationType.id === previewConfiguration.previewVizualizationTypes[i].vizualizationType?.id) previewConfiguration.previewVizualizationTypes.splice(i, 1)
    }
}
