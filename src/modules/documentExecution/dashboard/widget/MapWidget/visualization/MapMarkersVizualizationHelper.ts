import { ISelection, IVariable, IWidget } from '../../../Dashboard'
import { ILayerFeature, IMapWidgetLayer, IMapWidgetVisualizationType } from '../../../interfaces/mapWidget/DashboardMapWidget'
import { addMarker, getColumnName, getCoordinates } from '../LeafletHelper'
import { executeMapInteractions, columnsMatch } from '../interactions/MapInteractionsHelper'
import { addDialogToMarker, addDialogToMarkerForLayerData, addTooltipToMarker, addTooltipToMarkerForLayerData, createDialogFromDataset } from './MapDialogHelper'
import { getConditionalStyleUsingTargetDataset, getCoordinatesFromWktPointFeature, getFeatureValues, getTargetDataColumn, getVizualizationConditionalStyles, isConditionMet, transformDataUsingForeignKeyReturningAllColumns } from './MapVisualizationHelper'

const findInteractionColumnForVisualization = (widgetModel: IWidget, layerVisualizationSettings: IMapWidgetVisualizationType): string | null => {
    // try selection
    const selectionConfig = widgetModel?.settings?.interactions?.selection?.selections?.find((s: any) => s.vizualizationType?.id === layerVisualizationSettings.id || s.vizualizationType?.target === layerVisualizationSettings.target || s.vizualizationType?.label === layerVisualizationSettings.label)
    if (selectionConfig?.column) return selectionConfig.column

    const crossNavConfig = widgetModel?.settings?.interactions?.crossNavigation?.crossNavigationVizualizationTypes?.find((c: any) => c.vizualizationType?.id === layerVisualizationSettings.id || c.vizualizationType?.target === layerVisualizationSettings.target || c.vizualizationType?.label === layerVisualizationSettings.label)
    if (crossNavConfig?.column) return crossNavConfig.column

    const linkConfig = widgetModel?.settings?.interactions?.link?.linkVizualizationTypes?.find((l: any) => l.vizualizationType?.id === layerVisualizationSettings.id || l.vizualizationType?.target === layerVisualizationSettings.target || l.vizualizationType?.label === layerVisualizationSettings.label)
    if (linkConfig?.column) return linkConfig.column

    const previewConfig = widgetModel?.settings?.interactions?.preview?.previewVizualizationTypes?.find((p: any) => p.vizualizationType?.id === layerVisualizationSettings.id || p.vizualizationType?.target === layerVisualizationSettings.target || p.vizualizationType?.label === layerVisualizationSettings.label)
    if (previewConfig?.column) return previewConfig.column

    return null
}

// Showing markers from the data using geoColumn for the dataset, and property for the layer features (only Points allowed)
export const addMarkers = (data: any, model: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], layersData: any, targetDatasetData: any, variables: IVariable[], activeSelections: ISelection[], dashboardId: string) => {
    if (data && data[target.id]) {
        addMarkersFromData(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, variables, activeSelections, dashboardId)
    } else {
        addMarkersUsingLayers(targetDatasetData, layersData, dataColumn, spatialAttribute, layerGroup, layerVisualizationSettings, markerBounds, model, variables, activeSelections, dashboardId)
    }
}

const addMarkersFromData = (data: any, widgetModel: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], variables: IVariable[], activeSelections: ISelection[], dashboardId: string) => {
    addMarkersOrClustersFromData(data, widgetModel, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, variables, activeSelections, dashboardId)
}

export const addMarkersOrClustersFromData = (data: any, widgetModel: IWidget, target: IMapWidgetLayer, dataColumn: string, spatialAttribute: any, geoColumn: string, layerGroup: any, layerVisualizationSettings: IMapWidgetVisualizationType, markerBounds: any[], variables: IVariable[], activeSelections: ISelection[], dashboardId: string, clusters?: any) => {
    for (const row of data[target.id].rows) {
        createAndAddMarkerFromData(row, data, widgetModel, target, layerVisualizationSettings, dataColumn, spatialAttribute, geoColumn, markerBounds, variables, layerGroup, activeSelections, dashboardId, clusters)
    }

    if (clusters) layerGroup.addLayer(clusters)
}

const createAndAddMarkerFromData = (row: any, data: any, widgetModel: IWidget, target: IMapWidgetLayer, layerVisualizationSettings: IMapWidgetVisualizationType, dataColumn: string, spatialAttribute: any, geoColumn: string, markerBounds: any[], variables: IVariable[], layerGroup: any, activeSelections: ISelection[], dashboardId: string, clusters?: any) => {
    const dataColumnIndex = getTargetDataColumn(data[target.id], layerVisualizationSettings, dataColumn)
    const value = row[dataColumnIndex]

    const filter = layerVisualizationSettings.filter
    if (filter?.enabled && !isConditionMet(filter, value)) return null

    const conditionalStyle = getVizualizationConditionalStyles(widgetModel, layerVisualizationSettings.target, layerVisualizationSettings.targetMeasure, value, variables)
    const coordinates = getCoordinates(spatialAttribute, row[geoColumn], null)
    if (!coordinates) return

    const container = clusters ?? layerGroup
    const marker = addMarker(coordinates, container, layerVisualizationSettings.markerConf ?? null, row[dataColumnIndex], spatialAttribute, conditionalStyle?.['background-color'], conditionalStyle?.icon)

    addDialogToMarker(data, widgetModel, target, layerVisualizationSettings, row, marker, activeSelections, dashboardId, variables)
    addTooltipToMarker(data, widgetModel, target, layerVisualizationSettings, row, marker, activeSelections, dashboardId, variables)
    if (!clusters) markerBounds.push(marker.getLatLng())

    // Attach click handler to trigger interactions (selection/crossNavigation/link/preview)
    try {
        if (!widgetModel.settings.dialog.enabled) {
            marker.on &&
                marker.on('click', (ev: any) => {
                    try {
                        // Try to replicate the dialog's DOM and fire a clickable item that matches a crossNavigation config (so
                        // the same code path as the dialog is used). If no matching clickable is found, fall back to the synthetic event.
                        try {
                            const popup = createDialogFromDataset(false, layerVisualizationSettings, widgetModel.settings.dialog, data[target.id], row, widgetModel, activeSelections, dashboardId, variables)
                            const content = popup && (popup as any).getContent ? (popup as any).getContent() : null
                            if (content && content.querySelector) {
                                // Collect all clickable items
                                const clickables = Array.from(content.querySelectorAll('.clickable-custom-leaflet-list-item')) as HTMLElement[]

                                const crossNavConfigs = widgetModel?.settings?.interactions?.crossNavigation?.crossNavigationVizualizationTypes ?? []

                                for (const item of clickables) {
                                    const dataValue = item.getAttribute('data-value') ?? ''
                                    const [rawValueColumn] = dataValue.split(':')
                                    const itemColumn = (rawValueColumn || '').trim()

                                    const matched = crossNavConfigs.some((c: any) => {
                                        const viz = c.vizualizationType
                                        const vizMatches = viz && (viz.id === layerVisualizationSettings.id || viz.target === layerVisualizationSettings.target || viz.label === layerVisualizationSettings.label)
                                        return vizMatches && columnsMatch(c.column, itemColumn)
                                    })

                                    if (matched) {
                                        item.click()
                                        return
                                    }
                                }
                            }
                        } catch (err) {
                            // ignore and fall back to synthetic event
                        }

                        // Fallback: previous behavior — find an interaction column and synthesize an event
                        const column = findInteractionColumnForVisualization(widgetModel, layerVisualizationSettings)
                        if (!column) return

                        // build dataMap from dataset meta and row
                        const meta = data[target.id]
                        const dataMap: Record<string, any> = {}
                        meta?.metaData?.fields?.forEach((field: any) => {
                            if (!field.dataIndex) return
                            const val = row[field.dataIndex]
                            if (field.name) dataMap[field.name] = val
                            if (field.header) dataMap[field.header] = val
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
                        const column = findInteractionColumnForVisualization(widgetModel, layerVisualizationSettings)
                        if (!column) return

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
