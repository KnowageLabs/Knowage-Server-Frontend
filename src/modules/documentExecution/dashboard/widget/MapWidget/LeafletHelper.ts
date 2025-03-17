import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { ILayerFeature, IMapDialogSettings, IMapTooltipSettings, IMapTooltipSettingsLayer, IMapWidgetLayer, IMapWidgetVisualizationTypeBalloons, IMapWidgetVisualizationTypeMarker } from './../../interfaces/mapWidget/DashboardMapWidget.d'
import L from 'leaflet'
import italy from './italy.json'
import { IMapWidgetVisualizationType } from '../../interfaces/mapWidget/DashboardMapWidget'
import deepcopy from 'deepcopy'
import { addBaloonMarkers, addClusters, addGeography, addMarkers, createChoropleth } from './visualization/MapVisualizationHelper'
import { getLayerData, getMapWidgetData } from './MapWidgetDataProxy'
import targetDatasetDataMock from './target-dataset-data-mock.json'
import { createDialogFromDataset } from './visualization/MapDialogHelper'
import wktMock from './wkt-mock.json'
import { wktToGeoJSON } from '@terraformer/wkt'
import { feature, mesh } from 'topojson-client'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

const dashStore = dashboardStore()

// Used in the Map Visualization Helper to determine which of the three use cases is selected in the settings.
// There is no explicit model property.
export enum VisualizationDataType {
    DATASET_ONLY,
    LAYER_ONLY,
    DATASET_AND_LAYER
}

export function getColumnName(column, data) {
    return data.metaData.fields.find((field) => field.header === column).name
}

function isConditionValid(operator: string, measureValue: any, value: any): boolean {
    if (operator === '=') return measureValue == value
    if (operator === '>') return measureValue > value
    if (operator === '<') return measureValue < value
    return false
}

// Used for adding a marker to Leaflet. If there is no MEASURE data (e.g., when only Geography is needed),
// the settings passed will be null, and the default ones from the first line will be used.
function createMarker(position, settings: IMapWidgetVisualizationTypeMarker | IMapWidgetVisualizationTypeBalloons | null) {
    const defaultMarkerSettings = { color: settings?.style?.color ?? '', fillColor: settings?.style?.color ?? '', radius: settings?.size || 10 }
    if (!settings) return L.marker(position, defaultMarkerSettings)

    let icon

    if (!settings.type || settings.type === 'default') {
        return L.circleMarker(position, defaultMarkerSettings)
    }
    if (settings.type === 'icon') {
        icon = L.divIcon({
            html: `<i ${settings.style?.color ? 'style="color:' + settings.style.color + '"' : ''} class="${settings.icon?.className || 'fa fa-map-marker'} fa-2x"></i>`,
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
export function addMarker(position: number[] | string, container: any, settings: IMapWidgetVisualizationTypeMarker | IMapWidgetVisualizationTypeBalloons | null, value: number, spatialAttribute: any) {
    let marker
    if (spatialAttribute?.properties?.coordType === 'json')
        L.geoJSON(JSON.parse(position as string), {
            pointToLayer: function (feature, latlng) {
                return (marker = createMarker(latlng, settings).addTo(container))
            }
        })
    else marker = createMarker(position, settings).addTo(container)
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
    const [lat, lon] = input.split(' ')
    const isLatLon = spatialAttribute.properties.coordFormat === 'lat lon'

    if (coord === 'lat') return isLatLon ? lat : lon
    if (coord === 'lon') return isLatLon ? lon : lat

    return isLatLon ? [lat, lon] : [lon, lat]
}

const getCoordinatesFromJSONCoordType = (input: string) => {
    try {
        let sanitizedInput = input
            .replace(/\\/g, '')
            .replace(/(\w+)\s*:/g, '"$1":')
            .replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)/g, ': "$1"')

        const parsedInput = JSON.parse(sanitizedInput)

        if (!parsedInput) return []

        if (parsedInput.arcs) return getCoordinatesFromTopoJSONCoordType(parsedInput)

        return parsedInput?.geometry?.coordinates ?? []
    } catch (error) {
        throw Error('Spatial attribute coordinates are not a valid JSON!')
    }
}

// TODO - Need working example
const getCoordinatesFromTopoJSONCoordType = (parsedInput: any) => {
    const topojsonWithObjects = {
        type: 'Topology',
        arcs: parsedInput.arcs,
        transform: { scale: [1, 1], translate: [0, 0] },
        objects: {
            region: {
                type: 'Polygon',
                properties: parsedInput.properties ?? {},
                arcs: [parsedInput.arcs.map((_, i) => i)]
            }
        }
    } as any

    const geojsonFeatures = feature(topojsonWithObjects, topojsonWithObjects.objects.region)
    const geojsonMesh = mesh(topojsonWithObjects, topojsonWithObjects.objects.region)

    return geojsonFeatures?.geometry?.coordinates ? geojsonFeatures.geometry.coordinates : []
}

// Starting point for the data/layers logic
export async function initializeLayers(map: L.Map, model: IWidget, data: any, dashboardId: string) {
    const markerBounds = [] as any
    for (const layer of model.settings.visualizations) {
        const layerVisualizationSettings = deepcopy(layer)
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

            // TODO - Remove mock
            // layersData = wktMock

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
                // TODO - Remove Mocked
                // targetDatasetData = deepcopy(targetDatasetDataMock)
                const dashboardConfig = dashStore.dashboards[dashboardId]?.configuration
                const selections = dashStore.getSelections(dashboardId) ?? []

                const targetDatasetTempData = await getMapWidgetData(dashboardId, dashboardConfig, model, dashboardConfig.datasets, false, selections)
                if (targetDatasetTempData?.[layerVisualizationSettings.targetDataset]) targetDatasetData = targetDatasetTempData[layerVisualizationSettings.targetDataset]
            }
        }

        const layerGroup = L.layerGroup().addTo(map)
        layerGroup.knProperties = { layerId: target.layerId, layerGroup: true }

        if (layerVisualizationSettings.type === 'markers') {
            addMarkers(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, layersData, targetDatasetData)
        }

        if (layerVisualizationSettings.type === 'balloons') {
            addBaloonMarkers(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, layersData, visualizationDataType, targetDatasetData)
        }

        if (layerVisualizationSettings.type === 'clusters') {
            addClusters(data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, markerBounds, layersData, targetDatasetData)
        }

        if (layerVisualizationSettings.type === 'heatmap') {
            const values = { data: [] } as any
            for (const row of data[target.name].rows) {
                values.data.push({ lat: row.column_1.split(' ')[0], lon: row.column_1.split(' ')[1], value: row.column_2 })
                markerBounds.push({ lat: row.column_1.split(' ')[0], lng: row.column_1.split(' ')[1] })
            }
            const heatmapLayer = new HeatmapOverlay({
                radius: 0.05,
                maxOpacity: 0.5,
                scaleRadius: true,
                latField: 'lat',
                lngField: 'lon',
                value: 'count'
            })
            heatmapLayer.setData(values)
            layerGroup.addLayer(heatmapLayer)
        }

        if (layerVisualizationSettings.type === 'choropleth') {
            createChoropleth(map, data, model, target, dataColumn, spatialAttribute, geoColumn, layerGroup, layerVisualizationSettings, layersData, visualizationDataType, targetDatasetData)
        }

        if (layerVisualizationSettings.type === 'geography') {
            addGeography(data, target, dataColumn, spatialAttribute, geoColumn, layerGroup, markerBounds, layersData, map)
        }
    }

    if (model.settings.configuration.map.autoCentering && markerBounds.length > 0) map.fitBounds(L.latLngBounds(markerBounds))
}

const getTargetDatasetData = () => {}

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

export function switchLayerVisibility(map: L.Map, visibleLayers): void {
    map.eachLayer((layer) => {
        if (layer.knProperties?.layerGroup) {
            if (!visibleLayers[layer.knProperties.layerId]) layer.hide()
            else layer.show()
        }
        if (layer.knProperties?.cluster) {
            if (!visibleLayers[layer.knProperties.layerId]) layer.removeLayer()
            else layer.show()
        }
    })
}
