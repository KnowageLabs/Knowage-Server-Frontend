import { IVariable, IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { addMarker, centerTheMap, getColumnName, getCoordinates } from '../LeafletHelper'
import { addDialogToMarker, addDialogToMarkerForLayerData, addTooltipToMarker, addTooltipToMarkerForLayerData } from './MapDialogHelper'
import { getConditionalStyleUsingTargetDataset, getCoordinatesFromWktPointFeature, getFeatureValues, getTargetDataColumn, getTargetProperty, getVizualizationConditionalStyles, isConditionMet, transformDataUsingForeignKeyReturningAllColumns } from './MapVisualizationHelper'

// Showing markers from the data using geoColumn for the dataset, and property for the layer features (only Points allowed)
export const addMarkers = (
    map: any,
    data: any,
    model: IWidget,
    target: IMapWidgetLayer,
    dataColumn: string,
    spatialAttribute: any,
    geoColumn: string,
    layerGroup: any,
    layerVisualizationSettings: IMapWidgetVisualizationType,
    markerBounds: any[],
    layersData: any,
    targetDatasetData: any,
    variables: IVariable[],
    centerMap: boolean = true
) => {
    if (data && data[target.name]) {
        addMarkersFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, variables)
    } else {
        addMarkersUsingLayers(targetDatasetData, layersData, dataColumn, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds, model, variables)
    }

    if (centerMap) centerTheMap(map, markerBounds)
}

const addMarkersFromData = (data: any, widgetModel: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], variables: IVariable[]) => {
    addMarkersOrClustersFromData(data, widgetModel, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, variables)
}

export const addMarkersOrClustersFromData = (
    data: any,
    widgetModel: IWidget,
    target: IMapWidgetLayer,
    dataColumn: string,
    spatialAttribute: any,
    geoColumn: string,
    layerGroup: any,
    layerVisualizationSettings: IMapWidgetVisualizationType,
    markerBounds: any[],
    variables: IVariable[],
    clusters?: any
) => {
    for (const row of data[target.name].rows) {
        createAndAddMarkerFromData(row, data, widgetModel, target, layerVisualizationSettings, dataColumn, spatialAttribute, geoColumn, markerBounds, variables, layerGroup, clusters)
    }

    if (clusters) layerGroup.addLayer(clusters)
}

const createAndAddMarkerFromData = (
    row: any,
    data: any,
    widgetModel: IWidget,
    target: IMapWidgetLayer,
    layerVisualizationSettings: IMapWidgetVisualizationType,
    dataColumn: string,
    spatialAttribute: any,
    geoColumn: string,
    markerBounds: any[],
    variables: IVariable[],
    layerGroup: any,
    clusters?: any
) => {
    const dataColumnIndex = getTargetDataColumn(data[target.name], layerVisualizationSettings, dataColumn)
    const value = row[dataColumnIndex]

    const filter = layerVisualizationSettings.filter
    if (filter?.enabled && !isConditionMet(filter, value)) return null

    const conditionalStyle = getVizualizationConditionalStyles(widgetModel, layerVisualizationSettings.target, layerVisualizationSettings.targetMeasure, value, variables)
    const marker = addMarker(getCoordinates(spatialAttribute, row[geoColumn], null), layerGroup, layerVisualizationSettings.markerConf ?? null, row[dataColumnIndex], spatialAttribute, conditionalStyle?.['background-color'], conditionalStyle?.icon)

    addDialogToMarker(data, widgetModel, target, layerVisualizationSettings, row, marker)
    addTooltipToMarker(data, widgetModel, target, layerVisualizationSettings, row, marker)
    markerBounds.push(marker.getLatLng())

    clusters ? clusters.addLayer(marker) : layerGroup.addLayer(marker)

    return marker
}

const addMarkersUsingLayers = (targetDatasetData: any | null, layersData: any, dataColumn: string | null, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget, variables: IVariable[]) => {
    const { mappedData, dataColumnIndex } = getMappedDataAndColumnIndex(targetDatasetData, dataColumn, layerVisualizationSettings)

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Point') {
            addMarkerUsingLayersPoint(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, null, variables, dataColumnIndex)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addMarkerUsingLayersPoint(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, coord, variables, dataColumnIndex)
            })
        }
    })
}

export const getMappedDataAndColumnIndex = (targetDatasetData: any, dataColumn: string | null, layerVisualizationSettings: IMapWidgetVisualizationType): { mappedData: Record<string, number> | null; dataColumnIndex: string | null } => {
    let mappedData: Record<string, number> | null = null
    let dataColumnIndex = dataColumn

    if (targetDatasetData && dataColumn) {
        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetProperty, targetDatasetData)
        if (!foreignKeyColumnName) {
            throw new Error(`Foreign key column ${layerVisualizationSettings.targetProperty} is not present in the dataset`)
        }
        mappedData = transformDataUsingForeignKeyReturningAllColumns(targetDatasetData.rows, foreignKeyColumnName)
        dataColumnIndex = getTargetDataColumn(targetDatasetData, layerVisualizationSettings, dataColumn)
    }

    return { mappedData, dataColumnIndex }
}

const addMarkerUsingLayersPoint = (feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, layerGroup: any, spatialAttribute: any, widgetModel: IWidget, markerBounds: any[], coord: any[] | null, variables: IVariable[], dataColumnIndex: string | null) => {
    createMarkerForVisualization(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, coord, variables, dataColumnIndex)
}

export const createMarkerForVisualization = (
    feature: ILayerFeature,
    layerVisualizationSettings: IMapWidgetVisualizationType,
    mappedData: any,
    layerGroup: any,
    spatialAttribute: any,
    widgetModel: IWidget,
    markerBounds: any[],
    coord: any[] | null,
    variables: IVariable[],
    dataColumnIndex: string | null
) => {
    const { value } = getFeatureValues(feature, layerVisualizationSettings, mappedData, dataColumnIndex)

    const filter = layerVisualizationSettings.filter
    if (filter?.enabled && !isConditionMet(filter, value)) return null

    const conditionalStyle = getConditionalStyleUsingTargetDataset(layerVisualizationSettings, widgetModel, value, variables)
    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    const marker = addMarker(coordinates.reverse(), layerGroup, layerVisualizationSettings.markerConf ?? null, value as any, spatialAttribute, conditionalStyle?.['background-color'], conditionalStyle?.icon)

    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
    markerBounds.push(marker.getLatLng())

    return marker
}
