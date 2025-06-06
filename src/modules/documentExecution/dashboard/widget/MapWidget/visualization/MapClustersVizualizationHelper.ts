import { IVariable, IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { addMarkersOrClustersFromData, createMarkerForVisualization, getMappedDataAndColumnIndex } from './MapMarkersVizualizationHelper'
import L from 'leaflet'
import * as mapWidgetDefaultValues from '../../WidgetEditor/helpers/mapWidget/MapWidgetDefaultValues'

export const addClusters = (data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], layersData: any, targetDatasetData: any, variables: IVariable[], clusters: any) => {
    if (data && data[target.name]) {
        addClustersFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, clusters, variables)
    } else {
        addClustersUsingLayers(targetDatasetData, layersData, dataColumn, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds, model, clusters, variables)
    }
}

export const createClusterGroup = (layerVisualizationSettings: IMapWidgetVisualizationType, target: IMapWidgetLayer) => {
    const defaultClusterConfiguration = mapWidgetDefaultValues.getDefaultVisualizationClusterConfiguration()
    const maxClusterRadius = layerVisualizationSettings.clusterConf?.maxClusterRadius ?? defaultClusterConfiguration.maxClusterRadius
    const clusterIconRadius = layerVisualizationSettings?.clusterConf?.radiusSize ?? defaultClusterConfiguration.radiusSize
    const clusterIconFontSize = layerVisualizationSettings?.clusterConf?.style?.['font-size'] ?? defaultClusterConfiguration.style['font-size']
    const clusterIconFontColor = layerVisualizationSettings?.clusterConf?.style?.color ?? defaultClusterConfiguration.style.color
    const clusterIconBackgroundColor = layerVisualizationSettings?.clusterConf?.style?.['background-color'] ?? defaultClusterConfiguration.style['background-color']

    const clusters = L.markerClusterGroup({
        maxClusterRadius: maxClusterRadius,
        iconCreateFunction: function (cluster) {
            return L.divIcon({
                html: `<div style="
                    font-size: ${clusterIconFontSize};
                    background-color: ${clusterIconBackgroundColor};
                    color: ${clusterIconFontColor};
                    width: ${clusterIconRadius}px;
                    height: ${clusterIconRadius}px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                     user-select: none;">
                    ${cluster.getChildCount()}
                </div>`,
                className: 'custom-cluster-icon',
                iconSize: L.Point(clusterIconRadius, clusterIconRadius)
            })
        }
    })

    clusters.knProperties = { cluster: true, layerId: target.layerId }

    return clusters
}

const addClustersFromData = (data: any, widgetModel: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], clusters: any, variables: IVariable[]) => {
    addMarkersOrClustersFromData(data, widgetModel, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, variables, clusters)
}

const addClustersUsingLayers = (targetDatasetData: any | null, layersData: any, dataColumn: string | null, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget, clusters: any, variables: IVariable[]) => {
    const { mappedData, dataColumnIndex } = getMappedDataAndColumnIndex(targetDatasetData, dataColumn, layerVisualizationSettings)

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Point') {
            addClusterUsingLayersFeature(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, clusters, null, variables, dataColumnIndex)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addClusterUsingLayersFeature(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, clusters, coord, variables, dataColumnIndex)
            })
        }
    })
    layerGroup.addLayer(clusters)
}

const addClusterUsingLayersFeature = (feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, layerGroup: any, spatialAttribute: any, widgetModel: IWidget, markerBounds: any[], clusters: any, coord: any[] | null, variables: IVariable[], dataColumnIndex: string | null) => {
    const marker = createMarkerForVisualization(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, coord, variables, dataColumnIndex)
    if (marker) clusters.addLayer(marker)
}
