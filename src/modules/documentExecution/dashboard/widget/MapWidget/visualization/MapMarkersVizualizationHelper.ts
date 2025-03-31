import { IVariable, IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { addMarker, centerTheMap, getColumnName, getCoordinates } from '../LeafletHelper'
import { addDialogToMarker, addDialogToMarkerForLayerData, addTooltipToMarker, addTooltipToMarkerForLayerData } from './MapDialogHelper'
import { getCoordinatesFromWktPointFeature, getVizualizationConditionalStyles, isConditionMet, transformDataUsingForeginKey, transformDataUsingForeignKeyReturningAllColumns } from './MapVisualizationHelper'

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
    for (const row of data[target.name].rows) {
        const dataColumnIndex = getTargetDataColumn(data[target.name], layerVisualizationSettings, dataColumn)
        const value = row[dataColumnIndex]
        const filter = layerVisualizationSettings.filter
        if (filter?.enabled && !isConditionMet(filter, value)) continue

        const conditionalStyle = getVizualizationConditionalStyles(widgetModel, layerVisualizationSettings.target, layerVisualizationSettings.targetMeasure, value, variables)
        const marker = addMarker(getCoordinates(spatialAttribute, row[geoColumn], null), layerGroup, layerVisualizationSettings.markerConf ?? null, row[dataColumnIndex], spatialAttribute, conditionalStyle?.['background-color'], conditionalStyle?.icon)
        addDialogToMarker(data, widgetModel, target, layerVisualizationSettings, row, marker)
        addTooltipToMarker(data, widgetModel, target, layerVisualizationSettings, row, marker)
        markerBounds.push(marker.getLatLng())
    }
}

// TODO - Move function and rename it?
export const getTargetDataColumn = (data: any, layerVisualizationSettings: IMapWidgetVisualizationType, dataColumn: string) => {
    const filter = layerVisualizationSettings.filter

    let tempDataColumn = dataColumn
    if (filter?.enabled) {
        const columnMetadata = data?.metaData?.fields?.find((field: any) => field?.header === filter.column)
        if (columnMetadata) tempDataColumn = columnMetadata.dataIndex
    }

    return tempDataColumn
}

const addMarkersUsingLayers = (targetDatasetData: any | null, layersData: any, dataColumn: string | null, spatialAttribute: any, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], widgetModel: IWidget, variables: IVariable[]) => {
    let mappedData: Record<string, number> | null = null
    let dataColumnIndex = dataColumn

    if (targetDatasetData && dataColumn) {
        const foreignKeyColumnName = getColumnName(layerVisualizationSettings.targetProperty, targetDatasetData)
        if (!foreignKeyColumnName) throw new Error(`Foreign key column ${layerVisualizationSettings.targetProperty} is not present in the dataset`)
        mappedData = transformDataUsingForeignKeyReturningAllColumns(targetDatasetData.rows, foreignKeyColumnName)
        dataColumnIndex = getTargetDataColumn(targetDatasetData, layerVisualizationSettings, dataColumn)
    }

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

const addMarkerUsingLayersPoint = (feature: ILayerFeature, layerVisualizationSettings: IMapWidgetVisualizationType, mappedData: any, layerGroup: any, spatialAttribute: any, widgetModel: IWidget, markerBounds: any[], coord: any[] | null, variables: IVariable[], dataColumnIndex: string | null) => {
    const layerTargetProperty = mappedData ? layerVisualizationSettings.targetProperty : getTargetProperty(layerVisualizationSettings)
    const filter = layerVisualizationSettings.filter
    const valueKey = feature.properties[layerTargetProperty]
    const value = mappedData && dataColumnIndex ? mappedData[valueKey][dataColumnIndex] : valueKey

    if (filter?.enabled && !isConditionMet(filter, value)) return
    const targetProperty = mappedData ? layerVisualizationSettings.targetMeasure : layerTargetProperty

    let targetDataset = null as IMapWidgetLayer | null
    if (layerVisualizationSettings.targetDataset) {
        targetDataset = widgetModel.layers.find((layer: IMapWidgetLayer) => layer.name === layerVisualizationSettings.targetDataset)
    }

    const conditionalStyle = getVizualizationConditionalStyles(widgetModel, layerVisualizationSettings.target, targetProperty, value, variables, targetDataset?.layerId)

    const coordinates = coord ?? getCoordinatesFromWktPointFeature(feature)
    const marker = addMarker(coordinates.reverse(), layerGroup, layerVisualizationSettings.markerConf ?? null, value as any, spatialAttribute, conditionalStyle?.['background-color'], conditionalStyle?.icon)
    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker)
    markerBounds.push(marker.getLatLng())
}

// TODO - Move function and rename it?
export const getTargetProperty = (layerVisualizationSettings: IMapWidgetVisualizationType) => {
    const filter = layerVisualizationSettings.filter

    let targetProperty = layerVisualizationSettings.targetProperty
    if (filter?.enabled) targetProperty = filter.column

    return targetProperty
}
