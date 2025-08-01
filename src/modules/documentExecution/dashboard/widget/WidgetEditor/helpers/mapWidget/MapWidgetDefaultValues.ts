import {
    IMapDialogSettings,
    IMapTooltipSettings,
    IMapWidgetConditionalStyle,
    IMapWidgetControlPanel,
    IMapWidgetCrossNavigation,
    IMapWidgetLayerFilter,
    IMapWidgetLegend,
    IMapWidgetLinkConfiguration,
    IMapWidgetMapSettings,
    IMapWidgetPreview,
    IMapWidgetSelectionConfiguration,
    IMapWidgetVisualizationType,
    IMapWidgetVisualizationTypeBalloons,
    IMapWidgetVisualizationTypeChoropleth,
    IMapWidgetVisualizationTypeCluster,
    IMapWidgetVisualizationTypeHeatmap,
    IMapWidgetVisualizationTypeLegendSettings,
    IMapWidgetVisualizationTypeMarker,
    IMapWidgetVisualizationTypePie
} from '@/modules/documentExecution/dashboard/interfaces/mapWidget/DashboardMapWidget'
import descriptor from './MapWidgetDefaultValuesDescriptor.json'
import deepcopy from 'deepcopy'

export const getDefaultMapTooltips = () => {
    return deepcopy(descriptor.defaultTooltip) as IMapTooltipSettings
}

export const getDefaultDialogSettings = () => {
    return deepcopy(descriptor.defaultDialogSettings) as IMapDialogSettings
}

export const getDefaultVisualizationTypeLegendSettings = () => {
    return deepcopy(descriptor.defaultVisualizationTypeLegendSettings) as IMapWidgetVisualizationTypeLegendSettings
}

export const getDefaultLegendSettings = () => {
    return deepcopy(descriptor.defaultLegendSettings) as IMapWidgetLegend
}

export const getDefaultMapLayerSettings = () => {
    return deepcopy(descriptor.defaultMapLayerSettings) as IMapWidgetMapSettings
}

export const getDefaultControlPanelSettings = () => {
    return deepcopy(descriptor.defaultControlPanelSettings) as IMapWidgetControlPanel
}

export const getDefaultConditionalStyle = () => {
    return deepcopy(descriptor.defaultConditionalStyle) as IMapWidgetConditionalStyle
}

export const getDefaultVisualizationSettings = () => {
    const visualizationSettings = [
        {
            id: crypto.randomUUID(),
            target: '',
            type: 'markers',
            visible: true,
            markerConf: getDefaultVisualizationMarkerConfiguration(),
            balloonConf: getDefaultVisualizationBalloonsConfiguration(),
            pieConf: getDefaultVisualizationPieConfiguration(),
            clusterConf: getDefaultVisualizationClusterConfiguration(),
            heatmapConf: getDefaultVisualizationHeatmapConfiguration(),
            analysisConf: getDefaultVisualizationChoroplethConfiguration()
        }
    ] as Array<IMapWidgetVisualizationType>
    return deepcopy(visualizationSettings)
}

export const getDefaultVisualizationMarkerConfiguration = () => {
    return deepcopy(descriptor.defaultVisualizationMarkerConfiguration) as IMapWidgetVisualizationTypeMarker
}

export const getDefaultVisualizationBalloonsConfiguration = () => {
    return deepcopy(descriptor.defaultVisualizationBalloonsConfiguration) as IMapWidgetVisualizationTypeBalloons
}

export const getDefaultVisualizationPieConfiguration = () => {
    return deepcopy(descriptor.defaultVisualizationPieConfiguration) as IMapWidgetVisualizationTypePie
}

export const getDefaultVisualizationClusterConfiguration = () => {
    return deepcopy(descriptor.defaultVisualizationClusterConfiguration) as IMapWidgetVisualizationTypeCluster
}

export const getDefaultVisualizationHeatmapConfiguration = () => {
    return deepcopy(descriptor.defaultVisualizationHeatmapConfiguration) as IMapWidgetVisualizationTypeHeatmap
}

export const getDefaultVisualizationChoroplethConfiguration = () => {
    const defaultFilter = getDefaultVisualizationMapFilter()
    return deepcopy({ ...descriptor.defaultVisualizationChoroplethConfiguration, filter: defaultFilter }) as IMapWidgetVisualizationTypeChoropleth
}

export const getDefaultVisualizationMapFilter = () => {
    return deepcopy(descriptor.defaultMapFilter) as IMapWidgetLayerFilter
}

export const getDefaultMapSelectionConfiguration = () => {
    return deepcopy(descriptor.defaultMapSelectionConfiguration) as IMapWidgetSelectionConfiguration
}

export const getDefaultMapCrossNavigationConfiguration = () => {
    return deepcopy(descriptor.defaultMapCrossNavigationConfiguration) as IMapWidgetCrossNavigation
}

export const getDefaultMapLinkConfiguration = () => {
    return deepcopy(descriptor.defaultMapLinkConfiguration) as IMapWidgetLinkConfiguration
}

export const getDefaultMapPreviewConfiguration = () => {
    return deepcopy(descriptor.defaultMapPreviewConfiguration) as IMapWidgetPreview
}
