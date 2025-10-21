import { ISelection, IVariable, IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { addMarker, getColumnName, getCoordinates } from '../LeafletHelper'
import { executeMapInteractions } from '../interactions/MapInteractionsHelper'
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

    const container = clusters ?? layerGroup
    const marker = addMarker(coordinates, container, layerVisualizationSettings.markerConf ?? null, row[dataColumnIndex], spatialAttribute, conditionalStyle?.['background-color'], conditionalStyle?.icon)

    // Debug: log marker creation info
    try {
        // eslint-disable-next-line no-console
        console.log('MapMarkers: created marker from data', { target: target?.label, coordinates, marker, layerVisualizationSettingsId: layerVisualizationSettings.id })
    } catch (err) {
        // ignore
    }

    addDialogToMarker(data, widgetModel, target, layerVisualizationSettings, row, marker, activeSelections, dashboardId, variables)
    addTooltipToMarker(data, widgetModel, target, layerVisualizationSettings, row, marker, activeSelections, dashboardId, variables)
    if (!clusters) markerBounds.push(marker.getLatLng())

    // Attach click handler to trigger interactions (selection/crossNavigation/link/preview)
    try {
        if (!widgetModel.settings.dialog.enabled) {
            marker.on &&
                marker.on('click', (ev: any) => {
                    try {
                        const selectionConfig = widgetModel?.settings?.interactions?.selection?.selections?.find((s: any) => s.vizualizationType?.target === layerVisualizationSettings.target)
                        if (!selectionConfig || !selectionConfig.column) return

                        const column = selectionConfig.column
                        // build dataMap from dataset meta and row
                        const meta = data[target.label]
                        const dataMap: Record<string, any> = {}
                        meta?.metaData?.fields?.forEach((field: any) => {
                            if (!field.dataIndex) return
                            dataMap[field.header] = row[field.dataIndex]
                        })

                        const colName = getColumnName(column, meta)
                        const value = row[colName]
                        const dataValue = `${column}: ${value}`

                        const fakeElement: any = {
                            getAttribute: (name: string) => (name === 'data-value' ? dataValue : null),
                            _dataMap: dataMap
                        }

                        executeMapInteractions({ currentTarget: fakeElement }, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables)
                    } catch (err) {
                        // ignore
                    }
                })
        } else {
            // If dialog is enabled, open the bound popup on click so the dialog shows
            marker.on &&
                marker.on('click', (ev: any) => {
                    try {
                        if (marker.getPopup && marker.getPopup()) marker.openPopup()
                    } catch (err) {
                        // ignore
                    }
                })
        }
    } catch (err) {
        // ignore
    }

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

    // Debug: log marker creation info for layer features
    try {
        // eslint-disable-next-line no-console
        console.log('MapMarkers: created marker for layer feature', { feature, coordinates: coordinates.reverse ? coordinates.reverse() : coordinates, marker, layerVisualizationSettingsId: layerVisualizationSettings.id })
    } catch (err) {
        // ignore
    }

    addDialogToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker, activeSelections, dashboardId, variables)
    addTooltipToMarkerForLayerData(feature, widgetModel, layerVisualizationSettings, value, marker, activeSelections, dashboardId, variables)
    const isClusterGroup = typeof (layerGroup as any)?.getAllChildMarkers === 'function'
    if (!isClusterGroup) {
        markerBounds.push(marker.getLatLng())
    }
    // Attach click handler for layer-based features as well
    try {
        // If dialog is enabled, clicking should open the popup; otherwise trigger interactions
        if (widgetModel?.settings?.dialog?.enabled) {
            marker.on &&
                marker.on('click', (ev: any) => {
                    try {
                        if (marker.getPopup && marker.getPopup()) marker.openPopup()
                    } catch (err) {
                        // ignore
                    }
                })
        } else {
            marker.on &&
                marker.on('click', (ev: any) => {
                    try {
                        const selectionConfig = widgetModel?.settings?.interactions?.selection?.selections?.find((s: any) => s.vizualizationType?.target === layerVisualizationSettings.target)
                        if (!selectionConfig || !selectionConfig.column) return

                        const column = selectionConfig.column
                        const dataMap = feature.properties ?? {}
                        const valueForColumn = feature.properties?.[column]
                        const dataValue = `${column}: ${valueForColumn}`

                        const fakeElement: any = {
                            getAttribute: (name: string) => (name === 'data-value' ? dataValue : null),
                            _dataMap: dataMap
                        }

                        executeMapInteractions({ currentTarget: fakeElement }, widgetModel, layerVisualizationSettings, activeSelections, dashboardId, variables)
                    } catch (err) {
                        // ignore
                    }
                })
        }
    } catch (err) {
        // ignore
    }
    return marker
}
