import { IVariable, IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IMapWidgetLayer, IMapWidgetVisualizationTypeBalloons, IMapWidgetVisualizationTypeMarker } from './../../interfaces/mapWidget/DashboardMapWidget.d'
import L from 'leaflet'
import deepcopy from 'deepcopy'
import { getLayerData, getMapWidgetData } from './MapWidgetDataProxy'
import wktMock from './wkt-mock.json'
import { wktToGeoJSON } from '@terraformer/wkt'
import { feature } from 'topojson-client'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'
import { addMarkers } from './visualization/MapMarkersVizualizationHelper'
import { addBaloonMarkers } from './visualization/MapBaloonsVizualizationHelper'
import { addClusters } from './visualization/MapClustersVizualizationHelper'
import { addGeography } from './visualization/MapGeographyVizualizationHelper'
import { createChoropleth } from './visualization/MapChoroplethVizualizationHelper'
import { centerAndRedrawTheLayerOnMap, createHeatmapVisualization } from './visualization/MapHeatmapVizualizationHelper'
import { addMapCharts } from './visualization/MapChartsVizualizationHelper'

const dashStore = dashboardStore()

// Used in the Map Visualization Helper to determine which of the three use cases is selected in the settings.
// There is no explicit model property.
export enum VisualizationDataType {
    DATASET_ONLY,
    LAYER_ONLY,
    DATASET_AND_LAYER
}

export function getColumnName(column, data) {
    return data?.metaData?.fields?.find((field) => field.header === column).name
}

function isConditionValid(operator: string, measureValue: any, value: any): boolean {
    if (operator === '=') return measureValue == value
    if (operator === '>') return measureValue > value
    if (operator === '<') return measureValue < value
    return false
}

// Used for adding a marker to Leaflet. If there is no MEASURE data (e.g., when only Geography is needed),
// the settings passed will be null, and the default ones from the first line will be used.
const createMarker = (position: number[] | string, settings: IMapWidgetVisualizationTypeMarker | IMapWidgetVisualizationTypeBalloons | null, colorFromConditionalStyles?: string | undefined, iconFromConditionalStyles?: string | undefined) => {
    const markerColor = colorFromConditionalStyles ?? settings?.style?.color
    const markerIcon = iconFromConditionalStyles ?? (settings as IMapWidgetVisualizationTypeMarker)?.icon?.className
    const defaultMarkerSettings = { color: markerColor ?? '', fillColor: markerColor ?? '', radius: settings?.size || 10 }
    if (!settings) return L.marker(position, defaultMarkerSettings)

    let icon

    if (!settings.type || settings.type === 'default') {
        return L.circleMarker(position, defaultMarkerSettings)
    }
    if (settings.type === 'icon') {
        icon = L.divIcon({
            html: `<i ${markerColor ? 'style="color:' + markerColor + '"' : ''} class="${markerIcon || 'fa fa-map-marker'} fa-2x"></i>`,
            shadowUrl: '',
            shadowSize: [1, 1],
            className: 'customLeafletIcon'
        })
    }
    if (settings.type === 'img') icon = L.icon({ iconUrl: settings.img, shadowUrl: settings.img, shadowSize: [1, 1] })
    if (settings.type === 'url') icon = L.icon({ iconUrl: settings.url, shadowUrl: settings.img, iconSize: [30, 30], shadowSize: [1, 1] })
    if (['img', 'icon', 'url'].includes(settings.type)) return L.marker(position, { icon: icon })
}

// Used for creating marker object
export const addMarker = (position: number[] | string, container: any, settings: IMapWidgetVisualizationTypeMarker | IMapWidgetVisualizationTypeBalloons | null, value: number, spatialAttribute: any, colorFromConditionalStyles?: string | undefined, iconFromConditionalStyles?: string | undefined) => {
    let marker
    if (spatialAttribute?.properties?.coordType === 'json')
        L.geoJSON(JSON.parse(position as string), {
            pointToLayer: function (feature, latlng) {
                return (marker = createMarker(latlng, settings, colorFromConditionalStyles, iconFromConditionalStyles).addTo(container))
            }
        })
    else marker = createMarker(position, settings, colorFromConditionalStyles, iconFromConditionalStyles).addTo(container)
    marker.knProperties = { measureValue: value, layerId: container.knProperties.layerId }
    return marker
}

// Used for getting coordinates, if the type is WKT we are transforming them using the wktToGeoJSON from the @terraformer/wkt lib
export function getCoordinates(spatialAttribute: any, input: string, coord?: string | null | undefined) {
    if (!spatialAttribute) return []

    if (spatialAttribute.properties.coordType === 'string') {
        return getCoordinatesFromString(spatialAttribute, input, coord)
    } else if (spatialAttribute.properties.coordType === 'json') {
        const coordinates = getCoordinatesFromJSONCoordType(input)
        return coordinates
    } else if (spatialAttribute.properties.coordType === 'wkt') {
        const formattedWKTInput = wktToGeoJSON(input)
        return formattedWKTInput?.coordinates ?? []
    }
}

const getCoordinatesFromString = (spatialAttribute: any, input: string, coord?: string | null) => {
    const [firstCoord, secondCoord] = input.split(' ')
    const isLatLon = spatialAttribute.properties.coordFormat === 'lat lon'

    if (coord === 'lat') return isLatLon ? secondCoord : firstCoord
    if (coord === 'lon') return isLatLon ? firstCoord : secondCoord

    return isLatLon ? [secondCoord, firstCoord] : [firstCoord, secondCoord]
}

const getCoordinatesFromJSONCoordType = (input: string) => {
    try {
        let sanitizedInput = input
            .replace(/\\/g, '')
            .replace(/(\w+)\s*:/g, '"$1":')
            .replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)/g, ': "$1"')

        const parsedInput = JSON.parse(sanitizedInput)

        if (!parsedInput) return []

        return parsedInput?.geometry?.coordinates ?? []
    } catch (error) {
        throw Error('Spatial attribute coordinates are not a valid JSON!')
    }
}

// Starting point for the data/layers logic
export async function initializeLayers(map: L.Map, model: IWidget, data: any, dashboardId: string, variables: IVariable[]) {
    const markerBounds = [] as any
    for (const layer of model.settings.visualizations) {
        const layerVisualizationSettings = deepcopy(layer)
        let reloadWithFilters = false

        if (layerVisualizationSettings?.filter?.enabled && layerVisualizationSettings?.filter?.reloaded) return
        if (layerVisualizationSettings?.filter && !layerVisualizationSettings.filter.reloaded) {
            removeLayerFromMap(map, layerVisualizationSettings.target)
            reloadWithFilters = true
            layerVisualizationSettings.filter.reloaded = true
        }

        let spatialAttribute = undefined as any
        let geoColumn: any = undefined
        let dataColumn: any = undefined
        let layersData = null as any
        let visualizationDataType = VisualizationDataType.DATASET_ONLY
        let targetDatasetData = null as any

        const target = model.layers.find((widgetLayer: IMapWidgetLayer) => widgetLayer.layerId === layerVisualizationSettings.target)

        // This section handles data loading. In the first case, the user selects a dataset as the target;
        // in the else case, the target is a layer.
        // There are two use cases: layer only and layer with a target dataset.
        // Here, we need to add a data proxy call for the target dataset.
        // Additionally, if the layer is WKT, there is commented-out code related to it.
        // The backend service for retrieving layers does not work properly for WKT.
        if (target.type === 'dataset') {
            visualizationDataType = VisualizationDataType.DATASET_ONLY
            spatialAttribute = target.columns.filter((i) => i.fieldType === 'SPATIAL_ATTRIBUTE')[0]
            geoColumn = getColumnName(spatialAttribute.name, data[target.name])
            dataColumn = getColumnName(layerVisualizationSettings.targetMeasure, data[target.name])
        } else {
            visualizationDataType = VisualizationDataType.LAYER_ONLY
            layersData = await getLayerData(target)

            if (!layersData) return

            if (layersData.wkt) {
                const wktData = wktMock.wkt
                const wktRegex = /(POINT\s*\([^\)]+\)|POINT\s*M\s*\([^\)]+\)|POINT\s*ZM\s*\([^\)]+\)|LINESTRING\s*\([^\)]+\)|POLYGON\s*\(\([^\)]+\)\))/g
                const wktArray = wktData.match(wktRegex) || []

                const geojsonGeometries = wktArray.map((wkt: string) => wktToGeoJSON(wkt))

                const geojsonFeatures = {
                    type: 'FeatureCollection',
                    features: geojsonGeometries.map((geometry) => ({
                        type: 'Feature',
                        geometry: geometry,
                        properties: {}
                    }))
                }

                layersData = geojsonFeatures
            }

            if (layersData.type === 'Topology') {
                const geojsonFeatures: any[] = Object.values(layersData.objects).flatMap((obj: any) => (feature(layersData, obj) as any).features ?? [])

                layersData = {
                    type: 'FeatureCollection',
                    features: geojsonFeatures
                }
            }

            // Use case when we have layer with the external dataset connected with foreign key
            if (layerVisualizationSettings.targetDataset) {
                visualizationDataType = VisualizationDataType.DATASET_AND_LAYER
                dataColumn = getColumnName(layerVisualizationSettings.targetMeasure, data[layerVisualizationSettings.targetDataset])

                const dashboardConfig = dashStore.dashboards[dashboardId]?.configuration
                const selections = dashStore.getSelections(dashboardId) ?? []

                let targetDatasetTempData = await getMapWidgetData(dashboardId, dashboardConfig, model, dashboardConfig.datasets, false, selections)

                if (targetDatasetTempData?.[layerVisualizationSettings.targetDataset]) targetDatasetData = targetDatasetTempData[layerVisualizationSettings.targetDataset]
            }
        }

        const layerGroup = L.layerGroup().addTo(map)
        layerGroup.knProperties = { layerId: target.layerId, layerGroup: true }

        if (layerVisualizationSettings.type === 'markers') {
            addMarkers(map, data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, layersData, targetDatasetData, variables, !reloadWithFilters)
        }

        if (layerVisualizationSettings.type === 'balloons') {
            addBaloonMarkers(map, data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, layersData, visualizationDataType, targetDatasetData)
        }

        if (layerVisualizationSettings.type === 'pies') {
            addMapCharts(map, data, model, target, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, layersData, targetDatasetData)
        }

        if (layerVisualizationSettings.type === 'clusters') {
            addClusters(map, data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, layersData, targetDatasetData, variables, !reloadWithFilters)
        }

        if (layerVisualizationSettings.type === 'heatmap') {
            createHeatmapVisualization(map, data, target, dataColumn, spatialAttribute, geoColumn, layerVisualizationSettings, layersData, visualizationDataType, targetDatasetData)
        }

        if (layerVisualizationSettings.type === 'choropleth') {
            createChoropleth(map, data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, layersData, visualizationDataType, targetDatasetData)
        }

        if (layerVisualizationSettings.type === 'geography') {
            addGeography(data, target, dataColumn, spatialAttribute, geoColumn, layerGroup, markerBounds, layersData, map)
        }
    }
}

export function filterLayers(map: L.Map, layers): void {
    layers.forEach((layer) => {
        if (layer.filter?.enabled) {
            map.eachLayer((i) => {
                if (i.knProperties?.layerId === layer.layerId) {
                    if (!layer.filter.value || isConditionValid(layer.filter.operator, i.knProperties.measureValue, layer.filter.value)) i.show()
                    else i.hide()
                }
            })
        }
    })
}

export const centerTheMap = (map: any, markerBounds: any[] | null) => {
    setTimeout(() => {
        map.invalidateSize()
        if (markerBounds && markerBounds.length > 0) map.fitBounds(L.latLngBounds(markerBounds))
    }, 100)
}

const removeLayerFromMap = (map: L.Map, layerId: string): void => {
    map?.eachLayer((layer: any) => {
        if (layer.knProperties?.layerId === layerId) layer.remove()
    })
}
