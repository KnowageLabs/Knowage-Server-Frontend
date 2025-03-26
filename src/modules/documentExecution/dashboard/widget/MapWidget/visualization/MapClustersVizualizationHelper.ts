import { IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import * as mapWidgetDefaultValues from '../../WidgetEditor/helpers/mapWidget/MapWidgetDefaultValues'
import L from 'leaflet'
import { addMarker, centerTheMap, getColumnName, getCoordinates } from '../LeafletHelper'
import { addDialogToMarker, addDialogToMarkerForLayerData, addTooltipToMarker, addTooltipToMarkerForLayerData } from './MapDialogHelper'
import { getCoordinatesFromWktPointFeature, transformDataUsingForeginKey } from './MapVisualizationHelper'

export const addClusters = (map: any, data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], layersData: any, targetDatasetData: any) => {
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
    if (data && data[target.name]) {
        addClustersFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, clusters)
    } else {
        addClustersUsingLayers(targetDatasetData, layersData, dataColumn, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds, model, clusters)
    }

    console.log('------- LAYER GROUP: ', layerGroup)
    centerTheMap(map, markerBounds)
}

const addClustersFromData = (data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], clusters: any) => {
    for (const row of data[target.name].rows) {
        const marker = addMarker(getCoordinates(spatialAttribute, row[geoColumn], null), layerGroup, layerVisualizationSettings.markerConf ?? null, row[dataColumn], spatialAttribute)
        addDialogToMarker(data, model, target, layerVisualizationSettings, row, marker)
        addTooltipToMarker(data, model, target, layerVisualizationSettings, row, marker)
        clusters.addLayer(marker)
        markerBounds.push(marker.getLatLng())
    }
    layerGroup.addLayer(clusters)
}

const addClustersUsingLayers = (targetDatasetData: any | null, layersData: any, dataColumn: string | null, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget, clusters: any) => {
    let mappedData: Record<string, number> | null = null

    if (targetDatasetData && dataColumn) {
        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetProperty, targetDatasetData)
        if (!foreignKeyColumnName) throw new Error(`Foreign key column ${layerVisualizationSettings.targetProperty} is not present in the dataset`)
        mappedData = transformDataUsingForeginKey(targetDatasetData.rows, foreignKeyColumnName, dataColumn)
    }

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Point') {
            addClusterUsingLayersFeature(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, clusters, null)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addClusterUsingLayersFeature(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, clusters, coord)
            })
        }
    })
    layerGroup.addLayer(clusters)
}

const addClusterUsingLayersFeature = (feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, layerGroup: any, spatialAttribute: any, widgetModel: IWidget, markerBounds: any[], clusters: any, coord: any[] | null) => {
    const valueKey = feature.properties[layerVisualizationSettings.targetProperty]
    const value = mappedData ? mappedData[valueKey] : valueKey

    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    const marker = addMarker(coordinates.reverse(), layerGroup, layerVisualizationSettings.markerConf ?? null, value as any, spatialAttribute)
    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
    clusters.addLayer(marker)
    markerBounds.push(marker.getLatLng())
}
