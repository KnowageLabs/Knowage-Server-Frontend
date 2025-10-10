import { ISelection, IVariable, IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { addMarker, getColumnName, getCoordinates } from '../LeafletHelper'
import { addDialogToMarker, addDialogToMarkerForLayerData, addTooltipToMarker, addTooltipToMarkerForLayerData } from './MapDialogHelper'
import { getConditionalStyleUsingTargetDataset, getCoordinatesFromWktPointFeature, getFeatureValues, getTargetDataColumn, getVizualizationConditionalStyles, isConditionMet, transformDataUsingForeignKeyReturningAllColumns } from './MapVisualizationHelper'

// Showing markers from the data using geoColumn for the dataset, and property for the layer features (only Points allowed)
export const addMarkers = (data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], layersData: any, targetDatasetData: any, variables: IVariable[], activeSelections: ISelection[], dashboardId: string) => {
    if (data && data[target.label]) {
        addMarkersFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, variables, activeSelections, dashboardId)
    } else {
        addMarkersUsingLayers(targetDatasetData, layersData, dataColumn, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds, model, variables, activeSelections, dashboardId)
    }
}

const addMarkersFromData = (data: any, widgetModel: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], variables: IVariable[], activeSelections: ISelection[], dashboardId: string) => {
    addMarkersOrClustersFromData(data, widgetModel, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, variables, activeSelections, dashboardId)
}

export const addMarkersOrClustersFromData = (data: any, widgetModel: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], variables: IVariable[], activeSelections: ISelection[], dashboardId: string, clusters?: any) => {
    for (const row of data[target.label].rows) {
        createAndAddMarkerFromData(row, data, widgetModel, target, layerVisualizationSettings, dataColumn, spatialAttribute, geoColumn, markerBounds, variables, layerGroup, activeSelections, dashboardId, clusters)
    }

    if (clusters) layerGroup.addLayer(clusters)
}

const createAndAddMarkerFromData = (row: any, data: any, widgetModel: IWidget, target: IMapWidgetLayer, layerVisualizationSettings: IMapWidgetVisualizationType, dataColumn: string, spatialAttribute: any, geoColumn: string, markerBounds: any[], variables: IVariable[], layerGroup: any, activeSelections: ISelection[], dashboardId: string, clusters?: any) => {
    const dataColumnIndex = getTargetDataColumn(data[target.label], layerVisualizationSettings, dataColumn)
    const value = row[dataColumnIndex]

    const filter = layerVisualizationSettings.filter
    if (filter?.enabled && !isConditionMet(filter, value)) return null

    const conditionalStyle = getVizualizationConditionalStyles(widgetModel, layerVisualizationSettings.target, layerVisualizationSettings.targetMeasure, value, variables)
    const coordinates = getCoordinates(spatialAttribute, row[geoColumn], null)
    if (!coordinates) return
    const marker = addMarker(coordinates, layerGroup, layerVisualizationSettings.markerConf ?? null, row[dataColumnIndex], spatialAttribute, conditionalStyle?.['background-color'], conditionalStyle?.icon)

    addDialogToMarker(data, widgetModel, target, layerVisualizationSettings, row, marker, activeSelections, dashboardId, variables)
    addTooltipToMarker(data, widgetModel, target, layerVisualizationSettings, row, marker, activeSelections, dashboardId, variables)
    if (!clusters) markerBounds.push(marker.getLatLng())

    clusters ? clusters.addLayer(marker) : layerGroup.addLayer(marker)

    return marker
}

const addMarkersUsingLayers = (targetDatasetData: any | null, layersData: any, dataColumn: string | null, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget, variables: IVariable[], activeSelections: ISelection[], dashboardId: string) => {
    const { mappedData, dataColumnIndex } = getMappedDataAndColumnIndex(targetDatasetData, dataColumn, layerVisualizationSettings)

    layersData.features.forEach((feature: ILayerFeature) => {
        if (feature.geometry?.type === 'Point') {
            addMarkerUsingLayersPoint(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, null, variables, dataColumnIndex, activeSelections, dashboardId)
        } else if (feature.geometry?.type === 'MultiPoint') {
            feature.geometry.coordinates?.forEach((coord: any) => {
                addMarkerUsingLayersPoint(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, coord, variables, dataColumnIndex, activeSelections, dashboardId)
            })
        }
    })
}

export const getMappedDataAndColumnIndex = (targetDatasetData: any, dataColumn: string | null, layerVisualizationSettings: IMapWidgetVisualizationType): { mappedData: Record<string, number> | null; dataColumnIndex: string | null } => {
    let mappedData: Record<string, number> | null = null
    let dataColumnIndex = dataColumn

    if (targetDatasetData && dataColumn) {
        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetDatasetForeignKeyColumn, targetDatasetData)
        if (!foreignKeyColumnName) {
            throw new Error(`Foreign key column ${layerVisualizationSettings.targetDatasetForeignKeyColumn} is not present in the dataset`)
        }
        mappedData = transformDataUsingForeignKeyReturningAllColumns(targetDatasetData.rows, foreignKeyColumnName)
        dataColumnIndex = getTargetDataColumn(targetDatasetData, layerVisualizationSettings, dataColumn)
    }

    return { mappedData, dataColumnIndex }
}

const addMarkerUsingLayersPoint = (feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, layerGroup: any, spatialAttribute: any, widgetModel: IWidget, markerBounds: any[], coord: any[] | null, variables: IVariable[], dataColumnIndex: string | null, activeSelections: ISelection[], dashboardId: string) => {
    createMarkerForVisualization(feature, layerVisualizationSettings, mappedData, layerGroup, spatialAttribute, widgetModel, markerBounds, coord, variables, dataColumnIndex, activeSelections, dashboardId)
}

export const createMarkerForVisualization = (feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, layerGroup: any, spatialAttribute: any, widgetModel: IWidget, markerBounds: any[], coord: any[] | null, variables: IVariable[], dataColumnIndex: string | null, activeSelections: ISelection[], dashboardId: string) => {
    const { value } = getFeatureValues(feature, layerVisualizationSettings, mappedData, dataColumnIndex)

    if (!value) return

    const filter = layerVisualizationSettings.filter
    if (filter?.enabled && !isConditionMet(filter, value)) return null

    const conditionalStyle = getConditionalStyleUsingTargetDataset(layerVisualizationSettings, widgetModel, value, variables)
    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    if (!coordinates) return
    const marker = addMarker(coordinates.reverse(), layerGroup, layerVisualizationSettings.markerConf ?? null, value as any, spatialAttribute, conditionalStyle?.['background-color'], conditionalStyle?.icon)

    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker, activeSelections, dashboardId, variables)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker, activeSelections, dashboardId, variables)
    markerBounds.push(marker.getLatLng())

    return marker
}
